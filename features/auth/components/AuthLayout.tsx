import type { ReactNode } from "react";
import { ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface AuthLayoutProps {
  children: ReactNode;
  header?: ReactNode;
  background?: string;
}

export default function AuthLayout({
  children,
  header,
  background = "bg-light-background dark:bg-dark-background",
}: AuthLayoutProps) {
  return (
    <SafeAreaView className={`flex-1 ${background}`}>
      {header}
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}
