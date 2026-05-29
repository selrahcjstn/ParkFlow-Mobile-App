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
  /** Pass true once the scroll offset exceeds the threshold */
  hasScrolled?: boolean;
}

export default function DashboardHeader({
  hasScrolled = false,
}: DashboardHeaderProps) {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  // ── Theme tokens ──
  const primaryColor = isDark ? "#F87171" : "#D22730";
  // Use Tailwind 'background' token (light.background / dark.background)
  const surfaceColor = isDark ? "#09090B" : "#F4F4F5";
  const titleOnPrimary = "#FFFFFF";
  const titleOnSurface = isDark ? "#FAFAFA" : "#09090B";
  const bellOnPrimary = "#FFFFFF";
  const bellOnSurface = isDark ? "#A1A1AA" : "#71717A";
  const borderColor = isDark ? "#27272A" : "#E4E4E7";

  // ── Animation progress: 0 = primary, 1 = surface ──
  const anim = useRef(new Animated.Value(0)).current;

  // Bell icon needs a plain string colour (lucide doesn't accept Animated.Value)
  const [bellIconColor, setBellIconColor] = useState<string>(bellOnPrimary);

  useEffect(() => {
    Animated.timing(anim, {
      toValue: hasScrolled ? 1 : 0,
      duration: 220,
      useNativeDriver: false,
    }).start();
  }, [hasScrolled]);

  // Linearly interpolate between two hex colours and expose as state
  useEffect(() => {
    const lerp = (a: string, b: string, t: number) => {
      const parse = (h: string) => [
        parseInt(h.slice(1, 3), 16),
        parseInt(h.slice(3, 5), 16),
        parseInt(h.slice(5, 7), 16),
      ];
      const [ar, ag, ab] = parse(a);
      const [br, bg, bb] = parse(b);
      return `rgb(${Math.round(ar + (br - ar) * t)},${Math.round(ag + (bg - ag) * t)},${Math.round(ab + (bb - ab) * t)})`;
    };

    const id = anim.addListener(({ value }) =>
      setBellIconColor(lerp(bellOnPrimary, bellOnSurface, value)),
    );
    return () => anim.removeListener(id);
  }, [isDark]);

  // ── Animated style values ──
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

  return (
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
              shadowOpacity: hasScrolled ? 0.07 : 0,
              shadowRadius: 4,
            },
            android: {
              elevation: hasScrolled ? 3 : 0,
            },
          }),
        },
      ]}
    >
      {/* ── LEFT: ParkFlow wordmark ── */}
      <Animated.Text style={[styles.wordmark, { color: titleColor }]}>
        Park
        <Animated.Text style={[styles.wordmarkBold, { color: titleColor }]}>
          Flow
        </Animated.Text>
      </Animated.Text>

      {/* ── RIGHT: Notification bell ── */}
      <Animated.View style={[styles.bellWrapper, { backgroundColor: bellBg }]}>
        <TouchableOpacity
          activeOpacity={0.75}
          style={styles.bellTouchable}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Bell size={18} color={bellIconColor} strokeWidth={2} />
        </TouchableOpacity>
      </Animated.View>
    </Animated.View>
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
