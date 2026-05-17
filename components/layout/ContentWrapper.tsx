import React from "react";
import { View } from "react-native";

type Props = {
  children?: React.ReactNode;
};

export default function ContentWrapper({ children }: Props) {
  return (
    <View className="flex-1 bg-light-background rounded-t-3xl px-5 pt-2">
      {children}
    </View>
  );
}
