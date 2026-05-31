import { useIsFocused } from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";
import { Bell } from "lucide-react-native";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Platform,
  StyleSheet,
  TouchableOpacity,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAppTheme } from "@/hooks/useAppTheme";

export interface DashboardHeaderProps {
  scrollProgress?: number | Animated.Value | Animated.AnimatedInterpolation<number>;
}

export default function DashboardHeader({
  scrollProgress = 0,
}: DashboardHeaderProps) {
  const insets = useSafeAreaInsets();
  const { isDark, colors } = useAppTheme();
  const isFocused = useIsFocused();

  const anim = useRef(
    scrollProgress && typeof scrollProgress === "object" && "interpolate" in scrollProgress
      ? (scrollProgress as any)
      : new Animated.Value(Number(scrollProgress))
  ).current;

  const [isScrolledPast, setIsScrolledPast] = useState(false);

  useEffect(() => {
    const listenerId = anim.addListener(({ value }: { value: number }) => {
      const past = value > 0.8;
      if (past !== isScrolledPast) {
        setIsScrolledPast(past);
      }
    });

    return () => {
      anim.removeListener(listenerId);
    };
  }, [anim, isScrolledPast]);
  const themeAnim = useRef(new Animated.Value(isDark ? 0 : 1)).current;

  useEffect(() => {
    if (typeof scrollProgress === "number") {
      anim.setValue(scrollProgress);
    }
  }, [scrollProgress, anim]);

  useEffect(() => {
    Animated.timing(themeAnim, {
      toValue: isDark ? 0 : 1,
      duration: 250,
      useNativeDriver: true,
    }).start();
  }, [isDark, themeAnim]);

  // Opacities for smooth transitions
  const scrollOpacity = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0],
  });

  const scrollScrolledOpacity = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  const redOverlayOpacity = Animated.multiply(scrollOpacity, themeAnim);
  const darkContentOpacity = Animated.multiply(scrollScrolledOpacity, themeAnim);

  const borderBottomWidth = anim.interpolate({
    inputRange: [0, 0.15, 1],
    outputRange: [0, 1, 1],
  });

  const darkOverlayOpacity = themeAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0],
  });

  const darkBorderFinalOpacity = Animated.multiply(borderBottomWidth, darkOverlayOpacity);
  const lightBorderFinalOpacity = Animated.multiply(borderBottomWidth, themeAnim);

  const darkBellOpacity = themeAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.9, 0],
  });

  const lightUnscrolledBellOpacity = Animated.multiply(scrollOpacity, themeAnim).interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.18],
  });

  const lightScrolledBellOpacity = Animated.multiply(scrollScrolledOpacity, themeAnim).interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.9],
  });

  const iosShadowOpacity = anim.interpolate({
    inputRange: [0, 0.15, 1],
    outputRange: [0, 0.07, 0.07],
  });

  const androidElevation = anim.interpolate({
    inputRange: [0, 0.15, 1],
    outputRange: [0, 3, 3],
  });

  const statusBarStyle =
    isScrolledPast ? (isDark ? "light" : "dark") : "light";

  return (
    <>
      {isFocused && <StatusBar style={statusBarStyle} />}

      <Animated.View
        style={[
          styles.container,
          {
            paddingTop: Math.max(insets.top, 16),
            backgroundColor: "#F4F4F5",
            ...Platform.select({
              ios: {
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: iosShadowOpacity as any,
                shadowRadius: 4,
              },
              android: {
                elevation: androidElevation as any,
              },
            }),
          },
        ]}
      >
        {/* Dark Mode Background Overlay */}
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            {
              backgroundColor: "#1E1F22",
              opacity: darkOverlayOpacity,
            },
          ]}
        />

        {/* Absolute Red Overlay for Light Mode */}
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            {
              backgroundColor: "#D22730",
              opacity: redOverlayOpacity,
            },
          ]}
        />

        {/* Dark Mode Border Line */}
        <Animated.View
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            height: 1,
            backgroundColor: "#3A3C43",
            opacity: darkBorderFinalOpacity,
          }}
        />

        {/* Light Mode Border Line */}
        <Animated.View
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            height: 1,
            backgroundColor: "#E4E4E7",
            opacity: lightBorderFinalOpacity,
          }}
        />

        {/* Title Wordmark Container */}
        <View style={{ flex: 1, height: 32, justifyContent: "center", position: "relative" }}>
          {/* Base White Wordmark (always visible in dark mode, or unscrolled in light mode) */}
          <Text style={[styles.wordmark, { color: isDark ? colors.text : "#FFFFFF", position: "absolute", left: 0 }]}>
            Park
            <Text style={styles.wordmarkBold}>Flow</Text>
          </Text>

          {/* Overlay Dark Wordmark (fades in when scrolled in light mode) */}
          <Animated.View style={{ position: "absolute", left: 0, opacity: darkContentOpacity }}>
            <Text style={[styles.wordmark, { color: "#09090B" }]}>
              Park
              <Text style={styles.wordmarkBold}>Flow</Text>
            </Text>
          </Animated.View>
        </View>

        {/* Bell Button */}
        <View style={styles.bellWrapper}>
          {/* Dark Mode Bell Background Overlay */}
          <Animated.View
            style={[
              StyleSheet.absoluteFill,
              {
                backgroundColor: "#313338",
                opacity: darkBellOpacity,
              },
            ]}
          />

          {/* Light Mode Unscrolled Bell Background Overlay */}
          <Animated.View
            style={[
              StyleSheet.absoluteFill,
              {
                backgroundColor: "#FFFFFF",
                opacity: lightUnscrolledBellOpacity,
              },
            ]}
          />

          {/* Light Mode Scrolled Bell Background Overlay */}
          <Animated.View
            style={[
              StyleSheet.absoluteFill,
              {
                backgroundColor: "#FFFFFF",
                opacity: lightScrolledBellOpacity,
              },
            ]}
          />

          <TouchableOpacity
            activeOpacity={0.75}
            style={styles.bellTouchable}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            {/* Base White Bell Icon */}
            <Bell size={18} color={isDark ? colors.text : "#FFFFFF"} strokeWidth={2} style={{ position: "absolute" }} />

            {/* Overlay Muted Gray Bell Icon (fades in when scrolled in light mode) */}
            <Animated.View style={{ position: "absolute", opacity: darkContentOpacity }}>
              <Bell size={18} color="#71717A" strokeWidth={2} />
            </Animated.View>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    height: 95,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
  },
  wordmark: {
    fontSize: 22,
    fontFamily: "Inter-Regular",
    letterSpacing: -0.5,
  },
  wordmarkBold: {
    fontFamily: "Inter-Black",
  },
  bellWrapper: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  bellTouchable: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
});
