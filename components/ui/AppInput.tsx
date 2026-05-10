import { useState } from "react";
import { TextInput, TouchableOpacity, View, Text } from "react-native";
import type { TextInputProps } from "react-native";
import { Eye, EyeOff, AlertCircle } from "lucide-react-native";

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
      {label && (
        <Text className="text-light-accent text-sm font-semibold mb-1 ml-1">
          {label}
        </Text>
      )}

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

        {/* Eye icon to toggle password visibility */}
        {isPassword && (
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
        )}
      </View>

      {/* Error message with an icon for extra clarity */}
      {error && (
        <View className="flex-row items-center mt-1 ml-1 gap-1">
          <AlertCircle size={13} color="#EF4444" strokeWidth={2} />
          <Text className="text-light-danger text-xs font-medium">{error}</Text>
        </View>
      )}
    </View>
  );
}
