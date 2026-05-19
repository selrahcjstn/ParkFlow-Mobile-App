import AppInput from "@/components/ui/AppInput";
import { Body, Title } from "@/components/ui/Typography";
import { getVehicleTypeLabel } from "@/constants/vehicleType";
import {
    BottomSheetBackdrop,
    BottomSheetModal,
    BottomSheetScrollView,
} from "@gorhom/bottom-sheet";
import { Check } from "lucide-react-native";
import React, { forwardRef, useMemo, useState } from "react";
import { Pressable, View } from "react-native";

type Vehicle = {
  id: string;
  plateNumber: string;
  brand: string;
  qrCodeHash: string;
  isPrimary?: boolean;
  vehicleType?: number | string;
};

type VehiclePickerSheetProps = {
  vehicles: Vehicle[];
  selectedId?: string;
  onSelect: (vehicle: Vehicle) => void;
  onClose: () => void;
};

const VehiclePickerSheet = forwardRef<any, VehiclePickerSheetProps>(
  function VehiclePickerSheet(props: VehiclePickerSheetProps, ref: any) {
    const { vehicles, selectedId, onSelect, onClose } = props;
    const [query, setQuery] = useState("");
    // open full (index 0) and allow smaller 80% as second snap
    const snapPoints = useMemo(() => ["60%", "75%"], []);

    const filtered = useMemo(() => {
      const normalized = query.trim().toLowerCase();
      if (!normalized) return vehicles;
      return vehicles.filter((item: Vehicle) => {
        const plate = item.plateNumber?.toLowerCase() ?? "";
        const brand = item.brand?.toLowerCase() ?? "";
        const typeLabel =
          getVehicleTypeLabel(item.vehicleType)?.toLowerCase() ?? "";
        return (
          plate.includes(normalized) ||
          brand.includes(normalized) ||
          typeLabel.includes(normalized)
        );
      });
    }, [query, vehicles]);

    return (
      <BottomSheetModal
        ref={ref}
        index={1}
        snapPoints={snapPoints}
        enableDynamicSizing={false}
        enablePanDownToClose
        onDismiss={onClose}
        backdropComponent={(props) => (
          <BottomSheetBackdrop
            {...props}
            appearsOnIndex={0}
            disappearsOnIndex={-1}
          />
        )}
      >
        <View className="px-5 pt-2">
          <Title className="text-light-text font-black text-lg">
            Choose vehicle
          </Title>
          <Body className="text-light-muted font-book text-xs mt-1">
            Tap a vehicle to switch the QR code.
          </Body>
        </View>
        <View className="px-5 mt-4">
          <AppInput
            placeholder="Search plate, brand, or type"
            value={query}
            onChangeText={setQuery}
            className="text-sm"
          />
        </View>
        <BottomSheetScrollView
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingBottom: 32,
          }}
        >
          {filtered.length === 0 ? (
            <View className="py-8 items-center">
              <Body className="text-light-muted font-book text-sm">
                No vehicles found.
              </Body>
            </View>
          ) : (
            filtered.map((item: Vehicle) => {
              const typeLabel = getVehicleTypeLabel(item.vehicleType);
              const isSelected = selectedId === item.id;
              return (
                <Pressable
                  key={item.id}
                  onPress={() => onSelect(item)}
                  className="py-3 border-b border-light-border/60"
                  android_ripple={{ color: "#00000006" }}
                >
                  <View className="flex-row items-center justify-between">
                    <View>
                      <Body className="text-light-text font-heavy text-sm">
                        {item.plateNumber || "Unknown"}
                      </Body>
                      <Body className="text-light-muted font-book text-xs mt-0.5">
                        {(item.brand || "Unknown") +
                          " - " +
                          (typeLabel || "Unknown")}
                      </Body>
                    </View>
                    {isSelected ? (
                      <Check size={18} color="#10B981" strokeWidth={3} />
                    ) : null}
                  </View>
                </Pressable>
              );
            })
          )}
        </BottomSheetScrollView>
      </BottomSheetModal>
    );
  },
);

export default VehiclePickerSheet;
