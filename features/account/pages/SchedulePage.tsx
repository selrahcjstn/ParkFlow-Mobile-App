import React, { useState, useMemo, useEffect, useCallback } from "react";
import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  RefreshControl,
  Linking,
  Share,
} from "react-native";
import * as WebBrowser from "expo-web-browser";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router, useNavigation, useFocusEffect } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { ReservationService } from "@/features/schedule/services/reservation.service";
import ReservationAvailabilityNotice from "@/features/schedule/components/ReservationAvailabilityNotice";
import QRCodeSvg from "react-native-qrcode-svg";
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  Download,
  CheckCircle2,
  Calendar as CalendarIcon,
  ShieldCheck,
  AlertCircle,
  Copy,
  Check,
  Share2,
  ArrowRight,
  Ban,
  Plus,
  QrCode,
  ListFilter,
  CheckCircle,
} from "lucide-react-native";
import { MotorcycleIcon } from "@/components/ui/MotorcycleIcon";
import { useVehicleStore } from "@/features/user/store/vehicle.store";
import { useAuthStore } from "@/features/auth/store/auth.store";
import {
  useReservationStore,
  isReservationDone,
} from "@/features/schedule/store/reservation.store";
import {
  ReservationStatus,
  ParkingReservationResponse,
} from "@/features/schedule/types/reservation.types";
import { useAppTheme } from "@/hooks/useAppTheme";
import { useVerificationGuard } from "@/hooks/useVerificationGuard";
import { formatDate } from "@/utils/formatDate";
import { formatTime } from "@/utils/formatTime";
import { appDialog } from "@/services/app-dialog";
import AppDialog from "@/components/shared/AppDialog";

type ViewMode = "list" | "create" | "pass";
type StatusFilter = "all" | "active" | "pending" | "completed";

function parse12hTo24hTime(timeStr: string): string {
  const match = timeStr.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return "08:00:00";
  let hours = parseInt(match[1], 10);
  const minutes = match[2];
  const period = match[3].toUpperCase();
  if (period === "PM" && hours < 12) hours += 12;
  if (period === "AM" && hours === 12) hours = 0;
  return `${hours.toString().padStart(2, "0")}:${minutes}:00`;
}

function showAlert(title: string, message: string, variant: "success" | "error" = "error") {
  appDialog.show(title, message, undefined, { variant });
}

const QUICK_REASONS = [
  "Academic Consultation",
  "Thesis Defense / Panel",
  "Special Class / Lab Work",
  "Department Meeting",
  "Official University Event",
];

const PRESET_TIMES = [
  { label: "Morning", start: "7:30 AM", end: "12:00 PM" },
  { label: "Afternoon", start: "1:00 PM", end: "5:30 PM" },
  { label: "Full Day", start: "8:00 AM", end: "5:00 PM" },
  { label: "Custom", start: "8:30 AM", end: "4:00 PM" },
];

const COMMON_TIMES = [
  "6:30 AM",
  "7:00 AM",
  "7:30 AM",
  "8:00 AM",
  "8:30 AM",
  "9:00 AM",
  "10:00 AM",
  "11:30 AM",
  "12:00 PM",
  "1:00 PM",
  "2:30 PM",
  "3:30 PM",
  "4:00 PM",
  "5:00 PM",
  "5:30 PM",
  "6:30 PM",
  "7:00 PM",
  "8:00 PM",
];

interface SchedulePageProps {
  route?: {
    params?: {
      tab?: string;
      filter?: string;
    };
  };
  tab?: string;
  filter?: string;
}

