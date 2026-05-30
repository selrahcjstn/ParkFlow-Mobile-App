import AppInput from "@/components/ui/AppInput";
import { AppButton } from "@/components/ui";
import { X } from "lucide-react-native";
import React, { useState, useEffect } from "react";
import {
  Modal,
  Text,
  TouchableOpacity,
  View,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
} from "react-native";

interface SetPasswordModalProps {
  visible: boolean;
  onClose: () => void;
  defaultEmail: string;
  onSave: (email: string) => void;
}

export default function SetPasswordModal({
  visible,
  onClose,
  defaultEmail,
  onSave,
}: SetPasswordModalProps) {
  const [email, setEmail] = useState(defaultEmail);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [errors, setErrors] = useState({
    email: "",
    password: "",
    confirmPassword: "",
  });

  useEffect(() => {
    if (visible) {
      setEmail(defaultEmail);
      setPassword("");
      setConfirmPassword("");
      setErrors({ email: "", password: "", confirmPassword: "" });
    }
  }, [visible, defaultEmail]);

  const handleSubmit = async () => {
    Keyboard.dismiss();
    
    let hasError = false;
    const newErrors = { email: "", password: "", confirmPassword: "" };

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim()) {
      newErrors.email = "Email address is required.";
      hasError = true;
    } else if (!emailRegex.test(email.trim())) {
      newErrors.email = "Please enter a valid email address.";
      hasError = true;
    }

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
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsSubmitting(false);
    onSave(email.trim());
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View className="flex-1 justify-center bg-black/50 px-5 z-50">
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
          >
            <View className="bg-light-surface rounded-card p-5 border border-light-border/40 shadow-card">
              <View className="flex-row items-center justify-between border-b border-light-border/20 pb-3.5 mb-5">
                <Text className="text-light-text font-black text-[16px] tracking-tight">
                  Set Email & Password
                </Text>
                <TouchableOpacity
                  onPress={onClose}
                  className="w-8 h-8 rounded-pill bg-light-background items-center justify-center active:bg-light-border/40"
                >
                  <X size={15} color="#71717A" strokeWidth={2.5} />
                </TouchableOpacity>
              </View>

              <AppInput
                label="Email Address"
                value={email}
                onChangeText={(t) => {
                  setEmail(t);
                  setErrors((prev) => ({ ...prev, email: "" }));
                }}
                keyboardType="email-address"
                autoCapitalize="none"
                error={errors.email}
              />

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

              <View className="flex-row gap-3 mt-4">
                <View className="flex-1">
                  <AppButton
                    label="Cancel"
                    variant="outline"
                    uppercase={false}
                    disabled={isSubmitting}
                    onPress={onClose}
                  />
                </View>
                <View className="flex-1">
                  <AppButton
                    label="Submit"
                    variant="primary"
                    uppercase={false}
                    loading={isSubmitting}
                    disabled={isSubmitting}
                    onPress={handleSubmit}
                  />
                </View>
              </View>
            </View>
          </KeyboardAvoidingView>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}
