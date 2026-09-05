import React, { useState, useMemo, useEffect } from "react";
import {
  Alert,
  Image,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import QRCodeSvg from "react-native-qrcode-svg";
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Clock,
  Download,
  LogOut,
  CheckCircle2,
  Calendar as CalendarIcon,
  Car,
  ShieldCheck,
  AlertCircle,
  Copy,
  Check,
  Share2,
  Info,
  Sparkles,
  ArrowRight,
  X,
  FileText,
  MapPin,
  Ban,
  Plus,
  QrCode,
  ListFilter,
} from "lucide-react-native";
import { useVehicleStore } from "@/features/user/store/vehicle.store";
import { useAuthStore } from "@/features/auth/store/auth.store";
import { useReservationStore } from "@/features/schedule/store/reservation.store";
import { ReservationStatus } from "@/features/schedule/types/reservation.types";
import { useAppTheme } from "@/hooks/useAppTheme";

type Step = "form" | "pending" | "approved";
type ViewMode = "list" | "create" | "pass";
type StatusFilter = "all" | "pending" | "approved" | "history";

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

function showAlert(title: string, message: string) {
  if (Platform.OS === "web") {
    if (typeof window !== "undefined" && window.alert) {
      window.alert(`${title}\n\n${message}`);
    }
  } else {
    Alert.alert(title, message);
  }
}

