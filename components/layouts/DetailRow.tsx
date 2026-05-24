import React from "react";
import { Text, TouchableOpacity, View } from "react-native";

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
    <Text
      className={`flex-1 text-right text-[13px] leading-[20px] ${isHighlight ? "font-bold" : "font-regular"} ${valueColorClass}`}
      style={valueColor ? { color: valueColor } : undefined}
    >
      {value}
    </Text>
  );

  return (
    <View className="flex-row justify-between items-center py-2.5">
      <Text
        className={`text-[13px] leading-[20px] ${isHighlight ? "font-bold text-light-text" : "font-regular text-light-muted"}`}
      >
        {label}
      </Text>
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
