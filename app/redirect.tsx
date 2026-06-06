import React, { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";
import { useRouter } from "expo-router";
import { useAppTheme } from "@/hooks/useAppTheme";

export default function RedirectPage() {
  const router = useRouter();
  const { colors } = useAppTheme();

  useEffect(() => {
    // Safe fallback: redirect to login if the auth handler doesn't redirect us first
    const timer = setTimeout(() => {
      router.replace("/(auth)/login");
    }, 1500);
    return () => clearTimeout(timer);
  }, [router]);

  return (
    <View 
      style={{ 
        flex: 1, 
        justifyContent: "center", 
        alignItems: "center", 
        backgroundColor: colors.background 
      }}
    >
      <ActivityIndicator size="large" color={colors.primary} />
    </View>
  );
}
