import React from "react";
import { Text, TouchableOpacity, View } from "react-native";

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
      className={`flex-row items-center px-4 py-4 rounded-2xl bg-light-surface dark:bg-dark-surface ${
        selected ? "border border-light-primary dark:border-dark-primary" : "border border-transparent"
      }`}
    >
      <View
        className={`w-11 h-11 rounded-xl items-center justify-center mr-3.5 ${
          selected ? "bg-light-primary/15 dark:bg-dark-primary/15" : "bg-light-background dark:bg-dark-background"
        }`}
      >
        {icon}
      </View>

      <View className="flex-1">
        <Text
          className={`font-bold text-[14px] ${
            selected ? "text-light-primary dark:text-dark-primary" : "text-light-text dark:text-dark-text"
          }`}
        >
          {label}
        </Text>
        <Text className="text-light-muted dark:text-dark-muted font-light text-[12px] mt-0.5">{sublabel}</Text>
      </View>

      <View
        className={`w-5 h-5 rounded-full border-2 items-center justify-center ${
          selected ? "border-light-primary dark:border-dark-primary" : "border-light-border dark:border-dark-border"
        }`}
      >
        {selected && (
          <View className="w-2.5 h-2.5 rounded-full bg-light-primary dark:bg-dark-primary" />
        )}
      </View>
    </TouchableOpacity>
  );
}
