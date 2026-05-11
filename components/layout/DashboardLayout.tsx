import type { ReactNode } from "react";
import { ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface DashboardLayoutProps {
  children: ReactNode;
}

/**
 * Full-screen scroll wrapper for authenticated dashboard screens.
 * Uses the primary colour for the status-bar area and off-white for the body.
 */
export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <SafeAreaView className="flex-1 bg-light-primary">
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
      >
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}
