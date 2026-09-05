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
import { configureReanimatedLogger, ReanimatedLogLevel } from "react-native-reanimated";

try {
  configureReanimatedLogger({
    level: ReanimatedLogLevel.warn,
    strict: false,
  });
} catch (e) {
  console.warn("Reanimated logger configuration skipped:", e);
}

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

  // Startup update check (safe background fetch)
  useEffect(() => {
    if (!isLoaded || __DEV__) return;

    let isMounted = true;
    async function checkUpdatesOnStartup() {
      if (!Updates.isEnabled) return;
      try {
        const update = await Updates.checkForUpdateAsync();
        if (update.isAvailable && isMounted) {
          // Download in background first before prompting user to prevent native crash
          const fetched = await Updates.fetchUpdateAsync();
          if (fetched.isNew && isMounted) {
            Alert.alert(
              "Update Ready",
              "A new version of ParkFlow has been downloaded. Restart the app now to apply the update.",
              [
                { text: "Later", style: "cancel" },
                {
                  text: "Restart Now",
                  onPress: async () => {
                    try {
                      await Updates.reloadAsync();
                    } catch (err) {
                      console.warn("Failed to reload app for update:", err);
                    }
                  },
                },
              ],
              { cancelable: true }
            );
          }
        }
      } catch (e) {
        console.warn("Failed to check or fetch updates on startup:", e);
      }
    }

    const timer = setTimeout(() => {
      void checkUpdatesOnStartup();
    }, 2500);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [isLoaded]);

  if (!isLoaded) return null;

  return (
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
