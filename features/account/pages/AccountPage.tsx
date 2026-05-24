import { ContentWrapper } from "@/components/layouts";

import AccountMenu from "@/features/account/components/AccountMenu";

import { useAuthStore } from "@/features/auth/store/auth.store";

import { router, useNavigation } from "expo-router";

import React, { useEffect, useState } from "react";

import { ScrollView, useColorScheme } from "react-native";

export default function AccountPage() {
  const navigation = useNavigation();

  const colorScheme = useColorScheme();

  const isDark = colorScheme === "dark";

  const [darkTheme, setDarkTheme] = useState(isDark);

  const [isScrolled, setIsScrolled] = useState(false);

  const logout = useAuthStore((s) => s.logout);

  const handleLogout = async () => {
    await logout();

    router.replace("/(auth)/login");
  };

  useEffect(() => {
    navigation.setOptions({
      headerStyle: {
        backgroundColor: isDark ? "#09090B" : "#F4F4F5",

        height: 90,

        ...(isScrolled &&
          !isDark && {
            borderBottomWidth: 1,

            borderBottomColor: "#E4E4E7",

            shadowColor: "#000000",

            shadowOffset: { width: 0, height: 3 },

            shadowOpacity: 0.05,

            shadowRadius: 2.5,

            elevation: 4,
          }),

        ...(isScrolled &&
          isDark && {
            borderBottomWidth: 1,

            borderBottomColor: "#1C1C1E",
          }),

        ...(!isScrolled && {
          borderBottomWidth: 0,

          shadowOpacity: 0,

          elevation: 0,
        }),
      },
    });
  }, [isScrolled, isDark]);

  return (
    <ContentWrapper noPaddingY>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingVertical: 16 }}
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
    </ContentWrapper>
  );
}
