import { useAppTheme } from "@/hooks/useAppTheme";
import { themeColors } from "@/constants/colors";
import { useSegments } from "expo-router";
import type { ReactNode } from "react";
import type { TouchableOpacityProps } from "react-native";
import { ActivityIndicator, Text, TouchableOpacity, View } from "react-native";

type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";

interface AppButtonProps extends TouchableOpacityProps {
  label: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: ReactNode;
  uppercase?: boolean;
  forceLight?: boolean;
  textClassName?: string;
}

const styles: Record<
  ButtonVariant,
  { container: string; text: string }
> = {
  primary: {
    container: "bg-light-primary dark:bg-dark-primary",
    text: "text-light-textInverse dark:text-dark-background",
  },
  secondary: {
    container: "bg-light-accent dark:bg-dark-accent",
    text: "text-light-textInverse dark:text-dark-background",
  },
  outline: {
    container:
      "bg-transparent border border-light-primary/30 dark:border-dark-primary/30",
    text: "text-light-primary dark:text-dark-primary",
  },
  ghost: {
    container: "bg-transparent",
    text: "text-light-primary dark:text-dark-primary",
  },
  danger: {
    container: "bg-light-danger dark:bg-dark-danger",
    text: "text-light-text dark:text-dark-background",
  },
};

const sizes: Record<ButtonSize, { container: string; text: string }> = {
  sm: { container: "py-2.5 px-3", text: "text-xs" },
  md: { container: "py-3.5 px-6", text: "text-sm" },
  lg: { container: "py-4 px-8", text: "text-sm" },
};

export default function AppButton({
  label,
  variant = "primary",
  size = "md",
  loading = false,
  icon,
  disabled,
  className = "",
  uppercase = true,
  forceLight = false,
  textClassName = "",
  accessibilityState,
  ...rest
}: AppButtonProps) {
  const segments = (useSegments() as string[]) || [];
  const { isDark, colors } = useAppTheme();

  const isAuthPage = segments.includes("(auth)");
  const isOnboarding = segments.some(s => s.startsWith("onboarding") || s === "pending" || s === "verified");
  const shouldForceLight = forceLight || (isAuthPage && isOnboarding);
  const currentIsDark = isDark && !shouldForceLight;

  const isDisabled = disabled || loading;
  const s = styles[variant];
  const sz = sizes[size];
  const currentColors = currentIsDark ? colors : themeColors.light;
  const spinnerColor = variant === "danger"
    ? currentIsDark ? currentColors.background : currentColors.text
    : variant === "primary" || variant === "secondary"
      ? currentIsDark ? currentColors.background : themeColors.light.surface
      : currentColors.primary;

  // Filter out dark: classes from s.container and s.text if forcing light theme
  let containerStyles = s.container;
  let textStyles = s.text;

  if (shouldForceLight) {
    containerStyles = containerStyles
      .split(" ")
      .filter((c) => !c.startsWith("dark:"))
      .join(" ");
    textStyles = textStyles
      .split(" ")
      .filter((c) => !c.startsWith("dark:"))
      .join(" ");
  }

  // Filter out text color classes from textStyles if textClassName is provided
  if (textClassName) {
    textStyles = textStyles
      .split(" ")
      .filter((c) => !c.includes("text-"))
      .join(" ");
  }

  return (
    <TouchableOpacity
      activeOpacity={0.75}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityState={{ ...accessibilityState, disabled: !!isDisabled, busy: loading }}
      className={[
        "min-h-[44px] rounded-xl items-center justify-center",
        containerStyles,
        sz.container,
        isDisabled ? "opacity-40" : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator color={spinnerColor} size="small" />
      ) : (
        <View className="max-w-full flex-row items-center justify-center gap-2">
          {icon ? <View className="shrink-0">{icon}</View> : null}
          <Text
            className={[
              "shrink text-center font-bold",
              uppercase ? "uppercase tracking-widest" : "tracking-normal",
              sz.text,
              textStyles,
              textClassName,
            ]
              .filter(Boolean)
              .join(" ")}
          >
            {label}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}
