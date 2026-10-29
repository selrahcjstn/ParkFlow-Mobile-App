import { ContentWrapper } from "@/components/layouts";
import { AlertModal } from "@/components/shared";
import { SCHEDULE_DAYS } from "@/constants/scheduleDays";
import { onboardingService } from "@/features/auth/services/onboarding.service";
import { useScheduleStore } from "@/features/schedule/store/schedule.store";
import { queryClient } from "@/services/queryClient";
import { formatTime } from "@/utils/formatTime";
import DateTimePicker from "@react-native-community/datetimepicker";
import * as DocumentPicker from "expo-document-picker";
import { useFocusEffect, useNavigation } from "expo-router";
import React, { useCallback, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Platform,
  ScrollView,
  TouchableOpacity,
  View,
  Text,
  InteractionManager,
} from "react-native";
import { ScheduleEditMode, ScheduleViewMode } from "../components/schedule";

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatTimeForDisplay(date: Date): string {
  let hours = date.getHours();
  const minutes = date.getMinutes();
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12 || 12;
  const mins = minutes.toString().padStart(2, "0");
  return `${hours}:${mins} ${ampm}`;
}

function parseTimeString(value?: string): Date | null {
  if (!value) return null;
  const [time, ampm] = value.split(" ");
  if (!time || !ampm) return null;
  let [hours, minutes] = time.split(":").map(Number);
  if (ampm === "PM" && hours !== 12) hours += 12;
  if (ampm === "AM" && hours === 12) hours = 0;
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return date;
}

const GRACE_PERIOD = {
  exitAfterMin: 45,
};

const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0];
const DAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

