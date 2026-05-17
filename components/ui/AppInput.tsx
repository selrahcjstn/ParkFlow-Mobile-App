// inlined placeholder and icon colors
import { AlertCircle, Eye, EyeOff } from "lucide-react-native";
import { useState } from "react";
import type { TextInputProps } from "react-native";
import { TextInput, TouchableOpacity, View } from "react-native";
import { Caption, Label } from "./Typography";

interface AppInputProps extends TextInputProps {
  label?: string;
  error?: string;
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
      {label ? <Label className="mb-1 ml-1">{label}</Label> : null}

      <View className="relative">
        <TextInput
          placeholderTextColor="#6B7280"
          className={`bg-light-surface rounded-xl px-4 py-3.5 text-light-text text-base shadow-sm border ${borderColor} ${
            isPassword ? "pr-14" : ""
          } ${className}`}
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
              <Eye size={20} color="#6B7280" strokeWidth={1.8} />
            ) : (
              <EyeOff size={20} color="#6B7280" strokeWidth={1.8} />
            )}
          </TouchableOpacity>
        ) : null}
      </View>

      {error ? (
        <View className="flex-row items-center mt-1 ml-1 gap-1">
          <AlertCircle size={14} color="#EF4444" strokeWidth={2} />
          <Caption className="text-light-danger font-medium">{error}</Caption>
        </View>
      ) : null}
    </View>
  );
}
