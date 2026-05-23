import { Body, Caption } from "@/components/ui/Typography";
import React from "react";
import { TouchableOpacity, View } from "react-native";

interface PaymentOptionProps {
  icon: React.ReactNode;
  label: string;
  sublabel: string;
  selected: boolean;
  onPress: () => void;
}

export default function PaymentOption({
  icon,
  label,
  sublabel,
  selected,
  onPress,
}: PaymentOptionProps) {
  return (
    <TouchableOpacity
      activeOpacity={0.75}
      onPress={onPress}
      className={`flex-row items-center px-4 py-4 rounded-2xl bg-light-surface ${
        selected ? "border border-light-success" : "border border-transparent"
      }`}
    >
      <View
        className={`w-11 h-11 rounded-xl items-center justify-center mr-3.5 ${
          selected ? "bg-light-success/15" : "bg-light-background"
        }`}
      >
        {icon}
      </View>

      <View className="flex-1">
        <Body
          className={`font-heavy text-[14px] ${
            selected ? "text-light-success" : "text-light-text"
          }`}
        >
          {label}
        </Body>
        <Caption className="font-book text-[12px] mt-0.5">{sublabel}</Caption>
      </View>

      <View
        className={`w-5 h-5 rounded-full border-2 items-center justify-center ${
          selected ? "border-light-success" : "border-light-border"
        }`}
      >
        {selected && (
          <View className="w-2.5 h-2.5 rounded-full bg-light-success" />
        )}
      </View>
    </TouchableOpacity>
  );
}
