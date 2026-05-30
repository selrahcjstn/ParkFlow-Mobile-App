import type { ReactNode } from "react";
import type { TouchableOpacityProps } from "react-native";
import { ActivityIndicator, Text, TouchableOpacity, View } from "react-native";
import { useAppTheme } from "@/hooks/useAppTheme";

type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";

interface AppButtonProps extends TouchableOpacityProps {
  label: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: ReactNode;
  uppercase?: boolean;
}

const styles: Record<
  ButtonVariant,
  { container: string; text: string; spinnerLight: string; spinnerDark: string }
> = {
  primary: {
    container: "bg-light-primary dark:bg-dark-primary",
    text: "text-white dark:text-zinc-950",
    spinnerLight: "#FFFFFF",
    spinnerDark: "#09090B",
  },
  secondary: {
    container: "bg-light-accent dark:bg-dark-accent",
    text: "text-white dark:text-zinc-950",
    spinnerLight: "#FFFFFF",
    spinnerDark: "#09090B",
  },
  outline: {
    container: "bg-transparent border border-light-border dark:border-dark-border",
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
    text: "text-white dark:text-zinc-950",
    spinnerLight: "#FFFFFF",
    spinnerDark: "#09090B",
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
  ...rest
}: AppButtonProps) {
  const { isDark } = useAppTheme();
  const isDisabled = disabled || loading;
  const s = styles[variant];
  const sz = sizes[size];
  const spinnerColor = isDark ? s.spinnerDark : s.spinnerLight;

  return (
    <TouchableOpacity
      activeOpacity={0.75}
      disabled={isDisabled}
      className={[
        "rounded-xl items-center justify-center",
        s.container,
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
              s.text,
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

