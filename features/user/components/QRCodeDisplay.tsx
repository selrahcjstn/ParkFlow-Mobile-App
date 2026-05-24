import { AlertModal } from "@/components/shared";
import { Car, Clock, LogOut, Pointer, QrCode } from "lucide-react-native";
import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Text, TouchableOpacity, View } from "react-native";
import QRCodeSvg from "react-native-qrcode-svg";

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

  // Dummy Schedule Data
  const mockSchedule = {
    dateToday: "May 24, 2026",
    startTime: "08:00 AM",
    endTime: "05:00 PM",
  };

  const displayList = useMemo<Vehicle[]>(() => {
    const list = vehicles?.length ? vehicles : vehicle ? [vehicle] : [];
    return list;
  }, [vehicles, vehicle]);

  const openPicker = () => {
    if (displayList.length === 0) return;
    onOpenPicker?.();
  };

  useEffect(() => {
    if (displayList.length === 0) return;
    if (selectedVehicleId) return;

    const primary = displayList.find((v) => v.isPrimary);
    const autoSelect = primary ?? displayList[0];
    const idx = displayList.indexOf(autoSelect);
    if (idx >= 0) setActiveIndex(idx);
  }, [displayList, selectedVehicleId]);

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

  const activeItem = displayList[Math.min(activeIndex, displayList.length - 1)];

  const [secondsRemaining, setSecondsRemaining] = useState(8085);
  const [viewMode, setViewMode] = useState<"timer" | "qr">("timer");
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  useEffect(() => {
    if (activeItem?.status === "Parked") {
      setSecondsRemaining(8085);
      setViewMode("timer");
    } else {
      setViewMode("qr");
    }
  }, [activeItem?.id, activeItem?.status]);

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

  const instructionRow = (
    <View className="mx-6 mt-2 mb-4 py-1">
      <View className="flex-row items-center justify-center gap-2">
        <QrCode size={13} color="#D22730" strokeWidth={2.5} />
        <Text className="font-medium text-[11px] text-center text-light-muted">
          Present this card at the terminal checkpoint.
        </Text>
      </View>
    </View>
  );

  if (displayList.length === 0 && !isLoading) return null;

  return (
    <View className="mt-7 w-full">
      {activeItem ? (
        <>
          <View className="bg-light-surface rounded-3xl shadow-card overflow-hidden border border-light-border/30">
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={openPicker}
              className="flex-row items-center justify-between px-6 pt-5 pb-4 bg-light-surface"
            >
              <View className="flex-row items-center flex-1 pr-2 gap-3.5">
                <View className="p-2.5 rounded-xl bg-light-background border border-light-border/40">
                  <Car size={20} color="#334155" strokeWidth={2.2} />
                </View>

                <View className="flex-1">
                  <View className="flex-row items-center gap-2">
                    <Text
                      className="text-light-text font-black text-lg tracking-wide"
                      numberOfLines={1}
                    >
                      {activeItem.plateNumber ?? "———"}
                    </Text>
                    {activeItem.isPrimary && (
                      <View className="bg-light-primary/10 px-2 py-0.5 rounded-md">
                        <Text className="text-light-primary font-bold text-[9px] uppercase tracking-wider">
                          Primary
                        </Text>
                      </View>
                    )}
                  </View>
                  <Text className="font-regular text-[13px] text-light-muted mt-0.5">
                    {activeItem.brand ?? "Unknown Asset"}
                  </Text>
                </View>
              </View>
              <View className="pl-2">
                <Pointer size={18} color="#64748B" strokeWidth={2.2} />
              </View>
            </TouchableOpacity>

            <View className="flex-row items-center justify-between h-6 bg-light-surface">
              {/* Left Notch cut cleanly into layout backdrop */}
              <View className="w-5 h-5 rounded-full bg-light-background -ml-2.5 border-r border-light-border/20" />
              {/* Dashed Perforation Line */}
              <View className="flex-1 border-b border-dashed border-light-border mx-1" />
              {/* Right Notch */}
              <View className="w-5 h-5 rounded-full bg-light-background -mr-2.5 border-l border-light-border/20" />
            </View>

            {activeItem.status === "Parked" && viewMode === "timer" ? (
              <>
                <View className="px-6 pb-2 pt-2">
                  <View className="items-center mb-5">
                    <Text className="font-bold uppercase tracking-widest text-[11px] text-light-muted mb-2">
                      Time Remaining
                    </Text>
                    <Text className="text-4xl font-black text-light-text tracking-widest">
                      {formatSeconds(secondsRemaining)}
                    </Text>

                    <View className="flex-row items-center gap-1.5 mt-3 bg-light-success/10 px-3 py-1 rounded-full">
                      <View className="w-1.5 h-1.5 rounded-full bg-light-success" />
                      <Text className="text-light-success font-bold text-[10px] uppercase tracking-wider">
                        Active Parking Session
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => setShowExitConfirm(true)}
                    className="flex-row items-center justify-center gap-1.5 self-center mb-5 bg-light-primary/5 border border-light-primary/20 px-4 py-1.5 rounded-full"
                  >
                    <LogOut size={13} color="#D22730" strokeWidth={2.5} />
                    <Text className="text-light-primary font-bold text-xs uppercase tracking-wider">
                      Exit Terminal
                    </Text>
                  </TouchableOpacity>
                  <View className="gap-3 bg-light-background/40 rounded-2xl p-4 border border-light-border/30">
                    <View className="flex-row justify-between items-center">
                      <Text className="font-regular text-sm text-light-muted">
                        Accrued Charge
                      </Text>
                      <Text className="text-light-text font-bold text-base">
                        ₱40.00
                      </Text>
                    </View>

                    <View className="w-full h-[1px] bg-light-border/50" />

                    <View className="flex-row justify-between items-center">
                      <Text className="font-regular text-sm text-light-muted">
                        Must Exit By
                      </Text>
                      <Text className="text-light-text font-bold text-base">
                        05:30 PM
                      </Text>
                    </View>

                    <View className="w-full h-[1px] bg-light-border/50" />

                    <View className="flex-row justify-between items-center">
                      <Text className="font-regular text-sm text-light-muted">
                        Time Elapsed
                      </Text>
                      <Text className="text-light-text font-bold text-base">
                        1h 45m
                      </Text>
                    </View>
                  </View>
                </View>
                {instructionRow}
              </>
            ) : (
              <>
                <View className="items-center pt-3 pb-5 px-6">
                  {isLoading && !activeItem.qrCodeHash ? (
                    <View className="w-[190px] h-[190px] rounded-2xl bg-light-background items-center justify-center">
                      <ActivityIndicator size="large" color="#D22730" />
                    </View>
                  ) : activeItem.qrCodeHash ? (
                    <View className="bg-white p-4 rounded-2xl shadow-soft border border-light-border/60">
                      <QRCodeSvg value={activeItem.qrCodeHash} size={175} />
                    </View>
                  ) : (
                    <View className="w-[190px] h-[190px] rounded-2xl bg-light-background items-center justify-center border border-dashed border-light-border">
                      <QrCode size={44} color="#64748B" strokeWidth={1.2} />
                      {hasHydrated && !isLoading && !activeItem.qrCodeHash ? (
                        <Text className="font-bold text-xs mt-3 text-light-muted">
                          QR Code Unavailable
                        </Text>
                      ) : null}
                    </View>
                  )}
                </View>

                {activeItem.status === "Parked" && (
                  <View className="items-center pb-4">
                    <TouchableOpacity
                      activeOpacity={0.7}
                      onPress={() => setViewMode("timer")}
                      className="flex-row items-center justify-center gap-1.5 py-1.5 px-4 bg-light-background rounded-full"
                    >
                      <Clock size={13} color="#D22730" strokeWidth={2.5} />
                      <Text className="text-light-primary font-bold text-xs uppercase tracking-wider">
                        View Live Session
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}

                {instructionRow}
                <View className="px-6 pb-5 pt-4 bg-light-background/40 border-t border-light-border/40">
                  <View className="flex-row items-center justify-between">
                    <View>
                      <Text className="text-[12px] font-bold text-light-muted tracking-wider">
                        Date
                      </Text>
                      <Text className="text-light-text font-black text-[13px] mt-0.5">
                        {mockSchedule.dateToday}
                      </Text>
                    </View>
                    <View className="items-end">
                      <Text className="text-[12px] font-bold  text-light-muted tracking-wider">
                        Schedule
                      </Text>
                      <Text className="text-light-text font-black text-[13px] mt-0.5">
                        {mockSchedule.startTime} - {mockSchedule.endTime}
                      </Text>
                    </View>
                  </View>
                </View>
              </>
            )}
          </View>

          {displayList.length > 1 && (
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={openPicker}
              className="mt-4 items-center justify-center py-2.5 bg-light-surface/40 rounded-xl border border-light-border/20"
            >
              <Text className="text-light-primary font-bold text-xs uppercase tracking-widest">
                Switch Active Vehicle
              </Text>
            </TouchableOpacity>
          )}

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
