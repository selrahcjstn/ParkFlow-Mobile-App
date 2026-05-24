import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";

type Props = {
  children?: React.ReactNode;
};

export default function ContentWrapper({ children }: Props) {
  return (
    <SafeAreaView className="flex-1  bg-light-background px-5" edges={["top"]}>
      {children}
    </SafeAreaView>
  );
}
