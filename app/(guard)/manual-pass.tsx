import SubScreenLayout from "@/components/layouts/SubScreenLayout";
import { router, useLocalSearchParams } from "expo-router";
import { ScrollView, View, Text } from "react-native";
import { Camera, QrCode } from "lucide-react-native";
import QRCodeSvg from "react-native-qrcode-svg";
import { useAppTheme } from "@/hooks/useAppTheme";
import { AppButton } from "@/components/ui";
import { getVehicleTypeLabel } from "@/constants/vehicleType";
import { formatPhoneNumber } from "@/utils/formatParkingValues";
import { formatDateAndTime } from "@/utils/formatDataAndTime";
import type { ManualEntryResponse } from "@/features/session/types/parking-log.types";
import { useParkingSessionStore } from "@/features/session/store/parking-session.store";

export default function ManualPassPage() {
  const { colors } = useAppTheme();
  const params = useLocalSearchParams<{ passPayload?: string }>();
  const lastManualPass = useParkingSessionStore((s) => s.lastManualPass);

  let passData: Partial<ManualEntryResponse> = lastManualPass || {};
  if (!lastManualPass && params.passPayload) {
    try {
      passData = JSON.parse(decodeURIComponent(params.passPayload)) as Partial<ManualEntryResponse>;
    } catch {
      passData = {};
    }
  }

  const ownerName =
    `${passData.firstName || ""} ${passData.lastName || ""}`.trim() || "Guest Driver";
  const plateNumber = passData.plateNumber ?? "N/A";
  const brand = passData.brand ?? "Unknown Brand";

  // Normalize vehicle type display label
  const vehicleTypeRaw = passData.vehicleType;
  const vehicleKind =
    vehicleTypeRaw === "0" ||
    vehicleTypeRaw === "1" ||
    vehicleTypeRaw === "2" ||
    typeof vehicleTypeRaw === "number"
      ? getVehicleTypeLabel(vehicleTypeRaw)
      : String(vehicleTypeRaw ?? "Vehicle");

  const formattedPhone = formatPhoneNumber(passData.phoneNumber || "");
  const qrCodeValue = passData.qrCodeHash || passData.plateNumber || "PARKFLOW-MANUAL";

  return (
    <SubScreenLayout
      title="Manual Parking Pass"
      onBack={() => router.replace("/(guard)/(tabs)/home" as any)}
    >
      <ScrollView
        className="flex-1 bg-light-background dark:bg-dark-background"
        contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 20 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Pass Card */}
        <View className="bg-light-surface dark:bg-dark-surface rounded-3xl p-6 border border-light-border dark:border-dark-border shadow-soft items-center">
          {/* Header Badges */}
          <View className="flex-row items-center justify-between w-full mb-5">
            <View className="flex-row items-center gap-1.5 bg-light-primary/10 dark:bg-dark-primary/20 px-3 py-1.5 rounded-full">
              <QrCode size={14} color={colors.primary} />
              <Text className="text-light-primary dark:text-dark-primary font-bold text-[12px] uppercase tracking-wider">
                Visitor Pass
              </Text>
            </View>
            <View className="bg-light-success/15 dark:bg-dark-success/20 px-3 py-1.5 rounded-full">
              <Text className="text-light-success dark:text-dark-success font-bold text-[12px]">
                ₱20.00 Flat Rate
              </Text>
            </View>
          </View>

          {/* QR Code Container */}
          <View className="p-5 bg-white rounded-2xl border-2 border-slate-200 shadow-sm items-center justify-center mb-3">
            <QRCodeSvg value={qrCodeValue} size={190} />
          </View>

          {/* Plate Number Monospace Badge */}
          <View className="bg-slate-100 dark:bg-slate-800 px-4 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 mb-4">
            <Text className="font-mono font-bold text-slate-900 dark:text-white text-[16px] tracking-widest">
              {plateNumber}
            </Text>
          </View>

          {/* Driver Instruction Notice */}
          <View className="w-full bg-light-primary/5 dark:bg-dark-primary/10 border border-light-primary/20 dark:border-dark-primary/30 rounded-2xl p-3.5 flex-row items-start gap-2.5 mb-5">
            <View style={{ marginTop: 2 }}>
              <Camera size={18} color={colors.primary} />
            </View>
            <View className="flex-1">
              <Text className="text-light-text dark:text-dark-text font-bold text-[13px] leading-5">
                Driver Photo Required
              </Text>
              <Text className="text-light-muted dark:text-dark-muted font-regular text-[12px] leading-4 mt-0.5">
                Instruct the driver to take a photo of this QR code with their phone. They will present it to the guard scanner upon exit.
              </Text>
            </View>
          </View>

          {/* Details Grid */}
          <View className="w-full gap-2.5 pt-3 border-t border-light-border dark:border-dark-border">
            <View className="flex-row justify-between items-center py-1">
              <Text className="text-light-muted dark:text-dark-muted text-[13px] font-medium">
                Vehicle
              </Text>
              <Text className="text-light-text dark:text-dark-text text-[13px] font-bold">
                {brand} • {vehicleKind}
              </Text>
            </View>

            <View className="flex-row justify-between items-center py-1">
              <Text className="text-light-muted dark:text-dark-muted text-[13px] font-medium">
                Driver / Contact
              </Text>
              <Text className="text-light-text dark:text-dark-text text-[13px] font-semibold">
                {ownerName} {formattedPhone !== "N/A" ? `(${formattedPhone})` : ""}
              </Text>
            </View>

            <View className="flex-row justify-between items-center py-1">
              <Text className="text-light-muted dark:text-dark-muted text-[13px] font-medium">
                Entry Time
              </Text>
              <Text className="text-light-text dark:text-dark-text text-[13px] font-semibold">
                {passData.entryTime ? formatDateAndTime(passData.entryTime) : "N/A"}
              </Text>
            </View>

            <View className="flex-row justify-between items-center py-1">
              <Text className="text-light-muted dark:text-dark-muted text-[13px] font-medium">
                Valid Until
              </Text>
              <Text className="text-light-primary dark:text-dark-primary text-[13px] font-bold">
                {passData.maximumExitTime
                  ? formatDateAndTime(passData.maximumExitTime)
                  : "12:00 AM Midnight"}
              </Text>
            </View>

            {/* Fee breakdown info */}
            <View className="mt-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60">
              <View className="flex-row justify-between items-center mb-1">
                <Text className="text-slate-600 dark:text-slate-300 text-[12px] font-medium">
                  Flat Entry Fee
                </Text>
                <Text className="text-emerald-600 dark:text-emerald-400 text-[12px] font-bold">
                  ₱20.00
                </Text>
              </View>
              <View className="flex-row justify-between items-center">
                <Text className="text-slate-500 dark:text-slate-400 text-[11px] font-regular">
                  Overnight Past 12:00 AM
                </Text>
                <Text className="text-amber-600 dark:text-amber-400 text-[11px] font-medium">
                  +₱100.00 / day
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View className="gap-3 mt-6 mb-8">
          <AppButton
            label="Done & Return to Dashboard"
            onPress={() => router.replace("/(guard)/(tabs)/home" as any)}
            size="lg"
          />
          <AppButton
            label="Record Another Entry"
            variant="outline"
            onPress={() => router.replace("/(guard)/manual-input" as any)}
            size="lg"
          />
        </View>
      </ScrollView>
    </SubScreenLayout>
  );
}
