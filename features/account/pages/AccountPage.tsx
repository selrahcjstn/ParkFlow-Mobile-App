import { ContentWrapper } from "@/components/layouts";
import AccountMenu from "@/features/account/components/AccountMenu";
import { useAuthStore } from "@/features/auth/store/auth.store";
import { userService } from "@/features/user/services/user.service";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { ChevronRight, Check } from "lucide-react-native";
import { router, useSegments, useNavigation, useFocusEffect } from "expo-router";
import React, { useState, useRef, useCallback } from "react";
import { ScrollView, useColorScheme, Image, Text, TouchableOpacity, View } from "react-native";

export default function AccountPage() {
  const segments = useSegments() as string[];
  const isGuardSide = segments.includes("(guard)");
  const tabBarHeight = useBottomTabBarHeight();
  const navigation = useNavigation();
  const lastScrolledRef = useRef(false);

  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const [darkTheme, setDarkTheme] = useState(isDark);
  const [profileData, setProfileData] = useState<any>(null);

  const { user, logout } = useAuthStore();

  useFocusEffect(
    useCallback(() => {
      let active = true;
      const getProfile = async () => {
        try {
          const res = await userService.getProfile();
          if (res?.isSuccess && res.data && active) {
            setProfileData(res.data);
          }
        } catch (err) {
          console.error("Failed to load profile details in account menu", err);
        }
      };
      getProfile();
      return () => {
        active = false;
      };
    }, [])
  );

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

  const getInitials = () => {
    if (profileData?.firstName && profileData?.lastName) {
      return `${profileData.firstName.charAt(0)}${profileData.lastName.charAt(0)}`.toUpperCase();
    }
    if (user?.name) {
      const parts = user.name.split(" ");
      if (parts.length > 1) {
        return `${parts[0].charAt(0)}${parts[1].charAt(0)}`.toUpperCase();
      }
      return user.name.charAt(0).toUpperCase();
    }
    return "PF";
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
        {/* Clickable Profile Header at the top of everything */}
        <TouchableOpacity
          onPress={() => router.push("/(settings)/profile" as any)}
          activeOpacity={0.8}
          className="px-1 mb-10 flex-row items-center justify-between"
        >
          <View className="flex-row items-center gap-4 flex-1">
            {/* Avatar Circle Container */}
            <View className="w-14 h-14 rounded-full bg-light-primary/10 items-center justify-center overflow-hidden border border-light-border/40 dark:border-dark-border/40">
              {profileData?.profilePictureUrl ? (
                <Image
                  source={{ uri: profileData.profilePictureUrl }}
                  className="w-full h-full"
                  resizeMode="cover"
                />
              ) : (
                <Text className="text-light-primary font-black text-lg">
                  {getInitials()}
                </Text>
              )}
            </View>

            {/* Name, Email, and Verified Badge */}
            <View className="flex-1 items-start justify-center">
              <Text className="text-light-text dark:text-dark-text font-black text-[16px] leading-5">
                {profileData?.firstName && profileData?.lastName
                  ? `${profileData.firstName} ${profileData.lastName}`
                  : (user?.name || "User")}
              </Text>
              <Text className="text-light-muted dark:text-dark-muted font-regular text-[12px] mt-0.5" numberOfLines={1}>
                {user?.email || "N/A"}
              </Text>
              
              {/* Circular Verified Badge below */}
              <View className="flex-row items-center gap-1.5 mt-2">
                <View className="w-3.5 h-3.5 rounded-full bg-light-success items-center justify-center">
                  <Check size={8} color="#FFF" strokeWidth={4} />
                </View>
                <Text className="text-light-success font-heavy text-[9px] uppercase tracking-wider">
                  Verified
                </Text>
              </View>
            </View>
          </View>

          {/* Chevron Right arrow */}
          <ChevronRight size={20} color="#71717A" strokeWidth={2.2} />
        </TouchableOpacity>

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
