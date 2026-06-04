import { useAppTheme } from "@/hooks/useAppTheme";
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
  { container: string; text: string; spinnerLight: string; spinnerDark: string }
> = {
  primary: {
    container: "bg-light-primary dark:bg-dark-primary",
    text: "text-white",
    spinnerLight: "#FFFFFF",
    spinnerDark: "#FFFFFF",
  },
  secondary: {
    container: "bg-light-accent dark:bg-dark-accent",
    text: "text-white dark:text-zinc-950",
    spinnerLight: "#FFFFFF",
    spinnerDark: "#09090B",
  },
  outline: {
    container:
      "bg-transparent border border-light-border dark:border-dark-border",
    text: "text-light-text dark:text-dark-text",
    spinnerLight: "#09090B",
    spinnerDark: "#F2F3F5",
  },
  ghost: {
    container: "bg-transparent",
    text: "text-light-muted dark:text-dark-muted",
    spinnerLight: "#71717A",
    spinnerDark: "#B5BAC1",
  },
  danger: {
    container: "bg-light-danger dark:bg-dark-danger",
    text: "text-white",
    spinnerLight: "#FFFFFF",
    spinnerDark: "#FFFFFF",
  },
};

const sizes: Record<ButtonSize, { container: string; text: string }> = {
  sm: { container: "py-2.5 px-5", text: "text-xs" },
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
  ...rest
}: AppButtonProps) {
  const segments = useSegments() as string[];
  const { isDark } = useAppTheme();

  const isAuthPage = segments.includes("(auth)");
  const isOnboarding = segments.some(s => s.startsWith("onboarding") || s === "pending" || s === "verified");
  const shouldForceLight = forceLight || (isAuthPage && isOnboarding);
  const currentIsDark = isDark && !shouldForceLight;

  const isDisabled = disabled || loading;
  const s = styles[variant];
  const sz = sizes[size];
  const spinnerColor = currentIsDark ? s.spinnerDark : s.spinnerLight;

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
      className={[
        "rounded-xl items-center justify-center",
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
        <View className="flex-row items-center gap-2">
          {icon}
          <Text
            className={[
              "tracking-widest font-heavy",
              uppercase ? "uppercase" : "",
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
