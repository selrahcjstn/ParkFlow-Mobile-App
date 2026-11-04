import React, { forwardRef } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { AppBottomSheet } from "@/components/shared";
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import { VehicleResponse } from "@/features/user/types/vehicle.types";
import { getVehicleTypeLabel } from "@/constants/vehicleType";

interface VehicleActionSheetProps {
  selectedVehicle: VehicleResponse | null;
  onMakePrimary: () => void;
  onEditClick: () => void;
  onRemove: () => void;
  onDismiss: () => void;
}

export const VehicleActionSheet = forwardRef<BottomSheetModal, VehicleActionSheetProps>(
  function VehicleActionSheet(
    { selectedVehicle, onMakePrimary, onEditClick, onRemove, onDismiss },
    ref,
  ) {
    return (
      <AppBottomSheet
        ref={ref}
        title={
          selectedVehicle?.plateNumber ||
          (selectedVehicle?.vehicleType === 1 ? "No Plate (E-Bike)" : "Vehicle Actions")
        }
        subtitle={
          selectedVehicle
            ? `${selectedVehicle.brand} (${getVehicleTypeLabel(selectedVehicle.vehicleType)})`
            : undefined
        }
        snapPoints={["40%"]}
        onDismiss={onDismiss}
      >
        <View className="px-1">
          <TouchableOpacity
            activeOpacity={selectedVehicle?.isPrimary ? 1 : 0.65}
            onPress={selectedVehicle?.isPrimary ? undefined : onMakePrimary}
            disabled={selectedVehicle?.isPrimary}
            className={`flex-row items-center px-3 py-4 rounded-xl ${
              selectedVehicle?.isPrimary ? "opacity-40" : ""
            }`}
          >
            <Text
              className={`font-bold text-[15px] flex-1 ${
                selectedVehicle?.isPrimary
                  ? "text-light-muted dark:text-dark-muted"
                  : "text-light-text dark:text-dark-text"
              }`}
            >
              Make Primary Vehicle
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.65}
            onPress={onEditClick}
            className="flex-row items-center px-3 py-4 rounded-xl"
          >
            <Text className="text-light-text dark:text-dark-text font-bold text-[15px] flex-1">
              Edit Vehicle
            </Text>
          </TouchableOpacity>

          <View className="h-px bg-light-border/40 dark:bg-dark-border/20 my-1 mx-3" />

          <TouchableOpacity
            activeOpacity={0.65}
            onPress={onRemove}
            className="flex-row items-center px-3 py-4 rounded-xl"
          >
            <Text className="text-light-text dark:text-dark-danger font-bold text-[15px] flex-1">
              Remove Vehicle
            </Text>
          </TouchableOpacity>
        </View>
      </AppBottomSheet>
    );
  },
);
