import React, { useState, useMemo } from "react";
import {
  Alert,
  Image,
  Modal,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
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
} from "lucide-react-native";
import { useVehicleStore } from "@/features/user/store/vehicle.store";
import { useAuthStore } from "@/features/auth/store/auth.store";

type Step = "form" | "pending" | "approved";

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

export default function SchedulePage() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const { vehicle } = useVehicleStore();
  const { user } = useAuthStore();

  // Navigation / Stepper
  const [step, setStep] = useState<Step>("form");

  // Form State
  const [selectedDay, setSelectedDay] = useState<number>(20);
  const [startTime, setStartTime] = useState<string>("8:30 AM");
  const [endTime, setEndTime] = useState<string>("4:00 PM");
  const [reason, setReason] = useState<string>("");
  const [selectedPreset, setSelectedPreset] = useState<string>("Custom");

  // Modals
  const [showReviewModal, setShowReviewModal] = useState<boolean>(false);
  const [showCancelModal, setShowCancelModal] = useState<boolean>(false);
  const [showSuccessToast, setShowSuccessToast] = useState<boolean>(false);
  const [timePickerTarget, setTimePickerTarget] = useState<"start" | "end" | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [copiedRef, setCopiedRef] = useState<boolean>(false);

  // Month navigation
  const [currentMonthIndex, setCurrentMonthIndex] = useState<number>(2); // March
  const months = ["January 2026", "February 2026", "March 2026", "April 2026"];
  const currentMonth = months[currentMonthIndex] || "March 2026";

  // Static reference ID
  const referenceId = "RES-20260320-8914";

  // Leading days & current days for March
  const leadingDays = [27, 28, 29, 30];
  const daysInMonth = Array.from({ length: 31 }, (_, i) => i + 1);

  // Handle back navigation
  const handleBack = () => {
    if (step === "approved") {
      setStep("pending");
    } else if (step === "pending") {
      setShowCancelModal(true);
    } else {
      router.back();
    }
  };

  const handleApplyPreset = (preset: typeof PRESET_TIMES[0]) => {
    setSelectedPreset(preset.label);
    setStartTime(preset.start);
    setEndTime(preset.end);
  };

  const handleOpenReview = () => {
    if (!reason.trim()) {
      setReason("Academic Consultation & Department Activity");
    }
    setShowReviewModal(true);
  };

  const handleConfirmSubmit = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setShowReviewModal(false);
      setStep("pending");
    }, 600);
  };

  const handleCopyRef = () => {
    setCopiedRef(true);
    setTimeout(() => setCopiedRef(false), 2000);
  };

  const handleDownloadQr = () => {
    setShowSuccessToast(true);
    setTimeout(() => setShowSuccessToast(false), 3000);
  };

  // Stepper indicator percentage
  const currentStepNumber = step === "form" ? 1 : step === "pending" ? 2 : 3;

  return (
    <View className="flex-1 bg-[#F5F5F3] dark:bg-[#121214]">
      {/* ─── Top Brand Maroon Header ────────────────────────────────────── */}
      <View
        style={{ paddingTop: Math.max(insets.top, 14) }}
        className="bg-[#8B0000] px-4 pb-3 flex-row items-center justify-between shadow-md z-20"
      >
        <View className="flex-row items-center gap-2.5">
          <View className="w-10 h-10 rounded-full border-2 border-[#EAB308] bg-white overflow-hidden items-center justify-center shadow-sm">
            <Image
              source={require("@/assets/images/icon.png")}
              className="w-full h-full"
              resizeMode="cover"
            />
          </View>
          <View>
            <Text className="text-white font-black text-[15px] leading-tight tracking-wide">
              ParkFlow
            </Text>
            <Text className="text-white/80 font-regular text-[10px] tracking-wider uppercase">
              Schedule Pass System
            </Text>
          </View>
        </View>

        <TouchableOpacity
          onPress={() => router.back()}
          className="w-9 h-9 items-center justify-center rounded-full bg-white/10 active:bg-white/20"
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <LogOut size={18} color="#FFFFFF" strokeWidth={2.2} />
        </TouchableOpacity>
      </View>

      {/* ─── Modern Stepper Progress Bar ───────────────────────────────── */}
      <View className="bg-white dark:bg-zinc-900 px-5 py-2.5 flex-row items-center justify-between border-b border-zinc-200/80 dark:border-zinc-800 shadow-2xs">
        <View className="flex-row items-center gap-1.5 flex-1">
          <View
            className={`w-5 h-5 rounded-full items-center justify-center ${
              currentStepNumber >= 1 ? "bg-[#8B0000]" : "bg-zinc-300 dark:bg-zinc-700"
            }`}
          >
            <Text className="text-[10px] font-black text-white">1</Text>
          </View>
          <Text
            className={`text-[11px] font-heavy ${
              currentStepNumber === 1 ? "text-[#8B0000] dark:text-[#F87171]" : "text-zinc-500"
            }`}
          >
            Details
          </Text>

          <View className="w-6 h-0.5 bg-zinc-200 dark:bg-zinc-700 mx-1" />

          <View
            className={`w-5 h-5 rounded-full items-center justify-center ${
              currentStepNumber >= 2 ? "bg-[#8B0000]" : "bg-zinc-300 dark:bg-zinc-700"
            }`}
          >
            <Text className="text-[10px] font-black text-white">2</Text>
          </View>
          <Text
            className={`text-[11px] font-heavy ${
              currentStepNumber === 2 ? "text-[#8B0000] dark:text-[#F87171]" : "text-zinc-500"
            }`}
          >
            Review
          </Text>

          <View className="w-6 h-0.5 bg-zinc-200 dark:bg-zinc-700 mx-1" />

          <View
            className={`w-5 h-5 rounded-full items-center justify-center ${
              currentStepNumber === 3 ? "bg-[#16A34A]" : "bg-zinc-300 dark:bg-zinc-700"
            }`}
          >
            <Text className="text-[10px] font-black text-white">3</Text>
          </View>
          <Text
            className={`text-[11px] font-heavy ${
              currentStepNumber === 3 ? "text-[#16A34A] dark:text-[#22C55E]" : "text-zinc-500"
            }`}
          >
            Pass
          </Text>
        </View>

        {/* Prototype Switcher Pills */}
        <View className="flex-row items-center gap-1">
          <TouchableOpacity
            onPress={() => setStep("form")}
            className={`px-2 py-0.5 rounded-full ${
              step === "form" ? "bg-[#8B0000]" : "bg-zinc-100 dark:bg-zinc-800"
            }`}
          >
            <Text
              className={`text-[9px] font-heavy ${
                step === "form" ? "text-white" : "text-zinc-500"
              }`}
            >
              Form
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setStep("pending")}
            className={`px-2 py-0.5 rounded-full ${
              step === "pending" ? "bg-[#8B0000]" : "bg-zinc-100 dark:bg-zinc-800"
            }`}
          >
            <Text
              className={`text-[9px] font-heavy ${
                step === "pending" ? "text-white" : "text-zinc-500"
              }`}
            >
              Pending
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setStep("approved")}
            className={`px-2 py-0.5 rounded-full ${
              step === "approved" ? "bg-[#16A34A]" : "bg-zinc-100 dark:bg-zinc-800"
            }`}
          >
            <Text
              className={`text-[9px] font-heavy ${
                step === "approved" ? "text-white" : "text-zinc-500"
              }`}
            >
              Approved
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ─── Main Scrollable Body ───────────────────────────────────────── */}
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 24) + 30 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Back navigation action */}
        <View className="px-5 pt-3 pb-1">
          <TouchableOpacity
            onPress={handleBack}
            className="flex-row items-center gap-1 self-start py-1"
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <ChevronLeft size={17} color="#4B5563" strokeWidth={2.5} />
            <Text className="text-[13px] font-heavy text-zinc-700 dark:text-zinc-300">
              {step === "form" ? "Back to Schedule" : "Back"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* STEP 1: PARKING RESERVATION REQUEST FORM                        */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        {step === "form" && (
          <View className="px-5">
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
            <View className="bg-white dark:bg-zinc-900 rounded-2xl p-3.5 mt-2 mb-3 border border-zinc-200/80 dark:border-zinc-800 flex-row items-center justify-between shadow-2xs">
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

              <View className="px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex-row items-center gap-1">
                <View className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <Text className="text-[10px] font-heavy text-emerald-700 dark:text-emerald-400">
                  Verified
                </Text>
              </View>
            </View>

            {/* Calendar Card */}
            <View className="bg-white dark:bg-zinc-900 rounded-3xl p-4 border border-zinc-200/80 dark:border-zinc-800 shadow-sm">
              {/* Month Navigator Header */}
              <View className="flex-row items-center justify-between px-2 pb-3 mb-1 border-b border-zinc-100 dark:border-zinc-800">
                <TouchableOpacity
                  onPress={() =>
                    setCurrentMonthIndex((prev) => Math.max(0, prev - 1))
                  }
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  className="p-1 rounded-full hover:bg-zinc-100"
                >
                  <ChevronLeft size={18} color="#4B5563" strokeWidth={2.4} />
                </TouchableOpacity>

                <View className="flex-row items-center gap-1.5 bg-zinc-100 dark:bg-zinc-800 px-3 py-1 rounded-full">
                  <CalendarIcon size={13} color="#8B0000" strokeWidth={2.2} />
                  <Text className="text-[14px] font-heavy text-zinc-800 dark:text-zinc-200">
                    {currentMonth}
                  </Text>
                  <ChevronDown size={13} color="#6B7280" strokeWidth={2.2} />
                </View>

                <TouchableOpacity
                  onPress={() =>
                    setCurrentMonthIndex((prev) =>
                      Math.min(months.length - 1, prev + 1)
                    )
                  }
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  className="p-1 rounded-full hover:bg-zinc-100"
                >
                  <ChevronRight size={18} color="#4B5563" strokeWidth={2.4} />
                </TouchableOpacity>
              </View>

              {/* Day Labels */}
              <View className="flex-row justify-between mb-2 px-1">
                {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
                  <View key={d} className="w-10 items-center justify-center">
                    <Text className="text-[11px] font-heavy text-zinc-400 dark:text-zinc-500">
                      {d}
                    </Text>
                  </View>
                ))}
              </View>

              {/* Days Grid */}
              <View className="flex-row flex-wrap justify-between px-1">
                {leadingDays.map((d) => (
                  <View
                    key={`prev-${d}`}
                    className="w-10 h-8 items-center justify-center my-0.5 opacity-25"
                  >
                    <Text className="text-[12px] font-regular text-zinc-400">
                      {d}
                    </Text>
                  </View>
                ))}

                {daysInMonth.map((d) => {
                  const isSelected = d === selectedDay;
                  return (
                    <TouchableOpacity
                      key={`day-${d}`}
                      onPress={() => setSelectedDay(d)}
                      activeOpacity={0.7}
                      className={`w-10 h-8 items-center justify-center my-0.5 rounded-xl ${
                        isSelected
                          ? "bg-[#8B0000] shadow-sm"
                          : "active:bg-zinc-100 dark:active:bg-zinc-800"
                      }`}
                    >
                      <Text
                        className={`text-[12px] ${
                          isSelected
                            ? "text-white font-black text-[13px]"
                            : "text-zinc-800 dark:text-zinc-200 font-book"
                        }`}
                      >
                        {d}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Availability Notice */}
              <View className="mt-3 pt-2.5 border-t border-zinc-100 dark:border-zinc-800 flex-row items-center justify-between px-2">
                <View className="flex-row items-center gap-1.5">
                  <View className="w-2 h-2 rounded-full bg-emerald-500" />
                  <Text className="text-[11px] font-book text-zinc-600 dark:text-zinc-400">
                    March {selectedDay}, 2026
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
                    className={`flex-1 py-2 rounded-xl items-center border ${
                      selectedPreset === preset.label
                        ? "bg-[#8B0000] border-[#8B0000]"
                        : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800"
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
                className="flex-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-3 flex-row items-center justify-between shadow-2xs active:border-[#8B0000]"
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
                className="flex-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-3 flex-row items-center justify-between shadow-2xs active:border-[#8B0000]"
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
                    className={`px-3 py-1.5 rounded-full border ${
                      reason === r
                        ? "bg-[#8B0000]/10 border-[#8B0000]"
                        : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800"
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
            <View className="bg-white dark:bg-zinc-900 rounded-2xl p-4 border border-zinc-200/80 dark:border-zinc-800 shadow-2xs mb-6 min-h-[95px]">
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
              className="w-full bg-[#8B0000] py-4 rounded-full items-center justify-center shadow-md active:bg-[#700000] flex-row gap-2"
            >
              <Text className="text-white font-black text-[15px] tracking-wide">
                Review & Confirm Request
              </Text>
              <ArrowRight size={17} color="#FFFFFF" strokeWidth={2.4} />
            </TouchableOpacity>
          </View>
        )}

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* STEP 2: PENDING APPROVAL SCREEN                                 */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        {step === "pending" && (
          <View className="px-5 pt-2 items-center">
            {/* Status Badge */}
            <View className="px-3.5 py-1 rounded-full bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700 flex-row items-center gap-1.5 mb-3">
              <Clock size={13} color="#D97706" strokeWidth={2.5} />
              <Text className="text-[11px] font-black text-amber-800 dark:text-amber-400 uppercase tracking-wide">
                Awaiting Admin Approval
              </Text>
            </View>

            {/* Title */}
            <Text className="text-[#8B0000] dark:text-[#F87171] font-black text-[23px] text-center leading-7 mb-6">
              Pending Reservation{"\n"}Approval
            </Text>

            {/* Center Clock Visual Card */}
            <View className="w-full bg-white dark:bg-zinc-900 rounded-3xl p-6 border border-zinc-200/80 dark:border-zinc-800 items-center shadow-sm mb-5">
              <View className="w-28 h-28 rounded-full bg-[#8B0000] items-center justify-center shadow-lg mb-5">
                <View className="w-16 h-16 items-center justify-center">
                  <View className="w-3.5 h-3.5 rounded-full bg-white z-10" />
                  <View className="absolute top-1 w-2 h-7 bg-white rounded-full" />
                  <View className="absolute right-1 w-6 h-2 bg-white rounded-full" />
                </View>
              </View>

              <Text className="text-zinc-600 dark:text-zinc-300 font-book text-[13px] text-center leading-5 px-4 mb-4">
                Your reservation request for{" "}
                <Text className="font-heavy text-zinc-900 dark:text-zinc-100">
                  March {selectedDay}, 2026 ({startTime} – {endTime})
                </Text>{" "}
                has been submitted to campus parking administration.
              </Text>

              {/* Reference ID Pill */}
              <TouchableOpacity
                onPress={handleCopyRef}
                className="bg-zinc-100 dark:bg-zinc-800 px-4 py-2 rounded-xl flex-row items-center gap-2 border border-zinc-200 dark:border-zinc-700"
              >
                <Text className="text-[11px] font-book text-zinc-500">Ref No:</Text>
                <Text className="text-[12px] font-heavy text-zinc-900 dark:text-zinc-100">
                  {referenceId}
                </Text>
                {copiedRef ? (
                  <Check size={14} color="#16A34A" strokeWidth={2.5} />
                ) : (
                  <Copy size={14} color="#6B7280" />
                )}
              </TouchableOpacity>
            </View>

            {/* Timeline Process Breakdown */}
            <View className="w-full bg-white dark:bg-zinc-900 rounded-2xl p-4 border border-zinc-200/80 dark:border-zinc-800 shadow-2xs mb-6">
              <Text className="text-[11px] font-heavy text-zinc-400 uppercase tracking-wider mb-3">
                Request Status Timeline
              </Text>

              <View className="gap-3">
                <View className="flex-row items-center gap-3">
                  <View className="w-6 h-6 rounded-full bg-emerald-500 items-center justify-center">
                    <Check size={14} color="#FFFFFF" strokeWidth={2.8} />
                  </View>
                  <View className="flex-1">
                    <Text className="text-[12px] font-heavy text-zinc-900 dark:text-zinc-100">
                      Request Submitted
                    </Text>
                    <Text className="text-[10px] font-regular text-zinc-400">
                      Completed just now
                    </Text>
                  </View>
                </View>

                <View className="flex-row items-center gap-3">
                  <View className="w-6 h-6 rounded-full bg-amber-500 items-center justify-center">
                    <Clock size={13} color="#FFFFFF" strokeWidth={2.5} />
                  </View>
                  <View className="flex-1">
                    <Text className="text-[12px] font-heavy text-amber-700 dark:text-amber-400">
                      Security Review in Progress
                    </Text>
                    <Text className="text-[10px] font-regular text-zinc-400">
                      Estimated review: 15–30 mins
                    </Text>
                  </View>
                </View>

                <View className="flex-row items-center gap-3 opacity-40">
                  <View className="w-6 h-6 rounded-full bg-zinc-300 dark:bg-zinc-700 items-center justify-center">
                    <QrCodeIcon size={12} color="#FFFFFF" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-[12px] font-heavy text-zinc-600 dark:text-zinc-400">
                      Digital Gate Pass QR Ready
                    </Text>
                    <Text className="text-[10px] font-regular text-zinc-400">
                      Upon approval
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Prototype Instant Approval Demo Button */}
            <TouchableOpacity
              onPress={() => setStep("approved")}
              activeOpacity={0.85}
              className="w-full bg-[#8B0000] py-4 rounded-full items-center justify-center shadow-md active:bg-[#700000] flex-row gap-2 mb-3"
            >
              <Sparkles size={16} color="#FFFFFF" />
              <Text className="text-white font-black text-[14px] tracking-wide">
                Simulate Admin Approval →
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setShowCancelModal(true)}
              className="py-2.5"
            >
              <Text className="text-rose-700 dark:text-rose-400 text-[12px] font-heavy">
                Cancel This Request
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* STEP 3: RESERVATION REQUEST APPROVED (DIGITAL PASS)             */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        {step === "approved" && (
          <View className="px-5 pt-2 items-center">
            {/* Status Pill */}
            <View className="px-3.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-700 flex-row items-center gap-1.5 mb-2">
              <CheckCircle2 size={13} color="#16A34A" strokeWidth={2.5} />
              <Text className="text-[11px] font-black text-emerald-800 dark:text-emerald-400 uppercase tracking-wide">
                Access Verified & Approved
              </Text>
            </View>

            {/* Title */}
            <Text className="text-[#16A34A] dark:text-[#22C55E] font-black text-[23px] text-center leading-7 mb-4">
              Reservation Request{"\n"}Approved
            </Text>

            {/* Digital Pass Ticket Card */}
            <View className="w-full bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200/80 dark:border-zinc-800 shadow-md overflow-hidden mb-5">
              {/* Ticket Top Banner */}
              <View className="bg-[#8B0000] px-4 py-3 flex-row items-center justify-between">
                <View className="flex-row items-center gap-2">
                  <ShieldCheck size={16} color="#FFFFFF" strokeWidth={2.4} />
                  <Text className="text-white font-heavy text-[13px]">
                    BulSU Gate Entry Pass
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
                    value={`PARKFLOW-PASS-${referenceId}-${startTime}-${endTime}`}
                    size={200}
                    color="#09090B"
                    backgroundColor="#FFFFFF"
                  />
                </View>
              </View>

              {/* Perforated Divider */}
              <View className="flex-row items-center justify-between px-4 py-1">
                <View className="w-3 h-6 -ml-5 bg-[#F5F5F3] dark:bg-[#121214] rounded-r-full" />
                <View className="flex-1 border-b border-dashed border-zinc-300 dark:border-zinc-700 mx-2" />
                <View className="w-3 h-6 -mr-5 bg-[#F5F5F3] dark:bg-[#121214] rounded-l-full" />
              </View>

              {/* Ticket Details Grid */}
              <View className="p-5 pt-3 bg-white dark:bg-zinc-900">
                <View className="flex-row justify-between mb-3">
                  <View>
                    <Text className="text-[10px] font-heavy text-zinc-400 uppercase">
                      Reservation Date
                    </Text>
                    <Text className="text-[13px] font-heavy text-zinc-900 dark:text-zinc-100 mt-0.5">
                      March {selectedDay}, 2026
                    </Text>
                  </View>
                  <View className="items-end">
                    <Text className="text-[10px] font-heavy text-zinc-400 uppercase">
                      Permitted Window
                    </Text>
                    <Text className="text-[13px] font-heavy text-[#8B0000] dark:text-[#F87171] mt-0.5">
                      {startTime} – {endTime}
                    </Text>
                  </View>
                </View>

                <View className="flex-row justify-between pt-2.5 border-t border-zinc-100 dark:border-zinc-800">
                  <View>
                    <Text className="text-[10px] font-heavy text-zinc-400 uppercase">
                      Designated Bay
                    </Text>
                    <Text className="text-[13px] font-heavy text-zinc-900 dark:text-zinc-100 mt-0.5">
                      Main Campus (Gate 3)
                    </Text>
                  </View>
                  <View className="items-end">
                    <Text className="text-[10px] font-heavy text-zinc-400 uppercase">
                      Vehicle Plate
                    </Text>
                    <Text className="text-[13px] font-heavy text-zinc-900 dark:text-zinc-100 mt-0.5">
                      {vehicle?.plateNumber || "NCL 1234"}
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Instruction Warning */}
            <View className="w-full bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/60 rounded-2xl p-3 flex-row items-center gap-2.5 mb-6">
              <Info size={16} color="#B91C1C" strokeWidth={2.2} />
              <Text className="text-[11px] font-book text-rose-800 dark:text-rose-300 flex-1 leading-4">
                Note: Present this QR Code upon gate terminal arrival. An early arrival grace period of 15 minutes applies.
              </Text>
            </View>

            {/* Action Buttons */}
            <TouchableOpacity
              onPress={handleDownloadQr}
              activeOpacity={0.85}
              className="w-full bg-[#8B0000] py-4 rounded-full flex-row items-center justify-center gap-2 shadow-md active:bg-[#700000] mb-3"
            >
              <Download size={18} color="#FFFFFF" strokeWidth={2.4} />
              <Text className="text-white font-black text-[15px] tracking-wide">
                Download QR Pass
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setStep("form")}
              className="py-2.5"
            >
              <Text className="text-zinc-600 dark:text-zinc-400 text-[12px] font-heavy">
                Create Another Reservation
              </Text>
            </TouchableOpacity>
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
          <View className="bg-white dark:bg-zinc-900 rounded-t-3xl p-6 border-t border-zinc-200 dark:border-zinc-800 max-h-[85%]">
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
                  Friday, March {selectedDay}, 2026
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
              disabled={isSubmitting}
              className="w-full bg-[#8B0000] py-4 rounded-full items-center justify-center shadow-md active:bg-[#700000]"
            >
              {isSubmitting ? (
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
          <View className="w-full max-w-sm bg-white dark:bg-zinc-900 rounded-3xl p-5 border border-zinc-200 dark:border-zinc-800 shadow-xl items-center">
            <View className="w-12 h-12 rounded-full bg-rose-100 dark:bg-rose-950/50 items-center justify-center mb-3">
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
                onPress={() => {
                  setShowCancelModal(false);
                  setStep("form");
                }}
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
          <View className="w-full max-w-sm bg-white dark:bg-zinc-900 rounded-3xl p-5 border border-zinc-200 dark:border-zinc-800 shadow-xl">
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
