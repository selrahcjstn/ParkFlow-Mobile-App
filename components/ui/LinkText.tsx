import type { TouchableOpacityProps } from "react-native";
import { TouchableOpacity } from "react-native";

import { Body, Caption } from "@/components/ui/Typography";

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
      {size === "sm" ? (
        <Caption className={`text-light-accent font-extrabold ${className}`}>
          {label}
        </Caption>
      ) : (
        <Body className={`text-light-accent font-extrabold ${className}`}>
          {label}
        </Body>
      )}
    </TouchableOpacity>
  );
}
