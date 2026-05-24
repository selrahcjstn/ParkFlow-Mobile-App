import { Caption, Label } from "@/components/ui/Typography";
import { ParkingHistoryResponse } from "@/features/history/types/history.types";
import { formatTime } from "@/utils/formatTime";
import React from "react";
import { TouchableOpacity, View } from "react-native";

interface ParkingHistoryListItemProps {
  log: ParkingHistoryResponse;
  onPress: () => void;
  containerClassName?: string;
  isGuardSide?: boolean;
}

export default function ParkingHistoryListItem({
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
          <Label className="text-[16px] tracking-wide">{title}</Label>
          {log.hasViolation && (
            <View className="bg-light-danger/10 px-2 py-0.5 rounded">
              <Caption className="text-light-danger font-heavy text-[10px] uppercase tracking-wide">
                Violation
              </Caption>
            </View>
          )}
        </View>
        <View className="flex-row items-center gap-2 mt-1">
          <Caption className="text-[12px]">{log.brand || "Generic"}</Caption>
        </View>
      </View>

      <View className="items-end">
        <Label
          className={`text-[14px] ${log.exitTime ? "text-light-text" : "text-light-primary"}`}
        >
          {durationText}
        </Label>
        <Caption className="text-[12px] mt-1">
          {exitTime || (isGuardSide ? log.roleName : "") || "Guest"}
        </Caption>
      </View>
    </TouchableOpacity>
  );
}


