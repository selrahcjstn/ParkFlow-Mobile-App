import SubScreenLayout from "@/components/layouts/SubScreenLayout";
import { router } from "expo-router";
import { ScrollView, View, Text } from "react-native";
import { Keyboard } from "lucide-react-native";
import { useAppTheme } from "@/hooks/useAppTheme";
import { AppInput, AppSelect, AppButton } from "@/components/ui";
import { useState } from "react";
import { useAuthStore } from "@/features/auth/store/auth.store";
import { useApiMutation } from "@/hooks/useApiRequest";
import { parkingLogService } from "@/features/session/services/parking-log.service";
import { AlertModal } from "@/components/shared";
import { VEHICLE_TYPE_OPTIONS } from "@/constants/vehicleType";
import { useParkingSessionStore } from "@/features/session/store/parking-session.store";

export default function ManualInput() {
  const { colors } = useAppTheme();
  const { user } = useAuthStore();
  const { run: submitEntry, isLoading } = useApiMutation(parkingLogService.createManualEntry);
  const { getParkingSessionStats, getActiveSession, setLastManualPass } = useParkingSessionStore();

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
        // Store pass data in store
        setLastManualPass(response.data);
        // Force-refresh stats so home page reflects new count immediately
        void getParkingSessionStats(true);
        void getActiveSession(true);

        // Reset form
        setForm({
          plateNumber: "",
          vehicleType: "",
          brand: "",
          phoneNumber: "",
        });

        // Navigate cleanly to the dedicated manual pass screen
        const passQuery = new URLSearchParams();
        passQuery.set("passPayload", encodeURIComponent(JSON.stringify(response.data)));
        router.replace(`/(guard)/manual-pass?${passQuery.toString()}` as any);
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

