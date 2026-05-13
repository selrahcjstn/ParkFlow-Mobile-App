import DateTimePicker from "@react-native-community/datetimepicker";
import * as DocumentPicker from "expo-document-picker";
import { useRouter } from "expo-router";
import { CheckCircle2, UploadCloud, X } from "lucide-react-native";
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
import { AuthLayout, CompactHeader, FormCard } from "../../components/layout";
import { AlertModal } from "../../components/shared";
import { AppButton } from "../../components/ui";
import ScheduleDayRow from "../../components/ui/ScheduleDayRow";
import { Roles } from "../../constants/roles";

import { newUserService } from "../../services/new-user.service";
import { useRegisterStore } from "../../store/useRegisterStore";
import { getErrorMessage } from "../../utils/errorCodes";

// theme colors
const tailwindConfig = require("../../tailwind.config");
const THEME_COLORS = tailwindConfig?.theme?.extend?.colors?.light || {};

const DAYS = [
  { key: 1, label: "Monday" },
  { key: 2, label: "Tuesday" },
  { key: 3, label: "Wednesday" },
  { key: 4, label: "Thursday" },
  { key: 5, label: "Friday" },
  { key: 6, label: "Saturday" },
  { key: 0, label: "Sunday" },
] as const;

type DayKey = (typeof DAYS)[number]["key"];

type DaySchedule = {
  start?: string;
  end?: string;
};

const MAX_FILE_BYTES = 10 * 1024 * 1024;

type PickerTarget = { day: DayKey; field: "start" | "end" };

const getDayLabel = (key: DayKey) =>
  DAYS.find((d) => d.key === key)?.label || "";

function formatTime(date: Date): string {
  let hours = date.getHours();
  const minutes = date.getMinutes();
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12 || 12;
  const mins = minutes.toString().padStart(2, "0");
  return `${hours}:${mins} ${ampm}`;
}

