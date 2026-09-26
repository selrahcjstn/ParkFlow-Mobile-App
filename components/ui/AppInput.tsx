// inlined placeholder and icon colors
import { AlertCircle, Eye, EyeOff } from "lucide-react-native";
import { useState } from "react";
import type { TextInputProps } from "react-native";
import { Text, TextInput, TouchableOpacity, View } from "react-native";
import { useSegments } from "expo-router";
import { useAppTheme } from "@/hooks/useAppTheme";

interface AppInputProps extends TextInputProps {
  label?: string;
  error?: string;
  isPassword?: boolean;
  forceLight?: boolean;
}

export default function AppInput({
  label,
  error,
  isPassword = false,
  className = "",
  forceLight = false,
  ...rest
}: AppInputProps) {
  const [hidden, setHidden] = useState(true);
  const segments = useSegments() as string[];
  const { isDark } = useAppTheme();

  const isAuthPage = segments.includes("(auth)");
  const isOnboarding = segments.some(s => s.startsWith("onboarding") || s === "pending" || s === "verified");
  const shouldForceLight = forceLight || (isAuthPage && isOnboarding);
  const currentIsDark = isDark && !shouldForceLight;

  const borderColor = error
    ? (currentIsDark ? "border-dark-danger" : "border-light-danger")
    : (currentIsDark ? "border-dark-border" : "border-light-border");

  return (
    <View className="mb-4">
      {label ? (
        <Text
          className={`font-book text-base leading-5 mb-1 ml-1 ${
            currentIsDark ? "text-dark-text" : "text-light-text"
          }`}
        >
          {label}
        </Text>
      ) : null}

      <View className="relative">
        <TextInput
          placeholderTextColor={currentIsDark ? "#B5BAC1" : "#6B7280"}
          className={`rounded-xl px-4 text-base border ${borderColor} ${
            currentIsDark
              ? "bg-dark-surface text-dark-text"
              : "bg-light-surface text-light-text"
          } ${isPassword ? "pr-14" : ""} ${className}`}
          style={{ paddingVertical: 14, lineHeight: 22 }}
          secureTextEntry={isPassword && hidden}
          autoCapitalize="none"
          autoCorrect={false}
          {...rest}
        />

        {isPassword ? (
          <TouchableOpacity
            className="absolute right-3 top-0 bottom-0 justify-center"
            onPress={() => setHidden((h) => !h)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            {hidden ? (
              <Eye size={20} color={currentIsDark ? "#B5BAC1" : "#6B7280"} strokeWidth={1.8} />
            ) : (
              <EyeOff size={20} color={currentIsDark ? "#B5BAC1" : "#6B7280"} strokeWidth={1.8} />
            )}
          </TouchableOpacity>
        ) : null}
      </View>

      {error ? (
        <View className="flex-row items-center mt-1 ml-1 gap-1">
          <AlertCircle size={14} color={currentIsDark ? "#F87171" : "#EF4444"} strokeWidth={2} />
          <Text className={`${currentIsDark ? "text-dark-danger" : "text-light-danger"} font-book text-[13px] leading-5`}>
            {error}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

