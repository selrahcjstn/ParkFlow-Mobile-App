import { TabScreenLayout } from "@/components/layouts";
import AccountMenu from "@/features/account/components/AccountMenu";
import { useAuthStore } from "@/features/auth/store/auth.store";
import { router } from "expo-router";
import React from "react";
import { ScrollView, useColorScheme } from "react-native";

export default function AccountPage() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const [darkTheme, setDarkTheme] = React.useState(isDark);
  const [isScrolled, setIsScrolled] = React.useState(false);

  const logout = useAuthStore((s) => s.logout);

  const handleLogout = async () => {
    await logout();
    router.replace("/(auth)/login");
  };

  return (
    <TabScreenLayout title="Account" isScrolled={isScrolled}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 16 }}
        onScroll={(event) => {
          setIsScrolled(event.nativeEvent.contentOffset.y > 5);
        }}
        scrollEventThrottle={16}
      >
        <AccountMenu
          isDark={isDark}
          darkTheme={darkTheme}
          onToggleDarkTheme={setDarkTheme}
          onLogout={handleLogout}
        />
      </ScrollView>
    </TabScreenLayout>
  );
}
