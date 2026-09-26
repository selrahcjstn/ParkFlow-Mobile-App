import { ContentWrapper } from "@/components/layouts";
import { AlertModal } from "@/components/shared";
import { AppButton, AppInput } from "@/components/ui";
import EmailVerificationView from "@/features/auth/components/EmailVerificationView";
import { authService } from "@/features/auth/services/auth.service";
import { useAuthStore } from "@/features/auth/store/auth.store";
import { userService } from "@/features/user/services/user.service";
import { useAppTheme } from "@/hooks/useAppTheme";
import { useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import { KeyRound, Mail } from "lucide-react-native";
import React, { useEffect, useRef, useState } from "react";
import {
    Keyboard,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Text,
    TouchableWithoutFeedback,
    View,
} from "react-native";

type StepType = "email" | "code" | "password";

export default function SetPasswordPage() {
  const { colors, isDark } = useAppTheme();
  const router = useRouter();
  const navigation = useNavigation();
  const lastScrolledRef = useRef(false);
  const { mode } = useLocalSearchParams<{ mode?: string }>();
  const { user } = useAuthStore();
  const iconColor = colors.text;

  const [step, setStep] = useState<StepType>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);

  const [errors, setErrors] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    code: "",
  });

  useEffect(() => {
    const loadAndSetEmail = async () => {
      if (mode === "reset") {
        try {
          const res = await userService.getUserCredentials();
          if (res?.isSuccess && res.data) {
            const manualLink = res.data.linkedIdentities.find(
              (link) =>
                link.provider === "Manual" ||
                link.provider === "0" ||
                link.provider === "Local" ||
                link.provider === "Email"
            );
            
            const isManualPrimary =
              res.data.primaryProvider === "Manual" ||
              res.data.primaryProvider === "0";

            if (isManualPrimary) {
              setEmail(res.data.email || "");
            } else if (manualLink?.email) {
              setEmail(manualLink.email || "");
            } else if (user?.email) {
              setEmail(user.email || "");
            }
          } else if (user?.email) {
            setEmail(user.email || "");
          }
        } catch (e) {
          console.error("Failed to load user credentials for reset:", e);
          if (user?.email) {
            setEmail(user.email || "");
          }
        }
      }
    };

    void loadAndSetEmail();
  }, [mode, user]);

  const [modal, setModal] = useState({
    visible: false,
    title: "",
    message: "",
    variant: "success" as "error" | "warning" | "info" | "success",
  });

  const handleScroll = (event: any) => {
    const yOffset = event?.nativeEvent?.contentOffset?.y;
    if (yOffset !== undefined && yOffset !== null) {
      const scrolled = yOffset > 0;
      if (lastScrolledRef.current !== scrolled) {
        lastScrolledRef.current = scrolled;
        navigation.setParams({ hasScrolled: scrolled } as any);
      }
    }
  };

  const handleSendCode = async () => {
    Keyboard.dismiss();
    setErrors((prev) => ({ ...prev, email: "" }));

    const safeEmail = (email || "").trim();
    console.log(`[SetPasswordPage] handleSendCode called with email: "${email}" (safeEmail: "${safeEmail}")`);
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!safeEmail) {
      console.log(`[SetPasswordPage] handleSendCode validation failed: missing email`);
      setErrors((prev) => ({ ...prev, email: "Email address is required." }));
      return;
    } else if (!emailRegex.test(safeEmail)) {
      console.log(`[SetPasswordPage] handleSendCode validation failed: invalid email format`);
      setErrors((prev) => ({
        ...prev,
        email: "Please enter a valid email address.",
      }));
      return;
    }

    console.log(`[SetPasswordPage] calling API... mode: "${mode}"`);
    setIsSubmitting(true);
    try {
      if (mode === "reset") {
        console.log(`[SetPasswordPage] calling authService.forgotPassword...`);
        const res = await authService.forgotPassword(safeEmail);
        console.log(`[SetPasswordPage] authService.forgotPassword response:`, JSON.stringify(res));
        if (res?.isSuccess) {
          setStep("code");
        } else {
          setErrors((prev) => ({
            ...prev,
            email: res?.message || "Failed to send reset code. Please try again.",
          }));
        }
      } else {
        console.log(`[SetPasswordPage] calling authService.sendEmailOtp...`);
        const res = await authService.sendEmailOtp(safeEmail);
        console.log(`[SetPasswordPage] authService.sendEmailOtp response:`, JSON.stringify(res));
        if (res?.isSuccess) {
          setStep("code");
        } else {
          setErrors((prev) => ({
            ...prev,
            email:
              res?.message ||
              "Failed to send verification code. Email may already be in use.",
          }));
        }
      }
    } catch (e: any) {
      console.error(`[SetPasswordPage] handleSendCode error:`, e);
      const backendMessage =
        e?.response?.data?.message ||
        e?.message ||
        "An error occurred while sending the code.";
      setErrors((prev) => ({ ...prev, email: backendMessage }));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOtpSuccess = async (verifiedCode: string) => {
    if (mode === "change") {
      setIsSubmitting(true);
      try {
        const res = await authService.updateManualLink({
          newEmail: email.trim(),
        });

        if (res?.isSuccess) {
          setModal({
            visible: true,
            title: "Email Updated",
            message: `Your login email has been successfully updated to ${email.trim()}.`,
            variant: "success",
          });
        } else {
          setModal({
            visible: true,
            title: "Update Failed",
            message: res?.message || "Failed to update email address.",
            variant: "error",
          });
        }
      } catch (e: any) {
        const backendMessage =
          e?.response?.data?.message ||
          e?.message ||
          "An unexpected error occurred.";
        setModal({
          visible: true,
          title: "Update Failed",
          message: backendMessage,
          variant: "error",
        });
      } finally {
        setIsSubmitting(false);
      }
    } else {
      setCode(verifiedCode);
      setStep("password");
    }
  };

  const handleSubmit = async () => {
    Keyboard.dismiss();

    let hasError = false;
    const newErrors = { email: "", password: "", confirmPassword: "", code: "" };

    if (!password) {
      newErrors.password = "Password is required.";
      hasError = true;
    } else if (password.length < 8) {
      newErrors.password = "Password must be at least 8 characters.";
      hasError = true;
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = "Confirm password is required.";
      hasError = true;
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match.";
      hasError = true;
    }

    if (hasError) {
      setErrors((prev) => ({ ...prev, ...newErrors }));
      return;
    }

    setIsSubmitting(true);
    try {
      if (mode === "reset") {
        const res = await authService.resetPassword({
          email: email.trim(),
          resetToken: code.trim(),
          newPassword: password.trim(),
        });

        if (res?.isSuccess) {
          setModal({
            visible: true,
            title: "Password Updated",
            message: "Your account password has been successfully updated.",
            variant: "success",
          });
        } else {
          setModal({
            visible: true,
            title: "Update Failed",
            message: res?.message || "Failed to reset password. Please try again.",
            variant: "error",
          });
        }
      } else {
        const res = await authService.linkManual({
          email: email.trim(),
          password: password.trim(),
        });

        if (res?.isSuccess) {
          setModal({
            visible: true,
            title: "Credentials Saved",
            message: `Your login email has been set to ${email.trim()} and your password has been successfully configured.`,
            variant: "success",
          });
        } else {
          setModal({
            visible: true,
            title: "Linking Failed",
            message: res?.message || "Failed to complete email linking.",
            variant: "error",
          });
        }
      }
    } catch (e: any) {
      const backendMessage =
        e?.response?.data?.message ||
        e?.message ||
        "An unexpected error occurred.";
      setModal({
        visible: true,
        title: mode === "reset" ? "Update Failed" : "Linking Failed",
        message: backendMessage,
        variant: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleModalClose = () => {
    setModal((p) => ({ ...p, visible: false }));
    router.back();
  };

  const renderEmailStep = () => {
    return (
      <View className="px-1 py-1">
        <View className="flex-row items-start gap-3 mb-4">
          <View className="w-9 h-9 rounded-button bg-light-surfaceLighter dark:bg-dark-surfaceLighter items-center justify-center">
            <Mail size={18} color={iconColor} strokeWidth={2.2} />
          </View>
          <View className="flex-1">
            <Text className="text-light-text dark:text-dark-text font-black text-[15px] tracking-tight">
              {mode === "change"
                ? "Change Email Address"
                : mode === "reset"
                ? "Change Password"
                : "Verify Email Address"}
            </Text>
            <Text className="text-light-muted dark:text-dark-muted font-regular text-[11px] mt-0.5">
              {mode === "change"
                ? "Enter your new email address to send a verification code"
                : mode === "reset"
                ? "Verify your account email address to send a verification code"
                : "Enter email address to send a verification code"}
            </Text>
          </View>
        </View>

        <View className="gap-2.5 mt-1.5">
          <AppInput
            label="Email Address"
            placeholder="Enter your email address"
            value={email}
            onChangeText={(t) => {
              if (mode !== "reset") {
                setEmail(t);
                setErrors((prev) => ({ ...prev, email: "" }));
              }
            }}
            keyboardType="email-address"
            autoCapitalize="none"
            error={errors.email}
            editable={mode !== "reset"}
            selectTextOnFocus={mode !== "reset"}
          />

          <AppButton
            label="Send Verification Code"
            variant="primary"
            uppercase={false}
            loading={isSubmitting}
            disabled={isSubmitting}
            onPress={handleSendCode}
          />
        </View>
      </View>
    );
  };

  const renderCodeStep = () => {
    return (
      <EmailVerificationView
        email={email.trim()}
        onVerifySuccess={handleOtpSuccess}
        onBack={() => setStep("email")}
        isResetFlow={mode === "reset"}
      />
    );
  };

  const renderPasswordStep = () => {
    return (
      <View className="px-1 py-1">
        <View className="flex-row items-start gap-3 mb-4">
          <View className="w-9 h-9 rounded-button bg-light-surfaceLighter dark:bg-dark-surfaceLighter items-center justify-center">
            <KeyRound size={18} color={iconColor} strokeWidth={2.2} />
          </View>
          <View>
            <Text className="text-light-text dark:text-dark-text font-black text-[15px] tracking-tight">
              {mode === "reset" ? "Reset Password" : "Create New Password"}
            </Text>
            <Text className="text-light-muted dark:text-dark-muted font-regular text-[11px] mt-0.5">
              {mode === "reset"
                ? "Enter your new password below"
                : "Set your direct access login credentials"}
            </Text>
          </View>
        </View>

        <View className="gap-2.5 mt-1.5">
          <AppInput
            label="Password"
            placeholder="Minimum 8 characters"
            value={password}
            onChangeText={(t) => {
              setPassword(t);
              setErrors((prev) => ({ ...prev, password: "" }));
            }}
            isPassword
            error={errors.password}
          />

          <AppInput
            label="Confirm Password"
            placeholder="Re-enter your password"
            value={confirmPassword}
            onChangeText={(t) => {
              setConfirmPassword(t);
              setErrors((prev) => ({ ...prev, confirmPassword: "" }));
            }}
            isPassword
            error={errors.confirmPassword}
          />

          <AppButton
            label={mode === "reset" ? "Change Password" : "Save Credentials"}
            variant="primary"
            uppercase={false}
            loading={isSubmitting}
            disabled={isSubmitting}
            onPress={handleSubmit}
          />
        </View>
      </View>
    );
  };

  return (
    <ContentWrapper noPaddingY>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          className="flex-1"
        >
          <ScrollView
            className="flex-1"
            showsVerticalScrollIndicator={false}
            onScroll={handleScroll}
            scrollEventThrottle={16}
            contentContainerStyle={{ paddingTop: 16, paddingBottom: 40 }}
          >
            {step === "email" ? renderEmailStep() : null}
            {step === "code" ? renderCodeStep() : null}
            {step === "password" ? renderPasswordStep() : null}
          </ScrollView>
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>

      <AlertModal
        visible={modal.visible}
        onClose={handleModalClose}
        title={modal.title}
        message={modal.message}
        variant={modal.variant}
      />
    </ContentWrapper>
  );
}
