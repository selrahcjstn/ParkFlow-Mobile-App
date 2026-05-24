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
  return (
    <TouchableOpacity
      hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
      {...rest}
    >
      {size === "sm" ? (
        <Text className={`font-bold text-[13px] text-light-accent ${className}`}>
          {label}
        </Text>
      ) : (
        <Text className={`font-bold text-base text-light-accent ${className}`}>
          {label}
        </Text>
      )}
    </TouchableOpacity>
  );
}
