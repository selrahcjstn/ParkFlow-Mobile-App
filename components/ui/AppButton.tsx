import type { ReactNode } from "react";
import type { TouchableOpacityProps } from "react-native";
import { ActivityIndicator, Text, TouchableOpacity, View } from "react-native";

type ButtonVariant = "primary" | "secondary" | "outline" | "ghost";
type ButtonSize = "sm" | "md" | "lg";

interface AppButtonProps extends TouchableOpacityProps {
  label: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  rounded?: boolean;
  /** Optional Lucide icon element rendered before the label */
  icon?: ReactNode;
}

const containerVariants: Record<ButtonVariant, string> = {
  primary: "bg-light-primary",
  secondary: "bg-light-accent",
  outline: "bg-transparent border-2 border-light-accent",
  ghost: "bg-transparent",
};

const textVariants: Record<ButtonVariant, string> = {
  primary: "text-white",
  secondary: "text-white",
  outline: "text-light-accent",
  ghost: "text-light-accent",
};

const containerSizes: Record<ButtonSize, string> = {
  sm: "py-2.5 px-5",
  md: "py-3.5 px-6",
  lg: "py-4 px-8",
};

const textSizes: Record<ButtonSize, string> = {
  sm: "text-sm",
  md: "text-base",
  lg: "text-lg",
};

export default function AppButton({
  label,
  variant = "primary",
  size = "md",
  loading = false,
  rounded = true,
  icon,
  disabled,
  className = "",
  ...rest
}: AppButtonProps) {
  const isDisabled = disabled || loading;

  const containerClasses = [
    "items-center justify-center shadow-sm",
    rounded ? "rounded-full" : "rounded-xl",
    containerVariants[variant],
    containerSizes[size],
    isDisabled ? "opacity-50" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const textClasses = [
    "font-extrabold tracking-widest",
    textVariants[variant],
    textSizes[size],
  ].join(" ");

  return (
    <TouchableOpacity
      className={containerClasses}
      activeOpacity={0.95}
      disabled={isDisabled}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator
          color={
            variant === "outline" || variant === "ghost" ? "#1E3A5F" : "#FFFFFF"
          }
        />
      ) : (
        <View className="flex-row items-center gap-2">
          {icon}
          <Text className={textClasses}>{label}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}
