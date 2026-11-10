import type { ReactNode } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import KeyboardAwareScrollView from "@/components/ui/KeyboardAwareScrollView";

interface AuthLayoutProps {
  children: ReactNode;
  header?: ReactNode;
  background?: string;
}

/**
 * Shared shell for login, forgot password and every onboarding step. The scroll view keeps the
 * focused field above the keyboard, so individual screens need no keyboard code of their own.
 */
export default function AuthLayout({
  children,
  header,
  background = "bg-light-background dark:bg-dark-background",
}: AuthLayoutProps) {
  return (
    <SafeAreaView className={`flex-1 ${background}`}>
      {header}
      <KeyboardAwareScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
      >
        {children}
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
}
