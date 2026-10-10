import SubScreenLayout from "@/components/layouts/SubScreenLayout";
import { router, useLocalSearchParams } from "expo-router";
import { ScrollView, View, Text } from "react-native";
import { CheckCircle, LogOut, AlertOctagon } from "lucide-react-native";
import { useAppTheme } from "@/hooks/useAppTheme";
import { AppInput, AppButton } from "@/components/ui";
import React, { useRef, useState } from "react";
import { useAuthStore } from "@/features/auth/store/auth.store";
import { useApiMutation } from "@/hooks/useApiRequest";
import { parkingLogService } from "@/features/session/services/parking-log.service";
import { visitorService } from "@/features/session/services/visitor.service";
import { AlertModal } from "@/components/shared";
import { ScanResultLayout } from "@/components/layouts";
import { formatDateAndTime } from "@/utils/formatDataAndTime";
import { formatHours, formatPenaltyFee } from "@/utils/formatParkingValues";
import { useParkingSessionStore } from "@/features/session/store/parking-session.store";
import type { ManualExitResponse } from "@/features/session/types/parking-log.types";

export default function ManualExit() {
  const params = useLocalSearchParams<{ plateNumber?: string }>();
  const { colors } = useAppTheme();
  const { user } = useAuthStore();
  const { run: submitExit, isLoading: isExitLoading } = useApiMutation(parkingLogService.createManualExit);
  const { run: submitVisitorExit, isLoading: isVisitorExitLoading } = useApiMutation(visitorService.exitVisitor);
  const { getParkingSessionStats, getActiveSession } = useParkingSessionStore();
  const submittingRef = useRef(false);

  const [form, setForm] = useState({
    plateNumber: params.plateNumber ?? "",
  });

  const [errors, setErrors] = useState({
    plateNumber: "",
  });

  const [successData, setSuccessData] = useState<ManualExitResponse | null>(null);
  const [isLookingUp, setIsLookingUp] = useState(false);

  const [alert, setAlert] = useState({
    visible: false,
    title: "",
    message: "",
    variant: "error" as "error" | "warning" | "success" | "info",
  });

  const handleSubmit = async () => {
    if (submittingRef.current) return;
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

    const cleanPlate = form.plateNumber.trim().toUpperCase();

    try {
      submittingRef.current = true;
      setIsLookingUp(true);
      const lookup = await visitorService.lookupByPlate(cleanPlate);
      if (!lookup.isSuccess || !lookup.data) {
        throw new Error(lookup.message || "Could not check this plate. Please try again.");
      }
      if (lookup.data.isRegistered || lookup.data.lookupType === "Registered") {
        const response = await submitExit({ plateNumber: cleanPlate, userId: user.id });
        if (!response.isSuccess || !response.data) {
          throw new Error(response.message || "Could not record this exit.");
        }
        setSuccessData(response.data);
      } else {
        const response = await submitVisitorExit({ plateNumber: cleanPlate, guardUserId: user.id });
        if (!response.isSuccess || !response.data) {
          throw new Error(response.message || "No active visitor session found for this plate.");
        }
        // Never disguise an outdated API response as a free visitor exit.
        if (!Number.isFinite(response.data.chargeAmount) || !response.data.referenceNumber) {
          throw new Error("Exit was recorded, but charge details are unavailable. Check Collections and update the ParkFlow API before recording more visitor exits.");
        }
        setSuccessData({
          firstName: response.data.fullName,
          lastName: "(Visitor)",
          role: "Visitor",
          status: "Exited",
          plateNumber: response.data.plateNumber,
          brand: response.data.brand,
          vehicleType: response.data.vehicleType,
          entryTime: response.data.entryTime,
          exitTime: response.data.exitTime,
          overstayTime: 0,
          penaltyFee: response.data.chargeAmount,
          referenceNumber: response.data.referenceNumber,
          settlementStatus: response.data.settlementStatus,
        });
      }
      void getParkingSessionStats(true);
      void getActiveSession(true);
    } catch (error: any) {
      const serverMsg = error?.response?.data?.message;
      const errorMsg =
        serverMsg ||
        error?.message ||
        "No active parking or visit session found for this vehicle/visitor plate.";
      setAlert({
        visible: true,
        title: "Exit Failed",
        message: errorMsg,
        variant: "error",
      });
    } finally {
      submittingRef.current = false;
      setIsLookingUp(false);
    }
  };

  const handleResetForm = () => {
    setSuccessData(null);
    setForm({ plateNumber: "" });
  };

  const isLoading = isLookingUp || isExitLoading || isVisitorExitLoading;

  if (successData) {
    const ownerName = `${successData.firstName || ""} ${successData.lastName || ""}`.trim() || "Visitor / Driver";
    const plateNumber = successData.plateNumber ?? "N/A";
    const brand = successData.brand ?? "Vehicle";
    const vehicleKind = String(successData.vehicleType ?? "Vehicle").toLowerCase();

    const hasCharge = (successData.penaltyFee ?? 0) > 0;
    const isPaid = successData.settlementStatus === "Settled" || successData.settlementStatus === "Paid";
    const chargeDue = hasCharge && !isPaid;

    const ownerRows = [
      { label: "Name", value: ownerName },
      { label: "Role", value: successData.role ?? "N/A" },
    ];

    const sessionRows = [
      { label: "Entry Time", value: formatDateAndTime(successData.entryTime) },
      { label: "Exit Time", value: formatDateAndTime(successData.exitTime) },
      { label: "Chargeable Hours", value: formatHours(successData.overstayTime) },
      {
        label: isPaid && hasCharge ? "Charge Paid" : "Charge",
        value: formatPenaltyFee(String(successData.penaltyFee)),
        isHighlight: hasCharge,
        valueColorClass: chargeDue ? "text-light-warning dark:text-dark-warning" : "text-light-text dark:text-dark-text",
      },
      ...(successData.referenceNumber ? [{ label: "Charge Reference", value: successData.referenceNumber }] : []),
      ...(hasCharge ? [{ label: "Payment Status", value: isPaid ? "Paid" : "Unpaid" }] : []),
    ];

    const statusDescription = (
      <Text className="text-light-muted dark:text-dark-muted font-regular text-[13px] leading-[18px] text-center px-4">
        The{" "}
        <Text className="text-light-text dark:text-dark-text font-bold">
          {brand} {vehicleKind}
        </Text>{" "}
        with plate{" "}
        <Text className="text-light-text dark:text-dark-text font-bold">{plateNumber}</Text> is{" "}
        {chargeDue ? "recorded as exited. The charge remains unpaid and must be settled through the authorized payment process." : "cleared to leave the premises."}
      </Text>
    );

    const statusTitle = chargeDue ? "Exit Recorded (Charge Due)" : isPaid && hasCharge ? "Exit Recorded — Charge Paid" : "Exit Recorded";
    const statusColorClass = chargeDue ? "text-light-warning dark:text-dark-warning" : "text-light-success dark:text-dark-success";
    const statusIcon = chargeDue ? (
      <AlertOctagon size={56} color={colors.warning} strokeWidth={2.5} />
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
          chargeDue
            ? "Charge recorded as unpaid in Collections. Guards do not collect cash."
            : hasCharge ? "Payment confirmed and recorded in Collections." : "Vehicle exit recorded successfully."
        }
        footerLabel="Done"
        footerButtonVariant="primary"
        onBack={handleResetForm}
        onFooterPress={handleResetForm}
      >
        <AlertModal visible={alert.visible} title={alert.title} message={alert.message} variant={alert.variant}
          onClose={() => setAlert(prev => ({ ...prev, visible: false }))} />
      </ScanResultLayout>
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
            <LogOut size={32} color={colors.primary} strokeWidth={2} />
          </View>
          <Text className="text-light-text dark:text-dark-text font-bold text-[22px] leading-8 text-center tracking-tight">
            Manual Parking Exit
          </Text>
          <Text className="text-light-muted dark:text-dark-muted font-regular text-[13px] leading-[20px] text-center max-w-[280px] mt-1">
            Record a vehicle or visitor exit manually by entering its plate number.
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
              variant="primary"
              uppercase={false}
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
