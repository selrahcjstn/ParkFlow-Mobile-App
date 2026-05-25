import React from "react";
import { Text, View } from "react-native";

type SectionCardProps = {
  title: string;
  children: React.ReactNode;
};

export default function SectionCard({ title, children }: SectionCardProps) {
  return (
    <View className="mb-4 bg-light-surface rounded-2xl px-4 py-2">
      <Text className="text-light-text font-heavy pt-2 pb-1 text-[13px]">
        {title}
      </Text>
      <View>{children}</View>
    </View>
  );
}

