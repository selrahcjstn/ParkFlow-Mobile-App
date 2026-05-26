import { AlertModal } from "@/components/shared";
import { AppButton } from "@/components/ui";
import ScheduleDayRow from "@/components/ui/ScheduleDayRow";
import { SCHEDULE_DAYS, type ScheduleDayKey } from "@/constants/scheduleDays";
import AuthLayout from "@/features/auth/components/AuthLayout";
import { onboardingService } from "@/features/auth/services/onboarding.service";
import { useOnboardingStore } from "@/features/auth/store/onboarding.store";
import { useApiMutation } from "@/hooks";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useRouter } from "expo-router";
import { ChevronLeft } from "lucide-react-native";
import { useCallback, useMemo, useRef, useState } from "react";
import {
    Animated,
    Modal,
    Platform,
    Pressable,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

import { formatTime } from "@/utils/formatTime";
import { getDefaultTime, isEndBeforeStart } from "@/utils/scheduleTime";
import { parseTime } from "@/utils/timeParser";
import { toTimeSpan } from "@/utils/toTimeSpan";

type DaySchedule = {
  start?: string;
  end?: string;
};

type PickerTarget = { day: ScheduleDayKey; field: "start" | "end" };

export default function OnboardingSchedulePage() {
  const router = useRouter();
  const { run: updateSchedule, isLoading: submitting } = useApiMutation(
    onboardingService.updateSchedule,
  );

  const { scheduleItems, updateScheduleItem } = useOnboardingStore();

  const [schedule, setSchedule] = useState<Record<ScheduleDayKey, DaySchedule>>(
    () => {
      const base = Object.fromEntries(
        SCHEDULE_DAYS.map((d) => [d.key, { start: "", end: "" }]),
      ) as Record<ScheduleDayKey, DaySchedule>;

      scheduleItems.forEach((s) => {
        const dayKey = s.dayOfWeek as ScheduleDayKey;
        base[dayKey] = { start: s.startTime, end: s.endTime };
      });

      return base;
    },
  );

  const [pickerTarget, setPickerTarget] = useState<PickerTarget | null>(null);
  const [draftTime, setDraftTime] = useState<Date>(() =>
    getDefaultTime("start"),
  );
  const slideAnim = useRef(new Animated.Value(300)).current;

  const [modalVisible, setModalVisible] = useState(false);
  const [modalTitle, setModalTitle] = useState("");
  const [modalMessage, setModalMessage] = useState("");
  const [modalVariant, setModalVariant] = useState<
    "error" | "warning" | "info"
  >("info");

  const hasTimeErrors = useMemo(
    () =>
      SCHEDULE_DAYS.some((d) =>
        isEndBeforeStart(schedule[d.key].start, schedule[d.key].end),
      ),
    [schedule],
  );

  const openPicker = useCallback(
    (target: PickerTarget) => {
      const existing = schedule[target.day][target.field];
      const nextTime = parseTime(existing) ?? getDefaultTime(target.field);
      setDraftTime(nextTime);
      setPickerTarget(target);

      if (Platform.OS === "ios") {
        slideAnim.setValue(300);
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
          damping: 20,
          stiffness: 200,
        }).start();
      }
    },
    [schedule, slideAnim],
  );

  const closePicker = useCallback(() => {
    if (Platform.OS === "ios") {
      Animated.timing(slideAnim, {
        toValue: 300,
        duration: 180,
        useNativeDriver: true,
      }).start(() => setPickerTarget(null));
    } else {
      setPickerTarget(null);
    }
  }, [slideAnim]);

  const applyScheduleTime = useCallback(
    (day: ScheduleDayKey, field: "start" | "end", date: Date) => {
      const formatted = formatTime(date);
      const storeField = field === "start" ? "startTime" : "endTime";

      setSchedule((prev) => ({
        ...prev,
        [day]: { ...prev[day], [field]: formatted },
      }));
      updateScheduleItem(day, storeField, formatted);
    },
    [updateScheduleItem],
  );

  const confirmPicker = useCallback(() => {
    if (!pickerTarget) return;
    applyScheduleTime(pickerTarget.day, pickerTarget.field, draftTime);
    closePicker();
  }, [pickerTarget, draftTime, closePicker, applyScheduleTime]);

  const handleAndroidChange = useCallback(
    (_event: unknown, date?: Date) => {
      if (date && pickerTarget) {
        applyScheduleTime(pickerTarget.day, pickerTarget.field, date);
      }
      setPickerTarget(null);
    },
    [pickerTarget, applyScheduleTime],
  );

  const showAlert = useCallback(
    (
      title: string,
      message: string,
      variant: "error" | "warning" | "info" = "info",
    ) => {
      setModalTitle(title);
      setModalMessage(message);
      setModalVariant(variant);
      setModalVisible(true);
    },
    [],
  );

  const clearDay = useCallback(
    (dayKey: ScheduleDayKey) => {
      setSchedule((prev) => ({ ...prev, [dayKey]: {} }));
      updateScheduleItem(dayKey, "startTime", "");
      updateScheduleItem(dayKey, "endTime", "");
    },
    [updateScheduleItem],
  );

  const handleNext = async () => {
    if (hasTimeErrors) {
      showAlert(
        "Invalid Time Range",
        "One or more days have an end time before the start time.",
        "error",
      );
      return;
    }

    const formattedSchedules = SCHEDULE_DAYS.map((d) => ({
      dayOfWeek: d.key,
      startTime: toTimeSpan(schedule[d.key]?.start),
      endTime: toTimeSpan(schedule[d.key]?.end),
    })).filter((d) => d.startTime !== "" && d.endTime !== "");

    if (formattedSchedules.length === 0) {
      showAlert(
        "Missing Schedule",
        "Please set at least one valid day.",
        "warning",
      );
      return;
    }

    try {
      const response = await updateSchedule({ items: formattedSchedules });

      if (!response?.isSuccess) {
        showAlert(
          "Schedule Update Failed",
          response?.message || "Please try again.",
          "error",
        );
        return;
      }

      router.replace("/(auth)/onboarding-cor");
    } catch (error) {
      showAlert("Schedule Update Failed", "Please try again.", "error");
    }
  };

  return (
    <AuthLayout
      background="bg-light-surface"
      header={
        <View className="flex-row items-center justify-between px-4 py-2 bg-light-surface">
          <TouchableOpacity
            onPress={() => router.back()}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            className="w-10 h-10 items-center justify-center rounded-full active:bg-light-background"
          >
            <ChevronLeft size={24} color="#D22730" strokeWidth={2.5} />
          </TouchableOpacity>

          <Text
            numberOfLines={1}
            className="text-light-text text-[17px] font-black text-center flex-1"
          >
            Schedule Info
          </Text>

          <View className="w-10" />
        </View>
      }
    >
      <View className="flex-1 bg-light-surface px-6 pt-6 pb-12">
        <Text className="text-light-muted font-regular text-[13px] mb-6">
          Set your usual campus schedule for admin review.
        </Text>

        <View className="gap-2">
          {SCHEDULE_DAYS.map((d) => (
            <ScheduleDayRow
              key={d.key}
              day={d.shortLabel}
              schedule={schedule[d.key]}
              timeError={isEndBeforeStart(
                schedule[d.key].start,
                schedule[d.key].end,
              )}
              onOpenPicker={(target) => openPicker({ ...target, day: d.key })}
              onClear={() => clearDay(d.key)}
            />
          ))}
        </View>

        <View className="mt-8">
          <AppButton
            label="Continue"
            size="lg"
            onPress={handleNext}
            loading={submitting}
            disabled={submitting}
          />
        </View>
      </View>

      {Platform.OS === "android" && pickerTarget && (
        <DateTimePicker
          value={draftTime}
          mode="time"
          is24Hour={false}
          display="default"
          minuteInterval={5}
          onChange={handleAndroidChange}
        />
      )}

      {Platform.OS === "ios" && (
        <Modal
          visible={Boolean(pickerTarget)}
          transparent
          animationType="none"
          statusBarTranslucent
          onRequestClose={closePicker}
        >
          <Pressable
            className="flex-1"
            style={{ backgroundColor: "rgba(0, 0, 0, 0.4)" }}
            onPress={closePicker}
          />
          <Animated.View
            style={{ transform: [{ translateY: slideAnim }] }}
            className="absolute bottom-0 left-0 right-0 bg-light-surface rounded-t-3xl px-6 pb-8"
          >
            <View className="self-center w-12 h-1.5 rounded-full bg-light-border/60 mt-3 mb-6" />

            <View className="items-center mb-6">
              <DateTimePicker
                value={draftTime}
                mode="time"
                is24Hour={false}
                display="spinner"
                minuteInterval={5}
                textColor="#18181B"
                onChange={(_, date) => {
                  if (date) setDraftTime(date);
                }}
              />
            </View>

            <View className="flex-row gap-3">
              <TouchableOpacity
                className="flex-1 py-3.5 rounded-2xl bg-light-background items-center"
                onPress={closePicker}
                activeOpacity={0.7}
              >
                <Text className="text-light-muted font-book text-sm leading-5">
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="flex-[2] py-3.5 rounded-2xl bg-light-accent items-center"
                onPress={confirmPicker}
                activeOpacity={0.85}
              >
                <Text className="text-light-surface font-heavy text-sm leading-5">
                  Set Time
                </Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </Modal>
      )}

      <AlertModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        title={modalTitle}
        message={modalMessage}
        variant={modalVariant}
      />
    </AuthLayout>
  );
}
