import { AlertModal } from "@/components/shared";
import { Clock, Pointer, QrCode, AlertTriangle } from "lucide-react-native";
import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Text, TouchableOpacity, View } from "react-native";
import QRCodeSvg from "react-native-qrcode-svg";
import { parkingLogService } from "@/features/session/services/parking-log.service";
import ActiveSessionTimer from "./ActiveSessionTimer";
import ActiveSessionBanner from "./ActiveSessionBanner";
import { formatTime } from "@/utils/formatTime";
import { useSchedulesQuery } from "@/hooks";

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
  onSelectVehicle?: (vehicleId: string) => void;
  selectedDate?: Date;
}

interface ActiveSessionData {
  sessionId: string;
  startedAt: string;
  elapsedMinutes: number;
  accruedCharge: number;
  exitBy: string;
}

export default function QRCodeDisplay({
  vehicles,
  vehicle,
  isLoading = false,
  hasHydrated = false,
  selectedVehicleId,
  onOpenPicker,
  onSelectVehicle,
  selectedDate,
}: QRCodeDisplayProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  const { data: schedules } = useSchedulesQuery();

  const formattedDate = useMemo(() => {
    if (!selectedDate) return "———";
    const months = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];
    return `${months[selectedDate.getMonth()]} ${selectedDate.getDate()}, ${selectedDate.getFullYear()}`;
  }, [selectedDate]);

  const scheduleDisplay = useMemo(() => {
    if (!selectedDate) return "No schedule";
    if (!schedules) return "---";
    const dayOfWeek = selectedDate.getDay();
    const activeSched = schedules.find((s) => s.dayOfWeek === dayOfWeek);
    if (!activeSched) return "No schedule";
    return `${formatTime(activeSched.startTime)} - ${formatTime(activeSched.endTime)}`;
  }, [selectedDate, schedules]);

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

  const parkedCount = useMemo(() => {
    return vehicles?.filter((v) => v.status === "Parked").length ?? 0;
  }, [vehicles]);

  const [activeSession, setActiveSession] = useState<ActiveSessionData | null>(null);
  const [isFetchingSession, setIsFetchingSession] = useState(false);
  const [viewMode, setViewMode] = useState<"timer" | "qr">("qr");
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  useEffect(() => {
    if (activeItem?.status === "Parked" && activeItem?.id) {
      let isMounted = true;
      setIsFetchingSession(true);
      parkingLogService
        .getActiveVehicleSession(activeItem.id)
        .then((res) => {
          if (isMounted) {
            if (res.isSuccess && res.data) {
              setActiveSession(res.data);
            } else {
              setActiveSession(null);
            }
          }
        })
        .catch((err) => {
          console.error("Failed to fetch active vehicle session", err);
          if (isMounted) {
            setActiveSession(null);
          }
        })
        .finally(() => {
          if (isMounted) {
            setIsFetchingSession(false);
          }
        });
      return () => {
        isMounted = false;
      };
    } else {
      setViewMode("qr");
      setActiveSession(null);
    }
  }, [activeItem?.id, activeItem?.status]);

  const instructionRow = (
    <View className="mx-6 mt-2 mb-4 py-1">
      <View className="flex-row items-center justify-center gap-2">
        <QrCode size={13} color="#D22730" strokeWidth={2.5} />
        <Text className="font-book text-[11px] text-center text-light-muted dark:text-dark-muted">
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
          {parkedCount > 0 && viewMode === "qr" && (
            <ActiveSessionBanner
              parkedCount={parkedCount}
              onPress={() => {
                if (activeItem.status === "Parked") {
                  setViewMode("timer");
                } else {
                  const parkedIdx = displayList.findIndex((v) => v.status === "Parked");
                  if (parkedIdx >= 0) {
                    const parkedVehicle = displayList[parkedIdx];
                    onSelectVehicle?.(parkedVehicle.id);
                    setViewMode("timer");
                  }
                }
              }}
            />
          )}

          <View className="bg-light-surface dark:bg-dark-surface rounded-3xl shadow-card overflow-hidden">
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={openPicker}
              className="flex-row items-center justify-between px-6 pt-5 pb-4 bg-light-surface dark:bg-dark-surface"
            >
              <View className="flex-row items-center flex-1 pr-2 gap-3.5">
                <View className="flex-1">
                  <View className="flex-row items-center gap-2">
                    <Text
                      className="text-light-text dark:text-dark-text font-black text-lg tracking-wide"
                      numberOfLines={1}
                    >
                      {activeItem.plateNumber ?? "———"}
                    </Text>
                    {activeItem.isPrimary && (
                      <View className="bg-light-primary/10 dark:bg-dark-primary/22 px-2 py-0.5 rounded-md">
                        <Text className="text-light-primary dark:text-dark-primary font-heavy text-[9px] uppercase tracking-wider">
                          Primary
                        </Text>
                      </View>
                    )}
                  </View>
                  <Text className="font-regular text-[13px] text-light-muted dark:text-dark-muted mt-0.5">
                    {activeItem.brand ?? "Unknown Asset"}
                  </Text>
                </View>
              </View>
              <View className="pl-2">
                <Pointer size={18} color="#64748B" strokeWidth={2.2} />
              </View>
            </TouchableOpacity>

            <View className="flex-row items-center justify-between h-6 bg-light-surface dark:bg-dark-surface">
              <View className="w-5 h-5 rounded-full bg-light-background dark:bg-dark-background -ml-2.5" />
              <View className="flex-1 border-b border-dashed border-light-border dark:border-dark-border mx-1" />
              <View className="w-5 h-5 rounded-full bg-light-background dark:bg-dark-background -mr-2.5" />
            </View>

            {activeItem.status === "Parked" && viewMode === "timer" ? (
              <>
                {isFetchingSession ? (
                  <View className="py-12 items-center justify-center">
                    <ActivityIndicator size="large" color="#D22730" />
                    <Text className="font-heavy text-[11px] text-light-muted dark:text-dark-muted uppercase tracking-widest mt-3">
                      Retrieving Session Details...
                    </Text>
                  </View>
                ) : activeSession ? (
                  <ActiveSessionTimer
                    startedAt={activeSession.startedAt}
                    exitBy={activeSession.exitBy}
                    accruedCharge={activeSession.accruedCharge}
                    onExitPress={() => setShowExitConfirm(true)}
                  />
                ) : (
                  <View className="py-12 items-center justify-center px-6">
                    <Text className="font-heavy text-sm text-light-primary dark:text-dark-primary text-center">
                      Unable to Load Session
                    </Text>
                    <Text className="font-regular text-xs text-light-muted dark:text-dark-muted text-center mt-1">
                      Please try again or contact support if the problem persists.
                    </Text>
                  </View>
                )}
                {instructionRow}
              </>
            ) : (
              <>
                <View className="items-center pt-3 pb-5 px-6">
                  {isLoading && !activeItem.qrCodeHash ? (
                    <View className="w-[190px] h-[190px] rounded-2xl bg-light-surfaceLighter dark:bg-dark-surfaceLighter items-center justify-center">
                      <ActivityIndicator size="large" color="#D22730" />
                    </View>
                  ) : activeItem.qrCodeHash ? (
                    <View className="bg-white p-4 rounded-2xl shadow-card">
                      <QRCodeSvg value={activeItem.qrCodeHash} size={175} />
                    </View>
                  ) : (
                    <View className="w-[190px] h-[190px] rounded-2xl bg-light-surfaceLighter dark:bg-dark-surfaceLighter items-center justify-center border border-dashed border-light-border dark:border-dark-border">
                      <QrCode size={44} color="#64748B" strokeWidth={1.2} />
                      {hasHydrated && !isLoading && !activeItem.qrCodeHash ? (
                        <Text className="font-heavy text-xs mt-3 text-light-muted dark:text-dark-muted">
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
                      className="flex-row items-center justify-center gap-1.5 py-1.5 px-4 bg-light-surfaceLighter dark:bg-dark-surfaceLighter rounded-full"
                    >
                      <Clock size={13} color="#D22730" strokeWidth={2.5} />
                      <Text className="text-light-primary dark:text-dark-primary font-heavy text-xs uppercase tracking-wider">
                        View Live Session
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}

                {instructionRow}

                <View className="px-6 pb-5 pt-4 bg-light-surfaceLighter/40 dark:bg-dark-surfaceLighter/20 border-t border-light-border/40 dark:border-dark-border/40">
                  <View className="flex-row items-center justify-between">
                    <View>
                      <Text className="text-[12px] font-heavy text-light-muted dark:text-dark-muted tracking-wider">
                        Date
                      </Text>
                      <Text className="text-light-text dark:text-dark-text font-black text-[13px] mt-0.5">
                        {formattedDate}
                      </Text>
                    </View>
                    <View className="items-end">
                      <Text className="text-[12px] font-heavy text-light-muted dark:text-dark-muted tracking-wider">
                        Schedule
                      </Text>
                      <Text className="text-light-text dark:text-dark-text font-black text-[13px] mt-0.5">
                        {scheduleDisplay}
                      </Text>
                    </View>
                  </View>
                </View>
              </>
            )}
          </View>



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
            icon={<AlertTriangle size={28} color="#F59E0B" strokeWidth={2.2} />}
          />
        </>
      ) : null}
    </View>
  );
}
