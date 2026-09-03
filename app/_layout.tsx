import { StatusBar } from "expo-status-bar";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import { Stack, router } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { Text, Alert, Modal } from "react-native";
import * as Updates from "expo-updates";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Host } from "react-native-portalize";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { ThemeProvider as NavigationProvider, DefaultTheme } from "expo-router/react-navigation";
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

import * as SystemUI from "expo-system-ui";
import { useViolationStore } from "@/features/violation/store/violation.store";
import ViolationSummaryPage from "@/features/violation/pages/ViolationSummaryPage";


function RealtimeViolationModal() {
  const activeViolation = useViolationStore((s) => s.activeViolation);
  const clearViolation = useViolationStore((s) => s.clearViolation);

  useEffect(() => {
    const unsubscribe = useViolationStore.getState().initSignalRListener();
    return unsubscribe;
  }, []);

  if (!activeViolation) return null;

  const handleDismiss = () => {
    clearViolation();
    // Redirect user to Home after acknowledging violation
    try {
      router.replace("/(users)/(tabs)/home");
    } catch {
      // Ignore navigation errors if already on home
    }
  };

  return (
    <Modal
      visible={Boolean(activeViolation)}
      animationType="slide"
      transparent={false}
      onRequestClose={handleDismiss}
    >
      <ViolationSummaryPage
        violation={activeViolation}
        onBack={handleDismiss}
      />
    </Modal>
  );
}

function RootLayoutContent() {
  const { isDark, colors, isLoaded } = useAppTheme();

  useEffect(() => {
    if (isLoaded) {
      SplashScreen.hideAsync();
      SystemUI.setBackgroundColorAsync(colors.background).catch((err: any) => {
        console.warn("Failed to set SystemUI background color:", err);
      });
    }
  }, [isLoaded, colors.background]);

  // Startup update check
  useEffect(() => {
    if (!isLoaded) return;

    async function checkUpdatesOnStartup() {
      if (!Updates.isEnabled) return;
      try {
        const update = await Updates.checkForUpdateAsync();
        if (update.isAvailable) {
          Alert.alert(
            "Update Required",
            "A new version of ParkFlow is available. The app will download the update and restart to install it.",
            [
              {
                text: "Update Now",
                onPress: async () => {
                  try {
                    await Updates.fetchUpdateAsync();
                    await Updates.reloadAsync();
                  } catch (err) {
                    Alert.alert(
                      "Update Failed",
                      "Could not download the update. Please restart the app or check your internet connection."
                    );
                  }
                }
              }
            ],
            { cancelable: false }
          );
        }
      } catch (e) {
        console.warn("Failed to check for updates on startup:", e);
      }
    }

    void checkUpdatesOnStartup();
  }, [isLoaded]);

  if (!isLoaded) return null;

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
                  animation: "fade",
                  contentStyle: {
                    backgroundColor: colors.background,
                  },
                }}
              />
              <RealtimeViolationModal />
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

  if (!loaded) return null;

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <RootLayoutContent />
      </ThemeProvider>
    </QueryClientProvider>
  );
}
