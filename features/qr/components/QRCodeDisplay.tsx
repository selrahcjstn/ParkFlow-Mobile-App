import { AlertModal } from "@/components/shared";
import { getVehicleTypeLabel } from "@/constants/vehicleType";
import { Clock, LogOut, Pointer, QrCode } from "lucide-react-native";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Text,
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
  status?: string;
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

  const activeItem = displayList[Math.min(activeIndex, displayList.length - 1)];
  const typeLabel = activeItem
    ? getVehicleTypeLabel(activeItem.vehicleType)
    : "";

  const [secondsRemaining, setSecondsRemaining] = useState(8085); // 02:14:45
  const [viewMode, setViewMode] = useState<"timer" | "qr">("timer");
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  // Reset/sync timer and view mode when activeItem changes
  useEffect(() => {
    if (activeItem?.status === "Parked") {
      setSecondsRemaining(8085);
      setViewMode("timer");
    } else {
      setViewMode("qr");
    }
  }, [activeItem?.id, activeItem?.status]);

  // Run countdown
  useEffect(() => {
    if (activeItem?.status !== "Parked") return;

    const interval = setInterval(() => {
      setSecondsRemaining((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(interval);
  }, [activeItem?.id, activeItem?.status]);

  const formatSeconds = (totalSeconds: number) => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;

    const pad = (num: number) => String(num).padStart(2, "0");
    return `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
  };

  if (displayList.length === 0 && !isLoading) return null;

  return (
    <View
      className="mt-0"
      onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width)}
    >
      {activeItem ? (
        <>
          {/* Start Parking CTA Section Header */}
          <Text className="text-light-text font-regular text-[32px] mt-7 mb-3.5 pl-1 tracking-tight">
            Start Parking
          </Text>

          <View className="bg-light-surface rounded-3xl overflow-hidden">
            {/* ── Vehicle info header ── */}
            <View className="flex-row items-center justify-between px-5 pt-5 pb-4">
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={openPicker}
                className="flex-row items-center flex-1"
              >
                <View className="flex-1">
                  <View className="flex-row items-center gap-2">
                    <Text
                      className="text-light-text font-black text-[16px]"
                      numberOfLines={1}
                    >
                      {activeItem.plateNumber ?? "———"}
                    </Text>
                    {activeItem.isPrimary && (
                      <Text className="text-light-primary font-bold text-[9px] uppercase tracking-wider">
                        Primary
                      </Text>
                    )}
                  </View>
                  <Text className="font-regular text-[12px] mt-0.5 text-light-muted">
                    {activeItem.brand ?? "Unknown"}
                  </Text>
                </View>
              </TouchableOpacity>

              {/* Right Part: Touch indicator icon to prompt tap to select vehicle */}
              <View className="flex-row items-center ml-2">
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={openPicker}
                  className="p-1"
                >
                  <Pointer size={20} color="#71717A" strokeWidth={1.8} />
                </TouchableOpacity>
              </View>
            </View>
            <View className="h-[1px] bg-light-border/40 mx-5" />

            {activeItem.status === "Parked" && viewMode === "timer" ? (
              <View className="px-5 pt-6 pb-6">
                <View className="items-center mb-5">
                  <Text className="font-bold uppercase tracking-widest text-[10px] text-light-muted mb-2">
                    Time Remaining
                  </Text>
                  <Text
                    className="text-[36px] font-black text-light-text"
                    style={{ letterSpacing: 4 }}
                  >
                    {formatSeconds(secondsRemaining)}
                  </Text>
                  <View className="flex-row items-center gap-1.5 mt-2.5 bg-light-success/10 px-3 py-1 rounded-full">
                    <View className="w-1.5 h-1.5 rounded-full bg-light-success" />
                    <Text className="text-light-success font-bold text-[10px] uppercase tracking-wider">
                      Active Parking Session
                    </Text>
                  </View>
                </View>

                {/* ── Exit Session Button ── */}
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => setShowExitConfirm(true)}
                  className="flex-row items-center justify-center gap-1.5 self-center mb-6 py-1"
                >
                  <LogOut size={14} color="#D22730" strokeWidth={2} />
                  <Text className="text-light-primary font-bold text-[13px]">
                    Exit
                  </Text>
                </TouchableOpacity>

                {/* Details Rows (Borderless and shadowless list) */}
                <View className="gap-3.5 bg-light-background/40 rounded-2xl p-4">
                  <View className="flex-row justify-between items-center">
                    <Text className="font-regular text-[13px] text-light-muted">
                      Charge
                    </Text>
                    <Text className="text-light-text font-bold text-[14px]">
                      ₱40.00
                    </Text>
                  </View>

                  <View className="flex-row justify-between items-center">
                    <Text className="font-regular text-[13px] text-light-muted">
                      Must Exit By
                    </Text>
                    <Text className="text-light-text font-bold text-[14px]">
                      05:30 PM
                    </Text>
                  </View>

                  <View className="flex-row justify-between items-center">
                    <Text className="font-regular text-[13px] text-light-muted">
                      Time Parked
                    </Text>
                    <Text className="text-light-text font-bold text-[14px]">
                      1h 45m
                    </Text>
                  </View>
                </View>
              </View>
            ) : (
              <>
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
                        <Text className="font-bold text-[11px] mt-3 text-light-muted">
                          QR Code Unavailable
                        </Text>
                      ) : null}
                    </View>
                  )}
                </View>

                {/* ── Switch to Timer Details View Button ── */}
                {activeItem.status === "Parked" && (
                  <View className="items-center pb-5">
                    <TouchableOpacity
                      activeOpacity={0.7}
                      onPress={() => setViewMode("timer")}
                      className="flex-row items-center justify-center gap-1.5 py-1"
                    >
                      <Clock size={14} color="#D22730" strokeWidth={2} />
                      <Text className="text-light-primary font-bold text-[13px]">
                        Switch
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}

                <View className="px-5 pb-5 pt-1">
                  <View className="flex-row items-center justify-between">
                    <QrCode size={16} color="#D22730" strokeWidth={2.2} />
                    <Text className="font-regular text-[12px] text-center text-light-muted">
                      Scan this QR code
                    </Text>
                  </View>
                </View>
              </>
            )}
          </View>

          {displayList.length > 1 && (
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={openPicker}
              className="mt-3.5 items-center justify-center py-2.5"
            >
              <Text className="text-light-primary font-bold text-[13px] uppercase tracking-wider">
                Switch Active Vehicle
              </Text>
            </TouchableOpacity>
          )}

          {/* ── Exit Confirmation Modal ── */}
          <AlertModal
            visible={showExitConfirm}
            onClose={() => setShowExitConfirm(false)}
            title="Exit Session?"
            message="Are you sure you want to exit? You will need to present your QR code at the terminal."
            variant="warning"
            buttonLabel="Yes, Exit"
            cancelLabel="No, Stay"
            showCancel
            onConfirm={() => {
              setViewMode("qr");
              setShowExitConfirm(false);
            }}
            icon={<LogOut size={28} color="#F59E0B" strokeWidth={2.2} />}
          />
        </>
      ) : null}
    </View>
  );
}
