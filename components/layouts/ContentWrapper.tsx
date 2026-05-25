import React from "react";
import { View } from "react-native";

type Props = {
  children?: React.ReactNode;
  noPaddingX?: boolean;
  noPaddingY?: boolean;
};

export default function ContentWrapper({
  children,
  noPaddingX = false,
  noPaddingY = false,
}: Props) {
  return (
    <View
      className={`flex-1 bg-light-background ${noPaddingX ? "" : "px-4"} ${noPaddingY ? "" : "pt-4"}`}
    >
      {children}
    </View>
  );
}
