import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { Text, useColorScheme } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Host } from "react-native-portalize";
import { SafeAreaProvider } from "react-native-safe-area-context";

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

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const backgroundColor = isDark ? "#09090B" : "#F4F4F5";

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
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Host>
        <SafeAreaProvider>
          <BottomSheetModalProvider>
            <Stack
              screenOptions={{
                headerShown: false,
                contentStyle: {
                  backgroundColor: backgroundColor,
                },
              }}
            />
          </BottomSheetModalProvider>
        </SafeAreaProvider>
      </Host>
    </GestureHandlerRootView>
  );
}
