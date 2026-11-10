// inlined placeholder and icon colors
import { AlertCircle, Eye, EyeOff } from "lucide-react-native";
import { useState, type ComponentRef, type Ref } from "react";
import type { TextInputProps } from "react-native";
import { Text, TextInput, TouchableOpacity, View } from "react-native";
import { useAppTheme } from "@/hooks/useAppTheme";
import { themeColors } from "@/constants/colors";
import { useKeyboardScroll } from "@/components/ui/KeyboardAwareScrollView";

interface AppInputProps extends TextInputProps {
  label?: string;
  error?: string;
  isPassword?: boolean;
  forceLight?: boolean;
  /** Lets a form focus the next field from `onSubmitEditing`. */
  ref?: Ref<ComponentRef<typeof TextInput>>;
}

export default function AppInput({
  label,
  error,
  isPassword = false,
  className = "",
  forceLight = false,
  ref,
  ...rest
}: AppInputProps) {
  const [hidden, setHidden] = useState(true);
  const { isDark, colors } = useAppTheme();
  const keyboardScroll = useKeyboardScroll();

  const currentIsDark = isDark && !forceLight;
  const currentColors = currentIsDark ? colors : themeColors.light;
  const isReadOnly = rest.editable === false || rest.readOnly === true;
  const inputColors = isReadOnly
    ? (currentIsDark ? "bg-dark-surfaceMuted text-dark-muted" : "bg-light-surfaceMuted text-light-muted")
    : (currentIsDark ? "bg-dark-surface text-dark-text" : "bg-light-surface text-light-text");

  const borderColor = error
    ? (currentIsDark ? "border-dark-danger" : "border-light-danger")
    : (currentIsDark ? "border-dark-border" : "border-light-border");

  return (
    <View className="mb-4">
      {label ? (
        <Text
          className={`font-book text-base leading-5 mb-1 ml-1 ${
            isReadOnly
              ? (currentIsDark ? "text-dark-muted" : "text-light-muted")
              : (currentIsDark ? "text-dark-text" : "text-light-text")
          }`}
        >
          {label}
        </Text>
      ) : null}

      <View className="relative">
        <TextInput
          ref={ref}
          placeholderTextColor={currentColors.muted}
          className={`rounded-xl px-4 text-base border ${borderColor} ${inputColors} ${isPassword ? "pr-14" : ""} ${className}`}
          style={{ paddingVertical: 14, lineHeight: 22 }}
          secureTextEntry={isPassword && hidden}
          autoCapitalize="none"
          autoCorrect={false}
          {...rest}
          onFocus={(event) => {
            rest.onFocus?.(event);
            // Covers moving between fields while the keyboard is already open.
            keyboardScroll?.scrollToFocused(120);
          }}
        />

        {isPassword ? (
          <TouchableOpacity
            className="absolute right-3 top-0 bottom-0 justify-center"
            onPress={() => setHidden((h) => !h)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            {hidden ? (
              <Eye size={20} color={currentColors.muted} strokeWidth={1.8} />
            ) : (
              <EyeOff size={20} color={currentColors.muted} strokeWidth={1.8} />
            )}
          </TouchableOpacity>
        ) : null}
      </View>

      {error ? (
        <View className="flex-row items-center mt-1 ml-1 gap-1">
          <AlertCircle size={14} color={currentColors.danger} strokeWidth={2} />
          <Text className={`${currentIsDark ? "text-dark-danger" : "text-light-text"} font-book text-[13px] leading-5`}>
            {error}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

