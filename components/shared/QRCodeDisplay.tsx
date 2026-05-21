import { Body, Caption, Title } from "@/components/ui/Typography";
import { getVehicleTypeLabel } from "@/constants/vehicleType";
import { getVehicleIcon } from "@/utils/getVehicleIcon";
import { ChevronDown, QrCode } from "lucide-react-native";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  TouchableOpacity,
  View,
} from "react-native";
import QRCodeSvg from "react-native-qrcode-svg";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

interface Vehicle {
  id: string;
  plateNumber: string;
  brand: string;
  qrCodeHash: string;
  isPrimary?: boolean;
  vehicleType?: number | string;
}

interface QRCodeDisplayProps {
  vehicles?: Vehicle[];
  vehicle?: Vehicle | null;
  isLoading?: boolean;
  hasHydrated?: boolean;
  selectedVehicleId?: string;
  onOpenPicker?: () => void;
}

export default function QRCodeDisplay({
  vehicles,
  vehicle,
  isLoading = false,
  hasHydrated = false,
  selectedVehicleId,
  onOpenPicker,
}: QRCodeDisplayProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [containerWidth, setContainerWidth] = useState(SCREEN_WIDTH);

  const displayList = useMemo<Vehicle[]>(() => {
    const list = vehicles?.length ? vehicles : vehicle ? [vehicle] : [];
    return list;
  }, [vehicles, vehicle]);

  const openPicker = () => {
    if (displayList.length === 0) return;
    onOpenPicker?.();
  };

  // Auto-select: when vehicles load and nothing is selected, select first (or primary)
  useEffect(() => {
    if (displayList.length === 0) return;
    if (selectedVehicleId) return; // already selected

    const primary = displayList.find((v) => v.isPrimary);
    const autoSelect = primary ?? displayList[0];
    const idx = displayList.indexOf(autoSelect);
    if (idx >= 0) setActiveIndex(idx);
  }, [displayList, selectedVehicleId]);

  // Sync activeIndex when selectedVehicleId changes from picker
  useEffect(() => {
    if (!selectedVehicleId) return;
    const matchIndex = displayList.findIndex(
      (item) => item.id === selectedVehicleId,
    );
    if (matchIndex >= 0 && matchIndex !== activeIndex) {
      setActiveIndex(matchIndex);
    }
  }, [selectedVehicleId, displayList, activeIndex]);

  // Bounds guard
  useEffect(() => {
    if (displayList.length === 0) return;
    if (activeIndex >= displayList.length) {
      setActiveIndex(0);
    }
  }, [displayList, activeIndex]);

  if (displayList.length === 0 && !isLoading) return null;

  const activeItem =
    displayList[Math.min(activeIndex, displayList.length - 1)];
  const typeLabel = activeItem
    ? getVehicleTypeLabel(activeItem.vehicleType)
    : "";

  return (
    <View
      className="mt-4"
      onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width)}
    >
      {activeItem ? (
        <View className="bg-light-surface rounded-3xl overflow-hidden">
          {/* ── Vehicle info header ── */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={openPicker}
            className="flex-row items-center justify-between px-5 pt-5 pb-4"
          >
            <View className="flex-row items-center flex-1">
              <View className="w-10 h-10 rounded-xl bg-light-background items-center justify-center mr-3">
                {getVehicleIcon(activeItem.vehicleType, 20, "#71717A", 1.8)}
              </View>
              <View className="flex-1">
                <View className="flex-row items-center gap-2">
                  <Title
                    className="text-light-text font-black text-[16px]"
                    numberOfLines={1}
                  >
                    {activeItem.plateNumber ?? "———"}
                  </Title>
                  {activeItem.isPrimary && (
                    <Caption className="text-light-primary font-heavy text-[9px] uppercase tracking-wider">
                      Primary
                    </Caption>
                  )}
                </View>
                <Caption className="font-book text-[12px] mt-0.5">
                  {activeItem.brand ?? "Unknown"} · {typeLabel}
                </Caption>
              </View>
            </View>

            {displayList.length > 1 && (
              <View className="flex-row items-center gap-1 ml-2">
                <Caption className="text-light-primary font-heavy text-[12px]">
                  Switch
                </Caption>
                <ChevronDown size={14} color="#D22730" strokeWidth={2.5} />
              </View>
            )}
          </TouchableOpacity>

          {/* ── Divider ── */}
          <View className="h-[1px] bg-light-border/40 mx-5" />

          {/* ── QR Code area ── */}
          <View className="items-center pt-7 pb-5 px-6">
            {isLoading && !activeItem.qrCodeHash ? (
              <View className="w-[190px] h-[190px] rounded-2xl bg-light-background items-center justify-center">
                <ActivityIndicator size="large" color="#D22730" />
              </View>
            ) : activeItem.qrCodeHash ? (
              <View className="bg-white p-4 rounded-2xl">
                <QRCodeSvg value={activeItem.qrCodeHash} size={175} />
              </View>
            ) : (
              <View className="w-[190px] h-[190px] rounded-2xl bg-light-background items-center justify-center">
                <QrCode size={48} color="#D4D4D8" strokeWidth={1.2} />
                {hasHydrated && !isLoading && !activeItem.qrCodeHash ? (
                  <Caption className="font-heavy text-[11px] mt-3">
                    QR Code Unavailable
                  </Caption>
                ) : null}
              </View>
            )}
          </View>

          {/* ── Footer instruction ── */}
          <View className="bg-light-background/50 rounded-b-3xl px-5 py-3.5">
            <View className="flex-row items-center justify-center gap-2">
              <View className="w-1.5 h-1.5 rounded-full bg-light-success" />
              <Caption className="font-book text-[12px] text-center">
                Present this code at the parking terminal
              </Caption>
            </View>
          </View>
        </View>
      ) : null}
    </View>
  );
}
