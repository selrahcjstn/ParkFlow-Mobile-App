import { Body, Caption, Title } from "@/components/ui/Typography";
import { getVehicleTypeLabel } from "@/constants/vehicleType";
import { getVehicleIcon } from "@/utils/getVehicleIcon";
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetScrollView,
} from "@gorhom/bottom-sheet";
import { Check, Search, X } from "lucide-react-native";
import React, { forwardRef, useMemo, useState } from "react";
import { Pressable, TextInput, TouchableOpacity, View } from "react-native";

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
    const snapPoints = useMemo(() => ["55%", "80%"], []);

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
        index={0}
        snapPoints={snapPoints}
        enableDynamicSizing={false}
        enablePanDownToClose
        onDismiss={onClose}
        handleIndicatorStyle={{ backgroundColor: "#D4D4D8", width: 36 }}
        backgroundStyle={{
          backgroundColor: "#F4F4F5",
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
        }}
        backdropComponent={(props) => (
          <BottomSheetBackdrop
            {...props}
            appearsOnIndex={0}
            disappearsOnIndex={-1}
          />
        )}
      >
        {/* ── Header ── */}
        <View className="px-5 pt-1 pb-4">
          <Title className="text-light-text font-black text-[18px]">
            Select Vehicle
          </Title>
          <Caption className="font-book text-[13px] mt-0.5">
            Choose a vehicle to display its QR code
          </Caption>
        </View>

        {/* ── Search ── */}
        <View className="px-5 mb-3">
          <View className="flex-row items-center bg-light-surface rounded-2xl px-4">
            <Search size={16} color="#71717A" strokeWidth={2} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search plate, brand, type..."
              placeholderTextColor="#A1A1AA"
              style={{
                flex: 1,
                fontFamily: "AvenirBook",
                fontSize: 14,
                color: "#18181B",
                paddingVertical: 12,
                paddingHorizontal: 10,
              }}
              returnKeyType="search"
              autoCorrect={false}
              autoCapitalize="characters"
            />
            {query.length > 0 && (
              <TouchableOpacity
                onPress={() => setQuery("")}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <X size={16} color="#A1A1AA" strokeWidth={2.5} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* ── Count ── */}
        <View className="px-5 mb-2">
          <Caption className="font-heavy text-[11px] uppercase tracking-widest">
            {filtered.length} {filtered.length === 1 ? "vehicle" : "vehicles"}
            {query.trim() ? " found" : ""}
          </Caption>
        </View>

        {/* ── Vehicle List ── */}
        <BottomSheetScrollView
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingBottom: 40,
          }}
        >
          {filtered.length === 0 ? (
            <View className="py-10 items-center">
              <View className="w-14 h-14 rounded-2xl bg-light-surface items-center justify-center mb-3">
                <Search size={24} color="#A1A1AA" strokeWidth={1.5} />
              </View>
              <Body className="text-light-text font-heavy text-[14px] mb-1">
                No vehicles found
              </Body>
              <Caption className="font-book text-[12px] text-center px-4">
                {query.trim()
                  ? `No vehicles match "${query}"`
                  : "You don't have any registered vehicles."}
              </Caption>
            </View>
          ) : (
            <View className="gap-2">
              {filtered.map((item: Vehicle) => {
                const typeLabel = getVehicleTypeLabel(item.vehicleType);
                const isSelected = selectedId === item.id;
                const iconColor = isSelected ? "#10B981" : "#71717A";

                return (
                  <Pressable
                    key={item.id}
                    onPress={() => onSelect(item)}
                    android_ripple={{ color: "#00000006" }}
                    className={`bg-light-surface rounded-2xl px-4 py-4 ${isSelected ? "border border-light-success/20" : ""}`}
                  >
                    <View className="flex-row items-center justify-between">
                      {/* Left: icon + info */}
                      <View className="flex-row items-center flex-1 pr-3">
                        <View className="w-10 h-10 rounded-xl bg-light-background items-center justify-center mr-3">
                          {getVehicleIcon(
                            item.vehicleType,
                            18,
                            iconColor,
                            2,
                          )}
                        </View>
                        <View className="flex-1">
                          <View className="flex-row items-center gap-2">
                            <Body className="text-light-text font-black text-[14px]">
                              {item.plateNumber || "Unknown"}
                            </Body>
                            {item.isPrimary && (
                              <Caption className="text-light-primary font-heavy text-[9px] uppercase tracking-wider">
                                Primary
                              </Caption>
                            )}
                          </View>
                          <Caption className="font-book text-[12px] mt-0.5">
                            {item.brand || "Unknown"} ·{" "}
                            {typeLabel || "Unknown"}
                          </Caption>
                        </View>
                      </View>

                      {/* Right: check */}
                      {isSelected && (
                        <View className="w-6 h-6 rounded-full bg-light-success/15 items-center justify-center">
                          <Check size={14} color="#10B981" strokeWidth={3} />
                        </View>
                      )}
                    </View>
                  </Pressable>
                );
              })}
            </View>
          )}
        </BottomSheetScrollView>
      </BottomSheetModal>
    );
  },
);

export default VehiclePickerSheet;