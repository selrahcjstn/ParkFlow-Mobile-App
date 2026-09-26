import React from "react";
import { StyleSheet, View, Text } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAppTheme } from "@/hooks/useAppTheme";

export interface TabHeaderProps {
  title: string;
  hasScrolled?: boolean;
}

export default function TabHeader({
  title,
  hasScrolled = false,
}: TabHeaderProps) {
  const insets = useSafeAreaInsets();
  const { isDark } = useAppTheme();

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: Math.max(insets.top, 16),
          backgroundColor: isDark ? "#1E1F22" : "#F4F4F5",
          borderBottomWidth: hasScrolled ? StyleSheet.hairlineWidth : 0,
          borderBottomColor: isDark ? "#3A3C43" : "#E4E4E7",
        },
      ]}
    >
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <Text style={[styles.title, { color: isDark ? "#f2f3f5" : "#09090B" }]}>
          {title}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 95,
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  title: {
    fontSize: 18,
    fontFamily: "Inter-Bold",
    letterSpacing: -0.2,
  },
});
