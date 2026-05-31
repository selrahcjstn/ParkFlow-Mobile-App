import { AlertModal } from "@/components/shared";
import { AppButton, AppInput } from "@/components/ui";
import AuthHeader from "@/features/auth/components/AuthHeader";
import AuthLayout from "@/features/auth/components/AuthLayout";
import FormCard from "@/features/auth/components/FormCard";
import EmailVerificationView from "@/features/auth/components/EmailVerificationView";
import { authService } from "@/features/auth/services/auth.service";
import { useAuthStore } from "@/features/auth/store/auth.store";
import { useOnboardingStore } from "@/features/auth/store/onboarding.store";
import { useApiMutation } from "@/hooks";
import { useAppTheme } from "@/hooks/useAppTheme";
import { EMAIL_REGEX, MIN_PASSWORD_LENGTH } from "@/utils/registerValidation";
import { useRouter } from "expo-router";
import { AlertCircle } from "lucide-react-native";
import React, { useCallback, useState } from "react";
import { Text, TouchableOpacity, View, ActivityIndicator } from "react-native";

export default function RegisterPage() {
  const router = useRouter();
  const { colors } = useAppTheme();
  const { run: register, isLoading } = useApiMutation(authService.register);
  const { reset: resetOnboarding } = useOnboardingStore();
  const { setToken } = useAuthStore();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [isVerifying, setIsVerifying] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);

  const [modal, setModal] = useState({
    visible: false,
    title: "",
    message: "",
    variant: "error" as "error" | "warning" | "info",
  });

  const showAlert = useCallback(
    (
      title: string,
      message: string,
      variant: "error" | "warning" | "info" = "error",
    ) => {
      setModal({ visible: true, title, message, variant });
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

    // Email duplicate check & OTP triggering
    setSendingOtp(true);
    try {
      const otpRes = await authService.sendEmailOtp(trimmedEmail);
      if (otpRes?.isSuccess) {
        setIsVerifying(true);
      } else {
        showAlert(
          "Registration Blocked",
          otpRes?.message || "This email is already in use or cannot receive verification codes.",
          "error"
        );
      }
    } catch (error: any) {
      const backendMessage =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to verify email uniqueness. Please try again.";
      showAlert("Registration Blocked", backendMessage, "error");
    } finally {
      setSendingOtp(false);
    }
  };

  const handleOtpVerifiedSuccess = async () => {
    try {
      const response = await register({
        email: email.trim(),
        password: password.trim(),
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

      if (token) {
        const SecureStore = require("expo-secure-store");
        setToken(token);
        await SecureStore.setItemAsync("token", token);
      }

      resetOnboarding();
      router.replace("/(auth)/onboarding-profile");
    } catch (error: any) {
      const backendMessage = error?.response?.data?.message || error?.message || "Please try again.";
      showAlert("Registration Failed", backendMessage, "error");
    }
  };

  return (
    <AuthLayout background="bg-light-primary">
      <AuthHeader
        logo={require("../../../assets/images/icon.png")}
        title="ParkFlow"
        subtitle="Parking Management System"
      />

      <FormCard>
        {isVerifying ? (
          isLoading ? (
            <View className="items-center justify-center py-10 bg-light-surface dark:bg-dark-surface">
              <ActivityIndicator size="large" color={colors.primary} />
              <Text className="text-light-text dark:text-dark-text font-heavy mt-4 text-[14px]">
                Creating your account...
              </Text>
            </View>
          ) : (
            <EmailVerificationView
              email={email.trim()}
              onVerifySuccess={handleOtpVerifiedSuccess}
              onBack={() => setIsVerifying(false)}
            />
          )
        ) : (
          <>
            <Text className="text-light-text font-black text-2xl mb-5">Create Account</Text>
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
              loading={sendingOtp}
              disabled={sendingOtp}
              onPress={handleRegister}
            />

            <View className="flex-row justify-center mt-6">
              <Text className="text-light-muted">Already have an account? </Text>
              <TouchableOpacity onPress={() => router.replace("/(auth)/login")}>
                <Text className="text-light-accent font-heavy">Sign In</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </FormCard>

      <AlertModal
        visible={modal.visible}
        onClose={() => setModal((p) => ({ ...p, visible: false }))}
        title={modal.title}
        message={modal.message}
        variant={modal.variant}
        icon={<AlertCircle size={28} color="#F59E0B" />}
      />
    </AuthLayout>
  );
}

