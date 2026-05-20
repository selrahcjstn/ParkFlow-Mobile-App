import AppInput from "@/components/ui/AppInput";
import { Body, Title } from "@/components/ui/Typography";
import { getVehicleTypeLabel } from "@/constants/vehicleType";
import {
    BottomSheetBackdrop,
    BottomSheetModal,
    BottomSheetScrollView,
} from "@gorhom/bottom-sheet";
import { Check } from "lucide-react-native";
import {
    forwardRef,
    useEffect,
    useMemo,
    useState,
    type ElementRef,
} from "react";
import { TouchableOpacity, View } from "react-native";

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

const VehiclePickerSheet = forwardRef<
  ElementRef<typeof BottomSheetModal>,
  VehiclePickerSheetProps
>(function VehiclePickerSheet(
  { vehicles, selectedId, onSelect, onClose },
  ref,
) {
  const [query, setQuery] = useState("");
  const snapPoints = useMemo(() => ["40%", "80%"], []);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return vehicles;
    return vehicles.filter((item) => {
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

  useEffect(() => {
    console.debug("VehiclePickerSheet mounted");
    return () => console.debug("VehiclePickerSheet unmounted");
  }, []);

  return (
    <BottomSheetModal
      ref={ref}
      index={0}
      snapPoints={snapPoints}
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
      <BottomSheetScrollView contentContainerStyle={{ paddingHorizontal: 20 }}>
        {filtered.length === 0 ? (
          <View className="py-8 items-center">
            <Body className="text-light-muted font-book text-sm">
              No vehicles found.
            </Body>
          </View>
        ) : (
          filtered.map((item) => {
            const typeLabel = getVehicleTypeLabel(item.vehicleType);
            const isSelected = selectedId === item.id;
            return (
              <TouchableOpacity
                key={item.id}
                onPress={() => {
                  console.debug("VehiclePicker: pressed", item.id);
                  try {
                    onSelect(item);
                  } catch (err) {
                    console.error("VehiclePicker: onSelect error", err);
                  }
                }}
                className="py-3 border-b border-light-border/60"
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
              </TouchableOpacity>
            );
          })
        )}
      </BottomSheetScrollView>
    </BottomSheetModal>
  );
});

export default VehiclePickerSheet;
