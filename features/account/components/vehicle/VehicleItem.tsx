import React from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { MoreHorizontal } from "lucide-react-native";
import { VehicleResponse } from "@/features/user/types/vehicle.types";
import { getVehicleTypeLabel } from "@/constants/vehicleType";

interface VehicleItemProps {
  item: VehicleResponse;
  onPressMenu: () => void;
}

export function VehicleItem({ item, onPressMenu }: VehicleItemProps) {
  const isParked = item.status === "Parked";
  const isExited = item.status === "Exited";

  return (
    <TouchableOpacity
      activeOpacity={0.75}
      onPress={onPressMenu}
      className="mb-3 rounded-card overflow-hidden border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface"
    >
      <View className="p-5">
        <View className="flex-row items-start justify-between mb-3">
          <View className="flex-row items-center gap-3 flex-1">
            <View className="flex-1">
              <View className="flex-row items-center gap-2 flex-wrap">
                <Text className="text-[22px] font-bold text-light-text dark:text-dark-text tracking-widest">
                  {item.plateNumber}
                </Text>
                {item.isPrimary && (
                  <View className="bg-light-primary/10 dark:bg-dark-primary/22 px-2 py-0.5 rounded-md">
                    <Text className="text-light-primary dark:text-dark-primary font-bold text-[9px] uppercase tracking-wider">
                      Primary
                    </Text>
                  </View>
                )}
                {item.verificationStatus === 1 && (
                  <View className="bg-amber-500/10 dark:bg-amber-500/20 px-2 py-0.5 rounded-md border border-amber-500/30">
                    <Text className="text-amber-600 dark:text-amber-400 font-bold text-[9px] uppercase tracking-wider">
                      Pending Verification
                    </Text>
                  </View>
                )}
                {item.verificationStatus === 2 && (
                  <View className="bg-emerald-500/10 dark:bg-emerald-500/20 px-2 py-0.5 rounded-md border border-emerald-500/30">
                    <Text className="text-emerald-600 dark:text-emerald-400 font-bold text-[9px] uppercase tracking-wider">
                      Verified
                    </Text>
                  </View>
                )}
                {item.verificationStatus === 3 && (
                  <View className="bg-red-500/10 dark:bg-red-500/20 px-2 py-0.5 rounded-md border border-red-500/30">
                    <Text className="text-red-600 dark:text-red-400 font-bold text-[9px] uppercase tracking-wider">
                      Rejected
                    </Text>
                  </View>
                )}
              </View>
              <Text className="font-book text-[13px] text-light-muted dark:text-dark-muted mt-0.5">
                {item.brand}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            onPress={onPressMenu}
            className="w-8 h-8 items-center justify-center rounded-button bg-light-background dark:bg-dark-background -mt-0.5 border border-light-border dark:border-dark-border"
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <MoreHorizontal size={16} color="#71717A" strokeWidth={2} />
          </TouchableOpacity>
        </View>

        {item.verificationStatus === 3 && item.rejectionReason ? (
          <View className="mb-3 p-2.5 rounded-lg bg-red-500/10 dark:bg-red-500/15 border border-red-500/20">
            <Text className="text-[11px] text-red-600 dark:text-red-400 leading-snug">
              <Text className="font-bold">Rejection Reason: </Text>
              {item.rejectionReason}
            </Text>
          </View>
        ) : null}

        <View className="h-px bg-light-border dark:bg-dark-border mb-3" />

        <View className="flex-row items-center justify-between">
          <View className="bg-light-background dark:bg-dark-background px-3 py-1 rounded-lg border border-light-border dark:border-dark-border">
            <Text className="text-[11px] font-bold text-light-muted dark:text-dark-muted uppercase tracking-wider">
              {getVehicleTypeLabel(item.vehicleType)}
            </Text>
          </View>

          <View
            className={`flex-row items-center gap-1.5 px-3 py-1 rounded-lg border ${
              isParked
                ? "bg-light-warning/10 dark:bg-dark-warning/10 border-light-warning/20"
                : isExited
                  ? "bg-light-surfaceMuted/40 dark:bg-dark-surfaceMuted/20 border-light-border dark:border-dark-border"
                  : "bg-light-success/10 dark:bg-dark-success/10 border-light-success/20"
            }`}
          >
            {!isExited && (
              <View
                className={`w-1.5 h-1.5 rounded-full ${
                  isParked
                    ? "bg-light-warning dark:bg-dark-warning"
                    : "bg-light-success dark:bg-dark-success"
                }`}
              />
            )}
            <Text
              className={`font-bold text-[11px] uppercase tracking-wider ${
                isParked
                  ? "text-light-warning dark:text-dark-warning"
                  : isExited
                    ? "text-light-muted dark:text-dark-muted"
                    : "text-light-success dark:text-dark-success"
              }`}
            >
              {item.status === "Exited" ? "Not Parked" : item.status}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}
