import DateTimePicker from "@react-native-community/datetimepicker";
import * as DocumentPicker from "expo-document-picker";
import { useRouter } from "expo-router";
import { AlertCircle, CheckCircle2, UploadCloud, X } from "lucide-react-native";
import { useCallback, useMemo, useRef, useState } from "react";
import {
    Animated,
    Modal,
    Platform,
    Pressable,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { AuthLayout, CompactHeader, FormCard } from "../../components/layout";
import { AlertModal } from "../../components/shared";
import { AppButton } from "../../components/ui";

type DayKey = "Mon" | "Tues" | "Wed" | "Thurs" | "Fri" | "Sat" | "Sun";
type DaySchedule = { start?: string; end?: string };

const DAYS: DayKey[] = ["Mon", "Tues", "Wed", "Thurs", "Fri", "Sat", "Sun"];
const MAX_FILE_BYTES = 10 * 1024 * 1024;

type PickerTarget = { day: DayKey; field: "start" | "end" };

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

const COLORS = {
  primary: "#9D0215",
  accent: "#1E3A5F",
  secondary: "#475569",
  background: "#F8F9FA",
  surface: "#FFFFFF",
  text: "#111827",
  muted: "#6B7280",
  border: "#E5E7EB",
  success: "#10B981",
  warning: "#F59E0B",
  danger: "#EF4444",
};

type DayRowProps = {
  day: DayKey;
  schedule: DaySchedule;
  onOpenPicker: (target: PickerTarget) => void;
  onClear: (day: DayKey) => void;
};

function DayRow({ day, schedule, onOpenPicker, onClear }: DayRowProps) {
  const hasAny = Boolean(schedule.start || schedule.end);
  const hasBoth = Boolean(schedule.start && schedule.end);
  const timeError = isEndBeforeStart(schedule.start, schedule.end);

  const badgeBase = "rounded-xl px-3 py-3 border min-w-[64px] items-center";
  const badgeStyles =
    hasBoth && !timeError
      ? "bg-light-accent border-light-accent"
      : hasAny
        ? "bg-light-background border-light-border"
        : "bg-light-surface border-light-border";
  const badgeTextStyles =
    hasBoth && !timeError
      ? "text-light-surface"
      : hasAny
        ? "text-light-accent"
        : "text-light-muted";

  const timeBase = "flex-1 rounded-xl px-3 py-3.5 border items-center";
  const startStyles = schedule.start
    ? "bg-light-background border-light-accent"
    : "bg-light-surface border-light-border";
  const endStyles = schedule.end
    ? "bg-light-background border-light-accent"
    : "bg-light-surface border-light-border";
  const startText = schedule.start
    ? "text-light-accent font-semibold"
    : "text-light-muted";
  const endText = schedule.end
    ? "text-light-accent font-semibold"
    : "text-light-muted";

  return (
    <View className="mb-3">
      <View className="flex-row items-center gap-3">
        <TouchableOpacity
          className={`${badgeBase} ${badgeStyles}`}
          onPress={() => hasAny && onClear(day)}
          activeOpacity={0.8}
          accessibilityLabel={hasAny ? `Clear ${day}` : day}
        >
          <Text className={`text-xs font-extrabold ${badgeTextStyles}`}>
            {day}
          </Text>
        </TouchableOpacity>

        <View className="flex-row items-center flex-1 gap-2">
          <TouchableOpacity
            className={`${timeBase} ${startStyles}`}
            onPress={() => onOpenPicker({ day, field: "start" })}
            activeOpacity={0.8}
          >
            <Text className={`text-sm ${startText}`}>
              {schedule.start || "Start"}
            </Text>
          </TouchableOpacity>

          <Text className="text-light-muted text-xs font-semibold">to</Text>

          <TouchableOpacity
            className={`${timeBase} ${endStyles}`}
            onPress={() => onOpenPicker({ day, field: "end" })}
            activeOpacity={0.8}
          >
            <Text className={`text-sm ${endText}`}>
              {schedule.end || "End"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {timeError && (
        <View className="flex-row items-center gap-1.5 mt-1 ml-[76px]">
          <AlertCircle size={12} color={COLORS.danger} strokeWidth={2.5} />
          <Text className="text-light-danger text-xs font-semibold">
            End must be after start
          </Text>
        </View>
      )}
    </View>
  );
}

export default function Schedule() {
  const router = useRouter();

  const [schedule, setSchedule] = useState<Record<DayKey, DaySchedule>>(
    () =>
      Object.fromEntries(DAYS.map((d) => [d, {}])) as Record<
        DayKey,
        DaySchedule
      >,
  );

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
      DAYS.some((d) => isEndBeforeStart(schedule[d].start, schedule[d].end)),
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
    setSchedule((prev) => ({
      ...prev,
      [pickerTarget.day]: {
        ...prev[pickerTarget.day],
        [pickerTarget.field]: formatTime(draftTime),
      },
    }));
    closePicker();
  }, [pickerTarget, draftTime, closePicker]);

  // ── Android: native dialog handles its own UI, onChange fires once on confirm/dismiss ──
  const handleAndroidChange = useCallback(
    (_event: unknown, date?: Date) => {
      // Always clear the picker first — Android dialog closes after one event
      setPickerTarget(null);
      if (!date || !pickerTarget) return;
      setSchedule((prev) => ({
        ...prev,
        [pickerTarget.day]: {
          ...prev[pickerTarget.day],
          [pickerTarget.field]: formatTime(date),
        },
      }));
    },
    [pickerTarget],
  );

  // ── Other handlers ──

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

  const clearDay = useCallback((day: DayKey) => {
    setSchedule((prev) => ({ ...prev, [day]: {} }));
  }, []);

  const handleNext = () => {
    if (hasTimeErrors) {
      showAlert(
        "Invalid Time Range",
        "One or more days have an end time before the start time.",
        "error",
      );
      return;
    }
    router.replace("/(auth)/login");
  };

  const pickerLabel = pickerTarget
    ? `${pickerTarget.day} — ${pickerTarget.field === "start" ? "Start" : "End"} Time`
    : "";

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

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
          {DAYS.map((day) => (
            <DayRow
              key={day}
              day={day}
              schedule={schedule[day]}
              onOpenPicker={openPicker}
              onClear={clearDay}
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
            <CheckCircle2 size={18} color={COLORS.success} strokeWidth={2.5} />
          ) : (
            <UploadCloud size={18} color={COLORS.accent} strokeWidth={2.5} />
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
          <AppButton label="Next" size="lg" onPress={handleNext} />
        </View>
      </FormCard>

      {/*
       * Android: render DateTimePicker directly in the tree (no wrapping Modal).
       * It opens its own native dialog and fires onChange exactly once.
       */}
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

      {/* iOS: bottom-sheet Modal with spinner */}
      {Platform.OS === "ios" && (
        <Modal
          visible={Boolean(pickerTarget)}
          transparent
          animationType="none"
          statusBarTranslucent
          onRequestClose={closePicker}
        >
          <Pressable style={modalStyles.backdrop} onPress={closePicker} />
          <Animated.View
            style={[
              modalStyles.sheet,
              { transform: [{ translateY: slideAnim }] },
            ]}
          >
            <View style={modalStyles.handle} />

            <View style={modalStyles.sheetHeader}>
              <Text style={modalStyles.sheetTitle}>{pickerLabel}</Text>
              <TouchableOpacity
                onPress={closePicker}
                style={modalStyles.closeBtn}
              >
                <X size={18} color={COLORS.muted} strokeWidth={2.5} />
              </TouchableOpacity>
            </View>

            <View style={modalStyles.pickerWrap}>
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

            <View style={modalStyles.confirmRow}>
              <TouchableOpacity
                style={modalStyles.cancelBtn}
                onPress={closePicker}
                activeOpacity={0.7}
              >
                <Text style={modalStyles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={modalStyles.confirmBtn}
                onPress={confirmPicker}
                activeOpacity={0.85}
              >
                <Text style={modalStyles.confirmText}>Set Time</Text>
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

const modalStyles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: COLORS.text,
    opacity: 0.45,
  },
  sheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 28,
    paddingHorizontal: 20,
    shadowColor: COLORS.text,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 20,
  },
  handle: {
    alignSelf: "center",
    width: 32,
    height: 3,
    borderRadius: 2,
    backgroundColor: COLORS.border,
    marginTop: 10,
    marginBottom: 6,
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  sheetTitle: { fontSize: 14, fontWeight: "700", color: COLORS.accent },
  closeBtn: {
    padding: 5,
    borderRadius: 8,
    backgroundColor: COLORS.background,
  },
  pickerWrap: { alignItems: "center", marginBottom: 24 },
  confirmRow: { flexDirection: "row", gap: 10 },
  cancelBtn: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 12,
    backgroundColor: COLORS.background,
    alignItems: "center",
  },
  cancelText: { fontSize: 13, fontWeight: "600", color: COLORS.muted },
  confirmBtn: {
    flex: 2,
    paddingVertical: 11,
    borderRadius: 12,
    backgroundColor: COLORS.accent,
    alignItems: "center",
  },
  confirmText: { fontSize: 13, fontWeight: "700", color: COLORS.surface },
});
