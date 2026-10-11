import { AlertModal } from "@/components/shared";
import { AppButton, AppInput } from "@/components/ui";
import AuthHeader from "@/features/auth/components/AuthHeader";
import AuthLayout from "@/features/auth/components/AuthLayout";
import FormCard from "@/features/auth/components/FormCard";
import EmailVerificationView from "@/features/auth/components/EmailVerificationView";
import { authService } from "@/features/auth/services/auth.service";
import { useAppTheme } from "@/hooks/useAppTheme";
import { useRouter } from "expo-router";
import { AlertCircle, CheckCircle2, ArrowLeft } from "lucide-react-native";
import { StatusBar } from "expo-status-bar";
import React, { useCallback, useState } from "react";
import { Text, TouchableOpacity } from "react-native";
import { getPasswordValidationError } from "@/utils/registerValidation";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const { isDark, colors } = useAppTheme();

  const [step, setStep] = useState<"request" | "code" | "password">("request");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [isLoading, setIsLoading] = useState(false);

  const [modal, setModal] = useState({
    visible: false,
    title: "",
    message: "",
    variant: "error" as "error" | "warning" | "info" | "success",
  });

  const showAlert = useCallback(
    (
      title: string,
      message: string,
      variant: "error" | "warning" | "info" | "success" = "error",
    ) => {
      setModal({ visible: true, title, message, variant });
    },
    [],
  );

  const handleSendCode = async () => {
    const trimmedEmail = (email || "").trim();
    console.log(`[ForgotPasswordPage] handleSendCode called with email: "${email}" (trimmed: "${trimmedEmail}")`);
    if (!trimmedEmail) {
      console.log(`[ForgotPasswordPage] handleSendCode validation failed: missing email`);
      showAlert("Missing Email", "Please enter your email address.", "warning");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      console.log(`[ForgotPasswordPage] handleSendCode validation failed: invalid email format`);
      showAlert("Invalid Email", "Please enter a valid email address.", "warning");
      return;
    }

    console.log(`[ForgotPasswordPage] calling authService.forgotPassword...`);
    setIsLoading(true);
    try {
      const res = await authService.forgotPassword(trimmedEmail);
      console.log(`[ForgotPasswordPage] authService.forgotPassword result:`, JSON.stringify(res));
      if (res?.isSuccess) {
        setStep("code");
      } else {
        showAlert(
          "Request Failed",
          res?.message || "We could not request a password reset for this email.",
          "error"
        );
      }
    } catch (error: any) {
      console.error(`[ForgotPasswordPage] handleSendCode error:`, error);
      const backendMessage =
        error?.response?.data?.message ||
        error?.message ||
        "An unexpected error occurred. Please try again.";
      showAlert("Request Failed", backendMessage, "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpVerified = (verifiedCode: string) => {
    setCode(verifiedCode);
    setStep("password");
  };

  const handleResetPassword = async () => {
    if (!password || !confirmPassword) {
      showAlert("Missing Information", "Please fill in all password fields.", "warning");
      return;
    }

    const passwordError = getPasswordValidationError(password);
    if (passwordError) {
      showAlert("Invalid Password", passwordError, "warning");
      return;
    }

    if (password !== confirmPassword) {
      showAlert("Password Mismatch", "Passwords do not match.", "warning");
      return;
    }

    setIsLoading(true);
    try {
      const res = await authService.resetPassword({
        email: email.trim(),
        resetToken: code,
        newPassword: password,
      });

      if (res?.isSuccess) {
        showAlert(
          "Password Reset Success",
          "Your password has been successfully reset. You can now log in with your new credentials.",
          "success"
        );
      } else {
        showAlert(
          "Reset Failed",
          res?.message || "Failed to reset password. Please request another code.",
          "error"
        );
      }
    } catch (error: any) {
      const backendMessage =
        error?.response?.data?.message ||
        error?.message ||
        "An unexpected error occurred. Please try again.";
      showAlert("Reset Failed", backendMessage, "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleModalClose = () => {
    setModal((p) => ({ ...p, visible: false }));
    if (modal.title === "Password Reset Success") {
      router.replace("/(auth)/login");
    }
  };

  const renderRequestStep = () => {
    return (
      <>
        <TouchableOpacity
          onPress={() => router.replace("/(auth)/login")}
          className="flex-row items-center gap-2 mb-5 active:opacity-60"
        >
          <ArrowLeft size={16} color={colors.muted} />
          <Text className="text-light-muted dark:text-dark-muted font-regular text-[13px]">
            Back to Login
          </Text>
        </TouchableOpacity>

        <Text className="text-light-text dark:text-dark-text font-bold text-2xl mb-2">Forgot Password</Text>
        <Text className="text-light-muted dark:text-dark-muted text-[12px] mb-6">
          Enter your email to receive a password reset verification code.
        </Text>

        <AppInput
          label="Email Address"
          placeholder="Enter your email address"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <AppButton
          label="Send Reset Code"
          loading={isLoading}
          disabled={isLoading}
          onPress={handleSendCode}
        />
      </>
    );
  };

  const renderCodeStep = () => {
    return (
      <EmailVerificationView
        email={email.trim()}
        onVerifySuccess={handleOtpVerified}
        onBack={() => setStep("request")}
        title="Verify Code"
        subtitle={`Verify the 6-digit reset code sent to:\n${email.trim()}`}
        isResetFlow={true}
      />
    );
  };

  const renderPasswordStep = () => {
    return (
      <>
        <TouchableOpacity
          onPress={() => setStep("code")}
          className="flex-row items-center gap-2 mb-5 active:opacity-60"
        >
          <ArrowLeft size={16} color={colors.muted} />
          <Text className="text-light-muted dark:text-dark-muted font-regular text-[13px]">
            Back to Verification
          </Text>
        </TouchableOpacity>

        <Text className="text-light-text dark:text-dark-text font-bold text-2xl mb-2">Create New Password</Text>
        <Text className="text-light-muted dark:text-dark-muted text-[12px] mb-6">
          Set your direct access login credentials.
        </Text>

        <AppInput
          label="New Password"
          placeholder="Minimum 8 characters"
          value={password}
          onChangeText={setPassword}
          isPassword
        />

        <AppInput
          label="Confirm Password"
          placeholder="Re-enter new password"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          isPassword
        />

        <AppButton
          label="Reset Password"
          loading={isLoading}
          disabled={isLoading}
          onPress={handleResetPassword}
        />
      </>
    );
  };

  return (
    <AuthLayout background={isDark ? "bg-dark-background" : "bg-light-primary"}>
      <StatusBar style="light" />
      <AuthHeader
        logo={require("../../../assets/images/parkflow.png")}
        title="ParkFlow"
        subtitle="Parking Management System"
      />

      <FormCard>
        {step === "request" ? renderRequestStep() : null}
        {step === "code" ? renderCodeStep() : null}
        {step === "password" ? renderPasswordStep() : null}
      </FormCard>

      <AlertModal
        visible={modal.visible}
        onClose={handleModalClose}
        title={modal.title}
        message={modal.message}
        variant={modal.variant === "success" ? "success" : modal.variant}
        icon={
          modal.variant === "success" ? (
            <CheckCircle2 size={28} color={colors.success} />
          ) : (
            <AlertCircle size={28} color={modal.variant === "warning" ? colors.warning : colors.danger} />
          )
        }
      />
    </AuthLayout>
  );
}
