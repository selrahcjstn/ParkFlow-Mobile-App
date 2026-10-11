import { ParkingHistoryResponse } from "@/features/history/types/history.types";
import { formatTime } from "@/utils/formatTime";
import React, { memo } from "react";
import { Text, TouchableOpacity, View } from "react-native";

interface ParkingHistoryListItemProps {
  log: ParkingHistoryResponse;
  onPress: () => void;
  containerClassName?: string;
  isGuardSide?: boolean;
}

function ParkingHistoryListItem({
  log,
  onPress,
  containerClassName = "bg-light-surface px-4 rounded-2xl",
  isGuardSide = false,
}: ParkingHistoryListItemProps) {
  const exitTime = log.exitTime ? formatTime(log.exitTime) : "";
  const title = log.plateNumber || "N/A";
  const durationText =
    log.exitTime && log.parkingDuration != null
      ? `${log.parkingDuration.toFixed(1)} ${log.parkingDuration === 1 ? "hr" : "hrs"}`
      : "Active";

  return (
    <TouchableOpacity
      activeOpacity={0.6}
      onPress={onPress}
      className={`flex-row items-center justify-between py-4 ${containerClassName}`}
    >
      <View className="flex-1 pr-4 ">
        <View className="flex-row items-center gap-2">
          <Text className="font-bold text-[15px] tracking-wide text-light-text dark:text-dark-text">
            {title}
          </Text>
          {log.hasViolation && (
            <View
              className={`px-2.5 py-0.5 rounded-full border ${
                log.isPaid
                  ? "bg-light-success/10 dark:bg-dark-success/10 border-light-success/30 dark:border-dark-success/30"
                  : "bg-light-danger/15 dark:bg-dark-danger/15 border-light-danger/40 dark:border-dark-danger/40"
              }`}
            >
              <Text
                className={`font-bold text-[10px] uppercase tracking-wider ${
                  log.isPaid
                    ? "text-light-text dark:text-dark-success"
                    : "text-light-text dark:text-dark-danger"
                }`}
              >
                {log.isPaid ? "PAID" : "UNPAID"} (₱{(log.violationFee ?? 100).toFixed(2)})
              </Text>
            </View>
          )}
        </View>
        <View className="flex-row items-center gap-2 mt-1">
          <Text className="font-regular text-[12px] text-light-muted dark:text-dark-muted">
            {log.brand || "Generic"}
          </Text>
        </View>
      </View>

      <View className="items-end">
        <Text
          className={`font-bold text-[15px] leading-5 tracking-tight ${log.exitTime ? "text-light-text dark:text-dark-text" : "text-light-primary dark:text-dark-primary"}`}
        >
          {durationText}
        </Text>
        <Text className="font-regular text-[12px] mt-1 text-light-muted dark:text-dark-muted">
          {exitTime || (isGuardSide ? log.roleName : "") || "Guest"}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

export default memo(ParkingHistoryListItem);
