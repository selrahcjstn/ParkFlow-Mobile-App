import type { TouchableOpacityProps } from "react-native";
import { Text, TouchableOpacity } from "react-native";

interface LinkTextProps extends TouchableOpacityProps {
  label: string;
  size?: "sm" | "base";
}

export default function LinkText({
  label,
  size = "base",
  className = "",
  ...rest
}: LinkTextProps) {
  const sizeClass = size === "sm" ? "text-sm" : "text-base";

  return (
    <TouchableOpacity
      hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
      {...rest}
    >
      <Text
        className={`text-light-accent ${sizeClass} font-extrabold ${className}`}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}