const QUICK_REASONS = [
  "Thesis Defense / Defense Panel",
  "Special Class / Lab Work",
  "Faculty / Department Meeting",
  "Official University Event",
  "Academic Consultation",
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
  const { isDark } = useAppTheme();

  const searchTab = route?.params?.tab || tab;
  const searchFilter = route?.params?.filter || filter;

  const { vehicle } = useVehicleStore();
  const { user } = useAuthStore();
  const {
    reservations,
    activeReservation,
    fetchMyReservations,
    createReservation,
    cancelReservation,
    isSubmitting: storeSubmitting,
  } = useReservationStore();

  // Primary Navigation Tabs
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    if (searchTab === "create") return "create";
    if (searchTab === "pass") return "pass";
    return "list";
  });
  const [statusFilter, setStatusFilter] = useState<StatusFilter>(() => {
    return (searchFilter as StatusFilter) || "all";
  });

  // Stepper inside creation flow
  const [step, setStep] = useState<Step>("form");
  const [selectedPassId, setSelectedPassId] = useState<string | null>(null);

  // Filtered reservations for list view
  const filteredReservations = useMemo(() => {
    if (statusFilter === "pending")
      return reservations.filter((r) => r.status === ReservationStatus.Pending);
    if (statusFilter === "approved")
      return reservations.filter((r) => r.status === ReservationStatus.Approved);
    if (statusFilter === "history")
      return reservations.filter(
        (r) =>
          r.status === ReservationStatus.Rejected ||
          r.status === ReservationStatus.Cancelled
      );
    return reservations;
  }, [reservations, statusFilter]);

  const pendingCount = useMemo(
    () => reservations.filter((r) => r.status === ReservationStatus.Pending).length,
    [reservations]
  );
  const approvedCount = useMemo(
    () => reservations.filter((r) => r.status === ReservationStatus.Approved).length,
    [reservations]
  );

  // Selected reservation object for QR pass view
  const selectedPassReservation = useMemo(() => {
    if (selectedPassId) {
      return reservations.find((r) => r.id === selectedPassId) || activeReservation;
    }
    return activeReservation || reservations.find((r) => r.status === ReservationStatus.Approved);
  }, [selectedPassId, reservations, activeReservation]);

  // Form State
  const [selectedDay, setSelectedDay] = useState<number>(new Date().getDate());
  const [startTime, setStartTime] = useState<string>("8:30 AM");
  const [endTime, setEndTime] = useState<string>("4:00 PM");
  const [reason, setReason] = useState<string>(() => {
    const monthName = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ][new Date().getMonth()];
    return `Academic Consultation & Campus Activity (${monthName} ${new Date().getDate()})`;
  });
  const [selectedPreset, setSelectedPreset] = useState<string>("Custom");
  const [dateError, setDateError] = useState<string | null>(null);

  // Modals
  const [showReviewModal, setShowReviewModal] = useState<boolean>(false);
  const [showCancelModal, setShowCancelModal] = useState<boolean>(false);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [showSuccessToast, setShowSuccessToast] = useState<boolean>(false);
  const [timePickerTarget, setTimePickerTarget] = useState<"start" | "end" | null>(null);
  const [copiedRef, setCopiedRef] = useState<boolean>(false);

  // Load user reservations on mount
  useEffect(() => {
    fetchMyReservations();
  }, []);

  // Month navigation
  const [currentMonthIndex, setCurrentMonthIndex] = useState<number>(new Date().getMonth());
  const months = [
    "January 2026",
    "February 2026",
    "March 2026",
    "April 2026",
    "May 2026",
    "June 2026",
    "July 2026",
    "August 2026",
    "September 2026",
    "October 2026",
    "November 2026",
    "December 2026",
  ];
  const currentMonth = months[currentMonthIndex] || "September 2026";

  const referenceId =
    selectedPassReservation?.referenceNumber || activeReservation?.referenceNumber || "RES-20260904-8914";

  const currentYear = new Date().getFullYear();

  // Calculate dynamic days in selected month
  const daysInCurrentMonthCount = useMemo(() => {
    return new Date(currentYear, currentMonthIndex + 1, 0).getDate();
  }, [currentMonthIndex, currentYear]);

  // Clamp selectedDay if month changes
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
    [daysInCurrentMonthCount]
  );

  // Build calendar matrix (exact 7-column grid with trailing next-month days)
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

  // Calendar Day Click Handler - Simplified pure state, 0 popups
  const handleSelectDay = (day: number) => {
    const targetISO = getISOForDay(day);
    const todayISO = getTodayISO();
    const monthName = months[currentMonthIndex].split(" ")[0];

    if (targetISO < todayISO) {
      setDateError(`Selected date (${monthName} ${day}) is in the past. Please select today or a future date.`);
      return;
    }

    // Clear error and set valid date
    setDateError(null);
    setSelectedDay(day);
    setReason(`Academic Consultation & Campus Activity (${monthName} ${day})`);
  };

  const handleApplyPreset = (preset: typeof PRESET_TIMES[0]) => {
    setSelectedPreset(preset.label);
    setStartTime(preset.start);
    setEndTime(preset.end);
  };

  const handleOpenReview = () => {
    const targetISO = getISOForDay(selectedDay);
    const todayISO = getTodayISO();

    if (targetISO < todayISO) {
      setDateError("Please select today or a future date for your parking reservation.");
      return;
    }

    const startTime24 = parse12hTo24hTime(startTime);
    const endTime24 = parse12hTo24hTime(endTime);

    if (startTime24 >= endTime24) {
      setDateError("Exit time must be after entry time (e.g. 8:30 AM to 4:00 PM).");
      return;
    }

    if (!reason.trim()) {
      const monthName = months[currentMonthIndex].split(" ")[0];
      setReason(`Academic Consultation & Campus Activity (${monthName} ${selectedDay})`);
    }

    setDateError(null);
    setShowReviewModal(true);
  };

  const handleConfirmSubmit = async () => {
    const reservationDate = getISOForDay(selectedDay);
    const startTime24 = parse12hTo24hTime(startTime);
    const endTime24 = parse12hTo24hTime(endTime);

    const res = await createReservation({
      reservationDate,
      startTime: startTime24,
      endTime: endTime24,
      reason: reason || "Academic Consultation & Department Activity",
    });

    setShowReviewModal(false);
    if (res.success) {
      setViewMode("list");
      setStatusFilter("pending");
    } else {
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
        showAlert("Cancel Failed", res.message || "Could not cancel reservation.");
        return;
      }
    }
    setCancellingId(null);
  };

  const handleCopyRef = () => {
    setCopiedRef(true);
    setTimeout(() => setCopiedRef(false), 2000);
  };

  const handleDownloadQr = () => {
    setShowSuccessToast(true);
    setTimeout(() => setShowSuccessToast(false), 3000);
  };

  return (
    <View className="flex-1 bg-light-background dark:bg-dark-background">

      {/* ─── Mode Switcher Bar ─────────────────────────────────────────── */}
      <View className="bg-white dark:bg-dark-surface px-4 py-2.5 flex-row items-center border-b border-zinc-200/80 dark:border-zinc-800 gap-2">
        <TouchableOpacity
          onPress={() => setViewMode("list")}
          className={`flex-1 py-2 px-3 rounded-full flex-row items-center justify-center gap-1.5 ${
            viewMode === "list" ? "bg-[#8B0000]" : "bg-zinc-100 dark:bg-zinc-800/80"
          }`}
        >
          <ListFilter size={13} color={viewMode === "list" ? "#FFFFFF" : "#71717A"} />
          <Text
            className={`text-[11px] font-heavy ${
              viewMode === "list" ? "text-white" : "text-zinc-600 dark:text-zinc-400"
            }`}
          >
            My Schedule ({reservations.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setViewMode("create")}
          className={`flex-1 py-2 px-3 rounded-full flex-row items-center justify-center gap-1.5 ${
            viewMode === "create" ? "bg-[#8B0000]" : "bg-zinc-100 dark:bg-zinc-800/80"
          }`}
        >
          <Plus size={13} color={viewMode === "create" ? "#FFFFFF" : "#71717A"} />
          <Text
            className={`text-[11px] font-heavy ${
              viewMode === "create" ? "text-white" : "text-zinc-600 dark:text-zinc-400"
            }`}
          >
            New Request
          </Text>
        </TouchableOpacity>

        {selectedPassReservation && (
          <TouchableOpacity
            onPress={() => setViewMode("pass")}
            className={`py-2 px-3.5 rounded-full flex-row items-center justify-center gap-1.5 ${
              viewMode === "pass" ? "bg-emerald-600" : "bg-emerald-50 dark:bg-emerald-500/20 border border-emerald-300 dark:border-emerald-700"
            }`}
          >
            <QrCode size={13} color={viewMode === "pass" ? "#FFFFFF" : "#16A34A"} />
            <Text
              className={`text-[11px] font-heavy ${
                viewMode === "pass" ? "text-white" : "text-emerald-800 dark:text-emerald-400"
              }`}
            >
              Pass QR
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* ─── Main Scrollable Body ───────────────────────────────────────── */}
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 24) + 30 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* VIEW MODE 1: MY SCHEDULE RESERVATIONS LIST                      */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        {viewMode === "list" && (
          <View className="px-5 pt-3">
            {/* Top Info Banner */}
            <View className="bg-white dark:bg-dark-surface rounded-2xl p-4 mb-4 border border-zinc-200/80 dark:border-zinc-800 shadow-2xs">
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center gap-2.5">
                  <View className="w-9 h-9 rounded-xl bg-[#8B0000]/10 dark:bg-[#8B0000]/20 items-center justify-center">
                    <CalendarIcon size={18} color="#8B0000" strokeWidth={2.2} />
                  </View>
                  <View>
                    <Text className="text-[13px] font-heavy text-zinc-900 dark:text-zinc-100">
                      My Schedule Reservations
                    </Text>
                    <Text className="text-[11px] font-regular text-zinc-500">
                      {pendingCount} Pending • {approvedCount} Approved Pass{approvedCount === 1 ? "" : "es"}
                    </Text>
                  </View>
                </View>

                <TouchableOpacity
                  onPress={() => setViewMode("create")}
                  className="bg-[#8B0000] px-3 py-1.5 rounded-full flex-row items-center gap-1 shadow-2xs"
                >
                  <Plus size={13} color="#FFFFFF" strokeWidth={2.5} />
                  <Text className="text-white text-[11px] font-heavy">New</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Status Filter Chips */}
            <View className="flex-row gap-1.5 mb-4 flex-wrap">
              <TouchableOpacity
                onPress={() => setStatusFilter("all")}
                className={`px-3 py-1.5 rounded-full border ${
                  statusFilter === "all"
                    ? "bg-[#8B0000] border-[#8B0000]"
                    : "bg-white dark:bg-dark-surface border-zinc-200 dark:border-zinc-800"
                }`}
              >
                <Text
                  className={`text-[11px] font-heavy ${
                    statusFilter === "all" ? "text-white" : "text-zinc-600 dark:text-zinc-400"
                  }`}
                >
                  All ({reservations.length})
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setStatusFilter("pending")}
                className={`px-3 py-1.5 rounded-full border ${
                  statusFilter === "pending"
                    ? "bg-amber-600 border-amber-600"
                    : "bg-white dark:bg-dark-surface border-zinc-200 dark:border-zinc-800"
                }`}
              >
                <Text
                  className={`text-[11px] font-heavy ${
                    statusFilter === "pending" ? "text-white" : "text-zinc-600 dark:text-zinc-400"
                  }`}
                >
                  Pending ({pendingCount})
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setStatusFilter("approved")}
                className={`px-3 py-1.5 rounded-full border ${
                  statusFilter === "approved"
                    ? "bg-emerald-600 border-emerald-600"
                    : "bg-white dark:bg-dark-surface border-zinc-200 dark:border-zinc-800"
                }`}
              >
                <Text
                  className={`text-[11px] font-heavy ${
                    statusFilter === "approved" ? "text-white" : "text-zinc-600 dark:text-zinc-400"
                  }`}
                >
                  Approved ({approvedCount})
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setStatusFilter("history")}
                className={`px-3 py-1.5 rounded-full border ${
                  statusFilter === "history"
                    ? "bg-zinc-700 border-zinc-700"
                    : "bg-white dark:bg-dark-surface border-zinc-200 dark:border-zinc-800"
                }`}
              >
                <Text
                  className={`text-[11px] font-heavy ${
                    statusFilter === "history" ? "text-white" : "text-zinc-600 dark:text-zinc-400"
                  }`}
                >
                  History
                </Text>
              </TouchableOpacity>
            </View>

            {/* List Content */}
            {filteredReservations.length === 0 ? (
              <View className="py-12 items-center justify-center bg-white dark:bg-dark-surface rounded-3xl border border-zinc-200/80 dark:border-zinc-800 p-6">
                <CalendarIcon size={36} color="#9CA3AF" strokeWidth={1.5} />
                <Text className="text-zinc-800 dark:text-zinc-200 font-heavy text-[14px] mt-3">
                  No Reservations Found
                </Text>
                <Text className="text-zinc-400 font-regular text-[12px] text-center mt-1 mb-4">
                  You don't have any schedule reservations matching this filter.
                </Text>
                <TouchableOpacity
                  onPress={() => setViewMode("create")}
                  className="bg-[#8B0000] px-5 py-2.5 rounded-full flex-row items-center gap-2 shadow-xs"
                >
                  <Plus size={14} color="#FFFFFF" strokeWidth={2.5} />
                  <Text className="text-white font-heavy text-[12px]">Request Reservation</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View className="gap-3">
                {filteredReservations.map((item) => {
                  const isPending = item.status === ReservationStatus.Pending;
                  const isApproved = item.status === ReservationStatus.Approved;
                  const isRejected = item.status === ReservationStatus.Rejected;
                  const isCancelled = item.status === ReservationStatus.Cancelled;

                  return (
                    <View
                      key={item.id}
                      className={`bg-white dark:bg-dark-surface rounded-2xl p-4 border shadow-2xs ${
                        isPending
                          ? "border-amber-400/60 dark:border-amber-500/40"
                          : isApproved
                          ? "border-emerald-400/60 dark:border-emerald-500/40"
                          : "border-zinc-200/80 dark:border-zinc-800"
                      }`}
                    >
                      {/* Status Header */}
                      <View className="flex-row items-center justify-between mb-2.5">
                        <View
                          className={`px-2.5 py-0.5 rounded-full flex-row items-center gap-1 border ${
                            isPending
                              ? "bg-amber-50 dark:bg-amber-500/20 border-amber-300 dark:border-amber-700"
                              : isApproved
                              ? "bg-emerald-50 dark:bg-emerald-500/20 border-emerald-300 dark:border-emerald-700"
                              : isRejected
                              ? "bg-rose-50 dark:bg-rose-500/20 border-rose-300 dark:border-rose-700"
                              : "bg-zinc-100 dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700"
                          }`}
                        >
                          {isPending && <Clock size={11} color="#D97706" strokeWidth={2.5} />}
                          {isApproved && <CheckCircle2 size={11} color="#16A34A" strokeWidth={2.5} />}
                          {isRejected && <AlertCircle size={11} color="#E11D48" strokeWidth={2.5} />}
                          {isCancelled && <Ban size={11} color="#6B7280" strokeWidth={2.5} />}
                          <Text
                            className={`text-[10px] font-black uppercase tracking-wider ${
                              isPending
                                ? "text-amber-800 dark:text-amber-400"
                                : isApproved
                                ? "text-emerald-800 dark:text-emerald-400"
                                : isRejected
                                ? "text-rose-800 dark:text-rose-400"
                                : "text-zinc-600 dark:text-zinc-400"
                            }`}
                          >
                            {isPending
                              ? "Pending Approval"
                              : isApproved
                              ? "Approved & Verified"
                              : isRejected
                              ? "Rejected"
                              : "Cancelled"}
                          </Text>
                        </View>

                        <Text className="text-[11px] font-heavy text-zinc-400">
                          {new Date(item.reservationDate).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </Text>
                      </View>

                      {/* Reference & Time Window */}
                      <View className="mb-2">
                        <Text className="text-[14px] font-black text-zinc-900 dark:text-zinc-100">
                          {item.referenceNumber}
                        </Text>
                        <Text className="text-[12px] font-heavy text-[#8B0000] dark:text-[#F87171] mt-0.5">
                          {item.startTime} – {item.endTime}
                        </Text>
                      </View>

                      {/* Reason Details Card */}
                      <View className="bg-zinc-50 dark:bg-zinc-800/90 rounded-xl p-2.5 mb-3 border border-zinc-100 dark:border-zinc-800">
                        <Text className="text-[10px] font-heavy text-zinc-400 uppercase">
                          Reason / Purpose
                        </Text>
                        <Text className="text-[12px] font-regular text-zinc-700 dark:text-zinc-300 mt-0.5">
                          {item.reason}
                        </Text>
                        {item.adminNotes && (
                          <Text className="text-[11px] font-book italic text-zinc-500 mt-1">
                            Admin Note: {item.adminNotes}
                          </Text>
                        )}
                      </View>

                      {/* Contextual Action Buttons */}
                      <View className="flex-row items-center gap-2">
                        {isApproved && (
                          <TouchableOpacity
                            onPress={() => {
                              setSelectedPassId(item.id);
                              setViewMode("pass");
                            }}
                            className="flex-1 py-2.5 rounded-xl bg-emerald-600 flex-row items-center justify-center gap-1.5 shadow-2xs"
                          >
                            <QrCode size={13} color="#FFFFFF" strokeWidth={2.2} />
                            <Text className="text-[12px] font-heavy text-white">
                              View Gate QR Pass →
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
                              className="flex-1 py-2.5 rounded-xl bg-amber-500/10 border border-amber-300 dark:border-amber-700 flex-row items-center justify-center gap-1.5"
                            >
                              <Clock size={13} color="#D97706" strokeWidth={2.2} />
                              <Text className="text-[12px] font-heavy text-amber-800 dark:text-amber-400">
                                Review Status
                              </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                              onPress={() => handleOpenCancelModal(item.id)}
                              className="px-3 py-2.5 rounded-xl bg-rose-50 dark:bg-rose-500/20 border border-rose-200 dark:border-rose-800"
                            >
                              <Text className="text-[11px] font-heavy text-rose-700 dark:text-rose-400">
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
        {/* VIEW MODE 2: CREATE NEW PARKING RESERVATION REQUEST             */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        {viewMode === "create" && (
          <View className="px-5 pt-2">
            {/* Title & Description */}
            <View className="items-center my-2">
              <Text className="text-[#8B0000] dark:text-[#F87171] font-black text-[23px] text-center leading-7">
                Parking Reservation{"\n"}Request
              </Text>
              <Text className="text-zinc-500 dark:text-zinc-400 font-book text-[12px] text-center mt-1">
                Select your required date & time for campus parking
              </Text>
            </View>

            {/* Vehicle Card Indicator */}
            <View className="bg-white dark:bg-dark-surface rounded-2xl p-3.5 mt-2 mb-3 border border-zinc-200/80 dark:border-zinc-800 flex-row items-center justify-between shadow-2xs">
              <View className="flex-row items-center gap-3">
                <View className="w-10 h-10 rounded-xl bg-[#8B0000]/10 dark:bg-[#8B0000]/20 items-center justify-center">
                  <Car size={20} color="#8B0000" strokeWidth={2.2} />
                </View>
                <View>
                  <Text className="text-[11px] font-heavy text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
                    Designated Vehicle
                  </Text>
                  <Text className="text-[14px] font-heavy text-zinc-900 dark:text-zinc-100">
                    {vehicle ? `${vehicle.brand} • ${vehicle.plateNumber}` : "Honda Click 125 • NCL 1234"}
                  </Text>
                </View>
              </View>

              <View className="px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-500/20 border border-emerald-200 dark:border-emerald-800 flex-row items-center gap-1">
                <View className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <Text className="text-[10px] font-heavy text-emerald-700 dark:text-emerald-400">
                  Verified
                </Text>
              </View>
            </View>

            {/* Calendar Card */}
            <View className="bg-white dark:bg-dark-surface rounded-3xl p-4 border border-zinc-200/80 dark:border-zinc-800 shadow-sm">
              {/* Month Navigator Header */}
              <View className="flex-row items-center justify-between pb-3 mb-2 border-b border-zinc-100 dark:border-zinc-800">
                <TouchableOpacity
                  onPress={() => setCurrentMonthIndex((prev) => Math.max(0, prev - 1))}
                  disabled={currentMonthIndex === 0}
                  className={`w-9 h-9 rounded-full items-center justify-center border ${
                    currentMonthIndex === 0
                      ? "border-zinc-100 dark:border-zinc-800/40 opacity-30"
                      : "border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/80"
                  }`}
                >
                  <ChevronLeft size={18} color={isDark ? "#E4E4E7" : "#3F3F46"} strokeWidth={2.2} />
                </TouchableOpacity>

                <View className="flex-row items-center gap-2 bg-zinc-100 dark:bg-zinc-800 px-3.5 py-1.5 rounded-full border border-zinc-200/50 dark:border-zinc-700/50">
                  <CalendarIcon size={14} color="#8B0000" strokeWidth={2.2} />
                  <Text className="text-[14px] font-heavy text-zinc-900 dark:text-zinc-100">
                    {currentMonth}
                  </Text>
                </View>

                <TouchableOpacity
                  onPress={() => setCurrentMonthIndex((prev) => Math.min(months.length - 1, prev + 1))}
                  disabled={currentMonthIndex === months.length - 1}
                  className={`w-9 h-9 rounded-full items-center justify-center border ${
                    currentMonthIndex === months.length - 1
                      ? "border-zinc-100 dark:border-zinc-800/40 opacity-30"
                      : "border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/80"
                  }`}
                >
                  <ChevronRight size={18} color={isDark ? "#E4E4E7" : "#3F3F46"} strokeWidth={2.2} />
                </TouchableOpacity>
              </View>

              {/* Day Labels - Exact 7 columns */}
              <View className="flex-row items-center mb-2">
                {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
                  <View key={d} className="flex-1 items-center justify-center py-1">
                    <Text className="text-[11px] font-heavy text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
                      {d}
                    </Text>
                  </View>
                ))}
              </View>

              {/* Days Grid Matrix Rows */}
              <View className="gap-1">
                {calendarRows.map((row, rowIndex) => (
                  <View key={`row-${rowIndex}`} className="flex-row items-center">
                    {row.map((cell, colIndex) => {
                      if (cell.type === "prev" || cell.type === "next") {
                        return (
                          <View key={`${cell.type}-${cell.day}-${colIndex}`} className="flex-1 items-center justify-center py-0.5">
                            <Text className="text-[12px] font-regular text-zinc-300 dark:text-zinc-700">
                              {cell.day}
                            </Text>
                          </View>
                        );
                      }

                      const d = cell.day;
                      const isSelected = d === selectedDay;
                      const cellISO = getISOForDay(d);
                      const todayISO = getTodayISO();
                      const isPast = cellISO < todayISO;
                      const isToday = cellISO === todayISO;

                      return (
                        <View key={`day-${d}`} className="flex-1 items-center justify-center py-0.5">
                          <Pressable
                            onPress={() => handleSelectDay(d)}
                            style={({ pressed }) => ({
                              width: 38,
                              height: 38,
                              borderRadius: 19,
                              alignItems: "center",
                              justifyContent: "center",
                              opacity: isPast && !isSelected ? 0.4 : 1,
                              backgroundColor: isSelected
                                ? pressed
                                  ? "#700000"
                                  : "#8B0000"
                                : pressed && !isPast
                                ? isDark
                                  ? "rgba(248, 113, 113, 0.25)"
                                  : "#FEE2E2"
                                : "transparent",
                              borderWidth: isToday && !isSelected ? 2 : 0,
                              borderColor: isToday && !isSelected ? (isDark ? "#F87171" : "#8B0000") : "transparent",
                              shadowColor: isSelected ? "#8B0000" : "transparent",
                              shadowOffset: { width: 0, height: 2 },
                              shadowOpacity: isSelected ? 0.4 : 0,
                              shadowRadius: 4,
                              elevation: isSelected ? 3 : 0,
                              ...(Platform.OS === "web"
                                ? ({
                                    outlineStyle: "none",
                                    userSelect: "none",
                                    WebkitTapHighlightColor: "transparent",
                                  } as any)
                                : {}),
                            })}
                          >
                            <Text
                              style={{
                                fontSize: 14,
                                fontWeight: isSelected || isToday ? "900" : "700",
                                color: isSelected
                                  ? "#FFFFFF"
                                  : isPast
                                  ? isDark
                                    ? "#71717A"
                                    : "#A1A1AA"
                                  : isToday
                                  ? isDark
                                    ? "#F87171"
                                    : "#8B0000"
                                  : isDark
                                  ? "#F4F4F5"
                                  : "#18181B",
                                opacity: 1,
                                textDecorationLine: isPast && !isSelected ? "line-through" : "none",
                              }}
                            >
                              {d}
                            </Text>
                          </Pressable>
                        </View>
                      );
                    })}
                  </View>
                ))}
              </View>

              {/* Inline Date Warning Callout if present */}
              {dateError && (
                <View className="mt-3 p-3 rounded-2xl bg-amber-50 dark:bg-amber-500/20 border border-amber-300 dark:border-amber-700 flex-row items-center gap-2">
                  <AlertCircle size={15} color="#D97706" />
                  <Text className="text-[11px] font-heavy text-amber-800 dark:text-amber-300 flex-1">
                    {dateError}
                  </Text>
                </View>
              )}

              {/* Availability Notice */}
              <View className="mt-3 pt-2.5 border-t border-zinc-100 dark:border-zinc-800 flex-row items-center justify-between px-2">
                <View className="flex-row items-center gap-1.5">
                  <View className="w-2 h-2 rounded-full bg-emerald-500" />
                  <Text className="text-[11px] font-book text-zinc-600 dark:text-zinc-400">
                    {months[currentMonthIndex].split(" ")[0]} {selectedDay}, {currentYear}
                  </Text>
                </View>
                <Text className="text-[11px] font-heavy text-emerald-600 dark:text-emerald-400">
                  18 bays available
                </Text>
              </View>
            </View>

            {/* Time Slot Presets */}
            <View className="mt-4 mb-2">
              <Text className="text-[11px] font-heavy text-zinc-500 uppercase tracking-wider mb-2 px-1">
                Select Time Window
              </Text>
              <View className="flex-row gap-2">
                {PRESET_TIMES.map((preset) => (
                  <TouchableOpacity
                    key={preset.label}
                    onPress={() => handleApplyPreset(preset)}
                    activeOpacity={0.8}
                    className={`flex-1 py-2 rounded-xl items-center border ${
                      selectedPreset === preset.label
                        ? "bg-[#8B0000] border-[#8B0000]"
                        : "bg-white dark:bg-dark-surface border-zinc-200 dark:border-zinc-800"
                    }`}
                  >
                    <Text
                      className={`text-[11px] font-heavy ${
                        selectedPreset === preset.label
                          ? "text-white"
                          : "text-zinc-700 dark:text-zinc-300"
                      }`}
                    >
                      {preset.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Selected Time Display Pill Buttons */}
            <View className="flex-row items-center justify-center gap-3 my-3">
              <TouchableOpacity
                onPress={() => setTimePickerTarget("start")}
                className="flex-1 bg-white dark:bg-dark-surface border border-zinc-200 dark:border-zinc-800 rounded-2xl p-3 flex-row items-center justify-between shadow-2xs"
              >
                <View>
                  <Text className="text-[10px] font-heavy text-zinc-400 uppercase">
                    Entry Time
                  </Text>
                  <Text className="text-[14px] font-black text-[#8B0000] dark:text-[#F87171] mt-0.5">
                    {startTime}
                  </Text>
                </View>
                <Clock size={16} color="#8B0000" strokeWidth={2.2} />
              </TouchableOpacity>

              <Text className="text-zinc-400 dark:text-zinc-500 font-heavy text-[13px]">
                to
              </Text>

              <TouchableOpacity
                onPress={() => setTimePickerTarget("end")}
                className="flex-1 bg-white dark:bg-dark-surface border border-zinc-200 dark:border-zinc-800 rounded-2xl p-3 flex-row items-center justify-between shadow-2xs"
              >
                <View>
                  <Text className="text-[10px] font-heavy text-zinc-400 uppercase">
                    Exit Time
                  </Text>
                  <Text className="text-[14px] font-black text-[#8B0000] dark:text-[#F87171] mt-0.5">
                    {endTime}
                  </Text>
                </View>
                <Clock size={16} color="#8B0000" strokeWidth={2.2} />
              </TouchableOpacity>
            </View>

            {/* Quick Reason Chips */}
            <View className="mt-2 mb-2">
              <Text className="text-[11px] font-heavy text-zinc-500 uppercase tracking-wider mb-2 px-1">
                Reason / Purpose
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 6, paddingHorizontal: 2 }}
                className="mb-2"
              >
                {QUICK_REASONS.map((r) => (
                  <TouchableOpacity
                    key={r}
                    onPress={() => setReason(r)}
                    activeOpacity={0.8}
                    className={`px-3 py-1.5 rounded-full border ${
                      reason === r
                        ? "bg-[#8B0000]/10 border-[#8B0000]"
                        : "bg-white dark:bg-dark-surface border-zinc-200 dark:border-zinc-800"
                    }`}
                  >
                    <Text
                      className={`text-[11px] font-book ${
                        reason === r
                          ? "text-[#8B0000] font-heavy"
                          : "text-zinc-600 dark:text-zinc-400"
                      }`}
                    >
                      {r}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Custom Reason Text Area */}
            <View className="bg-white dark:bg-dark-surface rounded-2xl p-4 border border-zinc-200/80 dark:border-zinc-800 shadow-2xs mb-6 min-h-[95px]">
              <TextInput
                value={reason}
                onChangeText={setReason}
                placeholder="Enter valid reason for reservation (e.g., Thesis defense, department meeting)..."
                placeholderTextColor="#9CA3AF"
                multiline
                numberOfLines={3}
                className="text-[13px] font-regular text-zinc-900 dark:text-zinc-100 p-0 text-top min-h-[60px]"
                textAlignVertical="top"
              />
              <View className="items-end mt-1">
                <Text className="text-[10px] font-regular text-zinc-400">
                  {reason.length}/150
                </Text>
              </View>
            </View>

            {/* Next / Review Button */}
            <TouchableOpacity
              onPress={handleOpenReview}
              activeOpacity={0.85}
              className="w-full bg-[#8B0000] py-4 rounded-full items-center justify-center shadow-md flex-row gap-2"
            >
              <Text className="text-white font-black text-[15px] tracking-wide">
                Review & Confirm Request
              </Text>
              <ArrowRight size={17} color="#FFFFFF" strokeWidth={2.4} />
            </TouchableOpacity>
          </View>
        )}

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* VIEW MODE 3: DIGITAL PASS / REQUEST STATUS DETAILED VIEW       */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        {viewMode === "pass" && selectedPassReservation && (
          <View className="px-5 pt-2 items-center">
            {selectedPassReservation.status === ReservationStatus.Approved ? (
              <>
                {/* Status Pill */}
                <View className="px-3.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-500/20 border border-emerald-300 dark:border-emerald-700 flex-row items-center gap-1.5 mb-2">
                  <CheckCircle2 size={13} color="#16A34A" strokeWidth={2.5} />
                  <Text className="text-[11px] font-black text-emerald-800 dark:text-emerald-400 uppercase tracking-wide">
                    Access Verified & Approved
                  </Text>
                </View>

                {/* Title */}
                <Text className="text-[#16A34A] dark:text-[#22C55E] font-black text-[23px] text-center leading-7 mb-4">
                  Digital Gate Access Pass
                </Text>

                {/* Digital Pass Ticket Card */}
                <View className="w-full bg-white dark:bg-dark-surface rounded-3xl border border-zinc-200/80 dark:border-zinc-800 shadow-md overflow-hidden mb-5">
                  {/* Ticket Top Banner */}
                  <View className="bg-[#8B0000] px-4 py-3 flex-row items-center justify-between">
                    <View className="flex-row items-center gap-2">
                      <ShieldCheck size={16} color="#FFFFFF" strokeWidth={2.4} />
                      <Text className="text-white font-heavy text-[13px]">
                        ParkFlow Gate Entry Pass
                      </Text>
                    </View>
                    <Text className="text-white/90 font-book text-[11px]">
                      Zone B Access
                    </Text>
                  </View>

                  {/* QR Code Container */}
                  <View className="p-6 items-center justify-center bg-white">
                    <View className="p-4 rounded-2xl border-2 border-zinc-100 bg-white shadow-2xs items-center justify-center">
                      <QRCodeSvg
                        value={`PARKFLOW-PASS-${selectedPassReservation.referenceNumber}-${selectedPassReservation.startTime}-${selectedPassReservation.endTime}`}
                        size={200}
                        color="#09090B"
                        backgroundColor="#FFFFFF"
                      />
                    </View>
                  </View>

                  {/* Perforated Divider */}
                  <View className="flex-row items-center justify-between px-4 py-1">
                    <View className="w-3 h-6 -ml-5 bg-light-background dark:bg-dark-background rounded-r-full" />
                    <View className="flex-1 border-b border-dashed border-zinc-300 dark:border-zinc-700 mx-2" />
                    <View className="w-3 h-6 -mr-5 bg-light-background dark:bg-dark-background rounded-l-full" />
                  </View>

                  {/* Ticket Details Grid */}
                  <View className="p-5 pt-3 bg-white dark:bg-dark-surface">
                    <View className="flex-row justify-between mb-3">
                      <View>
                        <Text className="text-[10px] font-heavy text-zinc-400 uppercase">
                          Reservation Date
                        </Text>
                        <Text className="text-[13px] font-heavy text-zinc-900 dark:text-zinc-100 mt-0.5">
                          {new Date(selectedPassReservation.reservationDate).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </Text>
                      </View>
                      <View className="items-end">
                        <Text className="text-[10px] font-heavy text-zinc-400 uppercase">
                          Permitted Window
                        </Text>
                        <Text className="text-[13px] font-heavy text-[#8B0000] dark:text-[#F87171] mt-0.5">
                          {selectedPassReservation.startTime} – {selectedPassReservation.endTime}
                        </Text>
                      </View>
                    </View>

                    <View className="flex-row justify-between pt-2.5 border-t border-zinc-100 dark:border-zinc-800">
                      <View>
                        <Text className="text-[10px] font-heavy text-zinc-400 uppercase">
                          Designated Gate
                        </Text>
                        <Text className="text-[13px] font-heavy text-zinc-900 dark:text-zinc-100 mt-0.5">
                          Gate 3 Main Checkpoint
                        </Text>
                      </View>
                      <View className="items-end">
                        <Text className="text-[10px] font-heavy text-zinc-400 uppercase">
                          Reference No.
                        </Text>
                        <Text className="text-[13px] font-heavy text-zinc-900 dark:text-zinc-100 mt-0.5">
                          {selectedPassReservation.referenceNumber}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>

                {/* Action Buttons */}
                <TouchableOpacity
                  onPress={handleDownloadQr}
                  activeOpacity={0.85}
                  className="w-full bg-[#8B0000] py-4 rounded-full flex-row items-center justify-center gap-2 shadow-md mb-3"
                >
                  <Download size={18} color="#FFFFFF" strokeWidth={2.4} />
                  <Text className="text-white font-black text-[15px] tracking-wide">
                    Download Pass QR Code
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setViewMode("list")}
                  className="py-2.5"
                >
                  <Text className="text-zinc-600 dark:text-zinc-400 text-[12px] font-heavy">
                    ← Back to Schedule List
                  </Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                {/* Pending Pass View */}
                <View className="px-3.5 py-1 rounded-full bg-amber-50 dark:bg-amber-500/20 border border-amber-300 dark:border-amber-700 flex-row items-center gap-1.5 mb-3">
                  <Clock size={13} color="#D97706" strokeWidth={2.5} />
                  <Text className="text-[11px] font-black text-amber-800 dark:text-amber-400 uppercase tracking-wide">
                    Awaiting Admin Approval
                  </Text>
                </View>

                <Text className="text-[#8B0000] dark:text-[#F87171] font-black text-[23px] text-center leading-7 mb-6">
                  Pending Request Status
                </Text>

                <View className="w-full bg-white dark:bg-dark-surface rounded-3xl p-6 border border-zinc-200/80 dark:border-zinc-800 items-center shadow-sm mb-5">
                  <Text className="text-zinc-600 dark:text-zinc-300 font-book text-[13px] text-center leading-5 px-4 mb-4">
                    Reservation Request Ref:{" "}
                    <Text className="font-heavy text-zinc-900 dark:text-zinc-100">
                      {selectedPassReservation.referenceNumber}
                    </Text>
                    {"\n"}Date:{" "}
                    <Text className="font-heavy text-zinc-900 dark:text-zinc-100">
                      {selectedPassReservation.reservationDate} ({selectedPassReservation.startTime} – {selectedPassReservation.endTime})
                    </Text>
                  </Text>

                  <TouchableOpacity
                    onPress={() => handleOpenCancelModal(selectedPassReservation.id)}
                    className="bg-rose-50 dark:bg-rose-500/20 border border-rose-200 dark:border-rose-800 px-4 py-2 rounded-xl"
                  >
                    <Text className="text-[12px] font-heavy text-rose-700 dark:text-rose-400">
                      Cancel Request
                    </Text>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  onPress={() => setViewMode("list")}
                  className="py-2.5"
                >
                  <Text className="text-zinc-600 dark:text-zinc-400 text-[12px] font-heavy">
                    ← Back to My Schedule List
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        )}
      </ScrollView>

      {/* ─── REVIEW & CONFIRMATION MODAL ─────────────────────────────────── */}
      <Modal
        visible={showReviewModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowReviewModal(false)}
      >
        <View className="flex-1 bg-black/60 justify-end">
          <View className="bg-white dark:bg-dark-surface rounded-t-3xl p-6 border-t border-zinc-200 dark:border-zinc-800 max-h-[85%]">
            <View className="flex-row items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
              <View>
                <Text className="text-[18px] font-black text-zinc-900 dark:text-zinc-100">
                  Confirm Reservation
                </Text>
                <Text className="text-[11px] font-book text-zinc-500">
                  Please review your reservation summary
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setShowReviewModal(false)}
                className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 items-center justify-center"
              >
                <X size={16} color="#6B7280" />
              </TouchableOpacity>
            </View>

            {/* Summary Details Card */}
            <View className="bg-zinc-50 dark:bg-zinc-800/60 rounded-2xl p-4 my-4 border border-zinc-200/80 dark:border-zinc-700 gap-3">
              <View className="flex-row items-center justify-between">
                <Text className="text-[12px] font-book text-zinc-500">Date</Text>
                <Text className="text-[13px] font-heavy text-zinc-900 dark:text-zinc-100">
                  {new Date(currentYear, currentMonthIndex, selectedDay).toLocaleDateString("en-US", {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </Text>
              </View>

              <View className="flex-row items-center justify-between">
                <Text className="text-[12px] font-book text-zinc-500">Time Window</Text>
                <Text className="text-[13px] font-heavy text-[#8B0000] dark:text-[#F87171]">
                  {startTime} – {endTime}
                </Text>
              </View>

              <View className="flex-row items-center justify-between">
                <Text className="text-[12px] font-book text-zinc-500">Vehicle</Text>
                <Text className="text-[13px] font-heavy text-zinc-900 dark:text-zinc-100">
                  {vehicle ? `${vehicle.brand} (${vehicle.plateNumber})` : "Honda Click 125 (NCL 1234)"}
                </Text>
              </View>

              <View className="flex-row items-center justify-between">
                <Text className="text-[12px] font-book text-zinc-500">Terminal Gate</Text>
                <Text className="text-[13px] font-heavy text-zinc-900 dark:text-zinc-100">
                  Gate 3 Main Checkpoint
                </Text>
              </View>

              <View className="pt-2 border-t border-zinc-200 dark:border-zinc-700">
                <Text className="text-[11px] font-heavy text-zinc-400 uppercase mb-0.5">
                  Reason for visit
                </Text>
                <Text className="text-[12px] font-book text-zinc-800 dark:text-zinc-200 leading-snug">
                  {reason}
                </Text>
              </View>
            </View>

            {/* Checklist items */}
            <View className="gap-2 mb-5 px-1">
              <View className="flex-row items-center gap-2">
                <Check size={14} color="#16A34A" strokeWidth={2.5} />
                <Text className="text-[11px] font-book text-zinc-600 dark:text-zinc-400">
                  Valid only for the selected date and time window
                </Text>
              </View>
              <View className="flex-row items-center gap-2">
                <Check size={14} color="#16A34A" strokeWidth={2.5} />
                <Text className="text-[11px] font-book text-zinc-600 dark:text-zinc-400">
                  Subject to security checkpoint verification
                </Text>
              </View>
            </View>

            {/* Confirm Submit Button */}
            <TouchableOpacity
              onPress={handleConfirmSubmit}
              disabled={storeSubmitting}
              className="w-full bg-[#8B0000] py-4 rounded-full items-center justify-center shadow-md"
            >
              {storeSubmitting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text className="text-white font-black text-[15px] tracking-wide">
                  Confirm & Submit Request
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ─── CANCELLATION CONFIRMATION MODAL ────────────────────────────── */}
      <Modal
        visible={showCancelModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCancelModal(false)}
      >
        <View className="flex-1 bg-black/60 justify-center items-center px-6">
          <View className="w-full max-w-sm bg-white dark:bg-dark-surface rounded-3xl p-5 border border-zinc-200 dark:border-zinc-800 shadow-xl items-center">
            <View className="w-12 h-12 rounded-full bg-rose-100 dark:bg-rose-500/20 items-center justify-center mb-3">
              <AlertCircle size={24} color="#E11D48" strokeWidth={2.2} />
            </View>

            <Text className="text-[16px] font-black text-zinc-900 dark:text-zinc-100 text-center mb-1">
              Cancel Reservation Request?
            </Text>
            <Text className="text-[12px] font-book text-zinc-500 text-center leading-relaxed mb-5">
              Are you sure you want to cancel your pending reservation request? This action cannot be undone.
            </Text>

            <View className="flex-row gap-3 w-full">
              <TouchableOpacity
                onPress={() => setShowCancelModal(false)}
                className="flex-1 py-3 rounded-full bg-zinc-100 dark:bg-zinc-800 items-center justify-center"
              >
                <Text className="text-[13px] font-heavy text-zinc-700 dark:text-zinc-300">
                  Keep Request
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleConfirmCancel}
                disabled={storeSubmitting}
                className="flex-1 py-3 rounded-full bg-rose-600 items-center justify-center shadow-sm"
              >
                <Text className="text-[13px] font-heavy text-white">
                  Yes, Cancel
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ─── TIME SELECTION MODAL ────────────────────────────────────────── */}
      <Modal
        visible={timePickerTarget !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setTimePickerTarget(null)}
      >
        <View className="flex-1 bg-black/50 justify-center items-center px-6">
          <View className="w-full max-w-sm bg-white dark:bg-dark-surface rounded-3xl p-5 border border-zinc-200 dark:border-zinc-800 shadow-xl">
            <Text className="font-black text-[16px] text-zinc-900 dark:text-zinc-100 text-center mb-1">
              Select {timePickerTarget === "start" ? "Entry Time" : "Exit Time"}
            </Text>
            <Text className="font-regular text-[12px] text-zinc-500 text-center mb-4">
              Choose your expected gate arrival window
            </Text>

            <View className="flex-row flex-wrap justify-between gap-2 mb-4">
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
                    className={`w-[48%] py-2.5 rounded-xl items-center border ${
                      isSelected
                        ? "bg-[#8B0000] border-[#8B0000]"
                        : "bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700"
                    }`}
                  >
                    <Text
                      className={`text-[12px] font-heavy ${
                        isSelected ? "text-white" : "text-zinc-800 dark:text-zinc-200"
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
              className="py-3 rounded-full bg-zinc-100 dark:bg-zinc-800 items-center justify-center"
            >
              <Text className="text-[12px] font-heavy text-zinc-700 dark:text-zinc-300">
                Cancel
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ─── SUCCESS TOAST MODAL ─────────────────────────────────────────── */}
      {showSuccessToast && (
        <View
          style={{ top: Math.max(insets.top, 20) + 50 }}
          className="absolute left-6 right-6 z-50 bg-zinc-900/95 dark:bg-white/95 rounded-2xl p-4 shadow-xl flex-row items-center gap-3 border border-white/10"
        >
          <View className="w-8 h-8 rounded-full bg-emerald-500 items-center justify-center">
            <Check size={18} color="#FFFFFF" strokeWidth={2.8} />
          </View>
          <View className="flex-1">
            <Text className="text-white dark:text-zinc-900 font-heavy text-[13px]">
              QR Pass Saved to Gallery
            </Text>
            <Text className="text-zinc-300 dark:text-zinc-600 font-regular text-[11px]">
              Ready for presentation at Gate 3 terminal.
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}

// Fallback mini helper for QR Icon in timeline
function QrCodeIcon({ size, color }: { size: number; color: string }) {
  return (
    <View
      style={{ width: size, height: size }}
      className="border border-white/80 rounded-xs items-center justify-center"
    >
      <View className="w-1.5 h-1.5 bg-white rounded-2xs" />
    </View>
  );
}
