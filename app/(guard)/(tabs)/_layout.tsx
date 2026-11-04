import { Tabs, router } from "expo-router";
import { CommonActions } from "@react-navigation/native";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { History, Home, LayoutList, ScanLine, User } from "lucide-react-native";
import React from "react";
import { TabHeader } from "@/components/layouts";
import {
  Dimensions,
  Platform,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";
import { useAppTheme } from "@/hooks/useAppTheme";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// ── CUSTOM THEME TYPE DEFINITION ──
interface ThemeColors {
  background: string;
  surface: string;
  text: string;
  muted: string;
  border: string;
  primary: string;
}

// ── EXTEND NATIVE TAB BAR PROPS TO INCLUDE THEME TOKENS ──
type CustomCurvedTabBarProps = {
  state: any;
  descriptors: any;
  navigation?: any;
  emitter?: any;
  navigateToTab?: (key: string) => void;
  colors: ThemeColors;
};

// ── CUSTOM TRULY CURVED TAB BAR COMPONENT ──
function CustomCurvedTabBar({
  state,
  descriptors,
  navigation,
  emitter,
  navigateToTab,
  colors,
}: CustomCurvedTabBarProps) {
  const insets = useSafeAreaInsets();
  const barHeight = 64;
  const center = SCREEN_WIDTH / 2;

  // ── 🛠️ FINE-TUNED CURVE CONFIGURATION VARIABLES ──
  const NOTCH_WIDTH = 60; // How wide the curve opens at the top edge
  const NOTCH_DEPTH = 42; // How deep the U-notch drops down (Increased from 28 for maximum depth)

  const CURVE_PULL = 18;
  const CURVE_SOFTNESS = 40;
  // 📐 MODIFIED BÉZIER MATH: Generates a deep, fluid-molded luxury sweep
  const d = `
  M 0 0
  H ${center - NOTCH_WIDTH}

  C
  ${center - CURVE_PULL} 0,
  ${center - CURVE_SOFTNESS} ${NOTCH_DEPTH},
  ${center} ${NOTCH_DEPTH}

  C
  ${center + CURVE_SOFTNESS} ${NOTCH_DEPTH},
  ${center + CURVE_PULL} 0,
  ${center + NOTCH_WIDTH} 0

  H ${SCREEN_WIDTH}
  V ${barHeight + insets.bottom}
  H 0
  Z
`;

  return (
    <View
      style={{
        position: "absolute",
        bottom: 0,
        width: SCREEN_WIDTH,
        height: barHeight + insets.bottom,
        backgroundColor: "transparent",
        overflow: "visible",
      }}
    >
      <Svg
        width={SCREEN_WIDTH}
        height={barHeight + insets.bottom}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          ...Platform.select({
            ios: {
              shadowColor: "#0F172A",
              shadowOffset: { width: 0, height: -4 },
              shadowOpacity: 0.06,
              shadowRadius: 10,
            },
            android: {
              elevation: 8,
            },
          }),
        }}
      >
        <Path
          d={d}
          fill={colors.surface}
          stroke={colors.border}
          strokeWidth={1}
        />
      </Svg>

      {/* Tabs Items Interactive Row Track */}
      <View
        style={{
          flexDirection: "row",
          height: barHeight,
          width: SCREEN_WIDTH,
          overflow: "visible",
        }}
      >
        {state.routes.map((route: any, index: number) => {
          const { options } = descriptors[route.key];
          const isFocused = state.index === index;

          const onPress = () => {
            const nav = navigation ?? descriptors[route.key]?.navigation;
            const emitFn = nav?.emit ? nav.emit.bind(nav) : emitter?.emit ? emitter.emit.bind(emitter) : undefined;
            const event = emitFn
              ? emitFn({
                  type: "tabPress",
                  target: route.key,
                  canPreventDefault: true,
                })
              : { defaultPrevented: false };

            if (!isFocused && !event?.defaultPrevented) {
              if (typeof navigateToTab === "function") {
                try {
                  navigateToTab(route.key);
                } catch {
                  // Fallback below
                }
              } else if (nav?.dispatch) {
                try {
                  nav.dispatch({
                    ...CommonActions.navigate({ name: route.name, merge: true }),
                    target: state?.key,
                  });
                } catch {
                  // Fallback below
                }
              }

              router.navigate(`/(guard)/(tabs)/${route.name}` as any);
            }
          };

          if (route.name === "scan-qr") {
            return (
              <TouchableOpacity
                key={route.key}
                activeOpacity={0.85}
                onPress={() => {
                  const { router } = require("expo-router");
                  router.push("/(guard)/(scan)/scan-qr");
                }}
                style={{
                  flex: 1,
                  alignItems: "center",
                  justifyContent: "center",
                  height: barHeight,
                  top: -16,
                  zIndex: 99,
                }}
              >
                <View
                  style={{
                    width: 54,
                    height: 54,
                    borderRadius: 27,
                    backgroundColor: colors.primary,
                    alignItems: "center",
                    justifyContent: "center",
                    ...Platform.select({
                      ios: {
                        shadowColor: colors.primary,
                        shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: 0.32,
                        shadowRadius: 6,
                      },
                      android: {
                        elevation: 6,
                      },
                    }),
                  }}
                >
                  <ScanLine size={24} color="#FFFFFF" strokeWidth={2.5} />
                </View>
              </TouchableOpacity>
            );
          }

          // ── STANDARD TAB ITEMS ──
          const color = isFocused ? colors.primary : colors.muted;

          const renderIcon = () => {
            const iconProps = { size: 22, color, strokeWidth: 2.2 };
            if (route.name === "home") return <Home {...iconProps} />;
            if (route.name === "session") return <LayoutList {...iconProps} />;
            if (route.name === "history") return <History {...iconProps} />;
            if (route.name === "account") return <User {...iconProps} />;
            return null;
          };

          const label = options.title ?? route.name;

          return (
            <TouchableOpacity
              key={route.key}
              onPress={onPress}
              activeOpacity={0.7}
              style={{
                flex: 1,
                alignItems: "center",
                justifyContent: "center",
                height: barHeight,
              }}
            >
              {renderIcon()}
              <Text
                style={{
                  fontSize: 11,
                  fontFamily: "Inter-Bold",
                  color,
                  marginTop: 3,
                  letterSpacing: 0.1,
                }}
              >
                {label.charAt(0).toUpperCase() + label.slice(1)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

// ── MAIN EXPO ROUTER CONFIGURATION CONTAINER ──
export default function GuardTabsLayout() {
  const { colors } = useAppTheme();

  return (
    <Tabs
      tabBar={(props) => <CustomCurvedTabBar {...props} colors={colors} />}
      screenOptions={{
        headerShown: true,
        headerTitleAlign: "center",
        headerShadowVisible: false,
        headerLeftContainerStyle: { paddingLeft: 4 },
        headerTitleStyle: {
          fontSize: 18,
          fontFamily: "Inter-Bold",
          color: colors.text,
        },
        headerStyle: {
          backgroundColor: colors.background,
          height: 90,
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: "Home",
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="session"
        options={{
          title: "Sessions",
          header: ({ options, route }) => {
            const hasScrolled = (route.params as any)?.hasScrolled ?? false;
            return (
              <TabHeader
                title={options.title ?? "Sessions"}
                hasScrolled={hasScrolled}
              />
            );
          },
        }}
      />
      <Tabs.Screen
        name="scan-qr"
        options={{
          title: "Scan",
          header: ({ options, route }) => {
            const hasScrolled = (route.params as any)?.hasScrolled ?? false;
            return (
              <TabHeader
                title={options.title ?? "Scan"}
                hasScrolled={hasScrolled}
              />
            );
          },
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: "History",
          header: ({ options, route }) => {
            const hasScrolled = (route.params as any)?.hasScrolled ?? false;
            return (
              <TabHeader
                title={options.title ?? "History"}
                hasScrolled={hasScrolled}
              />
            );
          },
        }}
      />
      <Tabs.Screen
        name="account"
        options={{
          title: "Account",
          header: ({ options, route }) => {
            const hasScrolled = (route.params as any)?.hasScrolled ?? false;
            return (
              <TabHeader
                title={options.title ?? "Account"}
                hasScrolled={hasScrolled}
              />
            );
          },
        }}
      />
    </Tabs>
  );
}
