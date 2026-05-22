import { authService } from "@/api/auth.api";
import { useApiMutation } from "@/hooks";
import { useAuthStore } from "@/store/auth.store";
import { useVehicleStore } from "@/store/vehicle.store";
import { getErrorMessage } from "@/utils/errorCodes";
import { useRouter } from "expo-router";
import { AlertCircle, LogIn, Mail, ShieldAlert } from "lucide-react-native";
import { useState } from "react";
import { TouchableOpacity, View } from "react-native";

import { AlertModal } from "@/components/shared";
import { AppButton, AppInput, LinkText } from "@/components/ui";
import { Body, Caption } from "@/components/ui/Typography";
import AuthHeader from "@/features/auth/components/AuthHeader";
import AuthLayout from "@/features/auth/components/AuthLayout";
import FormCard from "@/features/auth/components/FormCard";

// ─── Constants ───────────────────────────────────────────────────────────────
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 8;

// ─── Social Button ────────────────────────────────────────────────────────────
function SocialButton({
  label,
  onPress,
}: {
  label: string;
  onPress?: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.75}
      className="flex-1 flex-row items-center justify-center gap-2 py-3 rounded-xl border border-light-border bg-light-surface"
    >
      <Body className="text-light-text font-heavy text-[13px]">{label}</Body>
    </TouchableOpacity>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────
export default function LoginPage() {
  const router = useRouter();
  const { setToken, loadUser } = useAuthStore();
  const { run: login, isLoading: loading } = useApiMutation(authService.login);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Modal state
  const [modalVisible, setModalVisible] = useState(false);
  const [modalTitle, setModalTitle] = useState("");
  const [modalMessage, setModalMessage] = useState("");
  const [modalVariant, setModalVariant] = useState<
    "error" | "warning" | "info"
  >("error");
  const [modalIcon, setModalIcon] = useState<React.ReactNode>(null);

  const showAlert = (
    title: string,
    message: string,
    variant: "error" | "warning" | "info" = "error",
    icon?: React.ReactNode,
  ) => {
    setModalTitle(title);
    setModalMessage(message);
    setModalVariant(variant);
    setModalIcon(
      icon ?? <AlertCircle size={28} color="#EF4444" strokeWidth={2} />,
    );
    setModalVisible(true);
  };

  const handleLogin = async () => {
    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();

    if (!trimmedEmail && !trimmedPassword) {
      showAlert(
        "Missing Credentials",
        "Please enter your email and password to continue.",
        "warning",
        <Mail size={28} color="#F59E0B" strokeWidth={2} />,
      );
      return;
    }

    if (!trimmedEmail) {
      showAlert(
        "Email Required",
        "Please enter your email address to continue.",
        "warning",
        <Mail size={28} color="#F59E0B" strokeWidth={2} />,
      );
      return;
    }

    if (!EMAIL_REGEX.test(trimmedEmail)) {
      showAlert(
        "Invalid Email",
        "Please enter a valid email address.",
        "warning",
        <Mail size={28} color="#F59E0B" strokeWidth={2} />,
      );
      return;
    }

    if (!trimmedPassword) {
      showAlert(
        "Password Required",
        "Please enter your password to continue.",
        "warning",
        <ShieldAlert size={28} color="#F59E0B" strokeWidth={2} />,
      );
      return;
    }

    if (password !== trimmedPassword) {
      showAlert(
        "Invalid Password",
        "Password cannot start or end with spaces.",
        "warning",
        <ShieldAlert size={28} color="#F59E0B" strokeWidth={2} />,
      );
      return;
    }

    if (trimmedPassword.length < MIN_PASSWORD_LENGTH) {
      showAlert(
        "Password Too Short",
        `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`,
        "warning",
        <ShieldAlert size={28} color="#F59E0B" strokeWidth={2} />,
      );
      return;
    }

    try {
      const data = await login(trimmedEmail, password);

      if (data.isSuccess && data.data) {
        setToken(data.data);
        const result = await loadUser();

        if (result.success) {
          const profileType = useAuthStore.getState().user?.profileType;
          if (profileType === "student" || profileType === "personnel") {
            await useVehicleStore.getState().loadVehicle();
          }
          router.replace("/");
        } else {
          console.warn("[auth] loadUser failed");
          showAlert(
            "Profile Error",
            result.message || getErrorMessage(500),
            "error",
          );
        }
      } else {
        showAlert("Login Failed", getErrorMessage(data.errorCode), "error");
      }
    } catch (err: any) {
      const errorCode = err?.response?.data?.errorCode ?? 0;
      console.error("[auth] login exception");
      showAlert("Login Failed", getErrorMessage(errorCode), "error");
    }
  };

  return (
    <AuthLayout background="bg-light-primary">
      <AuthHeader
        logo={require("../../assets/images/icon.png")}
        title="ParkFlow"
        subtitle="Parking Management System"
      />
      <FormCard title="Welcome Back">
        {/* Subtitle */}
        <Caption className="text-light-muted text-[12px] mb-6 -mt-2">
          Enter your details below
        </Caption>

        {/* Inputs */}
        <AppInput
          label="Email"
          placeholder="Enter your email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <AppInput
          label="Password"
          placeholder="Enter your password"
          isPassword
          value={password}
          onChangeText={setPassword}
        />

        <View className="self-end mb-6 -mt-2">
          <LinkText label="Forgot Password?" />
        </View>

        <AppButton
          label="Sign In"
          variant="primary"
          size="lg"
          loading={loading}
          icon={<LogIn size={20} color="#FFFFFF" strokeWidth={2} />}
          onPress={handleLogin}
        />

        <View className="flex-row items-center my-5">
          <View className="flex-1 h-px bg-light-border" />
          <Caption className="text-light-muted mx-3 text-[11px]">
            or sign in with
          </Caption>
          <View className="flex-1 h-px bg-light-border" />
        </View>

        <View className="flex-row gap-3">
          <SocialButton label="Google" />
          <SocialButton label="Facebook" />
        </View>

        <View className="flex-row justify-center items-center mt-6">
          <Body className="text-light-muted font-book text-[13px]">
            Don{"'"}t have an account?{" "}
          </Body>
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
