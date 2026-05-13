import { useRouter } from "expo-router";
import { AlertCircle, LogIn, Mail, ShieldAlert } from "lucide-react-native";
import { useState } from "react";
import { Text, View } from "react-native";

import { authService } from "@/services/auth.service";
import { useAuthStore } from "@/store/useAuthStore";
import { getErrorMessage } from "@/utils/errorCodes";

import { AuthHeader, AuthLayout, FormCard } from "@/components/layout";
import { AlertModal } from "@/components/shared";
import { AppButton, AppInput, LinkText } from "@/components/ui";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 8;

export default function Login() {
  const router = useRouter();
  const { setToken, loadUser } = useAuthStore();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // modal state
  const [modalVisible, setModalVisible] = useState(false);
  const [modalTitle, setModalTitle] = useState("");
  const [modalMessage, setModalMessage] = useState("");
  const [modalVariant, setModalVariant] = useState<
    "error" | "warning" | "info"
  >("error");
  const [modalIcon, setModalIcon] = useState<React.ReactNode>(null);

  // show alert modal
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

  // login handler
  const handleLogin = async () => {
    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();

    // validation
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

    setLoading(true);

    try {
      const data = await authService.login(trimmedEmail, password);

      if (data.isSuccess && data.data) {
        setToken(data.data);
        const result = await loadUser();

        if (result.success) {
          // Navigate to root; don't log user data
          router.replace("/");
        } else {
          // profile load failed
          console.warn("[auth] loadUser failed");
          showAlert(
            "Profile Error",
            result.message || getErrorMessage(500),
            "error",
          );
        }
      } else {
        // API returned failure
        showAlert("Login Failed", getErrorMessage(data.errorCode), "error");
      }
    } catch (err: any) {
      // request exception
      const errorCode = err?.response?.data?.errorCode ?? 0;
      console.error("[auth] login exception");
      showAlert("Login Failed", getErrorMessage(errorCode), "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <AuthHeader
        logo={require("../../assets/images/icon.png")}
        title="ParkFlow"
        subtitle="Parking Management System"
      />

      <FormCard title="Login">
        <AppInput
          label="Email"
          placeholder="Enter Email"
          value={email}
          onChangeText={setEmail}
        />

        <AppInput
          label="Password"
          placeholder="Enter Password"
          isPassword
          value={password}
          onChangeText={setPassword}
        />

        <View className="self-end mb-6 -mt-2">
          <LinkText label="Forgot Password?" />
        </View>

        <AppButton
          label="Login"
          variant="primary"
          size="lg"
          loading={loading}
          icon={<LogIn size={20} color="#FFFFFF" strokeWidth={2} />}
          onPress={handleLogin}
        />

        <View className="flex-row justify-center items-center mt-6">
          <Text className="text-light-text text-sm font-semibold">
            Don't have an account?{" "}
          </Text>
          <LinkText
            label="Click Here!"
            onPress={() => router.push("/(auth)/register")}
          />
        </View>
      </FormCard>

      {/* ── Alert modal ─────────────────────────── */}
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
