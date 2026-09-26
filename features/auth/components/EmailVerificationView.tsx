import React, { useState, useEffect, useRef } from "react";
import {
  Text,
  View,
  TextInput,
  TouchableOpacity,
  Keyboard,
  StyleSheet,
  Platform,
  Pressable,
} from "react-native";
import { ShieldCheck, ArrowLeft } from "lucide-react-native";
import { useAppTheme } from "@/hooks/useAppTheme";
import { AppButton } from "@/components/ui";
import { authService } from "@/features/auth/services/auth.service";

interface EmailVerificationViewProps {
  email: string;
  onVerifySuccess: (code: string) => void;
  onBack: () => void;
  title?: string;
  subtitle?: string;
  isResetFlow?: boolean;
}

export default function EmailVerificationView({
  email,
  onVerifySuccess,
  onBack,
  title = "Enter Verification Code",
  subtitle,
  isResetFlow = false,
}: EmailVerificationViewProps) {
  const { colors, isDark } = useAppTheme();
  const codeInputRef = useRef<TextInput>(null);

  const [code, setCode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(30);
  const [error, setError] = useState("");
  const [infoMessage, setInfoMessage] = useState("");
  const [isFocused, setIsFocused] = useState(false);

  // Countdown timer logic
  useEffect(() => {
    let interval: any;
    if (resendCooldown > 0) {
      interval = setInterval(() => {
        setResendCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendCooldown]);

  // Focus input automatically on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      codeInputRef.current?.focus();
    }, 250);
    return () => clearTimeout(timer);
  }, []);

  // Listen to keyboard dismiss events (e.g. Android back button closing keyboard)
  useEffect(() => {
    const hideSubscription = Keyboard.addListener("keyboardDidHide", () => {
      codeInputRef.current?.blur();
      setIsFocused(false);
    });
    const showSubscription = Keyboard.addListener("keyboardDidShow", () => {
      setIsFocused(true);
    });
    return () => {
      hideSubscription.remove();
      showSubscription.remove();
    };
  }, []);

  const handleFocusInput = () => {
    if (codeInputRef.current) {
      codeInputRef.current.blur();
      setTimeout(() => {
        codeInputRef.current?.focus();
      }, 50);
    }
  };

  const handleVerify = async () => {
    Keyboard.dismiss();
    setError("");
    setInfoMessage("");

    if (code.length < 6) {
      setError("Please enter the complete 6-digit verification code.");
      return;
    }

    setIsSubmitting(true);
    try {
      if (isResetFlow) {
        const res = await authService.verifyResetCode(email, code);
        if (res?.isSuccess) {
          onVerifySuccess(res.data);
        } else {
          setError(res?.message || "Invalid or expired verification code.");
        }
      } else {
        const res = await authService.verifyEmailOtp(email, code);
        if (res?.isSuccess) {
          onVerifySuccess(code);
        } else {
          setError(res?.message || "Invalid or expired verification code.");
        }
      }
    } catch (e: any) {
      setError(
        e?.response?.data?.message ||
          e?.message ||
          "An error occurred during verification. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0 || isSubmitting) return;

    Keyboard.dismiss();
    setError("");
    setInfoMessage("");
    setIsSubmitting(true);

    try {
      const res = isResetFlow
        ? await authService.forgotPassword(email)
        : await authService.sendEmailOtp(email);
      if (res?.isSuccess) {
        setCode("");
        setResendCooldown(30);
        setInfoMessage("A new verification code has been sent to your email.");
      } else {
        setError(res?.message || "Failed to resend verification code.");
      }
    } catch (e: any) {
      setError(
        e?.response?.data?.message ||
          e?.message ||
          "An error occurred while resending the code."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const codeLength = 6;
  const codeArray = new Array(codeLength).fill("");
  const activeCode = code.split("");

  return (
    <View className="px-1 py-1">
      {/* Back Button */}
      {onBack ? (
        <TouchableOpacity
          onPress={onBack}
          className="flex-row items-center gap-1.5 mb-4 py-1 self-start active:opacity-70"
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <ArrowLeft size={18} color={colors.primary} />
          <Text className="text-light-primary dark:text-dark-primary font-bold text-[14px]">
            Back
          </Text>
        </TouchableOpacity>
      ) : null}

      {/* Header Info */}
      <View className="flex-row items-start gap-3 mb-6">
        <View className="w-10 h-10 rounded-button bg-light-success/10 dark:bg-dark-success/20 items-center justify-center mt-0.5">
          <ShieldCheck size={20} color={colors.success} strokeWidth={2.2} />
        </View>
        <View className="flex-1">
          <Text className="text-light-text dark:text-dark-text font-black text-[16px] tracking-tight">
            {title}
          </Text>
          <Text className="text-light-muted dark:text-dark-muted font-regular text-[12px] mt-1 leading-[18px]">
            {subtitle || (
              <>
                We sent a 6-digit verification code to:{"\n"}
                <Text className="text-light-text dark:text-dark-text font-bold">
                  {email}
                </Text>
              </>
            )}
          </Text>
        </View>
      </View>

      {/* 6-Digit Code Container with Overlayed TextInput */}
      <Pressable onPress={handleFocusInput} className="relative my-5 active:opacity-95">
        <View pointerEvents="none" className="flex-row justify-between">
          {codeArray.map((_, index) => {
            const char = activeCode[index] || "";
            const isBoxFocused = isFocused && index === Math.min(activeCode.length, codeLength - 1);
            return (
              <View
                key={index}
                className={`w-[45px] h-[55px] rounded-lg border-2 items-center justify-center bg-light-background dark:bg-dark-background ${
                  isBoxFocused && activeCode.length < codeLength
                    ? "border-light-primary dark:border-dark-primary"
                    : char
                    ? "border-light-text/60 dark:border-dark-text/60"
                    : "border-light-border dark:border-dark-border"
                }`}
              >
                <Text className="text-light-text dark:text-dark-text font-black text-[20px]">
                  {char}
                </Text>
              </View>
            );
          })}
        </View>

        {/* Overlay TextInput covering entire 6-box area */}
        <TextInput
          ref={codeInputRef}
          value={code}
          onChangeText={(val) => {
            const sanitized = val.replace(/[^0-9]/g, "").slice(0, 6);
            setCode(sanitized);
            setError("");
            setInfoMessage("");
          }}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          onTouchStart={handleFocusInput}
          maxLength={6}
          keyboardType={Platform.OS === "ios" ? "number-pad" : "numeric"}
          textContentType="oneTimeCode"
          autoComplete="one-time-code"
          caretHidden={true}
          contextMenuHidden={true}
          style={styles.hiddenInputOverlay}
        />
      </Pressable>

      {/* Error State */}
      {error ? (
        <Text className="text-[#EF4444] text-[12px] font-medium mt-1 mb-4 px-1 leading-[18px]">
          {error}
        </Text>
      ) : null}

      {/* Success Info Message */}
      {infoMessage ? (
        <Text className="text-[#10B981] text-[12px] font-medium mt-1 mb-4 px-1 leading-[18px]">
          {infoMessage}
        </Text>
      ) : null}

      {/* Cooldown Timer / Resend Code Link */}
      <View className="flex-row justify-between items-center mt-1 mb-6 px-1">
        <Text className="text-light-muted dark:text-dark-muted font-regular text-[12px]">
          Didn't receive the code?
        </Text>
        <TouchableOpacity
          onPress={handleResend}
          disabled={resendCooldown > 0 || isSubmitting}
          className="active:opacity-60"
        >
          <Text
            className={`font-bold text-[12px] ${
              resendCooldown > 0
                ? "text-light-muted dark:text-dark-muted"
                : "text-light-accent dark:text-dark-accent"
            }`}
          >
            {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend Code"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Submission Button */}
      <AppButton
        label="Verify Code"
        variant="primary"
        uppercase={false}
        loading={isSubmitting}
        disabled={isSubmitting || code.length < 6}
        onPress={handleVerify}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  hiddenInputOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.01,
    color: "transparent",
    fontSize: 24,
  },
});
