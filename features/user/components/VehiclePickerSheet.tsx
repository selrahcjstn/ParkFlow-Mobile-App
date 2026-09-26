import { AppBottomSheet } from "@/components/shared";
import { getVehicleTypeLabel } from "@/constants/vehicleType";
import { useAppTheme } from "@/hooks/useAppTheme";
import { getVehicleIcon } from "@/utils/getVehicleIcon";
import { BottomSheetScrollView } from "@gorhom/bottom-sheet";
import { Check, CircleParking, Search, X } from "lucide-react-native";
import React, { forwardRef, useMemo, useState } from "react";
import { Pressable, Text, TextInput, TouchableOpacity, View } from "react-native";

type Vehicle = {
  id: string;
  plateNumber: string;
  brand: string;
  qrCodeHash: string;
  isPrimary?: boolean;
  vehicleType?: number | string;
  status?: string;
};

type VehiclePickerSheetProps = {
  vehicles: Vehicle[];
  selectedId?: string;
  onSelect: (vehicle: Vehicle) => void;
  onClose: () => void;
};

const VehiclePickerSheet = forwardRef<any, VehiclePickerSheetProps>(
  function VehiclePickerSheet(props: VehiclePickerSheetProps, ref: any) {
    const { colors, isDark } = useAppTheme();
    const { vehicles, selectedId, onSelect, onClose } = props;
    const [query, setQuery] = useState("");
    const snapPoints = useMemo(() => ["60%", "85%"], []);

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

    const parkedCount = useMemo(
      () => vehicles.filter((v) => v.status === "Parked").length,
      [vehicles],
    );

    return (
      <AppBottomSheet
        ref={ref}
        title="Select Vehicle"
        subtitle="Choose a vehicle to display its QR code"
        onDismiss={onClose}
        scrollable={false}
      >
        <View className="px-5 mb-3">
          <View className="flex-row items-center bg-light-surface dark:bg-dark-surfaceLighter rounded-2xl px-4 border border-light-border/40 dark:border-dark-border/40">
            <Search size={16} color={colors.muted} strokeWidth={2} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search plate, brand, type..."
              placeholderTextColor={isDark ? "#71717A" : "#A1A1AA"}
              style={{
                flex: 1,
                fontFamily: "Inter-Regular",
                fontSize: 14,
                color: colors.text,
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
                <X size={16} color={colors.muted} strokeWidth={2.5} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        <View className="flex-row items-center justify-between px-5 mb-3">
          <Text className="text-light-muted dark:text-dark-muted font-bold text-[11px] uppercase tracking-widest">
            {filtered.length} {filtered.length === 1 ? "vehicle" : "vehicles"}
            {query.trim() ? " found" : ""}
          </Text>
          {parkedCount > 0 && (
            <View className="flex-row items-center gap-1.5">
              <CircleParking size={12} color={colors.warning} strokeWidth={2.5} />
              <Text className="text-light-warning dark:text-dark-warning font-bold text-[11px] uppercase tracking-widest">
                {parkedCount} Parked
              </Text>
            </View>
          )}
        </View>

        <BottomSheetScrollView
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingBottom: 40,
          }}
        >
          {filtered.length === 0 ? (
            <View className="py-10 items-center">
              <View className="w-14 h-14 rounded-2xl bg-light-surface dark:bg-dark-surface items-center justify-center mb-3">
                <Search size={24} color={isDark ? "#B5BAC1" : "#A1A1AA"} strokeWidth={1.5} />
              </View>
              <Text className="text-light-text dark:text-dark-text font-bold text-[14px] mb-1">
                No vehicles found
              </Text>
              <Text className="text-light-muted dark:text-dark-muted font-light text-[12px] text-center px-4">
                {query.trim()
                  ? `No vehicles match "${query}"`
                  : "You don't have any registered vehicles."}
              </Text>
            </View>
          ) : (
            <View className="gap-2">
              {filtered.map((item: Vehicle) => {
                const typeLabel = getVehicleTypeLabel(item.vehicleType);
                const isSelected = selectedId === item.id;
                const isParked = item.status === "Parked";
                const iconColor = isSelected ? colors.success : colors.muted;

                return (
                  <Pressable
                    key={item.id}
                    onPress={() => onSelect(item)}
                    android_ripple={{ color: "#00000006" }}
                    className={`rounded-2xl px-4 py-4 border ${
                      isSelected
                        ? "border-light-success dark:border-dark-success bg-light-success/5 dark:bg-dark-success/10"
                        : "border-light-border/40 dark:border-dark-border/40 bg-light-surface dark:bg-dark-surface"
                    }`}
                  >
                    <View className="flex-row items-center justify-between">
                      <View className="flex-row items-center flex-1 pr-3">
                        <View className="w-10 h-10 rounded-xl bg-light-background dark:bg-dark-background items-center justify-center mr-3">
                          {getVehicleIcon(
                            item.vehicleType,
                            18,
                            iconColor,
                            2,
                          )}
                        </View>
                        <View className="flex-1">
                          <View className="flex-row items-center gap-2">
                            <Text className="text-light-text dark:text-dark-text font-bold text-[14px]">
                              {item.plateNumber || "Unknown"}
                            </Text>
                            {item.isPrimary && (
                              <Text className="text-light-primary dark:text-dark-primary font-bold text-[9px] uppercase tracking-wider">
                                Primary
                              </Text>
                            )}
                          </View>
                          <Text className="text-light-muted dark:text-dark-muted font-light text-[12px] mt-0.5">
                            {item.brand || "Unknown"} ·{" "}
                            {typeLabel || "Unknown"}
                          </Text>
                        </View>
                      </View>

                      <View className="flex-row items-center gap-2">
                        {isParked && (
                          <View className="bg-light-warning/10 dark:bg-dark-warning/10 px-2 py-1 rounded-lg border border-light-warning/20 dark:border-dark-warning/20">
                            <Text className="text-light-warning dark:text-dark-warning font-bold text-[9px] uppercase tracking-wider">
                              Parked
                            </Text>
                          </View>
                        )}

                        {isSelected && (
                          <View className="w-6 h-6 rounded-full bg-light-success/15 dark:bg-dark-success/20 items-center justify-center">
                            <Check size={14} color={colors.success} strokeWidth={3} />
                          </View>
                        )}
                      </View>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          )}
        </BottomSheetScrollView>
      </AppBottomSheet>
    );
  },
);

export default VehiclePickerSheet;
