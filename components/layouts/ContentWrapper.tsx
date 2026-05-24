import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";

type Props = {
  children?: React.ReactNode;
  noPadding?: boolean; // 👈 Add this optional prop
};

export default function ContentWrapper({ children, noPadding = false }: Props) {
  return (
    <SafeAreaView
      // If noPadding is true, remove horizontal padding from the safe area container
      className={`flex-1 bg-light-background ${noPadding ? "" : "px-5"}`}
      edges={["top"]}
    >
      {children}
    </SafeAreaView>
  );
}
