import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import "../global.css";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded] = useFonts({
    AvenirBlack: require("@/assets/fonts/Avenir/Avenir-Black.ttf"),
    AvenirBook: require("@/assets/fonts/Avenir/Avenir-Book.ttf"),
    AvenirHeavy: require("@/assets/fonts/Avenir/Avenir-Heavy.ttf"),
    AvenirLight: require("@/assets/fonts/Avenir/Avenir-Light.ttf"),
    AvenirRegular: require("@/assets/fonts/Avenir/Avenir-Regular.ttf"),
  });

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <BottomSheetModalProvider>
        <SafeAreaProvider>
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: {
                backgroundColor: "#F8F9FA",
              },
            }}
          />
        </SafeAreaProvider>
      </BottomSheetModalProvider>
    </GestureHandlerRootView>
  );
}
