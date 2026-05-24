import React from "react";
import { View } from "react-native";

type Props = {
  children?: React.ReactNode;
  noPadding?: boolean;
};

export default function ContentWrapper({ children, noPadding = false }: Props) {
  return (
    <View
      className={`flex-1 bg-light-background mt-4 ${noPadding ? "" : "px-5"}`}
    >
      {children}
    </View>
  );
}
