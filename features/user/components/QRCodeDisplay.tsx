import { AlertModal } from "@/components/shared";
import { Clock, Pointer, QrCode, AlertTriangle, ShieldAlert, Car, Plus, Download, Maximize2, X } from "lucide-react-native";
import { useEffect, useMemo, useState, useCallback } from "react";
import { ActivityIndicator, Text, TouchableOpacity, View, Modal, Linking, Platform, Share } from "react-native";
import * as WebBrowser from "expo-web-browser";
import { BlurView } from "expo-blur";
import { useRouter } from "expo-router";
import QRCodeSvg from "react-native-qrcode-svg";
import { parkingLogService } from "@/features/session/services/parking-log.service";
import ActiveSessionTimer from "./ActiveSessionTimer";
import ActiveSessionBanner from "./ActiveSessionBanner";
import { formatTime } from "@/utils/formatTime";
import { useSchedulesQuery } from "@/hooks";
import { useAuthStore } from "@/features/auth/store/auth.store";
import { registerParkingSessionListener, registerExitResponseListener, registerVerificationStatusListener, registerScheduleListener, registerReservationListener } from "@/services/signalr";
import { useVehicleStore } from "@/features/user/store/vehicle.store";
import { useViolationStore } from "@/features/violation/store/violation.store";
import { useReservationStore, isReservationDone } from "@/features/schedule/store/reservation.store";
import { ReservationStatus } from "@/features/schedule/types/reservation.types";

interface Vehicle {
  id: string;
  plateNumber: string;
  brand: string;
  qrCodeHash: string;
  isPrimary?: boolean;
  vehicleType?: number | string;
  status?: string;
  verificationStatus?: number | string;
  rejectionReason?: string;
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
  unpaidCount?: number;
}

interface ActiveSessionData {
  sessionId: string;
  startedAt: string;
  elapsedMinutes: number;
  accruedCharge: number;
  exitBy: string;
}

