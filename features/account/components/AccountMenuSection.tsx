import React from "react";
import { Text, View } from "react-native";

interface AccountMenuSectionProps {
  title?: string;
  children: React.ReactNode;
  containerClassName?: string;
}

export default function AccountMenuSection({
  title,
  children,
  containerClassName = "mb-6",
}: AccountMenuSectionProps) {
  return (
    <View className={containerClassName}>
      {title ? (
        <Text className="text-[11px] font-bold uppercase tracking-widest text-light-muted dark:text-dark-muted mb-2 px-1">
          {title}
        </Text>
      ) : null}
      <View className="bg-light-surface dark:bg-dark-surface rounded-card overflow-hidden">
        {children}
      </View>
    </View>
  );
}
