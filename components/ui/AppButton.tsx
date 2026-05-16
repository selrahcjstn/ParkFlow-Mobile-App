import { Label } from "@/components/ui/Typography";
import { lightColors } from "@/constants/theme";
import type { ReactNode } from "react";
import type { TouchableOpacityProps } from "react-native";
import { ActivityIndicator, TouchableOpacity, View } from "react-native";

type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";

interface AppButtonProps extends TouchableOpacityProps {
  label: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: ReactNode;
}

const styles: Record<
  ButtonVariant,
  { container: string; text: string; spinner: string }
> = {
  primary: {
    container: "bg-light-primary",
    text: "text-white",
    spinner: "#FFFFFF",
  },
  secondary: {
    container: "bg-light-accent",
    text: "text-white",
    spinner: "#FFFFFF",
  },
  outline: {
    container: "bg-transparent border border-light-border",
    text: "text-light-text",
    spinner: lightColors.text,
  },
  ghost: {
    container: "bg-transparent",
    text: "text-light-muted",
    spinner: lightColors.muted,
  },
  danger: {
    container: "bg-light-danger",
    text: "text-white",
    spinner: "#FFFFFF",
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
  ...rest
}: AppButtonProps) {
  const isDisabled = disabled || loading;
  const s = styles[variant];
  const sz = sizes[size];

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
        <ActivityIndicator color={s.spinner} size="small" />
      ) : (
        <View className="flex-row items-center gap-2">
          {icon}
          <Label
            className={[
              "tracking-widest uppercase font-heavy",
              sz.text,
              s.text,
            ].join(" ")}
          >
            {label}
          </Label>
        </View>
      )}
    </TouchableOpacity>
  );
}