function parseTimeToMinutes(timeStr: string | undefined | null): number | null {
  if (!timeStr) return null;
  const clean = timeStr.trim();
  if (!clean) return null;

  // "HH:mm:ss" or "HH:mm" (24-hour)
  const match24 = clean.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
  if (match24) {
    return parseInt(match24[1], 10) * 60 + parseInt(match24[2], 10);
  }

  // "hh:mm AM/PM" or "hh:mm:ss AM/PM" (12-hour)
  const match12 = clean.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM|am|pm)$/i);
  if (match12) {
    let hours = parseInt(match12[1], 10);
    const minutes = parseInt(match12[2], 10);
    const ampm = match12[3].toUpperCase();
    if (ampm === "PM" && hours < 12) hours += 12;
    if (ampm === "AM" && hours === 12) hours = 0;
    return hours * 60 + minutes;
  }

  return null;
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
  unpaidCount,
}: QRCodeDisplayProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);

  const activeViolationsList = useViolationStore((s) => s.activeViolationsList);
  const storeUnpaidCount = useMemo(() => {
    return activeViolationsList.filter(
      (v) =>
        !v.isPaid &&
        v.settlementStatus !== "Paid" &&
        v.settlementStatus !== "Settled"
    ).length;
  }, [activeViolationsList]);

  const effectiveUnpaidCount =
    unpaidCount !== undefined ? unpaidCount : storeUnpaidCount;
  const hasAccessSuspended = effectiveUnpaidCount >= 3;
  const hasActiveViolation = effectiveUnpaidCount > 0;

  const downloadQrImage = useCallback(async (hash: string, label: string = "Vehicle QR Code") => {
    if (!hash) return;
    const url = `https://api.qrserver.com/v1/create-qr-code/?size=600x600&data=${encodeURIComponent(hash)}`;
    try {
      if (Platform.OS === "web") {
        await Linking.openURL(url);
      } else {
        await WebBrowser.openBrowserAsync(url).catch(async () => {
          await Share.share({
            title: `ParkFlow QR Code - ${label}`,
            message: `ParkFlow QR Code (${label}): ${url}`,
            url: url,
          });
        });
      }
    } catch {
      Linking.openURL(url).catch(() => {});
    }
  }, []);

  const { user } = useAuthStore();
  const isUserPending = user?.corVerificationStatus === 1;
  const isUserRejected = user?.corVerificationStatus === 3;

  const { data: schedules } = useSchedulesQuery();
  const activeReservation = useReservationStore((s) => s.activeReservation);
  const fetchMyReservations = useReservationStore((s) => s.fetchMyReservations);

  useEffect(() => {
    fetchMyReservations();
  }, [fetchMyReservations]);

  const [currentMinutes, setCurrentMinutes] = useState(() => {
    const d = new Date();
    return d.getHours() * 60 + d.getMinutes();
  });

  useEffect(() => {
    const timer = setInterval(() => {
      const d = new Date();
      setCurrentMinutes(d.getHours() * 60 + d.getMinutes());
    }, 15000);
    return () => clearInterval(timer);
  }, []);

  const hasReservationToday = useMemo(() => {
    if (!activeReservation) return false;
    if (activeReservation.status !== ReservationStatus.Approved) return false;
    const now = new Date();
    const nowStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    const resDateStr = activeReservation.reservationDate.split("T")[0];
    return resDateStr === nowStr && !isReservationDone(activeReservation);
  }, [activeReservation]);

  const todayDayOfWeek = useMemo(() => new Date().getDay(), []);

  const todaySchedules = useMemo(() => {
    if (!schedules || schedules.length === 0) return [];
    return schedules.filter((s) => s.dayOfWeek === todayDayOfWeek);
  }, [schedules, todayDayOfWeek]);

  const hasScheduleToday = useMemo(() => {
    if (user?.profileType === "personnel") return true;
    if (hasReservationToday) return true;
    return todaySchedules.length > 0;
  }, [user?.profileType, hasReservationToday, todaySchedules]);

  const isScheduleEndedToday = useMemo(() => {
    if (user?.profileType === "personnel") return false;
    if (hasReservationToday) return false;

    // 1. Check if user had class schedules today that have ended
    if (todaySchedules.length > 0) {
      const latestEndMinutes = Math.max(
        ...todaySchedules.map((s) => parseTimeToMinutes(s.endTime) ?? 0)
      );
      if (currentMinutes > latestEndMinutes) {
        return true;
      }
    }

    // 2. Check if user had a reservation today that has ended/completed, and no active classes remain
    const reservationsList = useReservationStore.getState().reservations;
    const now = new Date();
    const nowStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    const todayRes = reservationsList.find((r) => r.reservationDate?.split("T")[0] === nowStr);
    if (todayRes && isReservationDone(todayRes)) {
      if (todaySchedules.length === 0) {
        return true;
      }
    }

    return false;
  }, [user?.profileType, hasReservationToday, todaySchedules, currentMinutes, activeReservation]);

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
    const dayOfWeek = selectedDate.getDay();
    const activeSched = schedules?.find((s) => s.dayOfWeek === dayOfWeek);
    if (activeSched) {
      return `${formatTime(activeSched.startTime)} - ${formatTime(activeSched.endTime)}`;
    }
    if (activeReservation && activeReservation.status === ReservationStatus.Approved) {
      const selDateStr = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, "0")}-${String(selectedDate.getDate()).padStart(2, "0")}`;
      const resDateStr = activeReservation.reservationDate.split("T")[0];
      if (selDateStr === resDateStr) {
        return `${formatTime(activeReservation.startTime)} - ${formatTime(activeReservation.endTime)} (Reservation)`;
      }
    }
    return "No schedule";
  }, [selectedDate, schedules, activeReservation]);

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

  const isPersonnel = user?.profileType === "personnel";

  const vStatus = activeItem?.verificationStatus as any;
  const isVehicleVerified = vStatus === 2 || vStatus === "2" || vStatus === "Verified";
  const isVehiclePending = (vStatus === 1 || vStatus === "1" || vStatus === "Pending" || vStatus === 0 || vStatus === "0" || vStatus === undefined || vStatus === null) && !isVehicleVerified;
  const isVehicleRejected = vStatus === 3 || vStatus === "3" || vStatus === "Rejected";

  const uStatus = user?.corVerificationStatus as any;
  const isCorVerified = uStatus === 2 || uStatus === "2" || uStatus === "Verified" || isPersonnel;
  const isCorPending = (uStatus === 1 || uStatus === "1" || uStatus === "Pending" || uStatus === 0 || uStatus === "0" || uStatus === undefined) && !isPersonnel && !isCorVerified;
  const isCorRejected = uStatus === 3 || uStatus === "3" || uStatus === "Rejected";

  // When BOTH schedule/COR & vehicle are verified, QR code is active!
  const isVerified = Boolean(activeItem) && isCorVerified && isVehicleVerified;

  const isItemRejected = isVehicleRejected || isCorRejected;
  const isItemPending = !isVerified && !isItemRejected;

  const parkedCount = useMemo(() => {
    return vehicles?.filter((v) => v.status === "Parked").length ?? 0;
  }, [vehicles]);

  const [activeSession, setActiveSession] = useState<ActiveSessionData | null>(null);
  const [isFetchingSession, setIsFetchingSession] = useState(false);
  const [viewMode, setViewMode] = useState<"timer" | "qr">("qr");
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  const fetchActiveSession = useCallback(async () => {
    if (!activeItem?.id) {
      setActiveSession(null);
      setViewMode("qr");
      return;
    }

    try {
      const res = await parkingLogService.getActiveVehicleSession(activeItem.id);
      if (res.isSuccess && res.data) {
        setActiveSession((prev) => {
          if (!prev) {
            setViewMode("timer");
          }
          return res.data;
        });
      } else {
        setActiveSession(null);
        setViewMode("qr");
      }
    } catch (err: any) {
      if (err?.response?.status !== 404 && err?.response?.status !== 500) {
        console.warn("[QRCodeDisplay] Unable to fetch active session:", err?.message || err);
      }
      setActiveSession(null);
      setViewMode("qr");
    }
  }, [activeItem?.id]);

  useEffect(() => {
    setActiveSession(null);
    fetchActiveSession();
    // Standard 30-second gentle fallback poll (realtime updates are pushed via SignalR)
    const pollTimer = setInterval(() => {
      fetchActiveSession();
    }, 30000);
    return () => clearInterval(pollTimer);
  }, [fetchActiveSession]);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    const handleUpdate = () => {
      console.log("[QRCodeDisplay] Realtime SignalR event received: scheduling smooth refresh...");
      timer = setTimeout(() => {
        useVehicleStore.getState().loadVehicle();
        useReservationStore.getState().fetchMyReservations();
        fetchActiveSession();
      }, 600);
    };

    const unregisterSession = registerParkingSessionListener(handleUpdate);
    const unregisterExit = registerExitResponseListener(handleUpdate);
    const unregisterReservation = registerReservationListener(async () => {
      console.log("[QRCodeDisplay] Realtime reservation update received: triggering live reload...");
      useReservationStore.getState().fetchMyReservations();
      fetchActiveSession();
    });
    const unregisterVerification = registerVerificationStatusListener(async () => {
      console.log("[QRCodeDisplay] Realtime verification update received: triggering live reload...");
      await Promise.all([
        useAuthStore.getState().loadUser(),
        useVehicleStore.getState().loadVehicle(true),
        useReservationStore.getState().fetchMyReservations(),
      ]);
      fetchActiveSession();
    });
    const unregisterSchedule = registerScheduleListener(async () => {
      console.log("[QRCodeDisplay] Realtime schedule update received: triggering live reload...");
      try {
        const { useScheduleStore } = require("@/features/schedule/store/schedule.store");
        void useScheduleStore.getState().fetchSchedules(true);
        void useReservationStore.getState().fetchMyReservations();
      } catch {}
    });

    return () => {
      if (timer) clearTimeout(timer);
      unregisterSession();
      unregisterExit();
      unregisterReservation();
      unregisterVerification();
      unregisterSchedule();
    };
  }, [fetchActiveSession]);

  const hasActiveSession = useMemo(() => {
    return activeSession !== null;
  }, [activeSession]);

  const instructionRow = (
    <View className="mx-6 mt-2 mb-4 py-1">
      <View className="flex-row items-center justify-center gap-2">
        {hasActiveViolation && !hasActiveSession ? (
          <>
            <AlertTriangle size={13} color="#7B1113" strokeWidth={2.5} />
            <Text className="font-book text-[11px] text-center text-light-danger dark:text-dark-danger">
              Outstanding citations must be settled before gate access is restored.
            </Text>
          </>
        ) : isScheduleEndedToday && !hasActiveSession ? (
          <>
            <Clock size={13} color="#EF4444" strokeWidth={2.5} />
            <Text className="font-book text-[11px] text-center text-red-500 dark:text-red-400">
              Entry closed for today. Authorized schedule ended.
            </Text>
          </>
        ) : !hasScheduleToday && !hasActiveSession ? (
          <>
            <Clock size={13} color="#D97706" strokeWidth={2.5} />
            <Text className="font-book text-[11px] text-center text-amber-600 dark:text-amber-400">
              No schedule for today. Gate access restricted.
            </Text>
          </>
        ) : (
          <>
            <QrCode size={13} color="#7B1113" strokeWidth={2.5} />
            <Text className="font-book text-[11px] text-center text-light-muted dark:text-dark-muted">
              Present this card at the terminal checkpoint.
            </Text>
          </>
        )}
      </View>
    </View>
  );

  const router = useRouter();

  if (displayList.length === 0) {
    if (!hasHydrated && isLoading) {
      return null;
    }
    if (isUserPending) {
      return (
        <View className="mt-7 w-full">
          <View className="bg-light-surface dark:bg-dark-surface rounded-3xl p-6 items-center border border-amber-500/30 dark:border-amber-500/20">
            <View className="w-16 h-16 rounded-full bg-amber-500/10 dark:bg-amber-500/20 items-center justify-center mb-4">
              <Clock size={32} color="#F59E0B" strokeWidth={2} />
            </View>
            <View className="bg-amber-500/10 dark:bg-amber-500/20 px-3 py-1 rounded-full mb-3 border border-amber-500/20">
              <Text className="text-amber-600 dark:text-amber-400 font-bold text-[11px] uppercase tracking-wider">
                Pending Approval
              </Text>
            </View>
            <Text className="text-light-text dark:text-dark-text font-bold text-lg text-center mb-2">
              Vehicle Verification Pending
            </Text>
            <Text className="text-light-muted dark:text-dark-muted font-regular text-xs text-center leading-5 px-2">
              Your vehicle registration and documents have been submitted and are currently under review by campus administrators. Parking QR pass will be activated once approved.
            </Text>
          </View>
        </View>
      );
    }

    if (isUserRejected) {
      return (
        <View className="mt-7 w-full">
          <View className="bg-light-surface dark:bg-dark-surface rounded-3xl p-6 items-center border border-red-500/30 dark:border-red-500/20">
            <View className="w-16 h-16 rounded-full bg-red-500/10 dark:bg-red-500/20 items-center justify-center mb-4">
              <ShieldAlert size={32} color="#EF4444" strokeWidth={2} />
            </View>
            <View className="bg-red-500/10 dark:bg-red-500/20 px-3 py-1 rounded-full mb-3 border border-red-500/20">
              <Text className="text-red-600 dark:text-red-400 font-bold text-[11px] uppercase tracking-wider">
                Registration Rejected
              </Text>
            </View>
            <Text className="text-light-text dark:text-dark-text font-bold text-lg text-center mb-2">
              Registration Documents Rejected
            </Text>
            <Text className="text-light-muted dark:text-dark-muted font-regular text-xs text-center leading-5 px-2 mb-4">
              {user?.rejectionReason
                ? `Reason: ${user.rejectionReason}`
                : "Your registration documents were rejected. Please update your information to proceed."}
            </Text>
            <TouchableOpacity
              onPress={() => router.push("/(auth)/register")}
              activeOpacity={0.8}
              className="w-full bg-red-600 dark:bg-red-600 py-3.5 px-5 rounded-2xl flex-row items-center justify-center gap-2 active:opacity-90"
            >
              <AlertTriangle size={18} color="#FFFFFF" strokeWidth={2.5} />
              <Text className="text-white font-bold text-sm tracking-wide">
                Fix Registration Documents
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    return (
      <View className="mt-7 w-full">
        <View className="bg-light-surface dark:bg-dark-surface rounded-3xl p-6 items-center border border-dashed border-light-border dark:border-dark-border">
          <View className="w-16 h-16 rounded-full bg-light-primary/10 dark:bg-dark-primary/20 items-center justify-center mb-4">
            <Car size={32} color="#7B1113" strokeWidth={2} />
          </View>
          <Text className="text-light-text dark:text-dark-text font-bold text-lg text-center mb-1">
            No Vehicle Registered Yet
          </Text>
          <Text className="text-light-muted dark:text-dark-muted font-regular text-xs text-center mb-6 leading-5 px-2">
            Your QR pass is disabled because you have no vehicle setup yet. Please register your vehicle to enable campus parking access.
          </Text>
          <TouchableOpacity
            onPress={() => router.push("/(settings)/vehicle" as any)}
            activeOpacity={0.8}
            className="w-full bg-light-primary dark:bg-dark-primary py-3.5 px-5 rounded-2xl flex-row items-center justify-center gap-2 active:opacity-90"
          >
            <Plus size={18} color="#FFFFFF" strokeWidth={2.5} />
            <Text className="text-white font-bold text-sm tracking-wide">
              Setup Your First Vehicle
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View className="mt-7 w-full">
      {activeItem ? (
        <>
          {hasActiveSession && viewMode === "qr" && (
            <ActiveSessionBanner
              parkedCount={1}
              onPress={() => setViewMode("timer")}
            />
          )}

          <View className="bg-light-surface dark:bg-dark-surface rounded-3xl border border-light-border dark:border-dark-border overflow-hidden">
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={openPicker}
              className="flex-row items-center justify-between px-6 pt-5 pb-4 bg-light-surface dark:bg-dark-surface"
            >
              <View className="flex-row items-center flex-1 pr-2 gap-3.5">
                <View className="flex-1">
                  <View className="flex-row items-center gap-2">
                    <Text
                      className="text-light-text dark:text-dark-text font-bold text-lg tracking-wide"
                      numberOfLines={1}
                    >
                      {activeItem.plateNumber ?? "———"}
                    </Text>
                    {activeItem.isPrimary && (
                      <View className="bg-light-primary/10 dark:bg-dark-primary/22 px-2 py-0.5 rounded-md">
                        <Text className="text-light-primary dark:text-dark-primary font-bold text-[9px] uppercase tracking-wider">
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

            {hasActiveSession && viewMode === "timer" ? (
              <>
                {isFetchingSession ? (
                  <View className="py-12 items-center justify-center">
                    <ActivityIndicator size="large" color="#7B1113" />
                    <Text className="font-bold text-[11px] text-light-muted dark:text-dark-muted uppercase tracking-widest mt-3">
                      Retrieving Session Details...
                    </Text>
                  </View>
                ) : activeSession ? (
                  <ActiveSessionTimer
                    startedAt={activeSession.startedAt}
                    exitBy={activeSession.exitBy}
                    accruedCharge={
                      hasReservationToday && activeReservation?.type !== "Special" && (activeSession.accruedCharge === 0 || activeSession.accruedCharge === undefined || activeSession.accruedCharge === null)
                        ? 20
                        : (activeSession.accruedCharge ?? 0)
                    }
                    onExitPress={() => setShowExitConfirm(true)}
                  />
                ) : (
                  <View className="py-12 items-center justify-center px-6">
                    <Text className="font-bold text-sm text-light-primary dark:text-dark-primary text-center">
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
                      <ActivityIndicator size="large" color="#7B1113" />
                    </View>
                  ) : hasAccessSuspended && !hasActiveSession ? (
                    <View className="w-[230px] min-h-[220px] bg-light-danger/5 dark:bg-dark-danger/10 border border-light-danger/30 dark:border-dark-danger/30 rounded-2xl items-center justify-center p-4">
                      <View className="w-12 h-12 rounded-full bg-light-danger/10 dark:bg-dark-danger/20 items-center justify-center mb-2.5">
                        <AlertTriangle size={24} color="#7B1113" strokeWidth={2.2} />
                      </View>
                      <Text className="text-light-danger dark:text-dark-danger font-bold text-[12px] uppercase tracking-wider text-center mb-1.5">
                        Parking Access Suspended
                      </Text>
                      <Text className="text-light-muted dark:text-dark-muted font-regular text-[11px] text-center leading-relaxed mb-3.5">
                        You have reached 3 or more unsettled violation charges ({effectiveUnpaidCount} total). Entry access is suspended until outstanding penalties are settled.
                      </Text>
                      <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={() => router.push("/(settings)/violations")}
                        className="bg-light-danger dark:bg-dark-danger px-4 py-2 rounded-xl flex-row items-center gap-1.5"
                      >
                        <Text className="text-white font-bold text-[11px] uppercase tracking-wider">
                          View & Settle Charges
                        </Text>
                      </TouchableOpacity>
                    </View>
                  ) : !isVerified ? (
                    <View
                      className={`w-[230px] min-h-[220px] rounded-2xl items-center justify-center p-5 border ${
                        isItemRejected
                          ? "bg-light-danger/10 dark:bg-dark-danger/15 border-light-danger/30 dark:border-dark-danger/30"
                          : "bg-amber-500/10 dark:bg-amber-500/15 border-amber-500/30 dark:border-amber-500/40"
                      }`}
                    >
                      <View
                        className={`w-12 h-12 rounded-full items-center justify-center mb-3 ${
                          isItemRejected
                            ? "bg-light-danger/15 dark:bg-dark-danger/25"
                            : "bg-amber-500/20 dark:bg-amber-500/25"
                        }`}
                      >
                        {isItemPending ? (
                          <Clock size={24} color="#D97706" strokeWidth={2.2} />
                        ) : (
                          <ShieldAlert size={24} color={isItemRejected ? "#DC2626" : "#D97706"} strokeWidth={2.2} />
                        )}
                      </View>
                      <Text
                        className={`font-bold text-[12px] uppercase tracking-wider text-center mb-1.5 ${
                          isItemRejected
                            ? "text-light-danger dark:text-dark-danger"
                            : "text-amber-700 dark:text-amber-400"
                        }`}
                      >
                        {isItemPending
                          ? (isVehiclePending && !isCorPending
                              ? "Vehicle Verification Pending"
                              : isCorPending && !isVehiclePending
                              ? "Schedule Verification Pending"
                              : "Verification Pending")
                          : isItemRejected
                          ? (isVehicleRejected
                            ? "Vehicle Registration Rejected"
                            : "Registration Rejected")
                          : "Verification Required"}
                      </Text>
                      <Text className="text-light-muted dark:text-dark-muted font-regular text-[11px] text-center leading-relaxed">
                        {isItemPending
                          ? (isVehiclePending && !isCorPending
                              ? "Your vehicle registration and OR/CR documents are currently under review by campus administrators. Access QR will be enabled once approved."
                              : isCorPending && !isVehiclePending
                              ? "Your schedule and COR documents are currently under review by campus administrators. Access QR will be enabled once approved."
                              : "Your registration documents and vehicle are currently under review by campus administrators. Access QR is disabled until approved.")
                          : isItemRejected
                          ? isVehicleRejected
                            ? activeItem?.rejectionReason
                              ? `Reason: ${activeItem.rejectionReason}`
                              : "This vehicle's registration was rejected. Please review and update vehicle documents."
                            : user?.rejectionReason
                            ? `Reason: ${user.rejectionReason}`
                            : "Your registration documents were rejected. Please update your information to proceed."
                          : "Please complete verification and schedule setup to activate your QR pass."}
                      </Text>
                      {isItemRejected && (
                        <TouchableOpacity
                          activeOpacity={0.8}
                          onPress={() => {
                            if (isVehicleRejected) {
                              router.push("/(settings)/vehicle" as any);
                            } else {
                              router.push("/(settings)/setup-schedule" as any);
                            }
                          }}
                          className="mt-3.5 bg-red-600 active:bg-red-700 px-4 py-2 rounded-xl flex-row items-center gap-1.5"
                        >
                          <AlertTriangle size={12} color="#FFFFFF" strokeWidth={2.5} />
                          <Text className="text-white font-bold text-[11px] uppercase tracking-wider">
                            {isVehicleRejected
                              ? "Vehicle Rejected — Fix Vehicle"
                              : "Registration Rejected — Fix Documents"}
                          </Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  ) : isScheduleEndedToday && !hasActiveSession ? (
                    <View className="w-[230px] min-h-[220px] rounded-2xl items-center justify-center p-5 border bg-red-500/10 dark:bg-red-500/15 border-red-500/30 dark:border-red-500/40">
                      <View className="w-12 h-12 rounded-full items-center justify-center mb-3 bg-red-500/20 dark:bg-red-500/25">
                        <Clock size={24} color="#EF4444" strokeWidth={2.2} />
                      </View>
                      <Text className="font-bold text-[12px] uppercase tracking-wider text-center mb-1.5 text-red-600 dark:text-red-400">
                        Schedule Ended for Today
                      </Text>
                      <Text className="text-light-muted dark:text-dark-muted font-regular text-[11px] text-center leading-relaxed mb-3">
                        Your authorized schedule for today has ended. Gate entry is no longer permitted.
                      </Text>
                      <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={() => router.push("/(tabs)/schedule" as any)}
                        className="bg-red-500/20 dark:bg-red-500/30 px-3.5 py-1.5 rounded-xl border border-red-500/40 flex-row items-center gap-1.5"
                      >
                        <Text className="text-red-600 dark:text-red-300 font-bold text-[11px]">
                          View Schedule / Reserve
                        </Text>
                      </TouchableOpacity>
                    </View>
                  ) : !hasScheduleToday && !hasActiveSession ? (
                    <View className="w-[230px] min-h-[220px] rounded-2xl items-center justify-center p-5 border bg-amber-500/10 dark:bg-amber-500/15 border-amber-500/30 dark:border-amber-500/40">
                      <View className="w-12 h-12 rounded-full items-center justify-center mb-3 bg-amber-500/20 dark:bg-amber-500/25">
                        <Clock size={24} color="#D97706" strokeWidth={2.2} />
                      </View>
                      <Text className="font-bold text-[12px] uppercase tracking-wider text-center mb-1.5 text-amber-700 dark:text-amber-400">
                        No Schedule Today
                      </Text>
                      <Text className="text-light-muted dark:text-dark-muted font-regular text-[11px] text-center leading-relaxed mb-3">
                        You do not have any registered classes or authorized parking schedules for today. Campus gate access is restricted.
                      </Text>
                      <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={() => router.push("/(tabs)/schedule" as any)}
                        className="bg-amber-500/20 dark:bg-amber-500/30 px-3.5 py-1.5 rounded-xl border border-amber-500/40 flex-row items-center gap-1.5"
                      >
                        <Text className="text-amber-700 dark:text-amber-300 font-bold text-[11px]">
                          View Schedule / Reserve
                        </Text>
                      </TouchableOpacity>
                    </View>
                  ) : activeItem.qrCodeHash ? (
                    <View className="items-center">
                      {effectiveUnpaidCount > 0 && effectiveUnpaidCount < 3 && (
                        <View className="mb-3 px-3.5 py-1.5 rounded-xl bg-amber-500/10 dark:bg-amber-500/15 border border-amber-500/30 flex-row items-center gap-1.5">
                          <AlertTriangle size={12} color="#D97706" strokeWidth={2.5} />
                          <Text className="text-amber-700 dark:text-amber-400 font-semibold text-[11px]">
                            {effectiveUnpaidCount} of 3 unpaid violations (Entry permitted)
                          </Text>
                        </View>
                      )}
                      <TouchableOpacity
                        activeOpacity={0.88}
                        onPress={() => setIsZoomed(true)}
                        className="bg-white p-4 rounded-2xl relative items-center justify-center overflow-hidden border border-light-border dark:border-dark-border"
                      >
                        <QRCodeSvg value={activeItem.qrCodeHash} size={175} />
                        <View className="absolute bottom-2 right-2 bg-slate-900/70 p-1.5 rounded-full">
                          <Maximize2 size={12} color="#FFFFFF" strokeWidth={2.5} />
                        </View>
                      </TouchableOpacity>

                      {/* Download QR Action */}
                      <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={() => downloadQrImage(activeItem.qrCodeHash)}
                        className="bg-light-primary/10 dark:bg-dark-primary/20 mt-3 py-1.5 px-3.5 rounded-full flex-row items-center gap-1.5 border border-light-primary/30 dark:border-dark-primary/40"
                      >
                        <Download size={12} color="#7B1113" strokeWidth={2.5} />
                        <Text className="text-light-primary dark:text-dark-primary font-bold text-[11px]">
                          Download QR
                        </Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <View className="w-[190px] h-[190px] rounded-2xl bg-light-surfaceLighter dark:bg-dark-surfaceLighter items-center justify-center border border-dashed border-light-border dark:border-dark-border">
                      <QrCode size={44} color="#64748B" strokeWidth={1.2} />
                      {hasHydrated && !isLoading && !activeItem.qrCodeHash ? (
                        <Text className="font-bold text-xs mt-3 text-light-muted dark:text-dark-muted">
                          QR Code Unavailable
                        </Text>
                      ) : null}
                    </View>
                  )}
                </View>

                {hasActiveSession && viewMode === "qr" && (
                  <View className="items-center pb-4">
                    <TouchableOpacity
                      activeOpacity={0.7}
                      onPress={() => setViewMode("timer")}
                      className="flex-row items-center justify-center gap-1.5 py-1.5 px-4 bg-light-surfaceLighter dark:bg-dark-surfaceLighter rounded-full"
                    >
                      <Clock size={13} color="#7B1113" strokeWidth={2.5} />
                      <Text className="text-light-primary dark:text-dark-primary font-bold text-xs uppercase tracking-wider">
                        View Live Session
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}

                {instructionRow}

                <View className="px-6 pb-5 pt-4 bg-light-surfaceLighter/40 dark:bg-dark-surfaceLighter/20 border-t border-light-border/40 dark:border-dark-border/40">
                  <View className="flex-row items-center justify-between">
                    <View>
                      <Text className="text-[12px] font-bold text-light-muted dark:text-dark-muted tracking-wider">
                        Date
                      </Text>
                      <Text className="text-light-text dark:text-dark-text font-bold text-[13px] mt-0.5">
                        {formattedDate}
                      </Text>
                    </View>
                    <View className="items-end">
                      <Text className="text-[12px] font-bold text-light-muted dark:text-dark-muted tracking-wider">
                        Schedule
                      </Text>
                      <Text className="text-light-text dark:text-dark-text font-bold text-[13px] mt-0.5">
                        {scheduleDisplay}
                      </Text>
                    </View>
                  </View>
                </View>
              </>
            )}
          </View>

          {/* Fullscreen QR Zoom Modal */}
          <Modal
            visible={isZoomed}
            transparent
            animationType="fade"
            onRequestClose={() => setIsZoomed(false)}
          >
            <View className="flex-1 items-center justify-center p-6 relative">
              {Platform.OS === "ios" ? (
                <BlurView
                  intensity={60}
                  tint="dark"
                  style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
                />
              ) : null}
              <View className="absolute inset-0 bg-black/80" />

              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setIsZoomed(false)}
                className="absolute top-12 right-6 w-11 h-11 rounded-full bg-white/20 items-center justify-center z-50"
              >
                <X size={22} color="#FFFFFF" strokeWidth={2.5} />
              </TouchableOpacity>

              <View className="bg-white p-6 rounded-3xl items-center border border-white/20 z-10">
                {activeItem?.qrCodeHash ? (
                  <QRCodeSvg value={activeItem.qrCodeHash} size={250} />
                ) : (
                  <View className="w-[250px] h-[250px] items-center justify-center">
                    <ActivityIndicator size="large" color="#7B1113" />
                  </View>
                )}
                <Text className="text-slate-900 font-bold text-lg mt-4 font-mono tracking-wider">
                  {activeItem?.plateNumber ?? "———"}
                </Text>
                <Text className="text-slate-500 font-regular text-xs mt-0.5">
                  {activeItem?.brand ?? "Registered Vehicle"}
                </Text>
              </View>

              <View className="flex-row items-center gap-3 mt-6 z-10">
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => {
                    if (activeItem?.qrCodeHash) {
                      downloadQrImage(activeItem.qrCodeHash);
                    }
                  }}
                  className="bg-light-primary dark:bg-dark-primary py-3.5 px-5 rounded-2xl flex-row items-center gap-2"
                >
                  <Download size={16} color="#FFFFFF" strokeWidth={2.5} />
                  <Text className="text-white font-bold text-xs tracking-wide">
                    Download QR Image
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => setIsZoomed(false)}
                  className="bg-white/15 py-3.5 px-5 rounded-2xl flex-row items-center gap-2"
                >
                  <Text className="text-white font-bold text-xs tracking-wide">
                    Close View
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>

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
