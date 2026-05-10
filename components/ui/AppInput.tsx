import { useState } from "react";
import { Text, TextInput, TouchableOpacity, View } from "react-native";
import type { TextInputProps } from "react-native";

interface AppInputProps extends TextInputProps {
  /** Label displayed above the input */
  label?: string;
  /** Error message displayed below the input */
  error?: string;
  /** Show a password-toggle eye icon */
  isPassword?: boolean;
}

export default function AppInput({
  label,
  error,
  isPassword = false,
  className = "",
  ...rest
}: AppInputProps) {
  const [hidden, setHidden] = useState(true);

  const borderColor = error ? "border-light-danger" : "border-light-border";

  return (
    <View className="mb-4">
      {/* ── Label ── */}
      {label && (
        <Text className="text-light-accent text-sm font-semibold mb-1 ml-1">
          {label}
        </Text>
      )}

      {/* ── Input Row ── */}
      <View className="relative">
        <TextInput
          placeholderTextColor="#9CA3AF"
          className={`bg-white rounded-xl px-4 py-3.5 text-light-text text-base shadow-sm border ${borderColor} ${
            isPassword ? "pr-14" : ""
          } ${className}`}
          secureTextEntry={isPassword && hidden}
          autoCapitalize="none"
          autoCorrect={false}
          {...rest}
        />

        {/* ── Toggle visibility ── */}
        {isPassword && (
          <TouchableOpacity
            className="absolute right-3 top-0 bottom-0 justify-center"
            onPress={() => setHidden((h) => !h)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text className="text-light-muted text-sm font-bold">
              {hidden ? "Show" : "Hide"}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* ── Error ── */}
      {error && (
        <Text className="text-light-danger text-xs font-medium mt-1 ml-1">
          {error}
        </Text>
      )}
    </View>
  );
}
