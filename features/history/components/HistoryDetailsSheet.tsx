import { AppBottomSheet } from "@/components/shared";
import { useAuthStore } from "@/features/auth/store/auth.store";
import { ParkingHistoryResponse } from "@/features/history/types/history.types";
import { formatDate } from "@/utils/formatDate";
import { formatTime } from "@/utils/formatTime";
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import React, { forwardRef, useEffect, useState } from "react";
import { Text, View } from "react-native";

interface InfoRowProps {
  label: string;
  value: string;
  valueColor?: string;
  isLast?: boolean;
}

function InfoRow({
  label,
  value,
  valueColor = "text-light-text dark:text-dark-text",
  isLast,
}: InfoRowProps) {
  return (
    <View
      className={`flex-row justify-between items-center py-3.5 ${
        !isLast
          ? "border-b border-light-border/40 dark:border-dark-border"
          : ""
      }`}
    >
      <Text className="text-[13px] font-regular text-light-muted dark:text-dark-muted">
        {label}
      </Text>
      <Text className={`text-[13px] font-bold ${valueColor}`}>{value}</Text>
    </View>
  );
}

interface HistoryDetailsSheetProps {
  log: ParkingHistoryResponse | null;
  isGuardSide?: boolean;
  onClose: () => void;
}

const HistoryDetailsSheet = forwardRef<
  BottomSheetModal,
  HistoryDetailsSheetProps
>(function HistoryDetailsSheet(
  { log, isGuardSide = false, onClose },
  ref,
) {
  const { user } = useAuthStore();
  const isGuardUser = isGuardSide || user?.profileType === "guard";
  const [cachedLog, setCachedLog] = useState<ParkingHistoryResponse | null>(null);

  useEffect(() => {
    if (log) setCachedLog(log);
  }, [log]);
  const activeLog = log || cachedLog;

  const entryTime = activeLog?.entryTime ? formatTime(activeLog.entryTime) : "N/A";
  const entryDate = activeLog?.entryTime ? formatDate(activeLog.entryTime) : "N/A";
  const exitTime = activeLog?.exitTime ? formatTime(activeLog.exitTime) : "—";
  const exitDate = activeLog?.exitTime ? formatDate(activeLog.exitTime) : "";
  const plateNumber = activeLog?.plateNumber || "N/A";
  const fullName =
    `${activeLog?.firstName ?? ""} ${activeLog?.lastName ?? ""}`.trim() || "N/A";
  const durationText =
    activeLog?.exitTime && activeLog.parkingDuration != null
      ? `${activeLog.parkingDuration.toFixed(1)} ${activeLog.parkingDuration === 1 ? "hour" : "hours"}`
      : "Active";

  return (
    <AppBottomSheet
      ref={ref}
      title="Parking Session"
      subtitle="View details of your recorded parking session"
      onDismiss={onClose}
    >
      {activeLog && (
        <View className="w-full bg-light-surfaceMuted dark:bg-dark-surfaceMuted rounded-card py-5 items-center mb-6 border border-light-border/40 dark:border-dark-border">
          <Text className="font-regular uppercase tracking-wider text-[12px] mb-0.5 text-light-muted dark:text-dark-muted">
            Plate Number
          </Text>
          <Text className="text-[26px] font-bold tracking-wider text-light-text dark:text-dark-text">
            {plateNumber}
          </Text>
        </View>
      )}


      <View className="mb-6">
        <Text className="text-[14px] font-bold text-light-text dark:text-dark-text mb-1">
          Details
        </Text>
        <View className="px-1">
          {activeLog && (
            <>
              {isGuardUser && <InfoRow label="Name" value={fullName} />}
              {isGuardUser && (
                <InfoRow label="Role" value={activeLog.roleName || "N/A"} />
              )}
              <InfoRow label="Vehicle" value={`${activeLog.brand} (${activeLog.type})`} />
              <InfoRow label="Entry" value={`${entryTime} · ${entryDate}`} />
              <InfoRow
                label="Exit"
                value={`${exitTime} ${exitDate ? `· ${exitDate}` : ""}`}
              />
              <InfoRow label="Duration" value={durationText} />
              <InfoRow label="Amount" value={`₱${Number(activeLog.amount ?? activeLog.penaltyFee ?? 0).toFixed(2)}`} />
              <InfoRow label="Payment" value={Number(activeLog.amount ?? activeLog.penaltyFee ?? 0) > 0 ? activeLog.isPaid === false ? 'Pending' : 'Paid' : 'No payment due'} />
              {(activeLog.overstayHours ?? 0) > 0 && (
                <InfoRow label="Overstay Hours" value={`${activeLog.overstayHours?.toFixed(1)} hours`} />
              )}
            </>
          )}

        </View>
      </View>
    </AppBottomSheet>
  );
});

export default HistoryDetailsSheet;
