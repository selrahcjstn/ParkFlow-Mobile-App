import type { ReactNode } from "react";
import { ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface AuthLayoutProps {
  children: ReactNode;
  header?: ReactNode;
  /**
   * Tailwind background class applied to the SafeAreaView.
   * Defaults to "bg-light-background".
   * Pass "bg-light-primary" to get the branded red top that shows
   * behind the AuthHeader before the white FormCard starts.
   */
  background?: string;
}

export default function AuthLayout({
  children,
  header,
  background = "bg-light-background",
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
