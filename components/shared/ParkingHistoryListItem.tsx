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
  const durationText = log.exitTime
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
          <Text className="font-heavy text-[16px] tracking-wide text-light-text">
            {title}
          </Text>
          {log.hasViolation && (
            <View className="bg-light-danger/10 px-2 py-0.5 rounded">
              <Text className="font-heavy text-light-danger text-[10px] uppercase tracking-wide">
                Violation
              </Text>
            </View>
          )}
        </View>
        <View className="flex-row items-center gap-2 mt-1">
          <Text className="font-regular text-[12px] text-light-muted">
            {log.brand || "Generic"}
          </Text>
        </View>
      </View>

      <View className="items-end">
        <Text
          className={`font-heavy text-[16px] leading-5 tracking-tight ${log.exitTime ? "text-light-text" : "text-light-primary"}`}
        >
          {durationText}
        </Text>
        <Text className="font-regular text-[12px] mt-1 text-light-muted">
          {exitTime || (isGuardSide ? log.roleName : "") || "Guest"}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

export default memo(ParkingHistoryListItem);

