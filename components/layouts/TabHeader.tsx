import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAppTheme } from "@/hooks/useAppTheme";

export interface TabHeaderProps {
  title: string;
  hasScrolled?: boolean;
  colors?: {
    background: string;
    text: string;
    border: string;
  };
}

export default function TabHeader({
  title,
  hasScrolled = false,
}: TabHeaderProps) {
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
    <View
      style={[
        styles.container,
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
            backgroundColor: "#2b2d31",
            opacity: darkOpacity,
          },
        ]}
      />

      {/* Dark Mode Border Line */}
      {hasScrolled && (
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
      )}

      {/* Light Mode Border Line */}
      {hasScrolled && (
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
      )}

      {/* Title Text Container (for layering) */}
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", position: "relative" }}>
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
