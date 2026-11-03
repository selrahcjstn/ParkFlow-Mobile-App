import DriverVehiclePreview from './DriverVehiclePreview';
import React from "react";
import { View, Text, ScrollView } from "react-native";
import {
  CheckCircle,
  AlertTriangle,
  XCircle,
  Clock,
  Calendar,
  ShieldAlert,
  ShieldCheck,
  LogOut,
} from "lucide-react-native";
import SubScreenLayout from "@/components/layouts/SubScreenLayout";
import SectionCard from "@/components/layouts/SectionCard";
import DetailRow from "@/components/layouts/DetailRow";
import { AppButton } from "@/components/ui";
import { useAppTheme } from "@/hooks/useAppTheme";
import type { StudentScanVerificationResponse } from "@/features/qr/types/qr-scan.types";

interface StudentScanResultCardProps {
  result: StudentScanVerificationResponse;
  onScanAnother: () => void;
  onBack?: () => void;
  onConfirmVehicleEntry?: () => void;
  onConfirmVehicleExit?: () => void;
  isConfirmingVehicle?: boolean;
}

export default function StudentScanResultCard({
  result,
  onScanAnother,
  onBack,
  onConfirmVehicleEntry,
  onConfirmVehicleExit,
  isConfirmingVehicle = false,
}: StudentScanResultCardProps) {
  const { colors } = useAppTheme();

  const isParked = Boolean(result.isCurrentlyParked);
  const isApproved = result.isValid && result.entryStatus === "Approved";
  const isNotFound = result.entryStatus === "NotFound";
  const isOutOfSchedule = result.entryStatus === "OutOfSchedule";
  const isNoScheduleToday = result.entryStatus === "NoScheduleToday";
  const isCorIssue = result.entryStatus === "CorNotVerified";
  const isVehicleIssue = result.entryStatus === "VehicleNotVerified";

  let statusTitle = "Approved for Campus Entry";
  let statusBadgeLabel = "Valid for Entry";
  let badgeBg = "bg-light-success/15 dark:bg-dark-success/15 border-light-success/30 dark:border-dark-success/30";
  let badgeText = "text-light-text dark:text-dark-success";
  let iconColor = colors.success;
  let IconComponent = CheckCircle;

  if (isParked) {
    statusTitle = "Ready for Vehicle Exit";
    statusBadgeLabel = "Active Parking — Ready to Exit";
    badgeBg = "bg-light-primary/15 dark:bg-dark-primary/15 border-light-primary/30 dark:border-dark-primary/30";
    badgeText = "text-light-primary dark:text-dark-primary";
    iconColor = colors.primary;
    IconComponent = LogOut;
  } else if (isNotFound) {
    statusTitle = "Student Not Registered";
    statusBadgeLabel = "Unregistered ID";
    badgeBg = "bg-light-danger/15 dark:bg-dark-danger/15 border-light-danger/30 dark:border-dark-danger/30";
    badgeText = "text-light-text dark:text-dark-danger";
    iconColor = colors.danger;
    IconComponent = XCircle;
  } else if (isVehicleIssue) {
    statusTitle = "Vehicle Verification Required";
    statusBadgeLabel = "Vehicle Pending Approval";
    badgeBg = "bg-light-danger/15 dark:bg-dark-danger/15 border-light-danger/30 dark:border-dark-danger/30";
    badgeText = "text-light-text dark:text-dark-danger";
    iconColor = colors.danger;
    IconComponent = ShieldAlert;
  } else if (isCorIssue) {
    statusTitle = "COR Verification Required";
    statusBadgeLabel = "COR Pending Approval";
    badgeBg = "bg-light-danger/15 dark:bg-dark-danger/15 border-light-danger/30 dark:border-dark-danger/30";
    badgeText = "text-light-text dark:text-dark-danger";
    iconColor = colors.danger;
    IconComponent = ShieldAlert;
  } else if (isOutOfSchedule) {
    statusTitle = "Outside Schedule Window";
    statusBadgeLabel = "Out of Schedule";
    badgeBg = "bg-light-warning/15 dark:bg-dark-warning/15 border-light-warning/30 dark:border-dark-warning/30";
    badgeText = "text-light-text dark:text-dark-warning";
    iconColor = colors.warning;
    IconComponent = Clock;
  } else if (isNoScheduleToday) {
    statusTitle = "No Classes Today";
    statusBadgeLabel = "No Schedule Today";
    badgeBg = "bg-light-warning/15 dark:bg-dark-warning/15 border-light-warning/30 dark:border-dark-warning/30";
    badgeText = "text-light-text dark:text-dark-warning";
    iconColor = colors.warning;
    IconComponent = Calendar;
  } else if (!isApproved) {
    statusTitle = "Entry Warning";
    statusBadgeLabel = "Entry Not Allowed";
    badgeBg = "bg-light-warning/15 dark:bg-dark-warning/15 border-light-warning/30 dark:border-dark-warning/30";
    badgeText = "text-light-text dark:text-dark-warning";
    iconColor = colors.warning;
    IconComponent = AlertTriangle;
  }

  const showConfirmExitButton =
    isParked &&
    result.hasRegisteredVehicle &&
    Boolean(result.vehicleQrCodeHash) &&
    typeof onConfirmVehicleExit === "function";

  const showConfirmVehicleButton =
    !isParked &&
    isApproved &&
    result.hasRegisteredVehicle &&
    Boolean(result.vehicleQrCodeHash) &&
    typeof onConfirmVehicleEntry === "function";

  const studentRows = [
    { label: "Student No.", value: result.studentNumber || "N/A", isHighlight: true },
    { label: "Full Name", value: result.fullName || "N/A" },
    { label: "Program", value: result.program || "N/A" },
    ...(result.yearLevel && result.section
      ? [{ label: "Year & Section", value: `Year ${result.yearLevel} - ${result.section}` }]
      : []),
  ];

  const scheduleRows = [
    {
      label: "Today's Schedule",
      value: result.todaySchedule || "None",
      isHighlight: isApproved,
    },
    ...(result.allowedEntryWindow
      ? [{ label: "Allowed Entry Window", value: result.allowedEntryWindow }]
      : []),
    { label: "COR Status", value: result.corStatus || "Not Submitted" },
  ];

  const vehicleRows = result.hasRegisteredVehicle
    ? [
        { label: "Plate Number", value: result.plateNumber || (result.vehicleType === "ElectricBike" || result.vehicleType === "E-Bike" ? "No Plate (E-Bike)" : "N/A"), isHighlight: true },
        { label: "Vehicle Brand", value: result.vehicleBrand || "N/A" },
        { label: "Vehicle Type", value: result.vehicleType || "Vehicle" },
        {
          label: "Current Status",
          value: isParked ? "Currently Parked (Ready to Exit)" : "Not Parked",
          valueColor: isParked ? colors.primary : undefined,
          isHighlight: isParked,
        },
      ]
    : [
        { label: "Vehicle Registered", value: "No (Pedestrian / Commuter)" },
        { label: "Entry Mode", value: "Pedestrian Walk-in" },
      ];

  const screenTitle = isParked ? "Student Exit Verification" : "Student Verification";

  return (
    <SubScreenLayout title={screenTitle} onBack={onBack ?? onScanAnother}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40, paddingTop: 16 }}
      >
        {/* Hero Status Card */}
        <View
          className={`bg-light-surface dark:bg-dark-surface p-5 rounded-3xl border ${
            isParked
              ? "border-light-primary/25 dark:border-dark-primary/30"
              : "border-light-border dark:border-dark-border"
          } items-center mb-4`}
        >
          <View
            className={`w-16 h-16 rounded-full items-center justify-center mb-3 ${
              isParked
                ? "bg-light-primary/10 dark:bg-dark-primary/15 border border-light-primary/25 dark:border-dark-primary/25"
                : "bg-light-background dark:bg-dark-background border border-light-border dark:border-dark-border"
            }`}
          >
            <IconComponent size={32} color={iconColor} strokeWidth={2.3} />
          </View>

          <Text className="font-bold text-lg text-center text-light-text dark:text-dark-text">
            {statusTitle}
          </Text>

          <Text className="font-regular text-[13px] leading-[18px] text-center mt-1 text-light-muted dark:text-dark-muted px-2">
            {result.statusMessage}
          </Text>

          {/* Badge */}
          <View className={`mt-3 px-3.5 py-1 rounded-full border ${badgeBg}`}>
            <Text className={`font-bold text-[11px] uppercase tracking-wider ${badgeText}`}>
              {statusBadgeLabel}
            </Text>
          </View>
        </View>

        <DriverVehiclePreview fullName={result.fullName} profilePictureUrl={result.profilePictureUrl} vehiclePictureUrl={result.vehiclePictureUrl}
          plateNumber={result.plateNumber} brand={result.vehicleBrand} vehicleType={result.vehicleType} />
        {/* Section Cards */}
        {isParked ? (
          <>
            {/* For exit flow: show Vehicle Exit Details first */}
            <SectionCard title="Vehicle Exit Details">
              {vehicleRows.map((row, idx) => (
                <DetailRow key={idx} {...row} />
              ))}
            </SectionCard>

            <SectionCard title="Student Information">
              {studentRows.map((row, idx) => (
                <DetailRow key={idx} {...row} />
              ))}
            </SectionCard>
          </>
        ) : (
          <>
            {/* For entry flow: show Student Info, Vehicle, Schedule */}
            <SectionCard title="Student Information">
              {studentRows.map((row, idx) => (
                <DetailRow key={idx} {...row} />
              ))}
            </SectionCard>

            <SectionCard title="Registered Vehicle">
              {vehicleRows.map((row, idx) => (
                <DetailRow key={idx} {...row} />
              ))}
            </SectionCard>

            <SectionCard title="Campus Schedule & COR">
              {scheduleRows.map((row, idx) => (
                <DetailRow key={idx} {...row} />
              ))}
            </SectionCard>
          </>
        )}

        {/* Security verification notice for exit */}
        {isParked && (
          <View className="flex-row items-center justify-center gap-1.5 mt-1 mb-3 px-4">
            <ShieldCheck size={15} color={colors.muted} strokeWidth={2} />
            <Text className="text-[12px] font-regular text-light-muted dark:text-dark-muted text-center">
              Verify student driver and plate number before confirming exit
            </Text>
          </View>
        )}

        {/* Action Buttons */}
        <View className="mt-2 gap-3">
          {showConfirmExitButton && (
            <AppButton
              label="Confirm Vehicle Exit"
              size="lg"
              loading={isConfirmingVehicle}
              icon={<LogOut size={18} color={colors.background} strokeWidth={2.2} />}
              onPress={onConfirmVehicleExit}
            />
          )}

          {showConfirmVehicleButton && (
            <AppButton
              label="Log Vehicle Entry"
              size="lg"
              loading={isConfirmingVehicle}
              onPress={onConfirmVehicleEntry}
            />
          )}

          <AppButton
            label="Scan Another QR Code"
            variant="outline"
            size="lg"
            onPress={onScanAnother}
          />
        </View>
      </ScrollView>
    </SubScreenLayout>
  );
}
