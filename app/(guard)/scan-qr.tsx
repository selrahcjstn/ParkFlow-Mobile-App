import MainAppLayout from "@/components/layout/MainAppLayout";
import { AppButton } from "@/components/ui";
import { CameraView, useCameraPermissions } from "expo-camera";
import { router } from "expo-router";
import { ChevronLeft } from "lucide-react-native";
import { useEffect } from "react";
import { Pressable, Text, View } from "react-native";

const tailwindConfig = require("../../tailwind.config");
const THEME_COLORS = tailwindConfig?.theme?.extend?.colors?.light || {};

export default function ScanQr() {
  const [permission, requestPermission] = useCameraPermissions();

  useEffect(() => {
    if (!permission) requestPermission();
  }, [permission, requestPermission]);

  const granted = Boolean(permission?.granted);

  return (
    <MainAppLayout title="Scan QR Code">
      <View className="flex-1 bg-light-background rounded-t-3xl -mt-1 px-5 pt-4">
        <Pressable
          className="flex-row items-center gap-2"
          onPress={() => router.replace("/(guard)/guardDashboard")}
        >
          <ChevronLeft
            size={18}
            color={THEME_COLORS.accent}
            strokeWidth={2.5}
          />
          <Text className="text-light-accent text-sm font-semibold">
            Back to Dashboard
          </Text>
        </Pressable>

        <Text className="text-light-text text-lg font-extrabold text-center mt-10">
          Status: Scanning
        </Text>

        <View className="items-center mt-8">
          <View className="w-[290px] h-[290px] rounded-3xl overflow-hidden bg-light-surface border border-light-border">
            {granted ? (
              <CameraView style={{ flex: 1 }} facing="back" />
            ) : (
              <View className="flex-1 items-center justify-center px-6">
                <Text className="text-light-text text-sm font-bold text-center">
                  Camera access is required.
                </Text>
                <Text className="text-light-muted text-xs text-center mt-2">
                  Allow camera to scan QR codes.
                </Text>
                <AppButton
                  label="Allow Camera"
                  size="md"
                  className="mt-4 w-full"
                  onPress={requestPermission}
                />
              </View>
            )}

            <View
              pointerEvents="none"
              className="absolute inset-0 rounded-3xl border-2 border-light-accent/25"
            />
            <View
              pointerEvents="none"
              className="absolute left-10 right-10 top-1/2 h-0.5 bg-light-accent/35"
            />
          </View>
        </View>

        <Text className="text-light-muted text-xs text-center mt-6">
          Align the QR code inside the frame.
        </Text>
      </View>
    </MainAppLayout>
  );
}
