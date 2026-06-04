import { ContentWrapper } from "@/components/layouts";
import AccountHeader from "@/features/account/components/AccountHeader";
import AccountMenu from "@/features/account/components/AccountMenu";
import { useAuthStore } from "@/features/auth/store/auth.store";
import { useProfileQuery } from "@/hooks";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import {
  router,
  useFocusEffect,
  useNavigation,
  useSegments,
} from "expo-router";
import React, { useCallback, useRef, useState } from "react";
import { ScrollView, InteractionManager } from "react-native";
import { useAppTheme } from "@/hooks/useAppTheme";

export default function AccountPage() {
  const segments = useSegments() as string[];
  const isGuardSide = segments.includes("(guard)");
  const tabBarHeight = useBottomTabBarHeight();
  const navigation = useNavigation();
  const lastScrolledRef = useRef(false);

  const { isDark } = useAppTheme();
  const { data: profile } = useProfileQuery();
  const profileData = profile || null;

  const { user, logout, profilePictureUrl } = useAuthStore();

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
          paddingHorizontal: 0.5,
          paddingBottom: isGuardSide ? tabBarHeight + 35 : 16,
        }}
      >
        <AccountHeader
          profileData={profileData}
          profilePictureUrl={profilePictureUrl}
          user={user}
          onPress={() => router.push("/(settings)/profile" as any)}
        />

        <AccountMenu
          onLogout={handleLogout}
          isGuard={isGuardSide}
        />
      </ScrollView>
    </ContentWrapper>
  );
}
