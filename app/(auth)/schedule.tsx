import DateTimePicker from "@react-native-community/datetimepicker";
import * as DocumentPicker from "expo-document-picker";
import { useRouter } from "expo-router";
import { CheckCircle2, UploadCloud, X } from "lucide-react-native";
import { useCallback, useMemo, useRef, useState } from "react";
import {
  Animated, Modal, Platform, Pressable, Text, TouchableOpacity, View,
} from "react-native";
import { AuthLayout, CompactHeader, FormCard } from "../../components/layout";
import { AlertModal } from "../../components/shared";
import { AppButton } from "../../components/ui";
import ScheduleDayRow from "../../components/ui/ScheduleDayRow";
import { Roles } from "../../constants/roles";
import {
  SCHEDULE_DAYS,
  getDayLabel,
  type ScheduleDayKey,
} from "../../constants/scheduleDays";

import { NewUserRegisterRequest } from "@/types/user";
import { newUserService } from "../../services/new-user.service";
import { useRegisterStore } from "../../store/useRegisterStore";
import { getErrorMessage } from "../../utils/errorCodes";
import { formatFileSize } from "../../utils/formatFileSize";
import { formatTime } from "../../utils/formatTime";
import { getDefaultTime, isEndBeforeStart } from "../../utils/scheduleTime";
import { parseTime } from "../../utils/timeParser";
import { toTimeSpan } from "../../utils/toTimeSpan";
import { validatePayloadStringLengths } from "../../utils/validatePayloadStringLengths";

const tailwindConfig = require("../../tailwind.config");
const THEME_COLORS = tailwindConfig?.theme?.extend?.colors?.light || {};

type DaySchedule = {
  start?: string;
  end?: string;
};

const MAX_FILE_BYTES = 10 * 1024 * 1024;

type PickerTarget = { day: ScheduleDayKey; field: "start" | "end" };

