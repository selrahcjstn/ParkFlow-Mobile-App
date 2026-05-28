import { ContentWrapper } from "@/components/layouts";
import AccountMenu from "@/features/account/components/AccountMenu";
import { useAuthStore } from "@/features/auth/store/auth.store";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { router, useSegments, useNavigation } from "expo-router";
import React, { useState, useRef } from "react";
import { ScrollView, useColorScheme } from "react-native";

export default function AccountPage() {
  const segments = useSegments() as string[];
  const isGuardSide = segments.includes("(guard)");
  const tabBarHeight = useBottomTabBarHeight();
  const navigation = useNavigation();
  const lastScrolledRef = useRef(false);

  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const [darkTheme, setDarkTheme] = useState(isDark);

  const logout = useAuthStore((s) => s.logout);

  const handleLogout = async () => {
    await logout();
    router.replace("/(auth)/login");
  };

  const handleScroll = (event: any) => {
    const yOffset = event?.nativeEvent?.contentOffset?.y;
    if (yOffset !== undefined && yOffset !== null) {
      const scrolled = yOffset > 0;
      if (lastScrolledRef.current !== scrolled) {
        lastScrolledRef.current = scrolled;
        navigation.setParams({ hasScrolled: scrolled } as any);
      }
    }
  };

  return (
    <ContentWrapper noPaddingY>
      <ScrollView
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
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
