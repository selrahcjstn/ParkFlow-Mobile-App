import { Body } from "@/components/ui/Typography";
import React from "react";
import { TouchableOpacity, View } from "react-native";

export type DetailRowProps = {
  label: string;
  value: string;
  isHighlight?: boolean;
  valueColorClass?: string;
  valueColor?: string;
  onPress?: () => void;
};

export default function DetailRow({
  label,
  value,
  isHighlight = false,
  valueColorClass = "text-light-text",
  valueColor,
  onPress,
}: DetailRowProps) {
  const Value = (
    <Body
      className={`flex-1 text-right text-[13px] leading-[20px] ${isHighlight ? "font-heavy" : "font-book"} ${valueColorClass}`}
      style={valueColor ? { color: valueColor } : undefined}
    >
      {value}
    </Body>
  );

  return (
    <View className="flex-row justify-between items-center py-2.5">
      <Body
        className={`text-[13px] leading-[20px] ${isHighlight ? "font-heavy text-light-text" : "font-book text-light-muted"}`}
      >
        {label}
      </Body>
      {onPress ? (
        <TouchableOpacity
          onPress={onPress}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          {Value}
        </TouchableOpacity>
      ) : (
        Value
      )}
    </View>
  );
}
