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
  const { colors } = useAppTheme();

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: Math.max(insets.top, 16),
          backgroundColor: colors.background,
          borderBottomWidth: hasScrolled ? StyleSheet.hairlineWidth : 0,
          borderBottomColor: colors.border,
        },
      ]}
    >
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <Text style={[styles.title, { color: colors.text }]}>
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
