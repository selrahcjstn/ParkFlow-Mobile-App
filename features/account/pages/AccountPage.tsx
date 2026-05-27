import { ContentWrapper } from "@/components/layouts";
import AccountMenu from "@/features/account/components/AccountMenu";
import { useAuthStore } from "@/features/auth/store/auth.store";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { router, useSegments } from "expo-router";
import React, { useState } from "react";
import { ScrollView, useColorScheme } from "react-native";

export default function AccountPage() {
  const segments = useSegments() as string[];
  const isGuardSide = segments.includes("(guard)");
  const tabBarHeight = useBottomTabBarHeight();

  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const [darkTheme, setDarkTheme] = useState(isDark);

  const logout = useAuthStore((s) => s.logout);

  const handleLogout = async () => {
    await logout();
    router.replace("/(auth)/login");
  };

  return (
    <ContentWrapper noPaddingY>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingVertical: 16,
          paddingBottom: isGuardSide ? tabBarHeight + 35 : 16,
        }}
      >
        <AccountMenu
          isDark={isDark}
          darkTheme={darkTheme}
          onToggleDarkTheme={setDarkTheme}
          onLogout={handleLogout}
        />
      </ScrollView>
    </ContentWrapper>
  );
}
