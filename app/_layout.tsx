import { StatusBar } from "expo-status-bar";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { Text } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Host } from "react-native-portalize";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { ThemeProvider as NavigationProvider, DefaultTheme } from "@react-navigation/native";
import { ThemeProvider } from "@/providers/theme-provider";
import { useAppTheme } from "@/hooks/useAppTheme";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/services/queryClient";

import {
  Inter_300Light,
  Inter_400Regular,
  Inter_500Medium,
  Inter_700Bold,
  Inter_900Black,
  useFonts,
} from "@expo-google-fonts/inter";

import "../global.css";

const defaultTextStyle = { fontFamily: "Inter-Regular" };
const TextComponent = Text as typeof Text & {
  defaultProps?: { style?: unknown };
};
TextComponent.defaultProps = TextComponent.defaultProps ?? {};
TextComponent.defaultProps.style = [
  defaultTextStyle,
  TextComponent.defaultProps.style,
];
SplashScreen.preventAutoHideAsync();

function RootLayoutContent() {
  const { isDark, colors } = useAppTheme();

  const navigationTheme = {
    dark: isDark,
    colors: {
      primary: colors.primary,
      background: colors.background,
      card: colors.background,
      text: colors.text,
      border: colors.border,
      notification: colors.primary,
    },
    fonts: DefaultTheme.fonts,
  };

  return (
    <NavigationProvider value={navigationTheme}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <Host>
          <SafeAreaProvider>
            <BottomSheetModalProvider>
              <StatusBar style={isDark ? "light" : "dark"} />
              <Stack
                screenOptions={{
                  headerShown: false,
                  contentStyle: {
                    backgroundColor: colors.background,
                  },
                }}
              />
            </BottomSheetModalProvider>
          </SafeAreaProvider>
        </Host>
      </GestureHandlerRootView>
    </NavigationProvider>
  );
}

export default function RootLayout() {
  const [loaded] = useFonts({
    "Inter-Light": Inter_300Light,
    "Inter-Regular": Inter_400Regular,
    "Inter-Medium": Inter_500Medium,
    "Inter-Bold": Inter_700Bold,
    "Inter-Black": Inter_900Black,
  });

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) return null;

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <RootLayoutContent />
      </ThemeProvider>
    </QueryClientProvider>
  );
}