function toMinutes(value?: string): number | null {
  if (!value) return null;
  const [time, ampm] = value.split(" ");
  if (!time || !ampm) return null;
  let [hours, minutes] = time.split(":").map(Number);
  if (ampm === "PM" && hours !== 12) hours += 12;
  if (ampm === "AM" && hours === 12) hours = 0;
  return hours * 60 + minutes;
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

function getDefaultTime(field: "start" | "end"): Date {
  const date = new Date();
  date.setHours(field === "start" ? 8 : 17, 0, 0, 0);
  return date;
}

function isEndBeforeStart(s?: string, e?: string): boolean {
  const start = toMinutes(s);
  const end = toMinutes(e);
  if (start === null || end === null) return false;
  return end <= start;
}

function formatFileSize(size?: number): string {
  if (!size) return "";
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

export function toTimeSpan(value?: string): string {
  if (!value) return "";
  const [time, modifier] = value.split(" ");
  if (!time || !modifier) return "";

  let [hours, minutes] = time.split(":");
  let hrs = parseInt(hours, 10);

  if (hrs === 12) {
    hrs = modifier === "AM" ? 0 : 12;
  } else if (modifier === "PM") {
    hrs += 12;
  }

  const hh = hrs.toString().padStart(2, "0");
  const mm = minutes.padStart(2, "0");

  return `${hh}:${mm}:00`;
}

export default function Schedule() {
  const router = useRouter();

  // registration store
  const {
    account,
    profile,
    vehicle,
    corSubmission,
    parkingSchedules,
    updateParkingSchedule,
    reset,
  } = useRegisterStore();

  const [submitting, setSubmitting] = useState(false);

  // helper: validate string lengths
  const validatePayloadStringLengths = (
    obj: unknown,
    limit = 256,
    prefix = "",
  ) => {
    const problems: { path: string; length: number; value: string }[] = [];

    const walk = (val: any, path: string) => {
      if (val == null) return;
      if (typeof val === "string") {
        if (val.length > limit)
          problems.push({ path, length: val.length, value: val });
        return;
      }
      if (typeof val === "number" || typeof val === "boolean") return;
      if (Array.isArray(val)) {
        val.forEach((v, i) => walk(v, `${path}[${i}]`));
        return;
      }
      if (typeof val === "object") {
        Object.keys(val).forEach((k) =>
          walk((val as any)[k], path ? `${path}.${k}` : k),
        );
      }
    };

    walk(obj, prefix || "");
    return problems;
  };

  const [schedule, setSchedule] = useState<Record<DayKey, DaySchedule>>(() => {
    const base = Object.fromEntries(
      DAYS.map((d) => [d.key, { start: "", end: "" }]),
    ) as Record<DayKey, DaySchedule>;

    parkingSchedules.forEach((s) => {
      const dayKey = s.dayOfWeek as DayKey;
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
      DAYS.some((d) =>
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

  const confirmPicker = useCallback(() => {
    if (!pickerTarget) return;
    const formatted = formatTime(draftTime);
    const storeField = pickerTarget.field === "start" ? "startTime" : "endTime";

    setSchedule((prev) => ({
      ...prev,
      [pickerTarget.day]: {
        ...prev[pickerTarget.day],
        [pickerTarget.field]: formatted,
      },
    }));

    updateParkingSchedule(pickerTarget.day, storeField, formatted);
    closePicker();
  }, [pickerTarget, draftTime, closePicker, updateParkingSchedule]);

  const handleAndroidChange = useCallback(
    (_event: unknown, date?: Date) => {
      setPickerTarget(null);
      if (!date || !pickerTarget) return;
      const formatted = formatTime(date);
      const storeField =
        pickerTarget.field === "start" ? "startTime" : "endTime";

      setSchedule((prev) => ({
        ...prev,
        [pickerTarget.day]: {
          ...prev[pickerTarget.day],
          [pickerTarget.field]: formatted,
        },
      }));

      updateParkingSchedule(pickerTarget.day, storeField, formatted);
    },
    [pickerTarget, updateParkingSchedule],
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
    } catch (err) {
      showAlert(
        "Upload Failed",
        "Something went wrong. Please try again.",
        "error",
      );
    }
  };

  const clearDay = useCallback(
    (dayKey: DayKey) => {
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
      // ==========================================
      // STEP 4: PREPARE THE SCHEDULE ARRAY
      // ==========================================
      const formattedSchedules = DAYS.map((d) => ({
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
        setSubmitting(false);
        return;
      }

      // Store values (steps 1-3) + schedule (step 4) combine into one payload.
      const profilePayload = {
        idCardNumber: profile.idCardNumber.trim(),
        firstName: profile.firstName.trim(),
        lastName: profile.lastName.trim(),
        profilePictureUrl: profile.profilePictureUrl.trim(),
        ...(account.role === Roles.Student
          ? {
              course: profile.course.trim(),
              yearLevel: Number(profile.yearLevel),
              section: profile.section.trim(),
            }
          : {}),
        ...(account.role === Roles.UniversityStaff ||
        account.role === Roles.NonAcademicPersonell
          ? { office: profile.office.trim() }
          : {}),
      };

      const payload = {
        account: {
          email: account.email.trim(),
          password: account.password,
          phoneNumber: account.phoneNumber.trim(),
          role: Number(account.role),
        },
        profile: profilePayload,
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

      // Validate payload locally for oversized strings to avoid DB errors.
      const oversized = validatePayloadStringLengths(payload, 256);
      if (oversized.length > 0) {
        showAlert(
          "Invalid Input",
          `Some fields exceed allowed length.`,
          "error",
        );
        setSubmitting(false);
        return;
      }

      // submitting
      console.info("[register] submitting");

      const response = await newUserService.register(payload);

      if (!response?.isSuccess) {
        showAlert(
          "Submission Error",
          getErrorMessage(response?.errorCode ?? 0),
          "error",
        );
        setSubmitting(false);
        return;
      }

      // Clean up the Register Store since everything is successfully finished
      reset();

      router.replace("/(auth)/pending");
    } catch (error: any) {
      // Log removed in production; preserve error for alerting
      // Advanced server error data may be available on `error.response`

      // submission error
      console.error("[register] submission exception");
      const errorCode = error?.response?.data?.errorCode ?? 0;
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
          {DAYS.map((d) => (
            <ScheduleDayRow
              key={d.key}
              day={d.label as any}
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
