import SubScreenLayout from "@/components/layouts/SubScreenLayout";
import { router } from "expo-router";
import { ScrollView, View, Text, Linking } from "react-native";
import { Keyboard, CheckCircle, Camera, QrCode, ShieldCheck, Clock, DollarSign, AlertCircle } from "lucide-react-native";
import QRCodeSvg from "react-native-qrcode-svg";
import { useAppTheme } from "@/hooks/useAppTheme";
import { AppInput, AppSelect, AppButton } from "@/components/ui";
import { useState } from "react";
import { useAuthStore } from "@/features/auth/store/auth.store";
import { useApiMutation } from "@/hooks/useApiRequest";
import { parkingLogService } from "@/features/session/services/parking-log.service";
import { AlertModal } from "@/components/shared";
import { VEHICLE_TYPE_OPTIONS, getVehicleTypeLabel } from "@/constants/vehicleType";
import { useParkingSessionStore } from "@/features/session/store/parking-session.store";
import { formatPhoneNumber } from "@/utils/formatParkingValues";
import { formatDateAndTime } from "@/utils/formatDataAndTime";
import type { ManualEntryResponse } from "@/features/session/types/parking-log.types";




export default function ManualInput() {
  const { colors } = useAppTheme();
  const { user } = useAuthStore();
  const { run: submitEntry, isLoading } = useApiMutation(parkingLogService.createManualEntry);
  const { getParkingSessionStats, getActiveSession } = useParkingSessionStore();

  const [form, setForm] = useState({
    plateNumber: "",
    vehicleType: "",
    brand: "",
    phoneNumber: "",
  });

  const [errors, setErrors] = useState({
    plateNumber: "",
    vehicleType: "",
    brand: "",
    phoneNumber: "",
  });

  const [successData, setSuccessData] = useState<ManualEntryResponse | null>(null);

  const [alert, setAlert] = useState({
    visible: false,
    title: "",
    message: "",
    variant: "error" as "error" | "warning" | "success" | "info",
  });

  const handleSubmit = async () => {
    // Clear previous errors
    setErrors({
      plateNumber: "",
      vehicleType: "",
      brand: "",
      phoneNumber: "",
    });

    let hasErrors = false;
    const newErrors = {
      plateNumber: "",
      vehicleType: "",
      brand: "",
      phoneNumber: "",
    };

    if (!form.plateNumber.trim()) {
      newErrors.plateNumber = "Plate number is required.";
      hasErrors = true;
    }
    if (!form.vehicleType) {
      newErrors.vehicleType = "Vehicle type is required.";
      hasErrors = true;
    }
    if (!form.brand.trim()) {
      newErrors.brand = "Brand/model is required.";
      hasErrors = true;
    }
    if (form.phoneNumber.trim()) {
      const cleanPhone = form.phoneNumber.trim();
      if (!/^\+?[0-9]{10,14}$/.test(cleanPhone)) {
        newErrors.phoneNumber = "Please enter a valid phone number (e.g. 09171234567).";
        hasErrors = true;
      }
    }

    if (hasErrors) {
      setErrors(newErrors);
      return;
    }

    if (!user?.id) {
      setAlert({
        visible: true,
        title: "Session Error",
        message: "Guard user session not found. Please log in again.",
        variant: "error",
      });
      return;
    }

    try {
      const payload = {
        plateNumber: form.plateNumber.trim().toUpperCase(),
        vehicleType: parseInt(form.vehicleType, 10),
        phoneNumber: form.phoneNumber.trim() || "N/A",
        brand: form.brand.trim(),
        userId: user.id,
      };

      const response = await submitEntry(payload);

      if (response.isSuccess && response.data) {
        setSuccessData(response.data);
        // Force-refresh stats so home page reflects new count immediately
        void getParkingSessionStats(true);
        void getActiveSession(true);
      } else {
        const errorMsg = response.message || "Failed to record manual entry.";
        setAlert({
          visible: true,
          title: "Submission Failed",
          message: errorMsg,
          variant: "error",
        });
      }
    } catch (error: any) {
      const serverMsg = error?.response?.data?.message;
      const errorMsg =
        serverMsg ||
        error?.message ||
        "An unexpected error occurred. Please try again.";
      const isNetworkError = !error?.response;
      setAlert({
        visible: true,
        title: isNetworkError ? "Network Error" : "Request Failed",
        message: errorMsg,
        variant: "error",
      });
    }
  };

  const handleResetForm = () => {
    setSuccessData(null);
    setForm({
      plateNumber: "",
      vehicleType: "",
      brand: "",
      phoneNumber: "",
    });
  };

  if (successData) {
    const ownerName = `${successData.firstName || ""} ${successData.lastName || ""}`.trim() || "Guest Driver";
    const plateNumber = successData.plateNumber ?? "N/A";
    const brand = successData.brand ?? "Unknown Brand";
    
    // Normalize vehicle type display label
    const vehicleTypeRaw = successData.vehicleType;
    const vehicleKind = (vehicleTypeRaw === "0" || vehicleTypeRaw === "1" || vehicleTypeRaw === "2" || typeof vehicleTypeRaw === "number")
      ? getVehicleTypeLabel(vehicleTypeRaw)
      : String(vehicleTypeRaw ?? "Vehicle");

    const formattedPhone = formatPhoneNumber(successData.phoneNumber);
    const qrCodeValue = successData.qrCodeHash || successData.plateNumber || "PARKFLOW-MANUAL";

    return (
      <SubScreenLayout title="Manual Parking Pass" onBack={() => router.replace("/(guard)/(tabs)/home" as any)}>
        <ScrollView
          className="flex-1 bg-light-background dark:bg-dark-background"
          contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 20 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Top Pass Card */}
          <View className="bg-light-surface dark:bg-dark-surface rounded-3xl p-6 border border-light-border dark:border-dark-border shadow-soft items-center">
            
            {/* Header / Badges */}
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
                <Text className="text-light-muted dark:text-dark-muted text-[13px] font-medium">Vehicle</Text>
                <Text className="text-light-text dark:text-dark-text text-[13px] font-bold">{brand} • {vehicleKind}</Text>
              </View>

              <View className="flex-row justify-between items-center py-1">
                <Text className="text-light-muted dark:text-dark-muted text-[13px] font-medium">Driver / Contact</Text>
                <Text className="text-light-text dark:text-dark-text text-[13px] font-semibold">
                  {ownerName} {formattedPhone !== "N/A" ? `(${formattedPhone})` : ""}
                </Text>
              </View>

              <View className="flex-row justify-between items-center py-1">
                <Text className="text-light-muted dark:text-dark-muted text-[13px] font-medium">Entry Time</Text>
                <Text className="text-light-text dark:text-dark-text text-[13px] font-semibold">
                  {formatDateAndTime(successData.entryTime)}
                </Text>
              </View>

              <View className="flex-row justify-between items-center py-1">
                <Text className="text-light-muted dark:text-dark-muted text-[13px] font-medium">Valid Until</Text>
                <Text className="text-light-primary dark:text-dark-primary text-[13px] font-bold">
                  {successData.maximumExitTime ? formatDateAndTime(successData.maximumExitTime) : "12:00 AM Midnight"}
                </Text>
              </View>

              {/* Fee breakdown info */}
              <View className="mt-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60">
                <View className="flex-row justify-between items-center mb-1">
                  <Text className="text-slate-600 dark:text-slate-300 text-[12px] font-medium">Flat Entry Fee</Text>
                  <Text className="text-emerald-600 dark:text-emerald-400 text-[12px] font-bold">₱20.00</Text>
                </View>
                <View className="flex-row justify-between items-center">
                  <Text className="text-slate-500 dark:text-slate-400 text-[11px] font-regular">Overnight Past 12:00 AM</Text>
                  <Text className="text-amber-600 dark:text-amber-400 text-[11px] font-medium">+₱100.00 / day</Text>
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
              onPress={handleResetForm}
              size="lg"
            />
          </View>
        </ScrollView>
      </SubScreenLayout>
    );
  }

  return (
    <SubScreenLayout title="Manual Input" onBack={() => router.back()}>
      <ScrollView 
        className="flex-1 bg-light-background dark:bg-dark-background"
        contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 24 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View className="items-center mb-6">
          <View className="w-16 h-16 rounded-[22px] bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border items-center justify-center shadow-soft mb-4">
            <Keyboard size={32} color={colors.primary} strokeWidth={2} />
          </View>
          <Text className="text-light-text dark:text-dark-text font-bold text-[22px] leading-8 text-center tracking-tight">
            Manual Parking Entry
          </Text>
          <Text className="text-light-muted dark:text-dark-muted font-regular text-[13px] leading-[20px] text-center max-w-[280px] mt-1">
            Record a vehicle entry manually by entering the vehicle details and owner's contact info.
          </Text>
        </View>

        <View className="gap-2">
          <AppInput
            label="Plate Number"
            placeholder="e.g. ABC 1234"
            value={form.plateNumber}
            onChangeText={(v) => {
              setForm((prev) => ({ ...prev, plateNumber: v }));
              if (errors.plateNumber) {
                setErrors((prev) => ({ ...prev, plateNumber: "" }));
              }
            }}
            autoCapitalize="characters"
            error={errors.plateNumber}
          />

          <AppSelect
            label="Vehicle Type"
            placeholder="Select vehicle type"
            options={VEHICLE_TYPE_OPTIONS}
            value={form.vehicleType}
            onChange={(val) => {
              setForm((prev) => ({ ...prev, vehicleType: val }));
              if (errors.vehicleType) {
                setErrors((prev) => ({ ...prev, vehicleType: "" }));
              }
            }}
            error={errors.vehicleType}
          />

          <AppInput
            label="Brand / Model"
            placeholder="e.g. Toyota Vios, Honda Click"
            value={form.brand}
            onChangeText={(v) => {
              setForm((prev) => ({ ...prev, brand: v }));
              if (errors.brand) {
                setErrors((prev) => ({ ...prev, brand: "" }));
              }
            }}
            error={errors.brand}
          />

          <AppInput
            label="Owner Phone Number (Optional)"
            placeholder="e.g. 09171234567"
            keyboardType="phone-pad"
            value={form.phoneNumber}
            onChangeText={(v) => {
              setForm((prev) => ({ ...prev, phoneNumber: v }));
              if (errors.phoneNumber) {
                setErrors((prev) => ({ ...prev, phoneNumber: "" }));
              }
            }}
            error={errors.phoneNumber}
          />

          <View className="mt-4 mb-8">
            <AppButton
              label="Register Manual Entry"
              onPress={handleSubmit}
              loading={isLoading}
              disabled={isLoading}
              size="lg"
            />
          </View>
        </View>
      </ScrollView>

      <AlertModal
        visible={alert.visible}
        onClose={() => setAlert((prev) => ({ ...prev, visible: false }))}
        title={alert.title}
        message={alert.message}
        variant={alert.variant}
      />
    </SubScreenLayout>
  );
}

