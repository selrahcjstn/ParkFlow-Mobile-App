import SubScreenLayout from "@/components/layouts/SubScreenLayout";
import { router } from "expo-router";
import { ScrollView, View, Text } from "react-native";
import { Keyboard, CheckCircle, LogOut, AlertOctagon } from "lucide-react-native";
import { useAppTheme } from "@/hooks/useAppTheme";
import { AppInput, AppButton } from "@/components/ui";
import React, { useState } from "react";
import { useAuthStore } from "@/features/auth/store/auth.store";
import { useApiMutation } from "@/hooks/useApiRequest";
import { parkingLogService } from "@/features/session/services/parking-log.service";
import { AlertModal } from "@/components/shared";
import { ScanResultLayout } from "@/components/layouts";
import { formatDateAndTime } from "@/utils/formatDataAndTime";
import { formatHours, formatPenaltyFee } from "@/utils/formatParkingValues";
import { useParkingSessionStore } from "@/features/session/store/parking-session.store";
import type { ManualExitResponse } from "@/features/session/types/parking-log.types";

export default function ManualExit() {
  const { colors } = useAppTheme();
  const { user } = useAuthStore();
  const { run: submitExit, isLoading } = useApiMutation(parkingLogService.createManualExit);
  const { getParkingSessionStats, getActiveSession } = useParkingSessionStore();

  const [form, setForm] = useState({
    plateNumber: "",
  });

  const [errors, setErrors] = useState({
    plateNumber: "",
  });

  const [successData, setSuccessData] = useState<ManualExitResponse | null>(null);

  const [alert, setAlert] = useState({
    visible: false,
    title: "",
    message: "",
    variant: "error" as "error" | "warning" | "success" | "info",
  });

  const handleSubmit = async () => {
    setErrors({ plateNumber: "" });

    if (!form.plateNumber.trim()) {
      setErrors({ plateNumber: "Plate number is required." });
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
        userId: user.id,
      };

      const response = await submitExit(payload);

      if (response.isSuccess && response.data) {
        setSuccessData(response.data);
        // Force-refresh stats so home page reflects new count immediately
        void getParkingSessionStats(true);
        void getActiveSession(true);
      } else {
        const errorMsg = response.message || "Failed to record manual exit.";
        setAlert({
          visible: true,
          title: "Submission Failed",
          message: errorMsg,
          variant: "error",
        });
      }
    } catch (error: any) {
      // Prefer the backend's own error message (ApiResponse.message from 4xx/5xx body)
      const serverMsg = error?.response?.data?.message;
      const errorMsg =
        serverMsg ||
        error?.message ||
        "An unexpected error occurred. Please try again.";
      // Only label as Network Error if there's truly no response (offline, timeout, etc.)
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
    setForm({ plateNumber: "" });
  };

  if (successData) {
    const ownerName = `${successData.firstName || ""} ${successData.lastName || ""}`.trim() || "Guest Driver";
    const plateNumber = successData.plateNumber ?? "N/A";
    const brand = successData.brand ?? "Unknown Brand";
    const vehicleKind = String(successData.vehicleType ?? "Vehicle").toLowerCase();

    const hasPenalty = (successData.penaltyFee ?? 0) > 0;

    const ownerRows = [
      { label: "Name", value: ownerName },
      { label: "Role", value: successData.role ?? "N/A" },
    ];

    const sessionRows = [
      { label: "Entry Time", value: formatDateAndTime(successData.entryTime) },
      { label: "Exit Time", value: formatDateAndTime(successData.exitTime) },
      { label: "Chargeable Hours", value: formatHours(successData.overstayTime) },
      {
        label: "Penalty Fee",
        value: formatPenaltyFee(String(successData.penaltyFee)),
        isHighlight: hasPenalty,
        valueColorClass: hasPenalty ? "text-light-danger dark:text-dark-danger" : "text-light-text dark:text-dark-text",
      },
    ];

    const statusDescription = (
      <Text className="text-light-muted dark:text-dark-muted font-regular text-[13px] leading-[18px] text-center px-4">
        The{" "}
        <Text className="text-light-text dark:text-dark-text font-bold">
          {brand} {vehicleKind}
        </Text>{" "}
        with plate{" "}
        <Text className="text-light-text dark:text-dark-text font-bold">{plateNumber}</Text> is
        cleared to leave the premises.
      </Text>
    );

    const statusTitle = hasPenalty ? "Payment Required" : "Exit Recorded";
    const statusColorClass = hasPenalty ? "text-light-danger dark:text-dark-danger" : "text-light-success dark:text-dark-success";
    const statusIcon = hasPenalty ? (
      <AlertOctagon size={56} color={colors.danger} strokeWidth={2.5} />
    ) : (
      <CheckCircle size={56} color={colors.success} strokeWidth={2.5} />
    );

    return (
      <ScanResultLayout
        ownerRows={ownerRows}
        sessionRows={sessionRows}
        statusTitle={statusTitle}
        statusDescription={statusDescription}
        statusColorClass={statusColorClass}
        statusIcon={statusIcon}
        footerMessage={
          hasPenalty
            ? "Collect the citation payment or overstay fee before releasing the vehicle."
            : "Verify that all parking citations or overstay fees have been settled if applicable."
        }
        footerLabel={hasPenalty ? "Mark as Paid" : "Okay"}
        footerButtonVariant={hasPenalty ? "danger" : "primary"}
        onBack={handleResetForm}
        onFooterPress={handleResetForm}
      />
    );
  }

  return (
    <SubScreenLayout title="Manual Exit" onBack={() => router.back()}>
      <ScrollView 
        className="flex-1 bg-light-background dark:bg-dark-background"
        contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 24 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View className="items-center mb-6">
          <View className="w-16 h-16 rounded-[22px] bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border items-center justify-center shadow-soft mb-4">
            <LogOut size={32} color={colors.danger} strokeWidth={2} />
          </View>
          <Text className="text-light-text dark:text-dark-text font-bold text-[22px] leading-8 text-center tracking-tight">
            Manual Parking Exit
          </Text>
          <Text className="text-light-muted dark:text-dark-muted font-regular text-[13px] leading-[20px] text-center max-w-[280px] mt-1">
            Record a vehicle exit manually by entering its plate number.
          </Text>
        </View>

        <View className="gap-4">
          <AppInput
            label="Plate Number"
            placeholder="e.g. ABC 1234"
            value={form.plateNumber}
            onChangeText={(v) => {
              setForm({ plateNumber: v });
              if (errors.plateNumber) {
                setErrors({ plateNumber: "" });
              }
            }}
            error={errors.plateNumber}
            autoCapitalize="characters"
            autoCorrect={false}
          />

          <View className="mt-4">
            <AppButton
              label="Process Exit"
              onPress={handleSubmit}
              loading={isLoading}
              size="lg"
              variant="danger"
            />
          </View>
        </View>
      </ScrollView>

      <AlertModal
        visible={alert.visible}
        title={alert.title}
        message={alert.message}
        variant={alert.variant}
        onClose={() => setAlert((prev) => ({ ...prev, visible: false }))}
      />
    </SubScreenLayout>
  );
}
