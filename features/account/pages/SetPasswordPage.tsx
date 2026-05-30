import { ContentWrapper } from "@/components/layouts";
import { AlertModal } from "@/components/shared";
import { AppButton, AppInput } from "@/components/ui";
import { KeyRound, Mail, ShieldCheck } from "lucide-react-native";
import { useRouter, useNavigation } from "expo-router";
import React, { useRef, useState, useEffect } from "react";
import {
  ScrollView,
  Text,
  View,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  TextInput,
  TouchableOpacity,
} from "react-native";

type StepType = "email" | "code" | "password";

export default function SetPasswordPage() {
  const router = useRouter();
  const navigation = useNavigation();
  const lastScrolledRef = useRef(false);
  const codeInputRef = useRef<TextInput>(null);

  const [step, setStep] = useState<StepType>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  const [errors, setErrors] = useState({
    email: "",
    code: "",
    password: "",
    confirmPassword: "",
  });

  const [modal, setModal] = useState({
    visible: false,
    title: "",
    message: "",
    variant: "success" as "error" | "warning" | "info" | "success",
  });

  useEffect(() => {
    let interval: any;
    if (resendCooldown > 0) {
      interval = setInterval(() => {
        setResendCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendCooldown]);

  useEffect(() => {
    if (step === "code") {
      setTimeout(() => {
        codeInputRef.current?.focus();
      }, 200);
    }
  }, [step]);

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
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim()) {
      setErrors((prev) => ({ ...prev, email: "Email address is required." }));
      return;
    } else if (!emailRegex.test(email.trim())) {
      setErrors((prev) => ({ ...prev, email: "Please enter a valid email address." }));
      return;
    }

    setIsSubmitting(true);
    await new Promise((resolve) => setTimeout(resolve, 800));
    setIsSubmitting(false);

    setStep("code");
    setResendCooldown(30);
  };

  const handleVerifyCode = async () => {
    Keyboard.dismiss();
    
    if (code.length < 6) {
      setErrors((prev) => ({ ...prev, code: "Please enter the 6-digit verification code." }));
      return;
    }

    setIsSubmitting(true);
    await new Promise((resolve) => setTimeout(resolve, 800));
    setIsSubmitting(false);

    setStep("password");
  };

  const handleResendCode = async () => {
    if (resendCooldown > 0) return;
    
    setIsSubmitting(true);
    await new Promise((resolve) => setTimeout(resolve, 800));
    setIsSubmitting(false);
    
    setCode("");
    setResendCooldown(30);
  };

  const handleSubmit = async () => {
    Keyboard.dismiss();
    
    let hasError = false;
    const newErrors = { email: "", code: "", password: "", confirmPassword: "" };

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
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsSubmitting(false);

    setModal({
      visible: true,
      title: "Credentials Saved",
      message: `Your login email has been set to ${email.trim()} and your password has been successfully configured.`,
      variant: "success",
    });
  };

  const handleModalClose = () => {
    setModal((p) => ({ ...p, visible: false }));
    router.back();
  };

  const handleBackToEmail = () => {
    setStep("email");
    setCode("");
    setErrors({ email: "", code: "", password: "", confirmPassword: "" });
  };

  const handleBackToCode = () => {
    setStep("code");
    setErrors({ email: "", code: "", password: "", confirmPassword: "" });
  };

  const renderEmailStep = () => {
    return (
      <View className="px-1 py-1">
        <View className="flex-row items-start gap-3 mb-4">
          <View className="w-9 h-9 rounded-button bg-light-danger/10 items-center justify-center">
            <Mail size={18} color="#D22730" strokeWidth={2.2} />
          </View>
          <View>
            <Text className="text-light-text font-black text-[15px] tracking-tight">
              Verify Email Address
            </Text>
            <Text className="text-light-muted font-regular text-[11px] mt-0.5">
              Enter email address to send a verification code
            </Text>
          </View>
        </View>

        <View className="gap-3.5 mt-2">
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
            className="mt-2"
            onPress={handleSendCode}
          />
        </View>
      </View>
    );
  };

  const renderCodeStep = () => {
    const codeLength = 6;
    const codeArray = new Array(codeLength).fill("");
    const activeCode = code.split("");

    return (
      <View className="px-1 py-1">
        <View className="flex-row items-start gap-3 mb-4">
          <View className="w-9 h-9 rounded-button bg-light-danger/10 items-center justify-center mt-0.5">
            <ShieldCheck size={18} color="#D22730" strokeWidth={2.2} />
          </View>
          <View>
            <Text className="text-light-text font-black text-[15px] tracking-tight">
              Enter Verification Code
            </Text>
            <Text className="text-light-muted font-regular text-[11.5px] mt-0.5 leading-[16px]">
              We sent a 6-digit verification code to:{"\n"}
              <Text className="text-light-text font-regular text-[11.5px]">
                {email}
              </Text>
            </Text>
          </View>
        </View>

        <TouchableWithoutFeedback onPress={() => codeInputRef.current?.focus()}>
          <View className="flex-row justify-between my-5">
            {codeArray.map((_, index) => {
              const char = activeCode[index] || "";
              const isFocused = index === activeCode.length && step === "code";
              return (
                <View
                  key={index}
                  className={`w-[45px] h-[55px] rounded-lg border-2 items-center justify-center bg-light-background ${
                    isFocused
                      ? "border-light-primary"
                      : char
                      ? "border-light-text/60"
                      : "border-light-border"
                  }`}
                >
                  <Text className="text-light-text font-black text-[20px]">
                    {char}
                  </Text>
                </View>
              );
            })}
          </View>
        </TouchableWithoutFeedback>

        <TextInput
          ref={codeInputRef}
          value={code}
          onChangeText={(val) => {
            const sanitized = val.replace(/[^0-9]/g, "");
            setCode(sanitized);
            setErrors((prev) => ({ ...prev, code: "" }));
          }}
          maxLength={6}
          keyboardType="number-pad"
          style={{ position: "absolute", width: 0, height: 0, opacity: 0 }}
        />

        {errors.code ? (
          <Text className="text-[#EF4444] text-[11px] font-medium -mt-2 mb-3">
            {errors.code}
          </Text>
        ) : null}

        <View className="flex-row justify-between items-center mt-1 mb-4">
          <Text className="text-light-muted font-regular text-[12px]">
            Didn't receive the code?
          </Text>
          <TouchableOpacity
            onPress={handleResendCode}
            disabled={resendCooldown > 0 || isSubmitting}
            className="active:opacity-60"
          >
            <Text
              className={`font-heavy text-[12px] ${
                resendCooldown > 0 ? "text-light-muted" : "text-light-accent"
              }`}
            >
              {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend Code"}
            </Text>
          </TouchableOpacity>
        </View>

        <AppButton
          label="Verify Code"
          variant="primary"
          uppercase={false}
          loading={isSubmitting}
          disabled={isSubmitting}
          onPress={handleVerifyCode}
        />
      </View>
    );
  };

  const renderPasswordStep = () => {
    return (
      <View className="px-1 py-1">
        <View className="flex-row items-start gap-3 mb-4">
          <View className="w-9 h-9 rounded-button bg-light-danger/10 items-center justify-center">
            <KeyRound size={18} color="#D22730" strokeWidth={2.2} />
          </View>
          <View>
            <Text className="text-light-text font-black text-[15px] tracking-tight">
              Create New Password
            </Text>
            <Text className="text-light-muted font-regular text-[11px] mt-0.5">
              Set your direct access login credentials
            </Text>
          </View>
        </View>

        <View className="gap-3.5 mt-2">
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
            className="mt-2"
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
