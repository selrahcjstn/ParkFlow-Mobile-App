import { useIsFocused } from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";
import { Bell } from "lucide-react-native";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Platform,
  StyleSheet,
  TouchableOpacity,
  useColorScheme,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export interface DashboardHeaderProps {
  scrollProgress?: number;
}

export default function DashboardHeader({
  scrollProgress = 0,
}: DashboardHeaderProps) {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const primaryColor = isDark ? "#F87171" : "#D22730";
  const surfaceColor = isDark ? "#09090B" : "#F4F4F5";

  const titleOnPrimary = "#FFFFFF";
  const titleOnSurface = isDark ? "#FAFAFA" : "#09090B";

  const bellOnPrimary = "#FFFFFF";
  const bellOnSurface = isDark ? "#A1A1AA" : "#71717A";

  const borderColor = isDark ? "#27272A" : "#E4E4E7";

  const anim = useRef(new Animated.Value(0)).current;

  const [bellIconColor, setBellIconColor] = useState(bellOnPrimary);

  useEffect(() => {
    anim.setValue(scrollProgress);
  }, [scrollProgress, anim]);

  useEffect(() => {
    const lerp = (a: string, b: string, t: number) => {
      const parse = (h: string) => [
        parseInt(h.slice(1, 3), 16),
        parseInt(h.slice(3, 5), 16),
        parseInt(h.slice(5, 7), 16),
      ];

      const [ar, ag, ab] = parse(a);
      const [br, bg, bb] = parse(b);

      return `rgb(${Math.round(ar + (br - ar) * t)},${Math.round(
        ag + (bg - ag) * t,
      )},${Math.round(ab + (bb - ab) * t)})`;
    };

    const id = anim.addListener(({ value }) => {
      setBellIconColor(lerp(bellOnPrimary, bellOnSurface, value));
    });

    return () => anim.removeListener(id);
  }, [anim, bellOnPrimary, bellOnSurface]);

  const backgroundColor = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [primaryColor, surfaceColor],
  });

  const titleColor = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [titleOnPrimary, titleOnSurface],
  });

  const bellBg = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [
      "rgba(255,255,255,0.18)",
      isDark ? "rgba(39,39,42,0.9)" : "rgba(244,244,245,0.9)",
    ],
  });

  const borderBottomWidth = anim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, 0, 1],
  });

  const isFocused = useIsFocused();

  const statusBarStyle =
    scrollProgress > 0.8 ? (isDark ? "light" : "dark") : "light";

  return (
    <>
      {isFocused && <StatusBar style={statusBarStyle} />}

      <Animated.View
        style={[
          styles.container,
          {
            paddingTop: Math.max(insets.top, 16),
            backgroundColor,
            borderBottomColor: borderColor,
            borderBottomWidth,
            ...Platform.select({
              ios: {
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: scrollProgress > 0 ? 0.07 : 0,
                shadowRadius: 4,
              },
              android: {
                elevation: scrollProgress > 0 ? 3 : 0,
              },
            }),
          },
        ]}
      >
        <Animated.Text style={[styles.wordmark, { color: titleColor }]}>
          Park
          <Animated.Text style={[styles.wordmarkBold, { color: titleColor }]}>
            Flow
          </Animated.Text>
        </Animated.Text>

        <Animated.View
          style={[styles.bellWrapper, { backgroundColor: bellBg }]}
        >
          <TouchableOpacity
            activeOpacity={0.75}
            style={styles.bellTouchable}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Bell size={18} color={bellIconColor} strokeWidth={2} />
          </TouchableOpacity>
        </Animated.View>
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
  },
  bellTouchable: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
});
