import * as DocumentPicker from "expo-document-picker";
import { useRouter } from "expo-router";
import { useCallback, useMemo, useRef, useState } from "react";
import { Animated, Platform, View } from "react-native";

import { AuthLayout, CompactHeader, FormCard } from "../../components/layout";
import { AppButton } from "../../components/ui";
import ScheduleDayRow from "../../components/ui/ScheduleDayRow";

import { newUserService } from "../../services/new-user.service";
import { useRegisterStore } from "../../store/useRegisterStore";

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

/* ---------------- TIME HELPERS ---------------- */

function formatTime(date: Date): string {
  let hours = date.getHours();
  const minutes = date.getMinutes();
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12 || 12;
  return `${hours}:${minutes.toString().padStart(2, "0")} ${ampm}`;
}

function toMinutes(value?: string): number | null {
  if (!value) return null;
  const [time, ampm] = value.split(" ");
  if (!time || !ampm) return null;

  let [h, m] = time.split(":").map(Number);
  if (ampm === "PM" && h !== 12) h += 12;
  if (ampm === "AM" && h === 12) h = 0;

  return h * 60 + m;
}

function parseTime(value?: string): Date | null {
  if (!value) return null;

  const [time, ampm] = value.split(" ");
  if (!time || !ampm) return null;

  let [h, m] = time.split(":").map(Number);
  if (ampm === "PM" && h !== 12) h += 12;
  if (ampm === "AM" && h === 12) h = 0;

  const date = new Date();
  date.setHours(h, m, 0, 0);
  return date;
}

function getDefaultTime(field: "start" | "end"): Date {
  const d = new Date();
  d.setHours(field === "start" ? 8 : 17, 0, 0, 0);
  return d;
}

function isEndBeforeStart(s?: string, e?: string) {
  const start = toMinutes(s);
  const end = toMinutes(e);
  if (start === null || end === null) return false;
  return end <= start;
}

function formatFileSize(size?: number) {
  if (!size) return "";
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

export function toTimeSpan(value?: string) {
  if (!value) return "";
  const [time, modifier] = value.split(" ");
  if (!time || !modifier) return "";

  let [h, m] = time.split(":").map(Number);

  if (h === 12) h = modifier === "AM" ? 0 : 12;
  else if (modifier === "PM") h += 12;

  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:00`;
}

/* ---------------- COMPONENT ---------------- */

export default function Schedule() {
  const router = useRouter();

  const {
    account,
    profile,
    student,
    personnel,
    vehicle,
    corSubmission,
    parkingSchedules,
    updateParkingSchedule,
    reset,
  } = useRegisterStore();

  const [submitting, setSubmitting] = useState(false);

  const [schedule, setSchedule] = useState<Record<DayKey, DaySchedule>>(() => {
    const base = Object.fromEntries(
      DAYS.map((d) => [d.key, { start: "", end: "" }]),
    ) as Record<DayKey, DaySchedule>;

    parkingSchedules.forEach((s) => {
      base[s.dayOfWeek as DayKey] = {
        start: s.startTime,
        end: s.endTime,
      };
    });

    return base;
  });

  const [selectedFile, setSelectedFile] =
    useState<DocumentPicker.DocumentPickerAsset | null>(null);

  const [pickerTarget, setPickerTarget] = useState<PickerTarget | null>(null);
  const [draftTime, setDraftTime] = useState(() => getDefaultTime("start"));

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

  /* ---------------- SCHEDULE ---------------- */

  const openPicker = useCallback(
    (target: PickerTarget) => {
      const existing = schedule[target.day][target.field];
      setDraftTime(parseTime(existing) ?? getDefaultTime(target.field));
      setPickerTarget(target);

      if (Platform.OS === "ios") {
        slideAnim.setValue(300);
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
        }).start();
      }
    },
    [schedule],
  );

  const closePicker = () => setPickerTarget(null);

  const confirmPicker = () => {
    if (!pickerTarget) return;

    const formatted = formatTime(draftTime);
    const field = pickerTarget.field === "start" ? "startTime" : "endTime";

    setSchedule((prev) => ({
      ...prev,
      [pickerTarget.day]: {
        ...prev[pickerTarget.day],
        [pickerTarget.field]: formatted,
      },
    }));

    updateParkingSchedule(pickerTarget.day, field, formatted);
    closePicker();
  };

  /* ---------------- FILE ---------------- */

  const handlePickFile = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: ["application/pdf", "image/*"],
      copyToCacheDirectory: true,
    });

    if (result.canceled) return;

    const file = result.assets?.[0];
    if (!file) return;

    if (file.size && file.size > MAX_FILE_BYTES) return;

    setSelectedFile(file);
  };

  /* ---------------- SUBMIT ---------------- */

  const handleNext = async () => {
    if (hasTimeErrors) return;

    setSubmitting(true);

    try {
      const formattedSchedules = DAYS.map((d) => ({
        dayOfWeek: d.key,
        startTime: toTimeSpan(schedule[d.key]?.start),
        endTime: toTimeSpan(schedule[d.key]?.end),
      })).filter((d) => d.startTime && d.endTime);

      const profilePayload = {
        firstName: profile.firstName.trim(),
        lastName: profile.lastName.trim(),
        profilePictureUrl: profile.profilePictureUrl.trim(),
      };

      const payload = {
        account: {
          email: account.email.trim(),
          password: account.password,
          phoneNumber: account.phoneNumber.trim(),
        },
        profile: profilePayload,

        student: student
          ? {
              studentNumber: student.studentNumber.trim(),
              course: student.course.trim(),
              section: student.section.trim(),
              yearLevel: Number(student.yearLevel),
            }
          : undefined,

        personnel: personnel
          ? {
              idCardNumber: personnel.idCardNumber.trim(),
              department: personnel.department.trim(),
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

      const res = await newUserService.register(payload);

      if (!res?.isSuccess) return;

      reset();
      router.replace("/(auth)/pending");
    } catch (e) {
      setSubmitting(false);
    }
  };

  /* ---------------- UI ---------------- */

  return (
    <AuthLayout>
      <CompactHeader />

      <FormCard title="Schedule Information">
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
              onOpenPicker={(t) => openPicker({ ...t, day: d.key })}
              onClear={() => updateParkingSchedule(d.key, "startTime", "")}
            />
          ))}
        </View>

        <AppButton
          label="Complete Registration"
          onPress={handleNext}
          loading={submitting}
        />
      </FormCard>
    </AuthLayout>
  );
}