export default function SchedulePage() {
  const navigation = useNavigation();
  const lastScrolledRef = useRef(false);

  // ── Schedule store ──
  const { schedules, isLoading: isLoadingSchedules, fetchSchedules } =
    useScheduleStore();

  // ── Mode: view vs edit ──
  const [isEditing, setIsEditing] = useState(false);

  // ── Edit state (same shape as onboarding) ──
  const [editSchedule, setEditSchedule] = useState<
    Record<string, { start?: string; end?: string }>
  >(() => Object.fromEntries(SCHEDULE_DAYS.map((d) => [d.shortLabel, {}])));

  // ── Time picker state ──
  const [pickerTarget, setPickerTarget] = useState<null | {
    day: string;
    field: "start" | "end";
  }>(null);
  const [draftTime, setDraftTime] = useState<Date>(() => {
    const d = new Date();
    d.setHours(8, 0, 0, 0);
    return d;
  });
  const slideAnim = useRef(new Animated.Value(300)).current;

  // ── COR file state ──
  const [selectedFile, setSelectedFile] =
    useState<DocumentPicker.DocumentPickerAsset | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // ── Alert modal ──
  const [modal, setModal] = useState({
    visible: false,
    title: "",
    message: "",
    variant: "error" as "error" | "warning" | "info" | "success",
  });

  const showAlert = useCallback(
    (
      title: string,
      message: string,
      variant: "error" | "warning" | "info" | "success" = "error",
    ) => {
      setModal({ visible: true, title, message, variant });
    },
    [],
  );

  useFocusEffect(
    useCallback(() => {
      const task = InteractionManager.runAfterInteractions(() => {
        fetchSchedules();
      });
      return () => task.cancel();
    }, []),
  );

  // ── Scroll tracking ──
  const handleScroll = (event: any) => {
    const yOffset = event?.nativeEvent?.contentOffset?.y;
    if (yOffset !== undefined && yOffset !== null) {
      const scrolled = yOffset > 0;
      if (lastScrolledRef.current !== scrolled) {
        lastScrolledRef.current = scrolled;
        navigation.setParams({ hasScrolled: scrolled } as any);
      }
    }
  };

  // ── Mapped schedule for view mode ──
  const mappedSchedules = DAY_ORDER.map((dayNum) => {
    const backendSched = schedules.find((s) => s.dayOfWeek === dayNum);
    return {
      dayName: DAY_NAMES[dayNum],
      startTime: backendSched ? formatTime(backendSched.startTime) : "",
      endTime: backendSched ? formatTime(backendSched.endTime) : "",
      isActive: !!backendSched,
    };
  });

  const activeCount = mappedSchedules.filter((d) => d.isActive).length;

  // ── Enter edit mode ──
  const handleStartEditing = () => {
    const prefilled: Record<string, { start?: string; end?: string }> = {};
    for (const d of SCHEDULE_DAYS) {
      const sched = schedules.find((s) => s.dayOfWeek === d.key);
      if (sched) {
        prefilled[d.shortLabel] = {
          start: formatTime(sched.startTime),
          end: formatTime(sched.endTime),
        };
      } else {
        prefilled[d.shortLabel] = {};
      }
    }
    setEditSchedule(prefilled);
    setSelectedFile(null);
    setIsEditing(true);
  };

  // ── Time picker controls ──
  const openPicker = useCallback(
    (day: string, field: "start" | "end") => {
      const existing = editSchedule[day]?.[field];
      const next =
        parseTimeString(existing) ??
        (() => {
          const d = new Date();
          d.setHours(field === "start" ? 8 : 17, 0, 0, 0);
          return d;
        })();
      setDraftTime(next);
      setPickerTarget({ day, field });

      if (Platform.OS === "ios") {
        slideAnim.setValue(300);
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
          tension: 45,
          friction: 8,
        }).start();
      }
    },
    [editSchedule, slideAnim],
  );

  const closePicker = useCallback(() => {
    if (Platform.OS === "ios") {
      Animated.timing(slideAnim, {
        toValue: 300,
        duration: 200,
        useNativeDriver: true,
      }).start(() => setPickerTarget(null));
    } else {
      setPickerTarget(null);
    }
  }, [slideAnim]);

  const confirmPicker = useCallback(() => {
    if (!pickerTarget) return;
    const formatted = formatTimeForDisplay(draftTime);
    setEditSchedule((prev) => ({
      ...prev,
      [pickerTarget.day]: {
        ...prev[pickerTarget.day],
        [pickerTarget.field]: formatted,
      },
    }));
    closePicker();
  }, [pickerTarget, draftTime, closePicker]);

  const handleAndroidChange = useCallback(
    (event: any, date?: Date) => {
      if (event.type === "dismissed" || !date || !pickerTarget) {
        setPickerTarget(null);
        return;
      }
      const currentDay = pickerTarget.day;
      const currentField = pickerTarget.field;
      setPickerTarget(null);
      const formatted = formatTimeForDisplay(date);
      setEditSchedule((prev) => ({
        ...prev,
        [currentDay]: {
          ...prev[currentDay],
          [currentField]: formatted,
        },
      }));
    },
    [pickerTarget],
  );

  // ── File picker ──
  const handlePickFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["application/pdf", "image/*"],
        copyToCacheDirectory: true,
      });
      if (result.canceled) return;
      const asset = result.assets?.[0];
      if (!asset) return;
      setSelectedFile(asset);
    } catch {
      showAlert(
        "Upload Failed",
        "Something went wrong. Please try again.",
        "error",
      );
    }
  };

  // ── Submit for review ──
  const handleSubmit = async () => {
    if (!selectedFile) {
      showAlert(
        "Missing Document",
        "Please upload your COR or Employee ID.",
        "error",
      );
      return;
    }

    const items = SCHEDULE_DAYS.map((d) => {
      const start = editSchedule[d.shortLabel]?.start;
      const end = editSchedule[d.shortLabel]?.end;
      const startDate = parseTimeString(start);
      const endDate = parseTimeString(end);
      return {
        dayOfWeek: d.key,
        startTime: startDate
          ? `${String(startDate.getHours()).padStart(2, "0")}:${String(
              startDate.getMinutes(),
            ).padStart(2, "0")}:00`
          : "",
        endTime: endDate
          ? `${String(endDate.getHours()).padStart(2, "0")}:${String(
              endDate.getMinutes(),
            ).padStart(2, "0")}:00`
          : "",
      };
    }).filter((item) => item.startTime && item.endTime);

    if (items.length === 0) {
      showAlert(
        "Missing Schedule",
        "Please set at least one day's schedule.",
        "error",
      );
      return;
    }

    setIsUploading(true);

    try {
      // Simulate upload delay for premium visual feedback
      await new Promise((resolve) => setTimeout(resolve, 800));

      // 1. Static COR submission (matching onboarding flow)
      const corRes = await onboardingService.updateCor({
        academicTerm: "2024-2025",
        corDocumentUrl: "https://example.com/cor-document.pdf",
      });
      if (!corRes?.isSuccess) {
        showAlert(
          "COR Upload Failed",
          corRes?.message || "Failed to submit COR.",
          "error",
        );
        setIsUploading(false);
        return;
      }

      // 2. Submit schedule
      const scheduleRes = await onboardingService.updateSchedule({ items });
      if (!scheduleRes?.isSuccess) {
        showAlert(
          "Schedule Error",
          scheduleRes?.message || "Failed to submit schedule.",
          "error",
        );
        setIsUploading(false);
        return;
      }

      // 3. Success
      setIsUploading(false);
      setIsEditing(false);
      queryClient.invalidateQueries({ queryKey: ["schedules"] });
      await fetchSchedules();
      showAlert(
        "Submitted for Review",
        "Your schedule and document have been submitted. An administrator will review your update shortly.",
        "success",
      );
    } catch (err: any) {
      setIsUploading(false);
      showAlert("Error", err?.message || "Please try again.", "error");
    }
  };

  const pickerLabel = pickerTarget
    ? `${pickerTarget.day} — ${
        pickerTarget.field === "start" ? "Start" : "End"
      }`
    : "";

  // ── Render ─────────────────────────────────────────────────────────────────

  if (isLoadingSchedules && schedules.length === 0) {
    return (
      <ContentWrapper noPaddingY>
        <View className="flex-1 items-center justify-center bg-light-background dark:bg-dark-background">
          <ActivityIndicator size="large" color="#7B1113" />
        </View>
      </ContentWrapper>
    );
  }

  return (
    <ContentWrapper noPaddingY>
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        contentContainerStyle={{ paddingTop: 16, paddingBottom: 40 }}
      >
        {isEditing ? (
          <ScheduleEditMode
            editSchedule={editSchedule}
            onClearDay={(day) =>
              setEditSchedule((prev) => ({ ...prev, [day]: {} }))
            }
            onOpenPicker={openPicker}
            onPickFile={handlePickFile}
            selectedFile={selectedFile}
            onClearFile={() => setSelectedFile(null)}
            isUploading={isUploading}
            onCancel={() => setIsEditing(false)}
            onSubmit={handleSubmit}
          />
        ) : (
          <ScheduleViewMode
            mappedSchedules={mappedSchedules}
            activeCount={activeCount}
            onStartEditing={handleStartEditing}
            gracePeriod={GRACE_PERIOD}
          />
        )}
      </ScrollView>

      {/* ── Alert Modal ──────────────────────────────────────────────────── */}
      <AlertModal
        visible={modal.visible}
        onClose={() => setModal((p) => ({ ...p, visible: false }))}
        title={modal.title}
        message={modal.message}
        variant={modal.variant}
      />

      {/* ── iOS Time Picker Drawer ───────────────────────────────────────── */}
      {pickerTarget && (
        <Animated.View
          style={[
            Platform.OS === "ios"
              ? { transform: [{ translateY: slideAnim }] }
              : {},
          ]}
          className="absolute bottom-0 left-0 right-0 bg-light-surface dark:bg-dark-surface rounded-t-card px-5 pb-8 shadow-card border-t border-light-border dark:border-dark-border z-50"
        >
          <View className="self-center w-9 h-1 rounded-pill bg-light-border dark:bg-dark-border mt-3 mb-2" />

          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-light-text dark:text-dark-text text-[15px] font-bold">
              {pickerLabel}
            </Text>
            <TouchableOpacity
              onPress={closePicker}
              className="px-3 py-1.5 rounded-button bg-light-surfaceMuted dark:bg-dark-surfaceMuted active:bg-light-border dark:active:bg-dark-border"
              activeOpacity={0.7}
            >
              <Text className="text-light-accent dark:text-dark-accent font-bold text-xs">
                Cancel
              </Text>
            </TouchableOpacity>
          </View>

          <View className="items-center mb-5 bg-light-background dark:bg-dark-background rounded-card overflow-hidden">
            <DateTimePicker
              value={draftTime}
              mode="time"
              is24Hour={false}
              display={Platform.OS === "ios" ? "spinner" : "default"}
              minuteInterval={1}
              onChange={(e, date) => {
                if (Platform.OS === "android") handleAndroidChange(e, date);
                else if (date) setDraftTime(date);
              }}
            />
          </View>

          {Platform.OS === "ios" && (
            <TouchableOpacity
              onPress={confirmPicker}
              className="rounded-button bg-light-accent dark:bg-dark-primary py-3.5 items-center justify-center active:opacity-90 shadow-soft"
              activeOpacity={0.8}
            >
              <Text className="text-light-textInverse dark:text-zinc-950 font-bold text-[15px]">
                Confirm Time Selection
              </Text>
            </TouchableOpacity>
          )}
        </Animated.View>
      )}
    </ContentWrapper>
  );
}
