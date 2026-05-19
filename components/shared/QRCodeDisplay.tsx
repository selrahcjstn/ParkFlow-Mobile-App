import { Body, Title } from "@/components/ui/Typography";
import { getVehicleTypeLabel } from "@/constants/vehicleType";
import { Car, ScanLine, ShieldCheck } from "lucide-react-native";
import { ReactNode, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  TouchableOpacity,
  View,
} from "react-native";
import QRCode from "react-native-qrcode-svg";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const SIDE_GUTTER = 4;

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

interface PillBadgeProps {
  icon: ReactNode;
  label: string;
  className?: string;
}

function PillBadge({ icon, label, className = "" }: PillBadgeProps) {
  return (
    <View
      className={`flex-row items-center border border-light-border bg-white rounded-full ${className}`}
    >
      {icon}
      <Body
        className="font-bold text-xs"
        style={{
          color: "#D22730",
        }}
      >
        {label}
      </Body>
    </View>
  );
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

  const baseList = useMemo<Vehicle[]>(() => {
    const baseList = vehicles?.length ? vehicles : vehicle ? [vehicle] : [];
    if (baseList.length === 0) return [];

    return baseList;
  }, [vehicles, vehicle]);

  const displayList = baseList;

  const openPicker = () => {
    if (baseList.length === 0) return;
    onOpenPicker?.();
  };

  useEffect(() => {
    if (!selectedVehicleId) return;
    const matchIndex = displayList.findIndex(
      (item) => item.id === selectedVehicleId,
    );
    if (matchIndex >= 0 && matchIndex !== activeIndex) {
      setActiveIndex(matchIndex);
    }
  }, [selectedVehicleId, displayList, activeIndex]);

  useEffect(() => {
    if (displayList.length === 0) return;
    if (activeIndex >= displayList.length) {
      setActiveIndex(0);
    }
  }, [displayList, activeIndex]);

  if (displayList.length === 0 && !isLoading) return null;

  const activeItem = displayList[Math.min(activeIndex, displayList.length - 1)];

  return (
    <View
      className="my-2"
      onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width)}
    >
      {activeItem ? (
        <View style={{ width: containerWidth }}>
          <TouchableOpacity activeOpacity={0.95} onPress={openPicker}>
            <View
              className="rounded-[28px] bg-white overflow-hidden"
              style={{ marginHorizontal: SIDE_GUTTER }}
            >
              <View className="items-center pt-6 pb-5 px-6 gap-y-6">
                <View className="w-full items-center justify-center relative min-h-[36px]">
                  <View className="items-center">
                    <Title
                      className="text-light-text font-black text-lg leading-5 tracking-tight text-center max-w-[160px] uppercase"
                      numberOfLines={1}
                    >
                      {activeItem.brand ?? "Unknown"}
                    </Title>
                    <Body className="text-light-muted font-heavy uppercase tracking-widest text-[9px] leading-none">
                      Brand
                    </Body>
                  </View>

                  {activeItem.isPrimary ? (
                    <PillBadge
                      icon={
                        <ShieldCheck
                          size={11}
                          color="#D22730"
                          strokeWidth={2.5}
                        />
                      }
                      label="Primary"
                      className="absolute right-0 top-1 px-2 py-1 gap-x-1"
                    />
                  ) : null}
                </View>

                {isLoading && !activeItem.qrCodeHash ? (
                  <View className="w-[180px] h-[180px] items-center justify-center">
                    <ActivityIndicator size="large" color="#D22730" />
                  </View>
                ) : activeItem.qrCodeHash ? (
                  <View className="bg-white">
                    <QRCode value={activeItem.qrCodeHash} size={180} />
                  </View>
                ) : (
                  <View className="w-[180px] h-[180px] items-center justify-center gap-y-2">
                    <Car size={40} color="#E5E7EB" strokeWidth={1.5} />
                    {hasHydrated && !isLoading && !activeItem.qrCodeHash ? (
                      <Body className="text-light-muted font-heavy text-center uppercase tracking-widest text-[10px]">
                        QR Code Unavailable
                      </Body>
                    ) : null}
                  </View>
                )}

                <PillBadge
                  icon={
                    <ScanLine size={14} color="#D22730" strokeWidth={2.5} />
                  }
                  label="Scan at the terminal"
                  className="px-[18px] py-[9px] gap-x-[7px]"
                />
              </View>

              <View className="border-t border-light-border bg-white py-4 px-6">
                {isLoading && !activeItem.qrCodeHash ? (
                  <View className="h-12 w-32 rounded-lg bg-light-border/40 self-center" />
                ) : (
                  <View className="flex-row items-center justify-between w-full">
                    <View className="flex-1 items-center justify-center pr-4">
                      <Body className="text-light-muted font-heavy uppercase tracking-widest text-[9px] leading-none">
                        Plate Number
                      </Body>
                      <Title
                        className="text-light-text font-black tracking-widest uppercase text-[15px]"
                        numberOfLines={1}
                        adjustsFontSizeToFit
                        minimumFontScale={0.8}
                      >
                        {activeItem.plateNumber ?? "———"}
                      </Title>
                    </View>

                    <View className="w-[1px] h-9 bg-light-border mx-1" />
                    <View className="flex-1 items-center justify-center pl-4">
                      <Body className="text-light-muted font-heavy uppercase tracking-widest text-[9px] leading-none">
                        Type
                      </Body>
                      <Body
                        className="text-light-text font-black uppercase text-[15px] tracking-wide"
                        numberOfLines={1}
                      >
                        {getVehicleTypeLabel(activeItem.vehicleType) ?? "———"}
                      </Body>
                    </View>
                  </View>
                )}
              </View>
            </View>
          </TouchableOpacity>
        </View>
      ) : null}
    </View>
  );
}
