import { AppBottomSheet } from "@/components/shared";
import { VEHICLE_TYPE_OPTIONS } from "@/constants/vehicleType";
import { useAppTheme } from "@/hooks/useAppTheme";
import { getVehicleIcon } from "@/utils/getVehicleIcon";
import { Check, CircleHelp } from "lucide-react-native";
import React, { forwardRef } from "react";
import { Pressable, Text, View } from "react-native";

type VehicleTypeFilterSheetProps = {
  selectedVehicleType: string | null;
  onSelect: (type: string | null) => void;
  onClose?: () => void;
};

const VehicleTypeFilterSheet = forwardRef<any, VehicleTypeFilterSheetProps>(
  function VehicleTypeFilterSheet(
    props: VehicleTypeFilterSheetProps,
    ref: any,
  ) {
    const { colors } = useAppTheme();
    const { selectedVehicleType, onSelect, onClose } = props;

    return (
      <AppBottomSheet
        ref={ref}
        title="Filter Vehicles"
        subtitle="Select a vehicle type to filter sessions"
        onDismiss={onClose}
      >
        <View className="gap-2">
          <Pressable
            onPress={() => onSelect(null)}
            android_ripple={{ color: "#00000006" }}
            className={`bg-light-surface dark:bg-dark-surface rounded-2xl px-4 py-4 ${
              selectedVehicleType === null
                ? "border border-light-primary/20 dark:border-dark-primary/20"
                : ""
            }`}
          >
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center flex-1 pr-3">
                <View className="w-10 h-10 rounded-xl bg-light-background dark:bg-dark-background items-center justify-center mr-3">
                  <CircleHelp
                    size={18}
                    color={selectedVehicleType === null ? colors.primary : colors.muted}
                    strokeWidth={2}
                  />
                </View>
                <View className="flex-1">
                  <Text
                    className={`font-bold text-[14px] ${
                      selectedVehicleType === null
                        ? "text-light-primary dark:text-dark-primary"
                        : "text-light-text dark:text-dark-text"
                    }`}
                  >
                    All Vehicles
                  </Text>
                </View>
              </View>

              {selectedVehicleType === null && (
                <View className="w-6 h-6 rounded-full bg-light-primary/15 dark:bg-dark-primary/15 items-center justify-center">
                  <Check size={14} color="#10B981" strokeWidth={3} />
                </View>
              )}
            </View>
          </Pressable>

          {VEHICLE_TYPE_OPTIONS.map((type) => {
            const isSelected = selectedVehicleType === type.value;
            const iconColor = isSelected ? "#10B981" : "#71717A";

            return (
              <Pressable
                key={type.value}
                onPress={() => onSelect(type.value)}
                android_ripple={{ color: "#00000006" }}
                className={`bg-light-surface dark:bg-dark-surface rounded-2xl px-4 py-4 ${
                  isSelected ? "border border-light-primary/20 dark:border-dark-primary/20" : ""
                }`}
              >
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center flex-1 pr-3">
                    <View className="w-10 h-10 rounded-xl bg-light-background dark:bg-dark-background items-center justify-center mr-3">
                      {getVehicleIcon(type.value, 18, iconColor, 2)}
                    </View>
                    <View className="flex-1">
                      <Text
                        className={`font-bold text-[14px] ${
                          isSelected
                            ? "text-light-primary dark:text-dark-primary"
                            : "text-light-text dark:text-dark-text"
                        }`}
                      >
                        {type.label}
                      </Text>
                    </View>
                  </View>

                  {isSelected && (
                    <View className="w-6 h-6 rounded-full bg-light-primary/15 dark:bg-dark-primary/15 items-center justify-center">
                      <Check size={14} color={colors.primary} strokeWidth={3} />
                    </View>
                  )}
                </View>
              </Pressable>
            );
          })}
        </View>
      </AppBottomSheet>
    );
  },
);

export default VehicleTypeFilterSheet;
