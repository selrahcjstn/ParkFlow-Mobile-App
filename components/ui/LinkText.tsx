import { Text, TouchableOpacity } from "react-native";
import type { TouchableOpacityProps } from "react-native";

interface LinkTextProps extends TouchableOpacityProps {
  /** The link text to display */
  label: string;
  /** Optional size */
  size?: "xs" | "sm" | "base";
}

export default function LinkText({
  label,
  size = "sm",
  className = "",
  ...rest
}: LinkTextProps) {
  const sizeClass = size === "xs" ? "text-xs" : size === "base" ? "text-base" : "text-sm";

  return (
    <TouchableOpacity hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }} {...rest}>
      <Text className={`text-light-accent ${sizeClass} font-extrabold ${className}`}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}