export default function Schedule() {
  const router = useRouter();

  const {
    account,
    profile,
    vehicle,
    student,
    personnel,
    corSubmission,
    parkingSchedules,
    selectedRole,
    updateParkingSchedule,
    reset,
  } = useRegisterStore();

  const [submitting, setSubmitting] = useState(false);

  const [schedule, setSchedule] = useState<
    Record<ScheduleDayKey, DaySchedule>
  >(() => {
    const base = Object.fromEntries(
      SCHEDULE_DAYS.map((d) => [d.key, { start: "", end: "" }]),
    ) as Record<ScheduleDayKey, DaySchedule>;

    parkingSchedules.forEach((s) => {
      const dayKey = s.dayOfWeek as ScheduleDayKey;
      base[dayKey] = { start: s.startTime, end: s.endTime };
    });

    return base;
  });

  const [selectedFile, setSelectedFile] =
    useState<DocumentPicker.DocumentPickerAsset | null>(null);

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
      updateParkingSchedule(day, storeField, formatted);
    },
    [updateParkingSchedule],
  );

  const confirmPicker = useCallback(() => {
    if (!pickerTarget) return;
    applyScheduleTime(pickerTarget.day, pickerTarget.field, draftTime);
    closePicker();
  }, [pickerTarget, draftTime, closePicker, applyScheduleTime]);

  const handleAndroidChange = useCallback(
    (_event: unknown, date?: Date) => {
      setPickerTarget(null);
      if (!date || !pickerTarget) return;
      applyScheduleTime(pickerTarget.day, pickerTarget.field, date);
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

  const handlePickFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["application/pdf", "image/*"],
        copyToCacheDirectory: true,
      });
      if (result.canceled) return;

      const asset = result.assets?.[0];
      if (!asset) return;

      if (asset.size && asset.size > MAX_FILE_BYTES) {
        showAlert(
          "File Too Large",
          "Please upload a file under 10 MB.",
          "warning",
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

  const clearDay = useCallback(
    (dayKey: ScheduleDayKey) => {
      setSchedule((prev) => ({ ...prev, [dayKey]: {} }));
      updateParkingSchedule(dayKey, "startTime", "");
      updateParkingSchedule(dayKey, "endTime", "");
    },
    [updateParkingSchedule],
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

    setSubmitting(true);

    try {
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

      if (!vehicle?.plateNumber?.trim() || !vehicle?.brand?.trim()) {
        showAlert(
          "Missing Vehicle",
          "Please complete all vehicle details.",
          "warning",
        );
        return;
      }

      const payload: NewUserRegisterRequest = {
        account: {
          email: account.email.trim(),
          password: account.password,
          phoneNumber: account.phoneNumber.trim(),
        },

        profile: {
          firstName: profile.firstName.trim(),
          lastName: profile.lastName.trim(),
          profilePictureUrl: profile.profilePictureUrl.trim(),
        },

        student:
          selectedRole === Roles.Student
            ? {
                studentNumber: student?.studentNumber?.trim() ?? "",
                course: student?.course?.trim() ?? "",
                section: student?.section?.trim() ?? "",
                yearLevel: Number(student?.yearLevel ?? 0),
              }
            : undefined,

        personnel:
          selectedRole === Roles.UniversityStaff ||
          selectedRole === Roles.NonAcademicPersonnel
            ? {
                idCardNumber: personnel?.idCardNumber?.trim() ?? "",
                department: personnel?.department?.trim() ?? "",
              }
            : undefined,

        corSubmission: {
          academicTerm: corSubmission.academicTerm.trim(),
          corDocumentUrl: corSubmission.corDocumentUrl.trim(),
        },

        parkingSchedules: formattedSchedules,

        vehicles: [
          {
            plateNumber: vehicle.plateNumber.trim().toUpperCase(),
            brand: vehicle.brand.trim(),
          },
        ],
      };

      const oversized = validatePayloadStringLengths(payload, 256);
      if (oversized.length > 0) {
        showAlert(
          "Invalid Input",
          "Some fields exceed allowed length.",
          "error",
        );
        return;
      }

      const response = await newUserService.register(payload);

      if (!response?.isSuccess) {
        showAlert(
          "Submission Error",
          getErrorMessage(response?.errorCode ?? 0),
          "error",
        );
        return;
      }

      reset();
      router.replace("/(auth)/pending");
    } catch (error: unknown) {
      const errorCode =
        (error as { response?: { data?: { errorCode?: number } } })?.response
          ?.data?.errorCode ?? 0;
      showAlert("Submission Error", getErrorMessage(errorCode), "error");
    } finally {
      setSubmitting(false);
    }
  };

  const pickerLabel = pickerTarget
    ? `${getDayLabel(pickerTarget.day)} — ${pickerTarget.field === "start" ? "Start" : "End"} Time`
    : "";

  return (
    <AuthLayout>
      <CompactHeader />
      <FormCard
        title="Schedule Information"
        back={{ label: "Back", onPress: () => router.back() }}
      >
        <Text className="text-light-muted text-xs leading-4 mb-3">
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

        <View className="border-t border-light-border my-5" />

        <TouchableOpacity
          className="flex-row items-center justify-center gap-2"
          onPress={handlePickFile}
          activeOpacity={0.85}
        >
          {selectedFile ? (
            <CheckCircle2
              size={18}
              color={THEME_COLORS.success}
              strokeWidth={2.5}
            />
          ) : (
            <UploadCloud
              size={18}
              color={THEME_COLORS.accent}
              strokeWidth={2.5}
            />
          )}
          <Text className="text-light-accent text-sm font-semibold">
            Upload COR or Employee ID
          </Text>
        </TouchableOpacity>

        {selectedFile && (
          <View className="items-center mt-2">
            <Text className="text-light-muted text-xs" numberOfLines={1}>
              {selectedFile.name} · {formatFileSize(selectedFile.size)}
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

        <Text className="text-light-muted text-xs mt-3 text-center leading-4">
          Employees may upload a valid employee ID instead of COR.
        </Text>

        <View className="mt-6">
          <AppButton
            label="Complete Registration"
            size="lg"
            onPress={handleNext}
            loading={submitting}
            disabled={submitting}
          />
        </View>
      </FormCard>

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
            className="flex-1 bg-light-text"
            style={{ opacity: 0.45 }}
            onPress={closePicker}
          />
          <Animated.View
            style={{ transform: [{ translateY: slideAnim }] }}
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
                <X size={18} color={THEME_COLORS.muted} strokeWidth={2.5} />
              </TouchableOpacity>
            </View>

            <View className="items-center mb-6">
              <DateTimePicker
                value={draftTime}
                mode="time"
                is24Hour={false}
                display="spinner"
                minuteInterval={5}
                onChange={(_, date) => {
                  if (date) setDraftTime(date);
                }}
              />
            </View>

            <View className="flex-row gap-2">
              <TouchableOpacity
                className="flex-1 py-3 rounded-xl bg-light-background items-center"
                onPress={closePicker}
                activeOpacity={0.7}
              >
                <Text className="text-light-muted text-sm font-semibold">
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="flex-[2] py-3 rounded-xl bg-light-accent items-center"
                onPress={confirmPicker}
                activeOpacity={0.85}
              >
                <Text className="text-light-surface text-sm font-bold">
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
