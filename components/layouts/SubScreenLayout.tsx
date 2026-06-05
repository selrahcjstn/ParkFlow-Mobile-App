import { ChevronLeft } from "lucide-react-native";
import React from "react";
import { StyleSheet, TouchableOpacity, View, Text } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAppTheme } from "@/hooks/useAppTheme";

type SubScreenLayoutProps = {
  title: string;
  onBack: () => void;
  children: React.ReactNode;
};

export default function SubScreenLayout({
  title,
  onBack,
  children,
}: SubScreenLayoutProps) {
  const insets = useSafeAreaInsets();
  const { isDark } = useAppTheme();

  return (
    <View style={[styles.screen, { backgroundColor: isDark ? "#1E1F22" : "#F4F4F5" }]}>
      {/* ── STANDARDIZED PREMIUM HEADER ── */}
      <View
        style={[
          styles.headerContainer,
          {
            paddingTop: Math.max(insets.top, 16),
            backgroundColor: isDark ? "#1E1F22" : "#F4F4F5",
            borderBottomWidth: StyleSheet.hairlineWidth,
            borderBottomColor: isDark ? "#3A3C43" : "#E4E4E7",
          },
        ]}
      >
        {/* Left Back Button slot */}
        <View style={styles.leftSlot}>
          <TouchableOpacity
            onPress={onBack}
            style={styles.backButton}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <ChevronLeft size={28} color={isDark ? "#f2f3f5" : "#09090B"} />
          </TouchableOpacity>
        </View>

        {/* Center Title slot */}
        <View style={styles.centerSlot}>
          <Text style={[styles.title, { color: isDark ? "#f2f3f5" : "#09090B" }]}>
            {title}
          </Text>
        </View>

        {/* Right slot for layout balance */}
        <View style={styles.rightSlot} />
      </View>

      {/* Screen Body Content */}
      <View style={[styles.content, { backgroundColor: isDark ? "#1E1F22" : "#F4F4F5" }]}>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  headerContainer: {
    height: 90,
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    zIndex: 10,
  },
  leftSlot: {
    width: 40,
    height: 40,
    justifyContent: "center",
  },
  backButton: {
    width: 40,
    height: 40,
    marginLeft: -8,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 20,
  },
  centerSlot: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 18,
    fontFamily: "Inter-Bold",
    letterSpacing: -0.2,
  },
  rightSlot: {
    width: 40,
    height: 40,
  },
  content: {
    flex: 1,
  },
});
