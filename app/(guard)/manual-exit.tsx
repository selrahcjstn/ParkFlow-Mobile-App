import SubScreenLayout from "@/components/layouts/SubScreenLayout";
import { router, useLocalSearchParams } from "expo-router";
import { ScrollView, View, Text } from "react-native";
import { CheckCircle, LogOut } from "lucide-react-native";
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
import { formatHours } from "@/utils/formatParkingValues";
import { useParkingSessionStore } from "@/features/session/store/parking-session.store";
import type { ManualExitResponse } from "@/features/session/types/parking-log.types";
import { useActionConfirmation } from "@/hooks/useActionConfirmation";
import { appDialog } from "@/services/app-dialog";

export default function ManualExit() {
  const confirmAction = useActionConfirmation();
  const params = useLocalSearchParams<{ plateNumber?: string }>();
  const { colors } = useAppTheme();
  const { user } = useAuthStore();
  const { run: submitExit, isLoading: isExitLoading } = useApiMutation(parkingLogService.createManualExit);
  const { run: submitVisitorExit, isLoading: isVisitorExitLoading } = useApiMutation(visitorService.exitVisitor);
  const { getParkingSessionStats, getActiveSession } = useParkingSessionStore();
  const submittingRef = useRef(false);
  const plateVersionRef = useRef(0);

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
    const version = plateVersionRef.current;

    try {
      submittingRef.current = true;
      setIsLookingUp(true);
      const lookup = await visitorService.lookupByPlate(cleanPlate);
      if (!lookup.isSuccess || !lookup.data) {
        throw new Error(lookup.message || "Could not check this plate. Please try again.");
      }
      if (version !== plateVersionRef.current) return;
      let record = lookup.data;
      if (record.isVisitor && !record.identityConfirmed) {
        const confirmed = await visitorService.confirmLookupByPlate(cleanPlate);
        if (!confirmed.isSuccess || !confirmed.data?.isVisitor || !confirmed.data.identityConfirmed)
          throw new Error(confirmed.message || 'Could not retrieve the visitor for exit.');
        if (version !== plateVersionRef.current) return;
        record = confirmed.data;
      }
      const registered = !!(record.isRegistered || record.lookupType === "Registered");
      const guardId = user.id;
      confirmAction("Confirm vehicle exit", [
        "Check this plate and driver before recording exit.",
        "",
        `Plate number: ${cleanPlate}`,
        `Name: ${record.ownerName || record.fullName || "Driver / Visitor"}`,
        `Vehicle: ${record.brand || "Not provided"}`,
        ...(record.entryTime ? [`Entered: ${formatDateAndTime(record.entryTime)}`] : []),
        "",
        "Confirm the vehicle and driver before recording exit.",
      ].join("\n"), async () => {
        if (version !== plateVersionRef.current) {
          appDialog.show("Search again", "The plate has changed. Check the plate again before recording exit.");
          return;
        }
        await submitConfirmedExit(cleanPlate, registered, guardId, record.visitorVehicleId, record.activeSessionId);
      }, { confirmLabel: "Confirm exit" });
    } catch (error: any) {
      setAlert({ visible: true, title: "Exit Failed",
        message: error?.response?.data?.message || error?.message || "Could not check this plate. Please try again.", variant: "error" });
    } finally {
      submittingRef.current = false;
      setIsLookingUp(false);
    }
  };

  const submitConfirmedExit = async (cleanPlate: string, registered: boolean, guardId: string, visitorVehicleId?: string | null, sessionId?: string | null) => {
    if (submittingRef.current) return;
    submittingRef.current = true;
    try {
      if (registered) {
        const response = await submitExit({ plateNumber: cleanPlate, userId: guardId });
        if (!response.isSuccess || !response.data) {
          throw new Error(response.message || "Could not record this exit.");
        }
        setSuccessData(response.data);
      } else {
        const response = await submitVisitorExit({ plateNumber: cleanPlate, guardUserId: guardId, visitorVehicleId, sessionId });
        if (!response.isSuccess || !response.data) {
          throw new Error(response.message || "No active visitor session found for this plate.");
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
      appDialog.show("Exit Failed", errorMsg, undefined, { variant: "error" });
    } finally {
      submittingRef.current = false;
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

    const ownerRows = [
      { label: "Name", value: ownerName },
      { label: "Role", value: successData.role ?? "N/A" },
    ];
    const sessionRows = [
      { label: "Entry Time", value: formatDateAndTime(successData.entryTime) },
      { label: "Exit Time", value: formatDateAndTime(successData.exitTime) },
      { label: "Overstay Hours", value: formatHours(successData.overstayTime) },
    ];
    const statusDescription = <Text className="text-light-muted dark:text-dark-muted text-center">
      The {brand} {vehicleKind} with plate {plateNumber} is cleared to leave the premises.
    </Text>;
    const statusTitle = "Exit Recorded";
    const statusColorClass = "text-light-text dark:text-dark-success";
    const statusIcon = <CheckCircle size={56} color={colors.success} strokeWidth={2.5} />;

    return (
      <ScanResultLayout
        ownerRows={ownerRows}
        sessionRows={sessionRows}
        statusTitle={statusTitle}
        statusDescription={statusDescription}
        statusColorClass={statusColorClass}
        statusIcon={statusIcon}
        footerMessage="Vehicle exit recorded successfully."
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
              ++plateVersionRef.current;
              setForm({ plateNumber: v });
              if (errors.plateNumber) {
                setErrors({ plateNumber: "" });
              }
            }}
            error={errors.plateNumber}
            autoCapitalize="characters"
            autoCorrect={false}
            editable={!isLoading}
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
