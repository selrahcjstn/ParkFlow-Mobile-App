import { ContentWrapper } from "@/components/layouts";
import { AlertModal } from "@/components/shared";
import { AppButton, AppInput } from "@/components/ui";
import { useAppTheme } from "@/hooks/useAppTheme";
import { KeyRound, Mail } from "lucide-react-native";
import { useRouter, useNavigation, useLocalSearchParams } from "expo-router";
import React, { useRef, useState } from "react";
import {
  ScrollView,
  Text,
  View,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
} from "react-native";
import { authService } from "@/features/auth/services/auth.service";
import EmailVerificationView from "@/features/auth/components/EmailVerificationView";

type StepType = "email" | "code" | "password";

export default function SetPasswordPage() {
  const { colors } = useAppTheme();
  const router = useRouter();
  const navigation = useNavigation();
  const lastScrolledRef = useRef(false);
  const { mode } = useLocalSearchParams<{ mode?: string }>();

  const [step, setStep] = useState<StepType>("email");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);

  const [errors, setErrors] = useState({
    email: "",
    password: "",
    confirmPassword: "",
  });

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
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim()) {
      setErrors((prev) => ({ ...prev, email: "Email address is required." }));
      return;
    } else if (!emailRegex.test(email.trim())) {
      setErrors((prev) => ({ ...prev, email: "Please enter a valid email address." }));
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await authService.sendEmailOtp(email.trim());
      if (res?.isSuccess) {
        setStep("code");
      } else {
        setErrors((prev) => ({
          ...prev,
          email: res?.message || "Failed to send verification code. Email may already be in use.",
        }));
      }
    } catch (e: any) {
      const backendMessage =
        e?.response?.data?.message ||
        e?.message ||
        "An error occurred while sending the code.";
      setErrors((prev) => ({ ...prev, email: backendMessage }));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOtpSuccess = async () => {
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
          e?.response?.data?.message || e?.message || "An unexpected error occurred.";
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
      setStep("password");
    }
  };

  const handleSubmit = async () => {
    Keyboard.dismiss();
    
    let hasError = false;
    const newErrors = { email: "", password: "", confirmPassword: "" };

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
    } catch (e: any) {
      const backendMessage =
        e?.response?.data?.message || e?.message || "An unexpected error occurred.";
      setModal({
        visible: true,
        title: "Linking Failed",
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
          <View className="w-9 h-9 rounded-button bg-light-danger/10 dark:bg-dark-primary/10 items-center justify-center">
            <Mail size={18} color={colors.primary} strokeWidth={2.2} />
          </View>
          <View className="flex-1">
            <Text className="text-light-text dark:text-dark-text font-black text-[15px] tracking-tight">
              {mode === "change" ? "Change Email Address" : "Verify Email Address"}
            </Text>
            <Text className="text-light-muted dark:text-dark-muted font-regular text-[11px] mt-0.5">
              {mode === "change"
                ? "Enter your new email address to send a verification code"
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
              setEmail(t);
              setErrors((prev) => ({ ...prev, email: "" }));
            }}
            keyboardType="email-address"
            autoCapitalize="none"
            error={errors.email}
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
      />
    );
  };

  const renderPasswordStep = () => {
    return (
      <View className="px-1 py-1">
        <View className="flex-row items-start gap-3 mb-4">
          <View className="w-9 h-9 rounded-button bg-light-danger/10 dark:bg-dark-primary/10 items-center justify-center">
            <KeyRound size={18} color={colors.primary} strokeWidth={2.2} />
          </View>
          <View>
            <Text className="text-light-text dark:text-dark-text font-black text-[15px] tracking-tight">
              Create New Password
            </Text>
            <Text className="text-light-muted dark:text-dark-muted font-regular text-[11px] mt-0.5">
              Set your direct access login credentials
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
            label="Save Credentials"
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

