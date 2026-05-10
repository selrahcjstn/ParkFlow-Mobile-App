import { Text, TouchableOpacity, ActivityIndicator } from "react-native";
import type { TouchableOpacityProps } from "react-native";

type ButtonVariant = "primary" | "secondary" | "outline" | "ghost";
type ButtonSize = "sm" | "md" | "lg";

interface AppButtonProps extends TouchableOpacityProps {
  /** Button label text */
  label: string;
  /** Visual variant */
  variant?: ButtonVariant;
  /** Size preset */
  size?: ButtonSize;
  /** Show a loading spinner and disable interactions */
  loading?: boolean;
  /** Fully rounded pill shape (default true) */
  rounded?: boolean;
}

/* ── Variant class maps ── */

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

/* ── Size class maps ── */

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
      activeOpacity={0.8}
      disabled={isDisabled}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === "outline" || variant === "ghost" ? "#1E3A5F" : "#FFFFFF"}
        />
      ) : (
        <Text className={textClasses}>{label}</Text>
      )}
    </TouchableOpacity>
  );
}
