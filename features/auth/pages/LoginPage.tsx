import { authService } from "@/features/auth/services/auth.service";
import { useAuthStore } from "@/features/auth/store/auth.store";
import { useOnboardingStore } from "@/features/auth/store/onboarding.store";
import { useVehicleStore } from "@/features/user/store/vehicle.store";
import { useApiMutation } from "@/hooks";
import * as AuthSession from "expo-auth-session";
import { useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { jwtDecode } from "jwt-decode";
import { AlertCircle, LogIn } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Text, TouchableOpacity, View } from "react-native";

import { AlertModal } from "@/components/shared";
import { AppButton, AppInput, LinkText } from "@/components/ui";
import AuthHeader from "@/features/auth/components/AuthHeader";
import AuthLayout from "@/features/auth/components/AuthLayout";
import FormCard from "@/features/auth/components/FormCard";

WebBrowser.maybeCompleteAuthSession();

const MS_CLIENT_ID = process.env.EXPO_PUBLIC_MS_CLIENT_ID ?? "";
const MS_TENANT_ID = process.env.EXPO_PUBLIC_MS_TENANT_ID ?? "";

const redirectUri = AuthSession.makeRedirectUri();

const discovery = {
  authorizationEndpoint: `https://login.microsoftonline.com/${MS_TENANT_ID}/oauth2/v2.0/authorize`,
  tokenEndpoint: `https://login.microsoftonline.com/${MS_TENANT_ID}/oauth2/v2.0/token`,
};

