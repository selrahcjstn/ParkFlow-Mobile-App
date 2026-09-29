import SubScreenLayout from "@/components/layouts/SubScreenLayout";
import { router, useLocalSearchParams } from "expo-router";
import { ScrollView, View, Text, TouchableOpacity, Modal, Platform } from "react-native";
import { Camera, Maximize2, X } from "lucide-react-native";
import QRCodeSvg from "react-native-qrcode-svg";
import { BlurView } from "expo-blur";
import { useAppTheme } from "@/hooks/useAppTheme";
import { AppButton } from "@/components/ui";
import { getVehicleTypeLabel } from "@/constants/vehicleType";
import { formatPhoneNumber } from "@/utils/formatParkingValues";
import { formatDateAndTime } from "@/utils/formatDataAndTime";
import type { ManualEntryResponse } from "@/features/session/types/parking-log.types";
import { useParkingSessionStore } from "@/features/session/store/parking-session.store";
import { useState } from "react";

export default function ManualPassPage() {
  const { colors } = useAppTheme();
  const params = useLocalSearchParams<{ passPayload?: string }>();
  const lastManualPass = useParkingSessionStore((s) => s.lastManualPass);
  const [isZoomed, setIsZoomed] = useState(false);

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
        {/* Pass Card - Shadowless with thin border */}
        <View className="bg-light-surface dark:bg-dark-surface rounded-3xl p-6 border border-light-border dark:border-dark-border items-center">
          
          {/* Header Message */}
          <View className="items-center mb-4">
            <Text className="text-light-text dark:text-dark-text font-bold text-[17px] tracking-tight text-center">
              QR Parking Pass
            </Text>
            <Text className="text-light-muted dark:text-dark-muted font-regular text-[12px] text-center mt-0.5">
              Scan at gate terminal upon vehicle exit
            </Text>
          </View>

          {/* QR Code Container - Maximizable */}
          <TouchableOpacity
            activeOpacity={0.88}
            onPress={() => setIsZoomed(true)}
            className="p-4 bg-white rounded-2xl border border-slate-200 dark:border-slate-700 relative items-center justify-center overflow-hidden mb-4"
          >
            <QRCodeSvg value={qrCodeValue} size={180} />
            <View className="absolute bottom-2 right-2 bg-slate-900/70 p-1.5 rounded-full">
              <Maximize2 size={12} color="#FFFFFF" strokeWidth={2.5} />
            </View>
          </TouchableOpacity>

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

      {/* Fullscreen QR Zoom Modal */}
      <Modal
        visible={isZoomed}
        transparent
        animationType="fade"
        onRequestClose={() => setIsZoomed(false)}
      >
        <View className="flex-1 items-center justify-center p-6 relative">
          {Platform.OS === "ios" ? (
            <BlurView
              intensity={60}
              tint="dark"
              style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
            />
          ) : null}
          <View className="absolute inset-0 bg-black/80" />

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setIsZoomed(false)}
            className="absolute top-12 right-6 w-11 h-11 rounded-full bg-white/20 items-center justify-center z-50"
          >
            <X size={22} color="#FFFFFF" strokeWidth={2.5} />
          </TouchableOpacity>

          <View className="bg-white p-6 rounded-3xl items-center border border-white/20 z-10">
            <QRCodeSvg value={qrCodeValue} size={250} />
            <Text className="text-slate-900 font-bold text-lg mt-4 font-mono tracking-wider">
              {plateNumber}
            </Text>
            <Text className="text-slate-500 font-regular text-xs mt-0.5">
              {brand} • {vehicleKind}
            </Text>
          </View>

          <View className="flex-row items-center gap-3 mt-6 z-10">
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setIsZoomed(false)}
              className="bg-white/20 py-3.5 px-6 rounded-2xl flex-row items-center gap-2"
            >
              <Text className="text-white font-bold text-xs tracking-wide">
                Close View
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SubScreenLayout>
  );
}
