import { ParkingHistoryResponse } from "@/features/history/types/history.types";
import { formatTime } from "@/utils/formatTime";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";

interface ParkingHistoryListItemProps {
  log: ParkingHistoryResponse;
  onPress: () => void;
}

export default function ParkingHistoryListItem({
  log,
  onPress,
}: ParkingHistoryListItemProps) {
  const entryTime = log.entryTime ? formatTime(log.entryTime) : "N/A";
  const exitTime = log.exitTime ? formatTime(log.exitTime) : "";
  const title = log.plateNumber || "N/A";
  const durationText = log.exitTime
    ? `${log.parkingDuration.toFixed(1)} ${log.parkingDuration === 1 ? "hr" : "hrs"}`
    : "Active";

  return (
    <TouchableOpacity
      activeOpacity={0.6}
      onPress={onPress}
      className="flex-row items-center justify-between py-4 px-4 bg-light-surface"
    >
      <View className="flex-1 pr-4 ">
        <View className="flex-row items-center gap-2">
          <Text className="text-light-text font-black text-[16px] tracking-wide">
            {title}
          </Text>
          {log.hasViolation && (
            <View className="bg-light-danger/10 px-2 py-0.5 rounded">
              <Text className="text-light-danger font-heavy text-[10px] uppercase tracking-wide">
                Violation
              </Text>
            </View>
          )}
        </View>
        <View className="flex-row items-center gap-2 mt-1">
          <Text className="text-light-muted font-book text-[13px]">
            {log.brand || "Generic"}
          </Text>
        </View>
      </View>

      <View className="items-end">
        <Text
          className={`font-black text-[14px] ${log.exitTime ? "text-light-text" : "text-light-primary"}`}
        >
          {durationText}
        </Text>
        <Text className="text-light-muted font-book text-[12px] mt-1">
          {exitTime || log.roleName || "Guest"}
        </Text>
      </View>
    </TouchableOpacity>
  );
}