// ─────────────────────────────────────────────────────────────
// MAIN SCREEN
// ─────────────────────────────────────────────────────────────
export default function LoginPage() {
  const router = useRouter();
  const { setToken, loadUser } = useAuthStore();
  const { setProfilePrefill, reset: resetOnboarding } = useOnboardingStore();
  const { run: login, isLoading: loading } = useApiMutation(authService.login);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msLoading, setMsLoading] = useState(false);

  const [modalVisible, setModalVisible] = useState(false);
  const [modalTitle, setModalTitle] = useState("");
  const [modalMessage, setModalMessage] = useState("");
  const [modalVariant, setModalVariant] = useState<
    "error" | "warning" | "info"
  >("error");
  const [modalIcon, setModalIcon] = useState<React.ReactNode>(null);

  const [request, response, promptAsync] = AuthSession.useAuthRequest(
    {
      clientId: MS_CLIENT_ID,
      scopes: ["openid", "profile", "email", "User.Read"],
      redirectUri,
      responseType: AuthSession.ResponseType.Code,
    },
    discovery,
  );

  useEffect(() => {
    if (response?.type === "success" && "params" in response) {
      const code = response.params?.code;

      if (code) {
        handleMicrosoftLoginSuccess(code);
      } else {
        setMsLoading(false);
      }
      return;
    }

    if (response?.type === "error" || response?.type === "cancel") {
      setMsLoading(false);
    }
  }, [response]);

  const handleMicrosoftLoginSuccess = async (authCode: string) => {
    try {
      setMsLoading(true);

      const tokenResponse = await AuthSession.exchangeCodeAsync(
        {
          clientId: MS_CLIENT_ID,
          code: authCode,
          redirectUri,
          extraParams: {
            code_verifier: request?.codeVerifier ?? "",
          },
        },
        discovery,
      );

      const idToken = tokenResponse.idToken;

      if (!idToken) {
        showAlert("Login Failed", "Missing identity token.", "error");
        setMsLoading(false);
        return;
      }

      const decoded = jwtDecode<{
        sub?: string;
        email?: string;
        name?: string;
        given_name?: string;
        family_name?: string;
      }>(idToken);

      const payload = {
        externalProviderId: decoded.sub ?? "",
        email: decoded.email ?? "",
        firstName: decoded.given_name ?? "",
        lastName: decoded.family_name ?? "",
        displayName: decoded.name ?? "",
      };

      if (!payload.externalProviderId || !payload.email) {
        showAlert(
          "Login Failed",
          "Missing Microsoft account details.",
          "error",
        );
        return;
      }

      const response = await authService.microsoftAuth(payload);

      if (!response?.isSuccess || !response?.data?.token) {
        showAlert(
          "Login Failed",
          response?.message || "Microsoft login failed.",
          "error",
        );
        return;
      }

      resetOnboarding();
      setProfilePrefill({
        firstName: response.data.firstName,
        lastName: response.data.lastName,
        displayName: response.data.displayName,
      });
      setToken(response.data.token);

      if (response.data.isNewAccount) {
        router.replace("/(auth)/onboarding-profile");
        return;
      }

      const result = await loadUser();

      if (result.success) {
        const profileType = useAuthStore.getState().user?.profileType;

        if (profileType === "student" || profileType === "personnel") {
          await useVehicleStore.getState().loadVehicle();
        }

        router.replace("/");
      } else if (result.needsOnboarding) {
        router.replace("/(auth)/onboarding-profile");
      } else {
        showAlert("Profile Error", result.message || "Failed", "error");
      }
    } catch (err) {
      console.error("[auth] error", err);
      showAlert("Login Failed", "Microsoft login failed.", "error");
    } finally {
      setMsLoading(false);
    }
  };

  const handleMicrosoftLogin = async () => {
    try {
      if (!request) return;

      setMsLoading(true);

      await promptAsync();
    } catch (err) {
      console.error("[auth] prompt error", err);
      setMsLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      showAlert(
        "Missing Information",
        "Email and password are required.",
        "warning",
      );
      return;
    }

    try {
      const result = await login(email.trim(), password);

      if (!result?.isSuccess) {
        showAlert(
          "Login Failed",
          result?.message || "Invalid credentials.",
          "error",
        );
        return;
      }

      if (result?.data?.token) {
        setToken(result.data.token);
      }

      if (result?.data?.isNewAccount) {
        router.replace("/(auth)/onboarding-profile");
        return;
      }

      const userResult = await loadUser();

      if (!userResult.success) {
        if (userResult.needsOnboarding) {
          router.replace("/(auth)/onboarding-profile");
          return;
        }
        showAlert(
          "Profile Error",
          userResult.message || "Failed to load profile.",
          "error",
        );
        return;
      }

      const profileType = useAuthStore.getState().user?.profileType;

      if (profileType === "student" || profileType === "personnel") {
        await useVehicleStore.getState().loadVehicle();
      }

      router.replace("/");
    } catch (err) {
      console.error("[auth] login error", err);
      showAlert("Login Failed", "Please try again.", "error");
    }
  };

  const showAlert = (
    title: string,
    message: string,
    variant: "error" | "warning" | "info" = "error",
    icon?: React.ReactNode,
  ) => {
    setModalTitle(title);
    setModalMessage(message);
    setModalVariant(variant);
    setModalIcon(icon ?? <AlertCircle size={28} color="#EF4444" />);
    setModalVisible(true);
  };

  return (
    <AuthLayout background="bg-light-primary">
      <AuthHeader
        logo={require("../../../assets/images/icon.png")}
        title="ParkFlow"
        subtitle="Parking Management System"
      />

      <FormCard title="Welcome Back">
        <Text className="text-light-muted text-[12px] mb-6">
          Enter your details below
        </Text>

        <AppInput
          label="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
        />

        <AppInput
          label="Password"
          value={password}
          onChangeText={setPassword}
          isPassword
        />

        <AppButton
          label="Sign In"
          loading={loading}
          icon={<LogIn size={20} color="#fff" />}
          onPress={handleLogin}
        />

        {/* Divider */}
        <View className="flex-row items-center my-5">
          <View className="flex-1 h-px bg-light-border" />
          <Text className="mx-3 text-light-muted text-[11px]">
            or sign in with
          </Text>
          <View className="flex-1 h-px bg-light-border" />
        </View>

        {/* Microsoft Button */}
        <TouchableOpacity
          onPress={handleMicrosoftLogin}
          disabled={!request || msLoading}
          className="w-full flex-row items-center justify-center py-3 rounded-xl border border-light-border"
        >
          {msLoading ? (
            <ActivityIndicator />
          ) : (
            <>
              <Text className="font-heavy ml-2">Sign in with Microsoft</Text>
            </>
          )}
        </TouchableOpacity>

        <View className="flex-row justify-center mt-6">
          <Text className="text-light-muted">Don’t have an account? </Text>
          <LinkText
            label="Create Account"
            onPress={() => router.push("/(auth)/register")}
          />
        </View>
      </FormCard>

      <AlertModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        title={modalTitle}
        message={modalMessage}
        variant={modalVariant}
        icon={modalIcon}
      />
    </AuthLayout>
  );
}
