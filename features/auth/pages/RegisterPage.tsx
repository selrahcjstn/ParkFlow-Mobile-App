import { AlertModal } from "@/components/shared";
import { AppButton, AppInput } from "@/components/ui";
import AuthHeader from "@/features/auth/components/AuthHeader";
import AuthLayout from "@/features/auth/components/AuthLayout";
import FormCard from "@/features/auth/components/FormCard";
import { authService } from "@/features/auth/services/auth.service";
import { useAuthStore } from "@/features/auth/store/auth.store";
import { useOnboardingStore } from "@/features/auth/store/onboarding.store";
import { useApiMutation } from "@/hooks";
import { EMAIL_REGEX, MIN_PASSWORD_LENGTH } from "@/utils/registerValidation";
import { useRouter } from "expo-router";
import { AlertCircle } from "lucide-react-native";
import React, { useCallback, useState } from "react";
import { Text, TouchableOpacity, View, Alert } from "react-native";

export default function RegisterPage() {
  const router = useRouter();
  const { run: register, isLoading } = useApiMutation(authService.register);
  const { reset: resetOnboarding } = useOnboardingStore();
  const { setToken } = useAuthStore();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [modalVisible, setModalVisible] = useState(false);
  const [modalTitle, setModalTitle] = useState("");
  const [modalMessage, setModalMessage] = useState("");
  const [modalVariant, setModalVariant] = useState<
    "error" | "warning" | "info"
  >("error");
  const [modalIcon, setModalIcon] = useState<React.ReactNode>(null);

  const showAlert = useCallback(
    (
      title: string,
      message: string,
      variant: "error" | "warning" | "info" = "error",
      icon?: React.ReactNode,
    ) => {
      setModalTitle(title);
      setModalMessage(message);
      setModalVariant(variant);
      setModalIcon(icon ?? <AlertCircle size={28} color="#F59E0B" />);
      setModalVisible(true);
    },
    [],
  );

  const handleRegister = async () => {
    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();
    const trimmedConfirm = confirmPassword.trim();

    if (!trimmedEmail || !trimmedPassword || !trimmedConfirm) {
      showAlert(
        "Missing Information",
        "Please complete all fields.",
        "warning",
      );
      return;
    }

    if (!EMAIL_REGEX.test(trimmedEmail)) {
      showAlert("Invalid Email", "Please enter a valid email.", "warning");
      return;
    }

    if (password !== trimmedPassword) {
      showAlert(
        "Invalid Password",
        "Password cannot start or end with spaces.",
        "warning",
      );
      return;
    }

    if (trimmedPassword.length < MIN_PASSWORD_LENGTH) {
      showAlert(
        "Password Too Short",
        `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`,
        "warning",
      );
      return;
    }

    if (!/[A-Za-z]/.test(trimmedPassword) || !/\d/.test(trimmedPassword)) {
      showAlert(
        "Weak Password",
        "Include at least one letter and one number.",
        "warning",
      );
      return;
    }

    if (trimmedPassword !== trimmedConfirm) {
      showAlert("Password Mismatch", "Passwords do not match.", "warning");
      return;
    }

    try {
      console.log("📝 [RegisterPage] handleRegister started with email:", trimmedEmail);
      const response = await register({
        email: trimmedEmail,
        password: trimmedPassword,
      });

      if (!response?.isSuccess) {
        showAlert(
          "Registration Failed",
          response?.message || "Please try again.",
          "error",
        );
        return;
      }

      const token = response?.data as unknown as string;
      console.log("✅ [RegisterPage] Registration succeeded! Token present in response:", !!token);

      if (token) {
        const SecureStore = require("expo-secure-store");
        setToken(token);
        await SecureStore.setItemAsync("token", token);
      }

      resetOnboarding();
      router.replace("/(auth)/onboarding-profile");
    } catch (error) {
      console.error("❌ [RegisterPage] Registration failed error:", error);
      showAlert("Registration Failed", "Please try again.", "error");
    }
  };

  return (
    <AuthLayout background="bg-light-primary">
      <AuthHeader
        logo={require("../../../assets/images/icon.png")}
        title="ParkFlow"
        subtitle="Parking Management System"
      />

      <FormCard title="Create Account">
        <Text className="text-light-muted text-[12px] mb-6">
          Use your email to create an account.
        </Text>

        <AppInput
          label="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <AppInput
          label="Password"
          value={password}
          onChangeText={setPassword}
          isPassword
        />

        <AppInput
          label="Confirm Password"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          isPassword
        />

        <AppButton
          label="Continue"
          loading={isLoading}
          onPress={handleRegister}
        />

        <View className="flex-row justify-center mt-6">
          <Text className="text-light-muted">Already have an account? </Text>
          <TouchableOpacity onPress={() => router.replace("/(auth)/login")}>
            <Text className="text-light-accent font-heavy">Sign In</Text>
          </TouchableOpacity>
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
