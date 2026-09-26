import { useCallback, useEffect, useMemo, useState } from "react";
import { Modal, Pressable, Text, View } from "react-native";
import { AlertTriangle, CheckCircle2, RefreshCw, WifiOff } from "lucide-react-native";
import { API_URL } from "@/services/apiConfig";
import {
  clearNetworkError,
  getNetworkErrorSnapshot,
  subscribeToNetworkErrors,
  type NetworkErrorDetails,
} from "@/services/networkError";

const getHostLabel = (url: string): string => {
  if (!url) return "Not configured";
  try {
    return new URL(url).host;
  } catch {
    return url;
  }
};

export default function NetworkErrorScreen() {
  const [error, setError] = useState<NetworkErrorDetails | null>(
    getNetworkErrorSnapshot(),
  );

  useEffect(() => subscribeToNetworkErrors(setError), []);

  const host = useMemo(() => getHostLabel(error?.baseURL || API_URL), [error]);

  const dismiss = useCallback(() => {
    clearNetworkError();
  }, []);

  if (!error) return null;

  return (
    <Modal visible animationType="fade" transparent={false} onRequestClose={dismiss}>
      <View className="flex-1 bg-light-background dark:bg-dark-background px-6 justify-center">
        <View className="items-center">
          <View className="w-20 h-20 rounded-full bg-red-500/10 dark:bg-red-500/20 items-center justify-center mb-5">
            <WifiOff size={38} color="#DC2626" strokeWidth={2.2} />
          </View>

          <Text className="text-light-text dark:text-dark-text font-bold text-2xl text-center">
            Connection problem
          </Text>
          <Text className="text-light-muted dark:text-dark-muted font-regular text-base leading-6 text-center mt-3">
            ParkFlow cannot reach the API server right now.
          </Text>
        </View>

        <View className="bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border rounded-2xl p-4 mt-8">
          <Text className="text-light-muted dark:text-dark-muted text-xs font-bold uppercase tracking-wide">
            Configured API host
          </Text>
          <Text className="text-light-text dark:text-dark-text text-base font-bold mt-1" selectable>
            {host}
          </Text>
          <Text className="text-light-muted dark:text-dark-muted text-xs mt-2" selectable>
            {error.baseURL || "No API URL configured"}
          </Text>
        </View>

        <View className="mt-6 gap-3">
          <View className="flex-row items-start gap-3">
            <AlertTriangle size={18} color="#D97706" />
            <Text className="flex-1 text-light-text dark:text-dark-text text-sm leading-5">
              Check that the API URL is correct and that the server is running.
            </Text>
          </View>
          <View className="flex-row items-start gap-3">
            <AlertTriangle size={18} color="#D97706" />
            <Text className="flex-1 text-light-text dark:text-dark-text text-sm leading-5">
              If using a phone, the server must be publicly reachable; localhost and private LAN addresses will not work in a release build.
            </Text>
          </View>
          <View className="flex-row items-start gap-3">
            <AlertTriangle size={18} color="#D97706" />
            <Text className="flex-1 text-light-text dark:text-dark-text text-sm leading-5">
              After changing EXPO_PUBLIC_API_URL, create and install a new build.
            </Text>
          </View>
        </View>

        <View className="mt-8 gap-3">
          <Pressable
            onPress={dismiss}
            className="bg-light-primary dark:bg-dark-primary rounded-full py-3.5 flex-row items-center justify-center gap-2"
          >
            <RefreshCw size={18} color="#FFFFFF" />
            <Text className="text-white font-bold text-base">Try again</Text>
          </Pressable>
          <Pressable onPress={dismiss} className="py-3 items-center">
            <Text className="text-light-muted dark:text-dark-muted font-bold text-sm">
              Dismiss
            </Text>
          </Pressable>
        </View>

        <View className="flex-row items-center justify-center gap-2 mt-8">
          <CheckCircle2 size={15} color="#71717A" />
          <Text className="text-light-muted dark:text-dark-muted text-xs">
            {error.kind === "configuration" ? "Build configuration is incomplete" : "The app will continue when the server is available"}
          </Text>
        </View>
      </View>
    </Modal>
  );
}
