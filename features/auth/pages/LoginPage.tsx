import { authService } from "@/features/auth/services/auth.service";
import { useAuthStore } from "@/features/auth/store/auth.store";
import { useVehicleStore } from "@/features/user/store/vehicle.store";
import { useApiMutation } from "@/hooks";
import * as AuthSession from "expo-auth-session";
import { useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
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

      // TODO: exchange auth code with backend for an access token
      const mockToken = "mock-jwt-token";
      setToken(mockToken);

      const result = await loadUser();

      if (result.success) {
        const profileType = useAuthStore.getState().user?.profileType;

        if (profileType === "student" || profileType === "personnel") {
          await useVehicleStore.getState().loadVehicle();
        }

        router.replace("/");
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
          onPress={() => login(email, password)}
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
          <LinkText label="Create Account" />
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
