import React from "react";
import { View, Text, ScrollView } from "react-native";
import { CheckCircle, AlertTriangle, XCircle, Clock, Calendar, ShieldAlert } from "lucide-react-native";
import SubScreenLayout from "@/components/layouts/SubScreenLayout";
import SectionCard from "@/components/layouts/SectionCard";
import DetailRow from "@/components/layouts/DetailRow";
import { AppButton } from "@/components/ui";
import { useAppTheme } from "@/hooks/useAppTheme";
import type { StudentScanVerificationResponse } from "@/features/qr/types/qr-scan.types";

interface StudentScanResultCardProps {
  result: StudentScanVerificationResponse;
  onScanAnother: () => void;
  onConfirmVehicleEntry?: () => void;
  isConfirmingVehicle?: boolean;
}

export default function StudentScanResultCard({
  result,
  onScanAnother,
  onConfirmVehicleEntry,
  isConfirmingVehicle = false,
}: StudentScanResultCardProps) {
  const { colors, isDark } = useAppTheme();

  // Determine status presentation
  const isApproved = result.isValid && result.entryStatus === "Approved";
  const isNotFound = result.entryStatus === "NotFound";
  const isOutOfSchedule = result.entryStatus === "OutOfSchedule";
  const isNoScheduleToday = result.entryStatus === "NoScheduleToday";
  const isCorIssue = result.entryStatus === "CorNotVerified";

  let statusTitle = "Approved for Campus Entry";
  let statusBadgeLabel = "✅ Valid for Entry";
  let badgeBg = "bg-emerald-500/15 border-emerald-500/30";
  let badgeText = "text-emerald-600 dark:text-emerald-400";
  let iconColor = colors.success || "#10B981";
  let IconComponent = CheckCircle;

  if (isNotFound) {
    statusTitle = "Student Not Registered";
    statusBadgeLabel = "❌ Unregistered ID";
    badgeBg = "bg-rose-500/15 border-rose-500/30";
    badgeText = "text-rose-600 dark:text-rose-400";
    iconColor = colors.danger || "#EF4444";
    IconComponent = XCircle;
  } else if (isOutOfSchedule) {
    statusTitle = "Outside Schedule Window";
    statusBadgeLabel = "⚠️ Out of Schedule";
    badgeBg = "bg-amber-500/15 border-amber-500/30";
    badgeText = "text-amber-600 dark:text-amber-400";
    iconColor = colors.warning || "#F59E0B";
    IconComponent = Clock;
  } else if (isNoScheduleToday) {
    statusTitle = "No Classes Today";
    statusBadgeLabel = "⚠️ No Schedule Today";
    badgeBg = "bg-amber-500/15 border-amber-500/30";
    badgeText = "text-amber-600 dark:text-amber-400";
    iconColor = colors.warning || "#F59E0B";
    IconComponent = Calendar;
  } else if (isCorIssue) {
    statusTitle = "COR Verification Required";
    statusBadgeLabel = "⚠️ COR Not Verified";
    badgeBg = "bg-rose-500/15 border-rose-500/30";
    badgeText = "text-rose-600 dark:text-rose-400";
    iconColor = colors.danger || "#EF4444";
    IconComponent = ShieldAlert;
  } else if (!isApproved) {
    statusTitle = "Entry Warning";
    statusBadgeLabel = "⚠️ Entry Not Allowed";
    badgeBg = "bg-amber-500/15 border-amber-500/30";
    badgeText = "text-amber-600 dark:text-amber-400";
    iconColor = colors.warning || "#F59E0B";
    IconComponent = AlertTriangle;
  }

  const showConfirmVehicleButton =
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
    { label: "Today's Schedule", value: result.todaySchedule || "None", isHighlight: isApproved },
    ...(result.allowedEntryWindow
      ? [{ label: "Allowed Entry Window", value: result.allowedEntryWindow }]
      : []),
    { label: "COR Status", value: result.corStatus || "Not Submitted" },
  ];

  const vehicleRows = result.hasRegisteredVehicle
    ? [
        { label: "Plate Number", value: result.plateNumber || "N/A", isHighlight: true },
        { label: "Vehicle Brand", value: result.vehicleBrand || "N/A" },
        { label: "Vehicle Type", value: result.vehicleType || "Vehicle" },
        {
          label: "Current Status",
          value: result.isCurrentlyParked ? "Currently Parked" : "Not Parked",
          valueColor: result.isCurrentlyParked ? "#F59E0B" : undefined,
        },
        ...(result.hasActiveViolation
          ? [
              {
                label: "Violation",
                value: result.violationNotice || "Active Violation Recorded",
                valueColor: "#EF4444",
                isHighlight: true,
              },
            ]
          : []),
      ]
    : [
        { label: "Vehicle Registered", value: "No (Pedestrian / Commuter)" },
        { label: "Entry Mode", value: "Pedestrian Walk-in" },
      ];

  return (
    <SubScreenLayout title="Student Verification" onBack={onScanAnother}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40, paddingTop: 16 }}
      >
        {/* Hero Status Card */}
        <View className="bg-light-surface dark:bg-dark-surface p-5 rounded-3xl border border-light-border dark:border-dark-border items-center mb-5">
          <View className="w-16 h-16 rounded-full items-center justify-center mb-3 bg-light-background dark:bg-dark-background border border-light-border dark:border-dark-border">
            <IconComponent size={36} color={iconColor} strokeWidth={2.3} />
          </View>

          <Text className="font-heavy text-lg text-center text-light-text dark:text-dark-text">
            {statusTitle}
          </Text>

          <Text className="font-regular text-[13px] leading-[18px] text-center mt-1 text-light-muted dark:text-dark-muted px-2">
            {result.statusMessage}
          </Text>

          {/* Badge */}
          <View className={`mt-3 px-3.5 py-1 rounded-full border ${badgeBg}`}>
            <Text className={`font-heavy text-[11px] uppercase tracking-wider ${badgeText}`}>
              {statusBadgeLabel}
            </Text>
          </View>
        </View>

        {/* Student Details Card */}
        <SectionCard title="Student Information">
          {studentRows.map((row, idx) => (
            <DetailRow key={idx} {...row} />
          ))}
        </SectionCard>

        {/* Schedule Details Card */}
        <SectionCard title="Campus Schedule & COR">
          {scheduleRows.map((row, idx) => (
            <DetailRow key={idx} {...row} />
          ))}
        </SectionCard>

        {/* Vehicle Details Card */}
        <SectionCard title="Registered Vehicle">
          {vehicleRows.map((row, idx) => (
            <DetailRow key={idx} {...row} />
          ))}
        </SectionCard>

        {/* Action Buttons */}
        <View className="mt-2 gap-3">
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
