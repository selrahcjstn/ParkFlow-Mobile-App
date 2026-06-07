import SubScreenLayout from "@/components/layouts/SubScreenLayout";
import { router } from "expo-router";
import { ScrollView, View, Text, Linking } from "react-native";
import { Hammer, CheckCircle } from "lucide-react-native";
import { useAppTheme } from "@/hooks/useAppTheme";
import { AppInput, AppSelect, AppButton } from "@/components/ui";
import { useState } from "react";
import { useAuthStore } from "@/features/auth/store/auth.store";
import { useApiMutation } from "@/hooks/useApiRequest";
import { parkingLogService } from "@/features/session/services/parking-log.service";
import { AlertModal } from "@/components/shared";
import { ScanResultLayout } from "@/components/layouts";
import { formatDateAndTime } from "@/utils/formatDataAndTime";
import type { ManualEntryResponse } from "@/features/session/types/parking-log.types";
import { VEHICLE_TYPE_OPTIONS, getVehicleTypeLabel } from "@/constants/vehicleType";
import { queryClient } from "@/services/queryClient";


export default function ManualInput() {
  const { colors } = useAppTheme();
  const { user } = useAuthStore();
  const { run: submitEntry, isLoading } = useApiMutation(parkingLogService.createManualEntry);

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
        phoneNumber: form.phoneNumber.trim(),
        brand: form.brand.trim(),
        userId: user.id,
      };

      const response = await submitEntry(payload);

      if (response.isSuccess && response.data) {
        setSuccessData(response.data);
        queryClient.invalidateQueries({ queryKey: ["activeSession"] });
        queryClient.invalidateQueries({ queryKey: ["sessionStats"] });
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
      const errorMsg =
        error?.response?.data?.message ||
        error?.message ||
        "An unexpected network error occurred.";
      setAlert({
        visible: true,
        title: "Network Error",
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
      ? getVehicleTypeLabel(vehicleTypeRaw).toLowerCase()
      : String(vehicleTypeRaw ?? "Vehicle").toLowerCase();

    const ownerRows = [
      { label: "Name", value: ownerName },
      { label: "Role", value: successData.role ?? "N/A" },
      {
        label: "Contact No.",
        value: successData.phoneNumber ?? "N/A",
        onPress: successData.phoneNumber
          ? () => Linking.openURL(`tel:${encodeURIComponent(successData.phoneNumber)}`)
          : undefined,
      },
    ];

    const sessionRows = [
      { label: "Entry Time", value: formatDateAndTime(successData.entryTime) },
      {
        label: "Must Exit Before",
        value: successData.maximumExitTime
          ? formatDateAndTime(successData.maximumExitTime)
          : "No limit set",
      },
      { label: "Entry Method", value: successData.entryMethod || "Manual Entry" },
    ];

    const statusDescription = (
      <Text className="text-light-muted dark:text-dark-muted font-regular text-[13px] leading-[18px] text-center px-4">
        The{" "}
        <Text className="text-light-text dark:text-dark-text font-black">
          {brand} {vehicleKind}
        </Text>{" "}
        with plate{" "}
        <Text className="text-light-text dark:text-dark-text font-black">{plateNumber}</Text> is
        cleared to enter the facility.
      </Text>
    );

    return (
      <ScanResultLayout
        ownerRows={ownerRows}
        sessionRows={sessionRows}
        statusTitle="Entry Recorded"
        statusDescription={statusDescription}
        statusColorClass="text-light-success dark:text-dark-success"
        statusIcon={<CheckCircle size={56} color="#10B981" strokeWidth={2.5} />}
        footerMessage="Verify the driver’s identity before granting access to the facility."
        footerLabel="Go Back"
        onBack={handleResetForm}
        onFooterPress={handleResetForm}
      />
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
            <Hammer size={32} color={colors.primary} strokeWidth={2} />
          </View>
          <Text className="text-light-text dark:text-dark-text font-black text-[22px] leading-8 text-center tracking-tight">
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

