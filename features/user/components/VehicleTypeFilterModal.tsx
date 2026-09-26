import { VEHICLE_TYPE_OPTIONS } from "@/constants/vehicleType";
import { Check, X } from "lucide-react-native";
import { Modal, Pressable, Text, TouchableOpacity, View } from "react-native";

interface VehicleTypeFilterModalProps {
  visible: boolean;
  onClose: () => void;
  selectedVehicleType: string | null;
  onSelectVehicleType: (type: string | null) => void;
}

export default function VehicleTypeFilterModal({
  visible,
  onClose,
  selectedVehicleType,
  onSelectVehicleType,
}: VehicleTypeFilterModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <Pressable
        className="flex-1 bg-black/50 items-center justify-end px-4 pb-8"
        onPress={onClose}
      >
        <Pressable
          className="w-full bg-light-surface rounded-3xl overflow-hidden px-6 py-6"
          onPress={(e) => e.stopPropagation()}
        >
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-light-text font-bold text-[17px]">
              Filter by Vehicle Type
            </Text>
            <TouchableOpacity
              onPress={onClose}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              className="w-8 h-8 rounded-full bg-light-background items-center justify-center"
            >
              <X size={16} color="#71717A" strokeWidth={2.5} />
            </TouchableOpacity>
          </View>

          <View className="gap-2">
            <TouchableOpacity
              onPress={() => {
                onSelectVehicleType(null);
                onClose();
              }}
              className={`flex-row items-center justify-between px-4 py-3.5 rounded-2xl ${
                selectedVehicleType === null
                  ? "bg-light-success/10 border border-light-success/20"
                  : "bg-light-background"
              }`}
            >
              <Text
                className={`font-bold text-[14px] ${
                  selectedVehicleType === null ? "text-light-success" : "text-light-text"
                }`}
              >
                All Vehicles
              </Text>
              {selectedVehicleType === null && (
                <Check size={16} color="#10B981" strokeWidth={3} />
              )}
            </TouchableOpacity>

            {VEHICLE_TYPE_OPTIONS.map((type) => {
              const isSelected = selectedVehicleType === type.value;
              return (
                <TouchableOpacity
                  key={type.value}
                  onPress={() => {
                    onSelectVehicleType(type.value);
                    onClose();
                  }}
                  className={`flex-row items-center justify-between px-4 py-3.5 rounded-2xl ${
                    isSelected
                      ? "bg-light-success/10 border border-light-success/20"
                      : "bg-light-background"
                  }`}
                >
                  <Text
                    className={`font-bold text-[14px] ${
                      isSelected ? "text-light-success" : "text-light-text"
                    }`}
                  >
                    {type.label}
                  </Text>
                  {isSelected && (
                    <Check size={16} color="#10B981" strokeWidth={3} />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