export default function SchedulePage({ route, tab, filter }: SchedulePageProps) {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { colors, isDark } = useAppTheme();

  const searchTab = route?.params?.tab || tab;
  const searchFilter = route?.params?.filter || filter;

  const { vehicle, vehicles, loadVehicle } = useVehicleStore();
  const { user } = useAuthStore();
  const {
    reservations,
    activeReservation,
    fetchMyReservations,
    createReservation,
    cancelReservation,
    isSubmitting: storeSubmitting,
  } = useReservationStore();

  const {
    state: verificationState,
    isApproved: isVerified,
    title: verificationTitle,
    noticeMessage: verificationNotice,
    checkAccessOrRedirect,
    navigateToVerification,
    refreshUserStatus,
  } = useVerificationGuard();

  const handleRequestReservation = () => {
    checkAccessOrRedirect(() => {
      setViewMode("create");
    }, "reservations");
  };

  // Primary Navigation
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    if (searchTab === "create") return "create";
    if (searchTab === "pass") return "pass";
    return "list";
  });
  const [statusFilter, setStatusFilter] = useState<StatusFilter>(() => {
    return (searchFilter as StatusFilter) || "all";
  });

  // Selected vehicle for reservation
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);
  const [selectedPassId, setSelectedPassId] = useState<string | null>(null);

  useEffect(() => {
    loadVehicle();
    fetchMyReservations();
  }, []);

  useEffect(() => {
    if (vehicle && !selectedVehicleId) {
      setSelectedVehicleId(vehicle.id);
    } else if (vehicles.length > 0 && !selectedVehicleId) {
      setSelectedVehicleId(vehicles[0].id);
    }
  }, [vehicle, vehicles, selectedVehicleId]);

  const activeVehicle = useMemo(() => {
    return vehicles.find((v) => v.id === selectedVehicleId) || vehicle;
  }, [vehicles, selectedVehicleId, vehicle]);

  // Reservation counts & categories
  const activeReservations = useMemo(
    () => reservations.filter((r) => r.status === ReservationStatus.Approved && !isReservationDone(r)),
    [reservations],
  );
  const pendingReservations = useMemo(
    () => reservations.filter((r) => r.status === ReservationStatus.Pending && !isReservationDone(r)),
    [reservations],
  );
  const completedReservations = useMemo(
    () => reservations.filter((r) => isReservationDone(r)),
    [reservations],
  );

  // Filtered reservations for list view
  const filteredReservations = useMemo(() => {
    if (statusFilter === "active") return activeReservations;
    if (statusFilter === "pending") return pendingReservations;
    if (statusFilter === "completed") return completedReservations;
    return reservations;
  }, [reservations, statusFilter, activeReservations, pendingReservations, completedReservations]);

  // Selected reservation for Pass view
  const selectedPassReservation: ParkingReservationResponse | null = useMemo(() => {
    if (selectedPassId) {
      return reservations.find((r) => r.id === selectedPassId) || null;
    }
    return activeReservation || reservations[0] || null;
  }, [selectedPassId, reservations, activeReservation]);

  const isSelectedPassDone = selectedPassReservation
    ? isReservationDone(selectedPassReservation)
    : false;

  const getInitialDay = () => {
    const tmrw = new Date();
    tmrw.setDate(tmrw.getDate() + 1);
    return tmrw.getDate();
  };

  // Form State
  const [selectedDay, setSelectedDay] = useState<number>(getInitialDay());
  const [startTime, setStartTime] = useState<string>("8:30 AM");
  const [endTime, setEndTime] = useState<string>("4:00 PM");
  const [reason, setReason] = useState<string>("Academic Consultation");
  const [selectedPreset, setSelectedPreset] = useState<string>("Custom");
  const [dateError, setDateError] = useState<string | null>(null);

  // Modals & Feedback
  const [showReviewModal, setShowReviewModal] = useState<boolean>(false);
  const [showCancelModal, setShowCancelModal] = useState<boolean>(false);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [showSuccessToast, setShowSuccessToast] = useState<boolean>(false);
  const [timePickerTarget, setTimePickerTarget] = useState<"start" | "end" | null>(null);
  const [copiedRef, setCopiedRef] = useState<boolean>(false);
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([fetchMyReservations(), loadVehicle()]);
    } catch {
      // ignore
    } finally {
      setRefreshing(false);
    }
  }, [fetchMyReservations, loadVehicle]);

  // Month navigation
  const [currentMonthIndex, setCurrentMonthIndex] = useState<number>(new Date().getMonth());
  const currentYear = new Date().getFullYear();
  const months = [
    `January ${currentYear}`,
    `February ${currentYear}`,
    `March ${currentYear}`,
    `April ${currentYear}`,
    `May ${currentYear}`,
    `June ${currentYear}`,
    `July ${currentYear}`,
    `August ${currentYear}`,
    `September ${currentYear}`,
    `October ${currentYear}`,
    `November ${currentYear}`,
    `December ${currentYear}`,
  ];
  const currentMonth = months[currentMonthIndex] || `September ${currentYear}`;

  const daysInCurrentMonthCount = useMemo(() => {
    return new Date(currentYear, currentMonthIndex + 1, 0).getDate();
  }, [currentMonthIndex, currentYear]);

  useEffect(() => {
    if (selectedDay > daysInCurrentMonthCount) {
      setSelectedDay(daysInCurrentMonthCount);
    }
  }, [daysInCurrentMonthCount, selectedDay]);

  const leadingDays = useMemo(() => {
    const firstDay = new Date(currentYear, currentMonthIndex, 1).getDay();
    const leadingCount = (firstDay + 6) % 7;
    const prevMonthDays = new Date(currentYear, currentMonthIndex, 0).getDate();
    return Array.from({ length: leadingCount }, (_, i) => prevMonthDays - leadingCount + 1 + i);
  }, [currentMonthIndex, currentYear]);

  const daysInMonth = useMemo(
    () => Array.from({ length: daysInCurrentMonthCount }, (_, i) => i + 1),
    [daysInCurrentMonthCount],
  );

  const calendarRows = useMemo(() => {
    const allCells: Array<{ type: "prev" | "current" | "next"; day: number }> = [];
    leadingDays.forEach((d) => allCells.push({ type: "prev", day: d }));
    daysInMonth.forEach((d) => allCells.push({ type: "current", day: d }));

    const remainder = allCells.length % 7;
    if (remainder !== 0) {
      const trailingCount = 7 - remainder;
      for (let i = 1; i <= trailingCount; i++) {
        allCells.push({ type: "next", day: i });
      }
    }

    const rows: Array<typeof allCells> = [];
    for (let i = 0; i < allCells.length; i += 7) {
      rows.push(allCells.slice(i, i + 7));
    }
    return rows;
  }, [leadingDays, daysInMonth]);

  const getISOForDay = (dayNum: number) => {
    const mStr = (currentMonthIndex + 1).toString().padStart(2, "0");
    const dStr = dayNum.toString().padStart(2, "0");
    return `${currentYear}-${mStr}-${dStr}`;
  };

  const getTodayISO = () => {
    const today = new Date();
    const mStr = (today.getMonth() + 1).toString().padStart(2, "0");
    const dStr = today.getDate().toString().padStart(2, "0");
    return `${today.getFullYear()}-${mStr}-${dStr}`;
  };

  const getExistingReservationForDate = useCallback(
    (dateISO: string) => {
      return reservations.find((r) => {
        const rDate = r.reservationDate?.split("T")[0];
        return (
          rDate === dateISO &&
          r.status !== ReservationStatus.Cancelled &&
          r.status !== ReservationStatus.Rejected
        );
      });
    },
    [reservations],
  );

  const selectedDateISO = useMemo(
    () => getISOForDay(selectedDay),
    [selectedDay, currentMonthIndex, currentYear],
  );
  const todayISO = useMemo(() => getTodayISO(), [currentMonthIndex, currentYear]);
  const isPastSelected = selectedDateISO <= todayISO;
  const [focused, setFocused] = useState(false);
  useFocusEffect(useCallback(() => {
    setFocused(true);
    return () => setFocused(false);
  }, []));
  const start24 = parse12hTo24hTime(startTime);
  const end24 = parse12hTo24hTime(endTime);
  const validAvailabilityRange = !isPastSelected && start24 < end24;
  const availability = useQuery({
    queryKey: ["reservation-availability", selectedDateISO, start24, end24],
    queryFn: async () => {
      const result = await ReservationService.getAvailability(selectedDateISO, start24, end24);
      if (!result.isSuccess || !result.data) throw new Error(result.message || "Could not check capacity.");
      return result.data;
    },
    enabled: focused && viewMode === "create" && validAvailabilityRange,
    staleTime: 10000,
    refetchInterval: focused && viewMode === "create" && validAvailabilityRange ? 30000 : false,
    retry: 1,
  });
  const capacityUnavailable = !validAvailabilityRange || availability.isPending || availability.isError || !availability.data || availability.data.availableSlots === 0;
  const existingReservationForSelectedDate = useMemo(
    () => getExistingReservationForDate(selectedDateISO),
    [getExistingReservationForDate, selectedDateISO],
  );

  const handleSelectDay = (day: number) => {
    const targetISO = getISOForDay(day);
    const todayStr = getTodayISO();
    const monthName = months[currentMonthIndex].split(" ")[0];

    if (targetISO <= todayStr) {
      setDateError(`Reservations must be booked at least 1 day in advance. Same-day bookings on ${monthName} ${day} are not available.`);
      setSelectedDay(day);
      return;
    }

    const existingRes = getExistingReservationForDate(targetISO);
    if (existingRes) {
      const isApproved = existingRes.status === ReservationStatus.Approved;
      const isCompleted = existingRes.status === ReservationStatus.Completed;
      setDateError(
        `You already have ${isApproved ? "an active/approved" : isCompleted ? "a used/completed" : "a pending"} reservation (${existingRes.referenceNumber}) on ${monthName} ${day}. Only one reservation per day is permitted.`
      );
    } else {
      setDateError(null);
    }

    setSelectedDay(day);
  };

  const handleApplyPreset = (preset: (typeof PRESET_TIMES)[0]) => {
    setSelectedPreset(preset.label);
    setStartTime(preset.start);
    setEndTime(preset.end);
  };

  const handleOpenReview = () => {
    if (storeSubmitting) return;
    if (capacityUnavailable) {
      setDateError(availability.data?.availableSlots === 0 ? "Fully booked for this time range. Choose another time or date." : "Check reservation availability before continuing.");
      return;
    }

    const targetISO = getISOForDay(selectedDay);
    const todayStr = getTodayISO();
    const monthName = months[currentMonthIndex].split(" ")[0];

    if (targetISO <= todayStr) {
      setDateError("Reservations must be booked at least 1 day in advance. Please select tomorrow or a future date.");
      return;
    }

    const existingRes = getExistingReservationForDate(targetISO);
    if (existingRes) {
      const isApproved = existingRes.status === ReservationStatus.Approved;
      setDateError(
        `You already have ${isApproved ? "an active/approved" : "a pending"} reservation (${existingRes.referenceNumber}) on ${monthName} ${selectedDay}. Only one reservation per day is allowed.`
      );
      return;
    }

    const startTime24 = parse12hTo24hTime(startTime);
    const endTime24 = parse12hTo24hTime(endTime);

    if (startTime24 >= endTime24) {
      setDateError("Exit time must be after entry time (e.g. 8:30 AM to 4:00 PM).");
      return;
    }

    if (!reason.trim()) {
      setReason("Academic Consultation");
    }

    setDateError(null);
    setShowReviewModal(true);
  };

  const handleConfirmSubmit = async () => {
    if (storeSubmitting) return;
    if (capacityUnavailable) {
      setShowReviewModal(false);
      setDateError("Reservation availability changed. Please check the selected time again.");
      return;
    }

    const reservationDate = getISOForDay(selectedDay);
    const monthName = months[currentMonthIndex].split(" ")[0];

    const existingRes = getExistingReservationForDate(reservationDate);
    if (existingRes) {
      setShowReviewModal(false);
      setDateError(
        `You already have a reservation on ${monthName} ${selectedDay} (${existingRes.referenceNumber}). Only one reservation per day is allowed.`
      );
      return;
    }

    const startTime24 = parse12hTo24hTime(startTime);
    const endTime24 = parse12hTo24hTime(endTime);

    const res = await createReservation({
      reservationDate,
      startTime: startTime24,
      endTime: endTime24,
      reason: reason.trim() || "Academic Consultation",
      vehicleId: selectedVehicleId || vehicle?.id || null,
    });

    setShowReviewModal(false);
    if (res.success) {
      const capacity = res.data?.availability;
      if (capacity) showAlert("Reservation submitted", `Your request is pending approval. Peak bookings for this time range: ${capacity.bookedSlots} of ${capacity.reservationCapacity}. ${capacity.availableSlots} reservation spaces remain available.`, "success");
      setViewMode("list");
      setStatusFilter("all");
    } else {
      void availability.refetch();
      setDateError(res.message || "Could not submit reservation request.");
    }
  };

  const handleOpenCancelModal = (resId?: string) => {
    setCancellingId(resId || activeReservation?.id || null);
    setShowCancelModal(true);
  };

  const handleConfirmCancel = async () => {
    const targetId = cancellingId || activeReservation?.id;
    setShowCancelModal(false);
    if (targetId) {
      const res = await cancelReservation(targetId);
      if (!res.success) {
        showAlert("Cancellation Failed", res.message || "Could not cancel reservation.");
        return;
      }
    }
    setCancellingId(null);
  };

  const handleCopyRef = (refNum: string) => {
    setCopiedRef(true);
    setTimeout(() => setCopiedRef(false), 2000);
  };

  const handleDownloadQr = async () => {
    if (!selectedPassReservation || isSelectedPassDone) return;

    const qrData =
      selectedPassReservation.referenceNumber ||
      selectedPassReservation.vehicleQrCodeHash ||
      "PARKFLOW-RESERVATION-PASS";
    const label = selectedPassReservation.referenceNumber || "Pass QR Code";
    const url = `https://api.qrserver.com/v1/create-qr-code/?size=600x600&data=${encodeURIComponent(qrData)}`;

    setShowSuccessToast(true);
    setTimeout(() => setShowSuccessToast(false), 3000);

    try {
      if (Platform.OS === "web") {
        await Linking.openURL(url);
      } else {
        await WebBrowser.openBrowserAsync(url).catch(async () => {
          await Share.share({
            title: `ParkFlow Gate QR Pass - ${label}`,
            message: `ParkFlow Gate QR Pass (${label}): ${url}`,
            url: url,
          });
        });
      }
    } catch {
      Linking.openURL(url).catch(() => {});
    }
  };

  return (
    <View className="flex-1 bg-light-background dark:bg-dark-background">
      {/* ─── Corporate Segmented Navigation Bar ─────────────────────────────── */}
      <View className="bg-light-surface dark:bg-dark-surface px-4 py-2 border-b border-light-border dark:border-dark-border">
        <View className="flex-row p-1 bg-light-surfaceMuted dark:bg-dark-surfaceMuted rounded-xl border border-light-border/60 dark:border-dark-border/60">
          <TouchableOpacity
            onPress={() => setViewMode("list")}
            activeOpacity={0.8}
            className={`flex-1 py-2 rounded-lg flex-row items-center justify-center gap-1.5 ${
              viewMode === "list"
                ? "bg-light-surface dark:bg-dark-surface shadow-2xs border border-light-border/80 dark:border-dark-border/80"
                : ""
            }`}
          >
            <ListFilter
              size={13}
              color={viewMode === "list" ? (isDark ? "#E25C65" : "#7B1113") : "#71717A"}
              strokeWidth={2.2}
            />
            <Text
              className={`text-[12px] font-bold ${
                viewMode === "list"
                  ? "text-light-text dark:text-dark-text"
                  : "text-light-muted dark:text-dark-muted"
              }`}
            >
              My Reservations ({reservations.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleRequestReservation}
            activeOpacity={0.8}
            className={`flex-1 py-2 rounded-lg flex-row items-center justify-center gap-1.5 ${
              viewMode === "create"
                ? "bg-light-surface dark:bg-dark-surface shadow-2xs border border-light-border/80 dark:border-dark-border/80"
                : ""
            }`}
          >
            <Plus
              size={13}
              color={viewMode === "create" ? (isDark ? "#E25C65" : "#7B1113") : "#71717A"}
              strokeWidth={2.5}
            />
            <Text
              className={`text-[12px] font-bold ${
                viewMode === "create"
                  ? "text-light-text dark:text-dark-text"
                  : "text-light-muted dark:text-dark-muted"
              }`}
            >
              New Reservation
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ─── Scrollable Content ────────────────────────────────────────────── */}
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 24) + 36 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={["#7B1113"]}
            tintColor={isDark ? "#FFFFFF" : "#7B1113"}
          />
        }
      >
        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* VIEW 1: RESERVATIONS LIST                                       */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        {viewMode === "list" && (
          <View className="px-4 pt-3.5">
            {/* Account Verification Warning Banner */}
            {!isVerified && (
              <View className="bg-light-surface dark:bg-dark-surface rounded-2xl p-4 mb-3.5 border border-amber-500/30">
                <View className="flex-row items-start gap-3 mb-2.5">
                  <View className="w-8 h-8 rounded-lg bg-amber-500/10 items-center justify-center mt-0.5">
                    <Clock size={16} color="#D97706" strokeWidth={2.2} />
                  </View>
                  <View className="flex-1">
                    <Text className="text-light-text dark:text-dark-text font-bold text-[13px]">
                      {verificationTitle}
                    </Text>
                    <Text className="text-light-muted dark:text-dark-muted font-regular text-[11px] mt-0.5 leading-relaxed">
                      {verificationNotice}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={verificationState === "pending" ? refreshUserStatus : navigateToVerification}
                  className="py-2 px-3 rounded-xl bg-amber-500/10 border border-amber-500/20 items-center"
                >
                  <Text className="text-amber-800 dark:text-amber-400 font-bold text-[11px]">
                    {verificationState === "pending" ? "Refresh Verification Status" : "Complete Account Verification"}
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Corporate Overview Card */}
            <View className="bg-light-surface dark:bg-dark-surface rounded-2xl p-4 mb-3.5 border border-light-border dark:border-dark-border">
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center gap-2.5">
                  <View className="w-9 h-9 rounded-xl bg-light-surfaceMuted dark:bg-dark-surfaceMuted items-center justify-center border border-light-border dark:border-dark-border">
                    <MotorcycleIcon size={20} color={isDark ? "#E25C65" : "#7B1113"} />
                  </View>
                  <View>
                    <Text className="text-[13.5px] font-bold text-light-text dark:text-dark-text">
                      Motorcycle Reservations
                    </Text>
                    <Text className="text-[11px] font-regular text-light-muted dark:text-dark-muted">
                      {activeReservations.length} Active • {pendingReservations.length} Pending • {completedReservations.length} Past
                    </Text>
                  </View>
                </View>

                <TouchableOpacity
                  onPress={handleRequestReservation}
                  activeOpacity={0.85}
                  className="bg-[#7B1113] dark:bg-[#A50000] px-3.5 py-1.5 rounded-lg flex-row items-center gap-1.5"
                >
                  <Plus size={13} color="#FFFFFF" strokeWidth={2.5} />
                  <Text className="text-white text-[11.5px] font-bold">New</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Minimal Filter Chips */}
            <View className="flex-row gap-1.5 mb-3.5 flex-wrap">
              {(
                [
                  { id: "all", label: `All (${reservations.length})` },
                  { id: "active", label: `Active (${activeReservations.length})` },
                  { id: "pending", label: `Pending (${pendingReservations.length})` },
                  { id: "completed", label: `Completed (${completedReservations.length})` },
                ] as const
              ).map((chip) => {
                const isSelected = statusFilter === chip.id;
                return (
                  <TouchableOpacity
                    key={chip.id}
                    onPress={() => setStatusFilter(chip.id)}
                    activeOpacity={0.7}
                    className={`px-3 py-1.5 rounded-lg border ${
                      isSelected
                        ? "bg-light-text dark:bg-dark-text border-light-text dark:border-dark-text"
                        : "bg-light-surface dark:bg-dark-surface border-light-border dark:border-dark-border"
                    }`}
                  >
                    <Text
                      className={`text-[11px] font-bold ${
                        isSelected
                          ? "text-light-surface dark:text-dark-surface"
                          : "text-light-muted dark:text-dark-muted"
                      }`}
                    >
                      {chip.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Reservations List */}
            {filteredReservations.length === 0 ? (
              <View className="py-12 items-center justify-center bg-light-surface dark:bg-dark-surface rounded-2xl border border-light-border dark:border-dark-border p-6">
                <MotorcycleIcon size={34} color="#A1A1AA" />
                <Text className="text-light-text dark:text-dark-text font-bold text-[13.5px] mt-3">
                  No Reservations Found
                </Text>
                <Text className="text-light-muted dark:text-dark-muted font-regular text-[11.5px] text-center mt-1 mb-4">
                  {statusFilter === "all"
                    ? "You haven't requested any parking reservations yet."
                    : "No reservations found under this filter category."}
                </Text>
                <TouchableOpacity
                  onPress={handleRequestReservation}
                  activeOpacity={0.85}
                  className="bg-[#7B1113] px-4 py-2 rounded-xl flex-row items-center gap-1.5"
                >
                  <Plus size={13} color="#FFFFFF" strokeWidth={2.5} />
                  <Text className="text-white font-bold text-[11.5px]">Request Parking Spot</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View className="gap-2.5">
                {filteredReservations.map((item) => {
                  const isDone = isReservationDone(item);
                  const isApproved = item.status === ReservationStatus.Approved;
                  const isPending = item.status === ReservationStatus.Pending;
                  const isCancelled = item.status === ReservationStatus.Cancelled;
                  const isRejected = item.status === ReservationStatus.Rejected;

                  return (
                    <View
                      key={item.id}
                      className={`bg-light-surface dark:bg-dark-surface rounded-xl p-3.5 border ${
                        isDone
                          ? "border-light-border dark:border-dark-border opacity-75"
                          : isApproved
                          ? "border-emerald-500/30 dark:border-emerald-500/20"
                          : isPending
                          ? "border-amber-500/30 dark:border-amber-500/20"
                          : "border-light-border dark:border-dark-border"
                      }`}
                    >
                      {/* Top Header: Status & Date */}
                      <View className="flex-row items-center justify-between mb-2">
                        {/* Status Tag */}
                        {isApproved && !isDone && item.status !== ReservationStatus.Completed && (
                          <View className="px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 flex-row items-center gap-1">
                            <CheckCircle2 size={11} color="#16A34A" strokeWidth={2.4} />
                            <Text className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wide">
                              Active Pass
                            </Text>
                          </View>
                        )}

                        {(item.status === ReservationStatus.Completed || (isApproved && isDone)) && (
                          <View className="px-2 py-0.5 rounded-md bg-zinc-500/10 border border-zinc-500/20 flex-row items-center gap-1">
                            <Clock size={11} color="#71717A" strokeWidth={2.4} />
                            <Text className="text-[10px] font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-wide">
                              Completed / Void
                            </Text>
                          </View>
                        )}

                        {isPending && (
                          <View className="px-2 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/20 flex-row items-center gap-1">
                            <Clock size={11} color="#D97706" strokeWidth={2.4} />
                            <Text className="text-[10px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wide">
                              Pending Review
                            </Text>
                          </View>
                        )}

                        {isCancelled && (
                          <View className="px-2 py-0.5 rounded-md bg-zinc-500/10 border border-zinc-500/20 flex-row items-center gap-1">
                            <Ban size={11} color="#71717A" strokeWidth={2.4} />
                            <Text className="text-[10px] font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-wide">
                              Cancelled
                            </Text>
                          </View>
                        )}

                        {isRejected && (
                          <View className="px-2 py-0.5 rounded-md bg-rose-500/10 border border-rose-500/20 flex-row items-center gap-1">
                            <AlertCircle size={11} color="#E11D48" strokeWidth={2.4} />
                            <Text className="text-[10px] font-bold text-rose-700 dark:text-rose-400 uppercase tracking-wide">
                              Declined
                            </Text>
                          </View>
                        )}

                        <Text className="text-[11px] font-medium text-light-muted dark:text-dark-muted">
                          {formatDate(item.reservationDate)}
                        </Text>
                      </View>

                      {/* Reference & Motorcycle */}
                      <View className="flex-row items-center justify-between mb-2">
                        <View className="flex-row items-center gap-1.5">
                          <MotorcycleIcon size={16} color={isDark ? "#A1A1AA" : "#52525B"} />
                          <Text className="text-[13px] font-bold text-light-text dark:text-dark-text">
                            {item.brand ? `${item.brand} • ` : ""}
                            <Text className="font-mono text-[12px]">{item.plateNumber || "Registered Motor"}</Text>
                          </Text>
                        </View>
                        <Text className="text-[11px] font-mono font-medium text-light-muted dark:text-dark-muted">
                          {item.referenceNumber}
                        </Text>
                      </View>

                      {/* Time & Reason Row */}
                      <View className="bg-light-surfaceMuted dark:bg-dark-surfaceMuted rounded-lg p-2.5 mb-2.5 border border-light-border/60 dark:border-dark-border/60">
                        <View className="flex-row items-center justify-between mb-1">
                          <View className="flex-row items-center gap-1">
                            <Clock size={12} color="#71717A" strokeWidth={2} />
                            <Text className="text-[11.5px] font-bold text-light-text dark:text-dark-text">
                              {formatTime(item.startTime)} – {formatTime(item.endTime)}
                            </Text>
                          </View>
                          {item.type === "Special" || item.type === 1 ? (
                            <Text className="text-[10px] font-bold text-[#7B1113] dark:text-[#E25C65] uppercase">
                              Special Pass
                            </Text>
                          ) : null}
                        </View>
                        <Text className="text-[11px] font-regular text-light-muted dark:text-dark-muted" numberOfLines={2}>
                          {item.reason}
                        </Text>
                        {item.adminNotes ? (
                          <Text className="text-[10.5px] font-book text-amber-700 dark:text-amber-400 mt-1 italic">
                            Note: {item.adminNotes}
                          </Text>
                        ) : null}
                      </View>

                      {/* Action Buttons */}
                      <View className="flex-row items-center gap-2">
                        {isApproved && !isDone && (
                          <TouchableOpacity
                            onPress={() => {
                              setSelectedPassId(item.id);
                              setViewMode("pass");
                            }}
                            activeOpacity={0.85}
                            className="flex-1 py-2 rounded-lg bg-[#7B1113] dark:bg-[#A50000] flex-row items-center justify-center gap-1.5"
                          >
                            <QrCode size={13} color="#FFFFFF" strokeWidth={2.2} />
                            <Text className="text-[11.5px] font-bold text-white">
                              View Gate QR Pass
                            </Text>
                          </TouchableOpacity>
                        )}

                        {isApproved && isDone && (
                          <TouchableOpacity
                            onPress={() => {
                              setSelectedPassId(item.id);
                              setViewMode("pass");
                            }}
                            activeOpacity={0.8}
                            className="flex-1 py-1.5 rounded-lg bg-light-surfaceMuted dark:bg-dark-surfaceMuted border border-light-border dark:border-dark-border flex-row items-center justify-center gap-1.5"
                          >
                            <Text className="text-[11.5px] font-bold text-light-muted dark:text-dark-muted">
                              View Pass Summary
                            </Text>
                          </TouchableOpacity>
                        )}

                        {isPending && (
                          <>
                            <TouchableOpacity
                              onPress={() => {
                                setSelectedPassId(item.id);
                                setViewMode("pass");
                              }}
                              activeOpacity={0.8}
                              className="flex-1 py-1.5 rounded-lg bg-light-surfaceMuted dark:bg-dark-surfaceMuted border border-light-border dark:border-dark-border flex-row items-center justify-center"
                            >
                              <Text className="text-[11.5px] font-bold text-light-text dark:text-dark-text">
                                Details
                              </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                              onPress={() => handleOpenCancelModal(item.id)}
                              activeOpacity={0.8}
                              className="px-3 py-1.5 rounded-lg bg-rose-500/10 border border-rose-500/20"
                            >
                              <Text className="text-[11px] font-bold text-rose-700 dark:text-rose-400">
                                Cancel
                              </Text>
                            </TouchableOpacity>
                          </>
                        )}
                      </View>
                    </View>
                  );
                })}
              </View>
            )}
          </View>
        )}

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* VIEW 2: NEW RESERVATION FORM                                    */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        {viewMode === "create" && (
          <View className="px-4 pt-3.5">
            {/* Header */}
            <View className="mb-3.5">
              <Text className="text-light-text dark:text-dark-text font-bold text-[18px]">
                New Parking Reservation
              </Text>
              <Text className="text-light-muted dark:text-dark-muted font-regular text-[12px] mt-0.5">
                Reserve an authorized motorcycle space for dates outside your regular schedule.
              </Text>
            </View>

            {/* Motorcycle Selector Card */}
            <View className="bg-light-surface dark:bg-dark-surface rounded-xl p-3.5 mb-3 border border-light-border dark:border-dark-border">
              <View className="flex-row items-center justify-between mb-2">
                <View className="flex-row items-center gap-1.5">
                  <MotorcycleIcon size={16} color={isDark ? "#E25C65" : "#7B1113"} />
                  <Text className="text-[11.5px] font-bold text-light-text dark:text-dark-text uppercase tracking-wider">
                    Select Motorcycle
                  </Text>
                </View>
                {vehicles.length > 0 && (
                  <Text className="text-[10.5px] font-medium text-light-muted dark:text-dark-muted">
                    {vehicles.length} Registered
                  </Text>
                )}
              </View>

              {vehicles.length === 0 ? (
                <View className="py-1">
                  <Text className="text-[12.5px] font-bold text-light-text dark:text-dark-text">
                    {vehicle ? `${vehicle.brand} • ${vehicle.plateNumber}` : "Primary Registered Motorcycle"}
                  </Text>
                </View>
              ) : (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row gap-2 pt-1 pb-0.5">
                  {vehicles.map((v) => {
                    const isSelected = selectedVehicleId === v.id;
                    return (
                      <TouchableOpacity
                        key={v.id}
                        onPress={() => setSelectedVehicleId(v.id)}
                        activeOpacity={0.8}
                        className={`px-3 py-2 rounded-lg border flex-row items-center gap-2 ${
                          isSelected
                            ? "bg-[#7B1113]/10 dark:bg-[#7B1113]/20 border-[#7B1113]"
                            : "bg-light-surfaceMuted dark:bg-dark-surfaceMuted border-light-border dark:border-dark-border"
                        }`}
                      >
                        <MotorcycleIcon size={15} color={isSelected ? (isDark ? "#E25C65" : "#7B1113") : "#71717A"} />
                        <View>
                          <Text
                            className={`text-[11.5px] font-bold ${
                              isSelected
                                ? "text-[#7B1113] dark:text-[#E25C65]"
                                : "text-light-text dark:text-dark-text"
                            }`}
                          >
                            {v.brand || "Motorcycle"}
                          </Text>
                          <Text className="text-[10px] font-mono text-light-muted dark:text-dark-muted">
                            {v.plateNumber}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              )}
            </View>

            {/* Corporate Calendar Card */}
            <View className="bg-light-surface dark:bg-dark-surface rounded-2xl p-4 border border-light-border dark:border-dark-border mb-3.5">
              {/* Month Navigator */}
              <View className="flex-row items-center justify-between pb-3 mb-2 border-b border-light-border dark:border-dark-border">
                <TouchableOpacity
                  onPress={() => setCurrentMonthIndex((prev) => Math.max(0, prev - 1))}
                  disabled={currentMonthIndex === 0}
                  className={`w-8 h-8 rounded-lg items-center justify-center border border-light-border dark:border-dark-border bg-light-surfaceMuted dark:bg-dark-surfaceMuted ${
                    currentMonthIndex === 0 ? "opacity-30" : ""
                  }`}
                >
                  <ChevronLeft size={16} color={isDark ? "#E4E4E7" : "#3F3F46"} strokeWidth={2} />
                </TouchableOpacity>

                <View className="flex-row items-center gap-1.5">
                  <CalendarIcon size={13} color={isDark ? "#E25C65" : "#7B1113"} strokeWidth={2} />
                  <Text className="text-[13.5px] font-bold text-light-text dark:text-dark-text">
                    {currentMonth}
                  </Text>
                </View>

                <TouchableOpacity
                  onPress={() => setCurrentMonthIndex((prev) => Math.min(months.length - 1, prev + 1))}
                  disabled={currentMonthIndex === months.length - 1}
                  className={`w-8 h-8 rounded-lg items-center justify-center border border-light-border dark:border-dark-border bg-light-surfaceMuted dark:bg-dark-surfaceMuted ${
                    currentMonthIndex === months.length - 1 ? "opacity-30" : ""
                  }`}
                >
                  <ChevronRight size={16} color={isDark ? "#E4E4E7" : "#3F3F46"} strokeWidth={2} />
                </TouchableOpacity>
              </View>

              {/* Day Headers */}
              <View className="flex-row items-center mb-1.5">
                {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
                  <View key={d} className="flex-1 items-center justify-center py-0.5">
                    <Text className="text-[10px] font-bold text-light-muted dark:text-dark-muted uppercase">
                      {d}
                    </Text>
                  </View>
                ))}
              </View>

              {/* Matrix Grid */}
              <View className="gap-1">
                {calendarRows.map((row, rowIndex) => (
                  <View key={`row-${rowIndex}`} className="flex-row items-center">
                    {row.map((cell, colIndex) => {
                      if (cell.type === "prev" || cell.type === "next") {
                        return (
                          <View key={`${cell.type}-${cell.day}-${colIndex}`} className="flex-1 items-center justify-center py-1">
                            <Text className="text-[11.5px] font-regular text-light-muted/30 dark:text-dark-muted/30">
                              {cell.day}
                            </Text>
                          </View>
                        );
                      }

                      const d = cell.day;
                      const isSelected = d === selectedDay;
                      const cellISO = getISOForDay(d);
                      const todayStr = getTodayISO();
                      const isPast = cellISO < todayStr;
                      const isToday = cellISO === todayStr;
                      const isUnavailable = cellISO <= todayStr;
                      const cellRes = getExistingReservationForDate(cellISO);
                      const hasRes = !!cellRes;
                      const isCellApproved = cellRes?.status === ReservationStatus.Approved;

                      return (
                        <View key={`day-${d}`} className="flex-1 items-center justify-center py-0.5">
                          <Pressable
                            onPress={() => handleSelectDay(d)}
                            style={({ pressed }) => ({
                              width: 34,
                              height: 34,
                              borderRadius: 17,
                              alignItems: "center",
                              justifyContent: "center",
                              backgroundColor: isSelected
                                ? "#7B1113"
                                : pressed && !isUnavailable
                                ? isDark
                                  ? "#27272A"
                                  : "#F4F4F5"
                                : "transparent",
                              borderWidth: isToday && !isSelected ? 1.5 : 0,
                              borderColor: isToday && !isSelected ? (isDark ? "#E25C65" : "#7B1113") : "transparent",
                              opacity: isUnavailable && !isSelected ? 0.35 : 1,
                            })}
                          >
                            <Text
                              style={{
                                fontSize: 13,
                                fontWeight: isSelected || isToday ? "800" : "600",
                                color: isSelected
                                  ? "#FFFFFF"
                                  : isToday
                                  ? isDark
                                    ? "#F87171"
                                    : "#7B1113"
                                  : isDark
                                  ? "#F4F4F5"
                                  : "#18181B",
                                textDecorationLine: isPast && !isSelected ? "line-through" : "none",
                              }}
                            >
                              {d}
                            </Text>
                            {hasRes && (
                              <View
                                style={{
                                  position: "absolute",
                                  bottom: 3,
                                  width: 4,
                                  height: 4,
                                  borderRadius: 2,
                                  backgroundColor: isSelected
                                    ? "#FFFFFF"
                                    : isCellApproved
                                    ? "#10B981"
                                    : "#F59E0B",
                                }}
                              />
                            )}
                          </Pressable>
                        </View>
                      );
                    })}
                  </View>
                ))}
              </View>

              {/* Calendar Indicator Legend */}
              <View className="flex-row items-center justify-end gap-3 mt-2 px-1">
                <View className="flex-row items-center gap-1">
                  <View className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <Text className="text-[10px] font-medium text-light-muted dark:text-dark-muted">
                    Approved Pass
                  </Text>
                </View>
                <View className="flex-row items-center gap-1">
                  <View className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                  <Text className="text-[10px] font-medium text-light-muted dark:text-dark-muted">
                    Pending Pass
                  </Text>
                </View>
              </View>

              {/* Error Notice */}
              {dateError ? (
                <View className="mt-3 p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 flex-row items-center gap-2">
                  <AlertCircle size={14} color="#D97706" />
                  <Text className="text-[11px] font-bold text-amber-800 dark:text-amber-300 flex-1">
                    {dateError}
                  </Text>
                </View>
              ) : null}

              {/* Existing Reservation Notice if selected day is already reserved */}
              {existingReservationForSelectedDate && (
                <View className="mt-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/25">
                  <View className="flex-row items-start gap-2.5">
                    <AlertCircle size={15} color="#D97706" style={{ marginTop: 1 }} />
                    <View className="flex-1">
                      <View className="flex-row items-center justify-between">
                        <Text className="text-[12px] font-bold text-amber-900 dark:text-amber-300">
                          Date Already Reserved
                        </Text>
                        <View className="px-1.5 py-0.5 rounded bg-amber-500/20">
                          <Text className="text-[9.5px] font-bold text-amber-800 dark:text-amber-300 uppercase">
                            {existingReservationForSelectedDate.status === ReservationStatus.Approved ? "Approved" : "Pending"}
                          </Text>
                        </View>
                      </View>
                      <Text className="text-[11px] font-regular text-amber-800/90 dark:text-amber-300/90 mt-1 leading-relaxed">
                        You already have a reservation ({existingReservationForSelectedDate.referenceNumber}) on {months[currentMonthIndex].split(" ")[0]} {selectedDay} ({formatTime(existingReservationForSelectedDate.startTime)} – {formatTime(existingReservationForSelectedDate.endTime)}). Only 1 reservation per day is allowed.
                      </Text>
                      <TouchableOpacity
                        onPress={() => {
                          setSelectedPassId(existingReservationForSelectedDate.id);
                          setViewMode("pass");
                        }}
                        activeOpacity={0.8}
                        className="mt-2 py-1.5 px-3 rounded-lg bg-amber-500/20 border border-amber-500/30 flex-row items-center justify-center gap-1.5 self-start"
                      >
                        <Text className="text-[11px] font-bold text-amber-900 dark:text-amber-200">
                          View This Pass
                        </Text>
                        <ArrowRight size={12} color={isDark ? "#FCD34D" : "#78350F"} />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              )}

              {/* Bay Availability Status */}
              <View className="mt-3 pt-2.5 border-t border-light-border dark:border-dark-border flex-row items-center justify-between px-1">
                <Text className="text-[11px] font-medium text-light-muted dark:text-dark-muted">
                  {months[currentMonthIndex].split(" ")[0]} {selectedDay}, {currentYear}
                </Text>
                <View className="flex-row items-center gap-1.5">
                  <View className="w-2 h-2 rounded-full bg-emerald-500" />
                  <Text className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400">
                    18 motorcycle bays open
                  </Text>
                </View>
              </View>
            </View>

            {/* Time Window Section */}
            <View className="mb-3.5">
              <Text className="text-[11.5px] font-bold text-light-muted dark:text-dark-muted uppercase tracking-wider mb-2 px-0.5">
                Arrival & Departure Window
              </Text>

              {/* Presets */}
              <View className="flex-row gap-1.5 mb-2.5">
                {PRESET_TIMES.map((preset) => (
                  <TouchableOpacity
                    key={preset.label}
                    onPress={() => handleApplyPreset(preset)}
                    activeOpacity={0.8}
                    className={`flex-1 py-1.5 rounded-lg items-center border ${
                      selectedPreset === preset.label
                        ? "bg-light-text dark:bg-dark-text border-light-text dark:border-dark-text"
                        : "bg-light-surface dark:bg-dark-surface border-light-border dark:border-dark-border"
                    }`}
                  >
                    <Text
                      className={`text-[11px] font-bold ${
                        selectedPreset === preset.label
                          ? "text-light-surface dark:text-dark-surface"
                          : "text-light-text dark:text-dark-text"
                      }`}
                    >
                      {preset.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Time Twin Inputs */}
              <View className="flex-row items-center gap-2.5">
                <TouchableOpacity
                  onPress={() => setTimePickerTarget("start")}
                  activeOpacity={0.8}
                  className="flex-1 bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border rounded-xl p-3 flex-row items-center justify-between"
                >
                  <View>
                    <Text className="text-[10px] font-bold text-light-muted dark:text-dark-muted uppercase">
                      Entry Time
                    </Text>
                    <Text className="text-[13.5px] font-bold text-light-text dark:text-dark-text mt-0.5">
                      {startTime}
                    </Text>
                  </View>
                  <Clock size={15} color={isDark ? "#A1A1AA" : "#71717A"} />
                </TouchableOpacity>

                <Text className="text-light-muted dark:text-dark-muted font-bold text-[12px]">to</Text>

                <TouchableOpacity
                  onPress={() => setTimePickerTarget("end")}
                  activeOpacity={0.8}
                  className="flex-1 bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border rounded-xl p-3 flex-row items-center justify-between"
                >
                  <View>
                    <Text className="text-[10px] font-bold text-light-muted dark:text-dark-muted uppercase">
                      Exit Time
                    </Text>
                    <Text className="text-[13.5px] font-bold text-light-text dark:text-dark-text mt-0.5">
                      {endTime}
                    </Text>
                  </View>
                  <Clock size={15} color={isDark ? "#A1A1AA" : "#71717A"} />
                </TouchableOpacity>
              </View>
            </View>

            {validAvailabilityRange && <ReservationAvailabilityNotice data={availability.data} loading={availability.isPending} error={availability.isError} onRetry={() => void availability.refetch()} />}

            {/* Purpose / Reason Section */}
            <View className="mb-4">
              <Text className="text-[11.5px] font-bold text-light-muted dark:text-dark-muted uppercase tracking-wider mb-2 px-0.5">
                Purpose / Reason
              </Text>

              {/* Quick Reason Chips */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 6 }}
                className="mb-2"
              >
                {QUICK_REASONS.map((r) => (
                  <TouchableOpacity
                    key={r}
                    onPress={() => setReason(r)}
                    activeOpacity={0.8}
                    className={`px-3 py-1.5 rounded-lg border ${
                      reason === r
                        ? "bg-light-text dark:bg-dark-text border-light-text dark:border-dark-text"
                        : "bg-light-surface dark:bg-dark-surface border-light-border dark:border-dark-border"
                    }`}
                  >
                    <Text
                      className={`text-[11px] font-medium ${
                        reason === r
                          ? "text-light-surface dark:text-dark-surface font-bold"
                          : "text-light-muted dark:text-dark-muted"
                      }`}
                    >
                      {r}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {/* Textarea */}
              <View className="bg-light-surface dark:bg-dark-surface rounded-xl p-3 border border-light-border dark:border-dark-border">
                <TextInput
                  value={reason}
                  onChangeText={setReason}
                  placeholder="Specify reservation purpose (e.g. academic consultation, defense)..."
                  placeholderTextColor="#A1A1AA"
                  multiline
                  numberOfLines={2}
                  maxLength={150}
                  className="text-[12.5px] font-regular text-light-text dark:text-dark-text p-0 min-h-[46px]"
                  textAlignVertical="top"
                />
                <View className="items-end mt-1">
                  <Text className="text-[10px] font-regular text-light-muted dark:text-dark-muted">
                    {reason.length}/150
                  </Text>
                </View>
              </View>
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              onPress={handleOpenReview}
              disabled={!!existingReservationForSelectedDate || isPastSelected || storeSubmitting || capacityUnavailable}
              activeOpacity={0.85}
              className={`w-full py-3.5 rounded-xl items-center justify-center flex-row gap-2 shadow-2xs ${
                existingReservationForSelectedDate || isPastSelected || capacityUnavailable
                  ? "bg-zinc-300 dark:bg-zinc-800 opacity-60"
                  : "bg-[#7B1113] dark:bg-[#A50000]"
              }`}
            >
              <Text
                className={`font-bold text-[14px] ${
                  existingReservationForSelectedDate || isPastSelected
                    ? "text-zinc-500 dark:text-zinc-400"
                    : "text-white"
                }`}
              >
                {existingReservationForSelectedDate
                  ? "Date Already Reserved (1 per Day)"
                  : isPastSelected
                  ? "Cannot Reserve Past Dates"
                  : "Review & Submit Request"}
              </Text>
              {!existingReservationForSelectedDate && !isPastSelected && (
                <ArrowRight size={15} color="#FFFFFF" strokeWidth={2.4} />
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* VIEW 3: PASS & DETAILS VIEW                                     */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        {viewMode === "pass" && selectedPassReservation && (
          <View className="px-4 pt-3.5">
            {/* ─── CASE A: ACTIVE APPROVED PASS (SHOW QR) ────────────────── */}
            {selectedPassReservation.status === ReservationStatus.Approved && !isSelectedPassDone && (
              <View>
                {/* Header Badge */}
                <View className="flex-row items-center justify-between mb-3">
                  <View className="px-2.5 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/20 flex-row items-center gap-1.5">
                    <CheckCircle2 size={12} color="#16A34A" strokeWidth={2.4} />
                    <Text className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wide">
                      Active Gate Access Pass
                    </Text>
                  </View>
                  <Text className="text-[11px] font-mono text-light-muted dark:text-dark-muted">
                    {selectedPassReservation.referenceNumber}
                  </Text>
                </View>

                {/* Gate Pass Card */}
                <View className="bg-light-surface dark:bg-dark-surface rounded-2xl border border-light-border dark:border-dark-border overflow-hidden mb-3.5 shadow-2xs">
                  {/* Pass Card Top Bar */}
                  <View className="bg-light-surfaceMuted dark:bg-dark-surfaceMuted px-4 py-3 border-b border-light-border dark:border-dark-border flex-row items-center justify-between">
                    <View className="flex-row items-center gap-2">
                      <ShieldCheck size={16} color={isDark ? "#E25C65" : "#7B1113"} strokeWidth={2.2} />
                      <Text className="text-[13px] font-bold text-light-text dark:text-dark-text">
                        ParkFlow Gate Pass
                      </Text>
                    </View>
                    <View className="flex-row items-center gap-1">
                      <MotorcycleIcon size={14} color="#71717A" />
                      <Text className="text-[11px] font-medium text-light-muted dark:text-dark-muted">
                        Motorcycle Bay
                      </Text>
                    </View>
                  </View>

                  {/* QR Code Container */}
                  <View className="py-6 px-4 items-center justify-center bg-white dark:bg-zinc-950">
                    <View className="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white">
                      <QRCodeSvg
                        value={
                          selectedPassReservation.referenceNumber ||
                          selectedPassReservation.vehicleQrCodeHash ||
                          "PARKFLOW-RESERVATION-PASS"
                        }
                        size={190}
                        color="#09090B"
                        backgroundColor="#FFFFFF"
                      />
                    </View>
                    <Text className="text-[11px] font-medium text-zinc-500 mt-3 text-center">
                      Scan this QR code at the gate terminal upon arrival.
                    </Text>
                  </View>

                  {/* Details Summary Table */}
                  <View className="p-4 border-t border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface gap-3">
                    <View className="flex-row justify-between">
                      <View>
                        <Text className="text-[10px] font-bold text-light-muted dark:text-dark-muted uppercase">
                          Date
                        </Text>
                        <Text className="text-[12.5px] font-bold text-light-text dark:text-dark-text mt-0.5">
                          {formatDate(selectedPassReservation.reservationDate)}
                        </Text>
                      </View>
                      <View className="items-end">
                        <Text className="text-[10px] font-bold text-light-muted dark:text-dark-muted uppercase">
                          Allowed Hours
                        </Text>
                        <Text className="text-[12.5px] font-bold text-[#7B1113] dark:text-[#E25C65] mt-0.5">
                          {formatTime(selectedPassReservation.startTime)} – {formatTime(selectedPassReservation.endTime)}
                        </Text>
                      </View>
                    </View>

                    <View className="flex-row justify-between pt-2.5 border-t border-light-border/60 dark:border-dark-border/60">
                      <View>
                        <Text className="text-[10px] font-bold text-light-muted dark:text-dark-muted uppercase">
                          Registered Motorcycle
                        </Text>
                        <View className="flex-row items-center gap-1.5 mt-0.5">
                          <MotorcycleIcon size={14} color="#71717A" />
                          <Text className="text-[12.5px] font-bold text-light-text dark:text-dark-text">
                            {selectedPassReservation.brand ? `${selectedPassReservation.brand} • ` : ""}
                            {selectedPassReservation.plateNumber || "Primary Motorcycle"}
                          </Text>
                        </View>
                      </View>
                      <View className="items-end">
                        <Text className="text-[10px] font-bold text-light-muted dark:text-dark-muted uppercase">
                          Reference Code
                        </Text>
                        <TouchableOpacity
                          onPress={() => handleCopyRef(selectedPassReservation.referenceNumber)}
                          className="flex-row items-center gap-1 mt-0.5"
                        >
                          <Text className="text-[12px] font-mono font-bold text-light-text dark:text-dark-text">
                            {selectedPassReservation.referenceNumber}
                          </Text>
                          {copiedRef ? (
                            <Check size={11} color="#16A34A" />
                          ) : (
                            <Copy size={11} color="#71717A" />
                          )}
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                </View>

                {/* Actions */}
                <TouchableOpacity
                  onPress={handleDownloadQr}
                  activeOpacity={0.85}
                  className="w-full bg-[#7B1113] dark:bg-[#A50000] py-3.5 rounded-xl flex-row items-center justify-center gap-2 mb-2.5"
                >
                  <Download size={16} color="#FFFFFF" strokeWidth={2.2} />
                  <Text className="text-white font-bold text-[13.5px]">
                    Save / Share Gate QR Code
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setViewMode("list")}
                  activeOpacity={0.8}
                  className="w-full py-2.5 items-center justify-center"
                >
                  <Text className="text-light-muted dark:text-dark-muted text-[12px] font-bold">
                    ← Back to Reservations
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* ─── CASE B: DONE / COMPLETED RESERVATION (QR REMOVED & MUTED) ── */}
            {isSelectedPassDone && (
              <View>
                {/* Header Status Tag */}
                <View className="flex-row items-center justify-between mb-3">
                  <View className="px-2.5 py-1 rounded-md bg-zinc-500/10 border border-zinc-500/20 flex-row items-center gap-1.5">
                    <Clock size={12} color="#71717A" strokeWidth={2.4} />
                    <Text className="text-[11px] font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-wide">
                      {selectedPassReservation.status === ReservationStatus.Approved
                        ? "Reservation Completed"
                        : selectedPassReservation.status === ReservationStatus.Cancelled
                        ? "Reservation Cancelled"
                        : "Reservation Declined"}
                    </Text>
                  </View>
                  <Text className="text-[11px] font-mono text-light-muted dark:text-dark-muted">
                    {selectedPassReservation.referenceNumber}
                  </Text>
                </View>

                {/* Muted Completion Card - NO QR CODE */}
                <View className="bg-light-surface dark:bg-dark-surface rounded-2xl border border-light-border dark:border-dark-border overflow-hidden mb-3.5 opacity-90 shadow-2xs">
                  <View className="p-6 items-center justify-center bg-light-surfaceMuted/50 dark:bg-dark-surfaceMuted/50 border-b border-light-border dark:border-dark-border">
                    {/* Muted Motorcycle Emblem */}
                    <View className="w-16 h-16 rounded-full bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border items-center justify-center mb-3">
                      <MotorcycleIcon size={30} color="#71717A" />
                    </View>

                    <Text className="text-[15px] font-bold text-light-text dark:text-dark-text text-center">
                      {selectedPassReservation.status === ReservationStatus.Approved
                        ? "Pass Expired & Concluded"
                        : selectedPassReservation.status === ReservationStatus.Cancelled
                        ? "Reservation Cancelled"
                        : "Request Not Approved"}
                    </Text>

                    <Text className="text-[11.5px] font-regular text-light-muted dark:text-dark-muted text-center mt-1 px-4 leading-relaxed">
                      {selectedPassReservation.status === ReservationStatus.Approved
                        ? "This parking reservation window has ended. The gate access QR code is deactivated and no longer valid for entry."
                        : "This reservation request is inactive and cannot be used for campus gate entry."}
                    </Text>
                  </View>

        {/* Summary Details */}
              <View className="p-4 bg-light-surface dark:bg-dark-surface gap-2.5">
                <View className="flex-row justify-between">
                  <Text className="text-sm font-medium text-light-muted dark:text-dark-muted">
                    Reservation Date
                  </Text>
                  <Text className="text-[12px] font-bold text-light-text dark:text-dark-text">
                    {formatDate(selectedPassReservation.reservationDate)}
                  </Text>
                </View>

                <View className="flex-row justify-between">
                  <Text className="text-sm font-medium text-light-muted dark:text-dark-muted">
                    Parking Window
                  </Text>
                  <Text className="text-[12px] font-bold text-light-muted dark:text-dark-muted">
                    {formatTime(selectedPassReservation.startTime)} – {formatTime(selectedPassReservation.endTime)}
                  </Text>
                </View>

                <View className="flex-row justify-between">
                  <Text className="text-sm font-medium text-light-muted dark:text-dark-muted">
                    Motorcycle
                  </Text>
                  <View className="flex-row items-center gap-1">
                    <MotorcycleIcon size={13} color={colors.muted} />
                    <Text className="text-[12px] font-bold text-light-text dark:text-dark-text">
                      {selectedPassReservation.plateNumber || "Registered Motor"}
                    </Text>
                  </View>
                </View>

                <View className="flex-row justify-between">
                  <Text className="text-sm font-medium text-light-muted dark:text-dark-muted">
                    Reference Number
                  </Text>
                  <Text className="text-sm font-mono font-medium text-light-muted dark:text-dark-muted">
                    {selectedPassReservation.referenceNumber}
                  </Text>
                </View>

                <View className="pt-2 border-t border-light-border/60 dark:border-dark-border/60">
                  <Text className="text-[10px] font-bold text-light-muted dark:text-dark-muted uppercase">
                    Reason for Visit
                  </Text>
                  <Text className="text-sm font-regular text-light-muted dark:text-dark-muted mt-0.5">
                    {selectedPassReservation.reason}
                  </Text>
                </View>
              </View>
            </View>

            {/* Back Button */}
            <TouchableOpacity
              onPress={() => setViewMode("list")}
              activeOpacity={0.85}
              className="w-full bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border py-3 rounded-xl items-center justify-center"
            >
              <Text className="text-light-text dark:text-dark-text font-bold text-[13px]">
                ← Back to Reservations
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ─── CASE C: PENDING REVIEW PASS ──────────────────────────── */}
        {selectedPassReservation.status === ReservationStatus.Pending && !isSelectedPassDone && (
          <View>
            {/* Header Tag */}
            <View className="flex-row items-center justify-between mb-3">
              <View className="px-2.5 py-1 rounded-md bg-amber-500/10 border border-amber-500/20 flex-row items-center gap-1.5">
                <Clock size={12} color="#D97706" strokeWidth={2.4} />
                <Text className="text-sm font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wide">
                  Pending Administrator Review
                </Text>
              </View>
              <Text className="text-sm font-mono text-light-muted dark:text-dark-muted">
                {selectedPassReservation.referenceNumber}
              </Text>
            </View>

            {/* Info Card */}
            <View className="bg-light-surface dark:bg-dark-surface rounded-2xl border border-light-border dark:border-dark-border p-5 mb-3.5 shadow-2xs">
              <View className="items-center mb-4">
                <View className="w-12 h-12 rounded-full bg-amber-500/10 items-center justify-center mb-2">
                  <Clock size={22} color="#D97706" strokeWidth={2.2} />
                </View>
                <Text className="text-[15px] font-bold text-light-text dark:text-dark-text text-center">
                  Request Submitted
                </Text>
                <Text className="text-sm font-regular text-light-muted dark:text-dark-muted text-center mt-1 px-2 leading-relaxed">
                  Your motorcycle reservation request is awaiting administrator confirmation. You will receive an access QR pass once approved.
                </Text>
              </View>

              <View className="p-3 bg-light-surfaceMuted dark:bg-dark-surfaceMuted rounded-xl gap-2 mb-4 border border-light-border/60 dark:border-dark-border/60">
                <View className="flex-row justify-between">
                  <Text className="text-sm font-medium text-light-muted dark:text-dark-muted">Date</Text>
                  <Text className="text-[12px] font-bold text-light-text dark:text-dark-text">
                    {formatDate(selectedPassReservation.reservationDate)}
                  </Text>
                </View>
                <View className="flex-row justify-between">
                  <Text className="text-sm font-medium text-light-muted dark:text-dark-muted">Hours</Text>
                  <Text className="text-[12px] font-bold text-light-text dark:text-dark-text">
                    {formatTime(selectedPassReservation.startTime)} – {formatTime(selectedPassReservation.endTime)}
                  </Text>
                </View>
                <View className="flex-row justify-between">
                  <Text className="text-sm font-medium text-light-muted dark:text-dark-muted">Motorcycle</Text>
                  <Text className="text-[12px] font-bold text-light-text dark:text-dark-text">
                    {selectedPassReservation.plateNumber || "Registered Motor"}
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                onPress={() => handleOpenCancelModal(selectedPassReservation.id)}
                activeOpacity={0.8}
                className="w-full py-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 items-center"
              >
                <Text className="text-[12px] font-bold text-rose-700 dark:text-rose-400">
                  Cancel Pending Request
                </Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              onPress={() => setViewMode("list")}
              activeOpacity={0.8}
              className="w-full py-2.5 items-center justify-center"
            >
              <Text className="text-light-muted dark:text-dark-muted text-[12px] font-bold">
                ← Back to Reservations
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    )}
  </ScrollView>

  {/* ─── REVIEW MODAL ────────────────────────────────────────────────── */}
  <AppDialog
    visible={showReviewModal}
    title="Confirm Reservation Request"
    message="Please verify your visit details before submitting."
    variant="confirmation"
    loading={storeSubmitting}
    dismissible={!storeSubmitting}
    onClose={() => setShowReviewModal(false)}
    actions={[
      { text: "Cancel", style: "cancel", onPress: () => setShowReviewModal(false), closeOnPress: false },
      { text: "Confirm & Submit Request", onPress: handleConfirmSubmit, disabled: capacityUnavailable, closeOnPress: false },
    ]}
  >
        {/* Summary Details */}
        <View className="bg-light-surfaceMuted dark:bg-dark-surfaceMuted rounded-xl p-3.5 my-3.5 border border-light-border dark:border-dark-border gap-2.5">
          <View className="flex-row items-center justify-between">
            <Text className="text-sm font-medium text-light-muted dark:text-dark-muted">Date</Text>
            <Text className="text-sm font-bold text-light-text dark:text-dark-text">
              {new Date(currentYear, currentMonthIndex, selectedDay).toLocaleDateString("en-US", {
                weekday: "short",
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </Text>
          </View>

          <View className="flex-row items-center justify-between">
            <Text className="text-sm font-medium text-light-muted dark:text-dark-muted">Time Window</Text>
            <Text className="text-sm font-bold text-light-primary dark:text-dark-primary">
              {startTime} – {endTime}
            </Text>
          </View>

          <View className="flex-row items-center justify-between">
            <Text className="text-sm font-medium text-light-muted dark:text-dark-muted">Motorcycle</Text>
            <View className="flex-row items-center gap-1.5">
              <MotorcycleIcon size={14} color="#71717A" />
              <Text className="text-sm font-bold text-light-text dark:text-dark-text">
                {activeVehicle ? `${activeVehicle.brand} (${activeVehicle.plateNumber})` : "Registered Motor"}
              </Text>
            </View>
          </View>

          <View className="pt-2 border-t border-light-border/60 dark:border-dark-border/60">
            <Text className="text-[10px] font-bold text-light-muted dark:text-dark-muted uppercase mb-0.5">
              Reason for visit
            </Text>
            <Text className="text-[12px] font-regular text-light-text dark:text-dark-text">
              {reason}
            </Text>
          </View>
        </View>

        <ReservationAvailabilityNotice data={availability.data} loading={availability.isPending} error={availability.isError} onRetry={() => void availability.refetch()} />

        {/* Checkpoints */}
        <View className="gap-1.5 mb-4 px-1">
          <View className="flex-row items-center gap-2">
            <Check size={13} color={colors.success} strokeWidth={2.5} />
            <Text className="text-sm font-regular text-light-muted dark:text-dark-muted">
              Valid only for the selected date and time window.
            </Text>
          </View>
          <View className="flex-row items-center gap-2">
            <Check size={13} color={colors.success} strokeWidth={2.5} />
            <Text className="text-sm font-regular text-light-muted dark:text-dark-muted">
              Subject to campus gate checkpoint verification.
            </Text>
          </View>
        </View>

      </AppDialog>

      {/* ─── CANCELLATION MODAL ──────────────────────────────────────────── */}
      <AppDialog
        visible={showCancelModal}
        title="Cancel Reservation Request?"
        message="Are you sure you want to cancel your pending reservation request? This action cannot be undone."
        variant="warning"
        loading={storeSubmitting}
        dismissible={false}
        onClose={() => setShowCancelModal(false)}
        actions={[
          { text: "Keep Request", style: "cancel", onPress: () => setShowCancelModal(false), closeOnPress: false },
          { text: "Yes, Cancel", style: "destructive", onPress: handleConfirmCancel, closeOnPress: false },
        ]}
      />

      {/* ─── TIME PICKER MODAL ───────────────────────────────────────────── */}
      <Modal
        visible={timePickerTarget !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setTimePickerTarget(null)}
      >
        <View className="flex-1 bg-black/50 justify-center items-center px-6">
          <View className="w-full max-w-sm bg-light-surface dark:bg-dark-surface rounded-2xl p-4 border border-light-border dark:border-dark-border">
            <Text className="font-bold text-[15px] text-light-text dark:text-dark-text text-center mb-1">
              Select {timePickerTarget === "start" ? "Entry Time" : "Exit Time"}
            </Text>
            <Text className="font-regular text-[11.5px] text-light-muted dark:text-dark-muted text-center mb-3">
              Choose your expected gate arrival window
            </Text>

            <View className="flex-row flex-wrap justify-between gap-1.5 mb-3">
              {COMMON_TIMES.map((t) => {
                const isSelected =
                  (timePickerTarget === "start" && startTime === t) ||
                  (timePickerTarget === "end" && endTime === t);
                return (
                  <TouchableOpacity
                    key={t}
                    onPress={() => {
                      if (timePickerTarget === "start") {
                        setStartTime(t);
                      } else {
                        setEndTime(t);
                      }
                      setSelectedPreset("Custom");
                      setTimePickerTarget(null);
                    }}
                    activeOpacity={0.8}
                    className={`w-[48%] py-2 rounded-lg items-center border ${
                      isSelected
                        ? "bg-[#7B1113] border-[#7B1113]"
                        : "bg-light-surfaceMuted dark:bg-dark-surfaceMuted border-light-border dark:border-dark-border"
                    }`}
                  >
                    <Text
                      className={`text-[11.5px] font-bold ${
                        isSelected ? "text-white" : "text-light-text dark:text-dark-text"
                      }`}
                    >
                      {t}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <TouchableOpacity
              onPress={() => setTimePickerTarget(null)}
              activeOpacity={0.8}
              className="py-2.5 rounded-xl bg-light-surfaceMuted dark:bg-dark-surfaceMuted items-center justify-center border border-light-border dark:border-dark-border"
            >
              <Text className="text-[11.5px] font-bold text-light-text dark:text-dark-text">
                Cancel
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ─── SUCCESS TOAST ───────────────────────────────────────────────── */}
      {showSuccessToast && (
        <View
          style={{ top: Math.max(insets.top, 20) + 40 }}
          className="absolute left-6 right-6 z-50 bg-zinc-900/95 dark:bg-white/95 rounded-xl p-3.5 shadow-xl flex-row items-center gap-2.5 border border-white/10"
        >
          <View className="w-7 h-7 rounded-full bg-emerald-500 items-center justify-center">
            <Check size={16} color="#FFFFFF" strokeWidth={2.8} />
          </View>
          <View className="flex-1">
            <Text className="text-white dark:text-zinc-900 font-bold text-[12.5px]">
              Gate QR Pass Ready
            </Text>
            <Text className="text-zinc-300 dark:text-zinc-600 font-regular text-[10.5px]">
              Present this pass at campus gate terminal upon entry.
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}
