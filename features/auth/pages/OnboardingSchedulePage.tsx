import { AlertModal } from "@/components/shared";
import { AppButton } from "@/components/ui";
import ScheduleDayRow from "@/components/ui/ScheduleDayRow";
import { SCHEDULE_DAYS } from "@/constants/scheduleDays";
import AuthLayout from "@/features/auth/components/AuthLayout";
import { onboardingService } from "@/features/auth/services/onboarding.service";
import { useApiMutation } from "@/hooks";
import DateTimePicker from "@react-native-community/datetimepicker";
import * as DocumentPicker from "expo-document-picker";
import { useRouter } from "expo-router";
import React, { useCallback, useRef, useState } from "react";
import { Animated, Platform, Text, TouchableOpacity, View } from "react-native";

type DayKey = (typeof SCHEDULE_DAYS)[number]["shortLabel"];

function formatTime(date: Date): string {
  let hours = date.getHours();
  const minutes = date.getMinutes();
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12 || 12;
  const mins = minutes.toString().padStart(2, "0");
  return `${hours}:${mins} ${ampm}`;
}

function parseTime(value?: string): Date | null {
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

export default function OnboardingSchedulePage() {
  const router = useRouter();
  const { run: submitSchedule, isLoading } = useApiMutation(
    onboardingService.updateSchedule,
  );

  const [schedule, setSchedule] = useState<
    Record<string, { start?: string; end?: string }>
  >(
    () =>
      Object.fromEntries(SCHEDULE_DAYS.map((d) => [d.shortLabel, {}])) as any,
  );

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

  const [selectedFile, setSelectedFile] =
    useState<DocumentPicker.DocumentPickerAsset | null>(null);

  const [modal, setModal] = useState({
    visible: false,
    title: "",
    message: "",
    variant: "error" as any,
  });

  const showAlert = useCallback(
    (
      title: string,
      message: string,
      variant: "error" | "warning" | "info" = "error",
    ) => {
      setModal({ visible: true, title, message, variant });
    },
    [],
  );

  const openPicker = useCallback(
    (day: string, field: "start" | "end") => {
      const existing = schedule[day]?.[field];
      const next =
        parseTime(existing) ??
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

  const confirmPicker = useCallback(() => {
    if (!pickerTarget) return;
    const formatted = formatTime(draftTime);
    setSchedule((prev) => ({
      ...prev,
      [pickerTarget.day]: {
        ...prev[pickerTarget.day],
        [pickerTarget.field]: formatted,
      },
    }));
    closePicker();
  }, [pickerTarget, draftTime, closePicker]);

  const handleAndroidChange = useCallback(
    (_event: unknown, date?: Date) => {
      if (!date || !pickerTarget) {
        setPickerTarget(null);
        return;
      }
      const formatted = formatTime(date);
      setSchedule((prev) => ({
        ...prev,
        [pickerTarget.day]: {
          ...prev[pickerTarget.day],
          [pickerTarget.field]: formatted,
        },
      }));
      setPickerTarget(null);
    },
    [pickerTarget],
  );

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

  const handleNext = async () => {
    // Build payload items: include all days with start/end or empty strings
    const items = SCHEDULE_DAYS.map((d) => ({
      dayOfWeek: d.key,
      startTime: schedule[d.shortLabel]?.start ?? "",
      endTime: schedule[d.shortLabel]?.end ?? "",
    }));

    try {
      const res = await submitSchedule({ items });
      if (!res?.isSuccess) {
        showAlert(
          "Schedule Error",
          res?.message || "Failed to submit schedule.",
          "error",
        );
        return;
      }
      router.replace("/(auth)/pending");
    } catch (err: any) {
      showAlert("Schedule Error", err?.message || "Please try again.", "error");
    }
  };

  const pickerLabel = pickerTarget
    ? `${pickerTarget.day} — ${pickerTarget.field === "start" ? "Start" : "End"} Time`
    : "";

  return (
    <AuthLayout
      header={
        <View className="flex-row items-center justify-between px-4 py-2 bg-light-surface">
          <TouchableOpacity
            onPress={() =>
              router.canGoBack()
                ? router.back()
                : router.replace("/(auth)/login")
            }
            className="w-10 h-10 items-center justify-center rounded-full active:bg-light-background"
          >
            <Text className="text-light-accent">Back</Text>
          </TouchableOpacity>
          <Text className="text-light-text text-[17px] font-black text-center flex-1">
            Schedule
          </Text>
          <View className="w-10" />
        </View>
      }
    >
      <View className="flex-1 bg-light-surface px-6 pt-4 pb-12">
        <Text className="text-light-muted text-xs mb-3">
          Set your usual campus schedule for admin review.
        </Text>

        <View className="gap-2">
          {SCHEDULE_DAYS.map((d) => (
            <ScheduleDayRow
              key={d.shortLabel}
              day={d.shortLabel as any}
              schedule={schedule[d.shortLabel] ?? {}}
              timeError={false}
              onOpenPicker={({ day, field }) => openPicker(d.shortLabel, field)}
              onClear={() => setSchedule((p) => ({ ...p, [d.shortLabel]: {} }))}
            />
          ))}
        </View>

        <View className="border-t border-light-border my-5" />

        <TouchableOpacity
          className="flex-row items-center justify-center gap-2"
          onPress={handlePickFile}
          activeOpacity={0.85}
        >
          <Text className="text-light-accent text-sm font-semibold">
            Upload COR or Employee ID
          </Text>
        </TouchableOpacity>

        {selectedFile && (
          <View className="items-center mt-2">
            <Text className="text-light-muted text-xs" numberOfLines={1}>
              {selectedFile.name}
            </Text>
            <TouchableOpacity
              onPress={() => setSelectedFile(null)}
              className="mt-2 px-3 py-1 rounded-full border border-light-border"
              activeOpacity={0.8}
            >
              <Text className="text-light-muted text-xs font-semibold">
                Remove
              </Text>
            </TouchableOpacity>
          </View>
        )}

        <AppButton
          label="Continue"
          variant="primary"
          size="lg"
          className="mt-8"
          onPress={handleNext}
          loading={isLoading}
          disabled={isLoading}
        />
      </View>

      <AlertModal
        visible={modal.visible}
        onClose={() => setModal((p) => ({ ...p, visible: false }))}
        title={modal.title}
        message={modal.message}
        variant={modal.variant}
      />

      <Animated.View
        style={[
          { display: pickerTarget ? "flex" : "none" },
          Platform.OS === "ios"
            ? { transform: [{ translateY: slideAnim }] }
            : {},
        ]}
        className="absolute bottom-0 left-0 right-0 bg-light-surface rounded-t-3xl px-5 pb-7 shadow-2xl"
      >
        <View className="self-center w-8 h-1 rounded-full bg-light-border mt-2 mb-2" />
        <View className="flex-row items-center justify-between mb-4">
          <Text className="text-light-accent text-sm font-bold">
            {pickerLabel}
          </Text>
          <TouchableOpacity
            onPress={closePicker}
            className="p-1.5 rounded-lg bg-light-background"
          >
            <Text>Close</Text>
          </TouchableOpacity>
        </View>
        <View className="items-center mb-6">
          <DateTimePicker
            value={draftTime}
            mode="time"
            is24Hour={false}
            display="spinner"
            minuteInterval={5}
            onChange={(e, date) => {
              if (Platform.OS === "android") handleAndroidChange(e, date);
              else if (date) setDraftTime(date);
            }}
          />
        </View>
        <TouchableOpacity
          onPress={confirmPicker}
          className="rounded-xl bg-light-accent py-3 items-center"
        >
          <Text className="text-light-surface font-heavy">Set Time</Text>
        </TouchableOpacity>
      </Animated.View>
    </AuthLayout>
  );
}
