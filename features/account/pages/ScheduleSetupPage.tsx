import { parseTime as parseTimeString } from "@/utils/timeParser";
import { useAppTheme } from "@/hooks/useAppTheme";
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
import { CheckCircle2, Clock } from "lucide-react-native";
import { userService } from "@/features/user/services/user.service";
import { useVehicleStore } from "@/features/user/store/vehicle.store";
import { validateFileSize } from "@/utils/fileValidation";
import { useSystemSettingsQuery } from "@/hooks";
import { useAuthStore } from "@/features/auth/store/auth.store";
import PersonnelParkingHours from "@/features/schedule/components/PersonnelParkingHours";
import AppButton from "@/components/ui/AppButton";
import React, { useCallback, useMemo, useRef, useState } from "react";
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

export default function ScheduleSetupPage() {
  const { colors } = useAppTheme();
  const { user, loadUser } = useAuthStore();
  const isPersonnel = user?.profileType === "personnel";
  const navigation = useNavigation();
  const lastScrolledRef = useRef(false);

  // ── Schedule store & dynamic settings ──
  const { schedules, isLoading: isLoadingSchedules, fetchSchedules } =
    useScheduleStore();
  const { vehicles } = useVehicleStore();
  const hasOngoingSession = vehicles.some((v) => v.status === "Parked");
  const { data: systemSettings } = useSystemSettingsQuery();

  const dynamicGracePeriod = useMemo(() => {
    const isEarly = systemSettings?.isEarlyParkingAllowed ?? true;
    const isGrace = systemSettings?.isGracePeriodEnabled ?? true;
    const entryMin = systemSettings?.earlyParkingMinutes ?? 15;
    const exitMin = systemSettings?.gracePeriodMinutes ?? 15;
    const mode = systemSettings?.feeCalculationMode ?? "per_hour";
    const rate = Number(systemSettings?.violationRatePerHour ?? 100).toFixed(2);
    const base = Number(systemSettings?.baseFee ?? 50).toFixed(2);

    let feePolicyText = `₱${rate}/hr overstay fee`;
    if (mode === "no_fee") feePolicyText = "Exempt (No overstay fees applied)";
    else if (mode === "per_day") feePolicyText = `₱${rate} / day flat overstay penalty`;
    else if (mode === "one_time") feePolicyText = `₱${base} one-time overstay penalty`;
    else if (mode === "one_time_hourly") feePolicyText = `₱${base} base + ₱${rate}/hr`;

    return {
      entryBeforeMin: entryMin,
      exitAfterMin: exitMin,
      isEarlyParkingAllowed: isEarly,
      isGracePeriodEnabled: isGrace,
      feePolicyText,
    };
  }, [systemSettings]);

  // ── Mode: view vs edit (default to edit/selector mode) ──
  const [isEditing, setIsEditing] = useState(true);

  // ── Edit state (same shape as onboarding) ──
  const [editSchedule, setEditSchedule] = useState<
    Record<string, { start?: string; end?: string }>
  >(() => {
    const prefilled: Record<string, { start?: string; end?: string }> = {};
    const existingSchedules = useScheduleStore.getState().schedules;
    for (const d of SCHEDULE_DAYS) {
      const sched = existingSchedules.find((s) => s.dayOfWeek === d.key);
      if (sched) {
        prefilled[d.shortLabel] = {
          start: formatTime(sched.startTime),
          end: formatTime(sched.endTime),
        };
      } else {
        prefilled[d.shortLabel] = {};
      }
    }
    return prefilled;
  });

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

  // ── COR document file state ──
  const [selectedFile, setSelectedFile] =
    useState<DocumentPicker.DocumentPickerAsset | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

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
      if (isPersonnel) return;
      const task = InteractionManager.runAfterInteractions(() => {
        fetchSchedules().then((res) => {
          if (res?.data && res.data.length > 0) {
            const prefilled: Record<string, { start?: string; end?: string }> = {};
            for (const d of SCHEDULE_DAYS) {
              const sched = res.data.find((s) => s.dayOfWeek === d.key);
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
          }
        });
      });
      return () => task.cancel();
    }, [isPersonnel, fetchSchedules]),
  );

  // ── Scroll tracking ──
  const handleScroll = (event: any) => {
    const yOffset = event?.nativeEvent?.contentOffset?.y;
    if (yOffset !== undefined && yOffset !== null) {
      const scrolled = yOffset > 0;
      if (lastScrolledRef.current !== scrolled) {
        lastScrolledRef.current = scrolled;
        try {
          navigation.setParams({ hasScrolled: scrolled } as any);
        } catch {
          // Ignore if navigation is detaching or unmounted
        }
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
    if (hasOngoingSession) {
      showAlert(
        "Action Locked",
        "You cannot update your schedule or COR document while you have an ongoing parking session. Please exit the parking facility first.",
        "warning",
      );
      return;
    }
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
      setDraftTime(date);
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

  // Android's native dialog reopens when onChange changes identity.
  // Keep this stable across unrelated renders so the chosen time is not reset.
  const handlePickerChange = useCallback(
    (event: { type: string }, date?: Date) => {
      if (Platform.OS === "android") handleAndroidChange(event, date);
      else if (event.type === "set" && date) setDraftTime(date);
    },
    [handleAndroidChange],
  );

  // ── COR File picker (PDF only) ──
  const handlePickFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: isPersonnel ? ["application/pdf", "image/*"] : ["application/pdf"],
        copyToCacheDirectory: true,
      });
      if (result.canceled) return;
      const asset = result.assets?.[0];
      if (!asset) return;

      const validation = validateFileSize(asset, 5);
      if (!validation.isValid) {
        showAlert(
          "File Too Large",
          validation.message || "File size cannot exceed 5MB.",
          "error",
        );
        return;
      }

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
    if (hasOngoingSession) {
      showAlert(
        "Action Locked",
        isPersonnel ? "Cannot update your Employee ID while you have an ongoing parking session. Please exit the parking facility first." : "Cannot update schedule or COR while you have an ongoing parking session. Please exit the parking facility first.",
        "warning",
      );
      return;
    }

    if (!selectedFile) {
      showAlert(
        "Missing Document",
        isPersonnel ? "Please upload your Employee ID." : "Please upload your COR document.",
        "error",
      );
      return;
    }

    const fileValidation = validateFileSize(selectedFile, 5);
    if (!fileValidation.isValid) {
      showAlert(
        "File Too Large",
        fileValidation.message || "File size cannot exceed 5MB.",
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

    if (!isPersonnel && items.length === 0) {
      showAlert(
        "Missing Schedule",
        "Please set at least one day's schedule.",
        "error",
      );
      return;
    }

    setIsUploading(true);

    try {
      let corUrl = selectedFile.uri;
      if (
        !selectedFile.uri.startsWith("http://") &&
        !selectedFile.uri.startsWith("https://")
      ) {
        const corUploadRes = await userService.uploadCorDocument(
          selectedFile.uri,
          selectedFile.name,
          "",
        );
        if (!corUploadRes?.isSuccess || !corUploadRes.data?.secureUrl) {
          showAlert(
            "Upload Error",
            corUploadRes?.message ||
              "Failed to upload document. Please ensure the file is under 5MB and in valid format.",
            "error",
          );
          setIsUploading(false);
          return;
        }
        corUrl = corUploadRes.data.secureUrl;
      }

      const corRes = await onboardingService.updateCor({
        academicTerm: isPersonnel ? "Employee ID" : "2024-2025",
        corDocumentUrl: corUrl,
      });

      const scheduleRes = isPersonnel ? null : await onboardingService.updateSchedule({ items });
      if (isPersonnel ? !corRes?.isSuccess : !scheduleRes?.isSuccess && !corRes?.isSuccess) {
        showAlert(
          isPersonnel ? "Employee ID submission failed" : "Schedule Error",
          scheduleRes?.message || corRes?.message || "Failed to submit schedule.",
          "error",
        );
        setIsUploading(false);
        return;
      }

      setIsUploading(false);
      setIsEditing(false);
      if (!isPersonnel) {
        queryClient.invalidateQueries({ queryKey: ["schedules"] });
        await fetchSchedules();
      }
      await queryClient.invalidateQueries({ queryKey: ["profile"] });
      await loadUser();
      setShowSuccessModal(true);
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

  if (!isPersonnel && isLoadingSchedules && schedules.length === 0) {
    return (
      <ContentWrapper noPaddingY>
        <View className="flex-1 items-center justify-center bg-light-background dark:bg-dark-background">
          <ActivityIndicator size="large" color={colors.primary} />
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
        {hasOngoingSession && (
          <View className="mb-4 px-4 py-3.5 rounded-2xl bg-light-warning/10 dark:bg-dark-warning/20 border border-light-warning/30 dark:border-dark-warning/30 flex-row items-center gap-3">
            <Clock size={18} color={colors.warning} strokeWidth={2.2} />
            <Text className="text-light-text dark:text-dark-warning text-xs font-semibold flex-1 leading-relaxed">
              {isPersonnel ? "Updating your Employee ID is locked until your vehicle exits." : "Active Parking Session: Updating your Certificate of Registration (COR) and weekly schedule is locked until your vehicle exits."}
            </Text>
          </View>
        )}

        {isEditing ? (
          <ScheduleEditMode
            isPersonnel={isPersonnel}
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
        ) : isPersonnel ? (
          <View>
            <PersonnelParkingHours />
            <AppButton label="Update Employee ID" variant="outline" uppercase={false} onPress={() => setIsEditing(true)} />
          </View>
        ) : (
          <ScheduleViewMode
            mappedSchedules={mappedSchedules}
            activeCount={activeCount}
            onStartEditing={handleStartEditing}
            gracePeriod={dynamicGracePeriod}
          />
        )}
      </ScrollView>

      {/* Alert Modal */}
      <AlertModal
        visible={modal.visible}
        onClose={() => setModal((p) => ({ ...p, visible: false }))}
        title={modal.title}
        message={modal.message}
        variant={modal.variant}
      />

      {/* Success Send Modal */}
      <AlertModal
        visible={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        title={isPersonnel ? "Employee ID submitted" : "Schedule Submitted"}
        message={isPersonnel ? "Your Employee ID has been submitted for administrative review. Your parking hours remain managed by the Super Admin." : "Your campus schedule and COR document have been successfully submitted for administrative review."}
        variant="success"
        icon={<CheckCircle2 size={32} color={colors.success} strokeWidth={2.5} />}
        buttonLabel="Done"
      />

      {/* iOS Time Picker Drawer */}
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
              <Text className="text-light-muted dark:text-dark-muted font-bold text-xs">
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
              onChange={handlePickerChange}
            />
          </View>

          {Platform.OS === "ios" && (
            <TouchableOpacity
              onPress={confirmPicker}
              className="rounded-button bg-light-primary dark:bg-dark-primary py-3.5 items-center justify-center active:opacity-90"
              activeOpacity={0.8}
            >
              <Text className="text-light-textInverse dark:text-dark-background font-bold text-[15px]">
                Confirm Time Selection
              </Text>
            </TouchableOpacity>
          )}
        </Animated.View>
      )}
    </ContentWrapper>
  );
}
