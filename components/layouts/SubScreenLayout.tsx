import { ChevronLeft } from "lucide-react-native";
import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, TouchableOpacity, View } from "react-native";
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

  const themeAnim = useRef(new Animated.Value(isDark ? 0 : 1)).current;

  useEffect(() => {
    Animated.timing(themeAnim, {
      toValue: isDark ? 0 : 1,
      duration: 250,
      useNativeDriver: true,
    }).start();
  }, [isDark, themeAnim]);

  const darkOpacity = themeAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0],
  });

  const lightOpacity = themeAnim;

  return (
    <View style={styles.screen}>
      {/* ── STANDARDIZED PREMIUM HEADER ── */}
      <View
        style={[
          styles.headerContainer,
          {
            paddingTop: Math.max(insets.top, 16),
            backgroundColor: "#F4F4F5",
          },
        ]}
      >
        {/* Dark Mode Background Overlay */}
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            {
              backgroundColor: "#1E1F22",
              opacity: darkOpacity,
            },
          ]}
        />

        {/* Hairline Bottom Border Line */}
        <Animated.View
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            height: StyleSheet.hairlineWidth,
            backgroundColor: "#3A3C43",
            opacity: darkOpacity,
          }}
        />
        <Animated.View
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            height: StyleSheet.hairlineWidth,
            backgroundColor: "#E4E4E7",
            opacity: lightOpacity,
          }}
        />

        {/* Left Back Button slot */}
        <View style={styles.leftSlot}>
          <TouchableOpacity
            onPress={onBack}
            style={styles.backButton}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            {/* Dark Mode Back Icon */}
            <Animated.View style={{ position: "absolute", opacity: darkOpacity }}>
              <ChevronLeft size={28} color="#f2f3f5" />
            </Animated.View>

            {/* Light Mode Back Icon */}
            <Animated.View style={{ position: "absolute", opacity: lightOpacity }}>
              <ChevronLeft size={28} color="#09090B" />
            </Animated.View>
          </TouchableOpacity>
        </View>

        {/* Center Title slot with Layered Title Text */}
        <View style={styles.centerSlot}>
          {/* Dark Mode Title */}
          <Animated.Text
            style={[
              styles.title,
              {
                color: "#f2f3f5",
                position: "absolute",
                opacity: darkOpacity,
              },
            ]}
          >
            {title}
          </Animated.Text>

          {/* Light Mode Title */}
          <Animated.Text
            style={[
              styles.title,
              {
                color: "#09090B",
                position: "absolute",
                opacity: lightOpacity,
              },
            ]}
          >
            {title}
          </Animated.Text>
        </View>

        {/* Right slot for layout balance */}
        <View style={styles.rightSlot} />
      </View>

      {/* Screen Body Content */}
      <View style={styles.content}>
        {/* Body Background Overlays for smooth theme transition */}
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            {
              backgroundColor: "#1E1F22",
              opacity: darkOpacity,
              zIndex: -1,
            },
          ]}
        />
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            {
              backgroundColor: "#F4F4F5",
              opacity: lightOpacity,
              zIndex: -1,
            },
          ]}
        />
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
