import { AlertCircle } from "lucide-react-native";
import { Text, TouchableOpacity, View } from "react-native";
import { useAppTheme } from "@/hooks/useAppTheme";

type DayKey = "Mon" | "Tues" | "Wed" | "Thurs" | "Fri" | "Sat" | "Sun";

type DaySchedule = {
  start?: string;
  end?: string;
};

type PickerTarget = { day: DayKey; field: "start" | "end" };

type ScheduleDayRowProps = {
  day: DayKey;
  schedule: DaySchedule;
  timeError: boolean;
  onOpenPicker: (target: PickerTarget) => void;
  onClear: (day: DayKey) => void;
};

export default function ScheduleDayRow({
  day,
  schedule,
  timeError,
  onOpenPicker,
  onClear,
}: ScheduleDayRowProps) {
  const { colors, isDark } = useAppTheme();
  const hasAny = Boolean(schedule.start || schedule.end);
  const hasBoth = Boolean(schedule.start && schedule.end);

  const badgeBase = "rounded-xl px-2.5 py-2.5 border min-w-[62px] items-center justify-center";
  const timeBase = "flex-1 rounded-xl px-3 py-3 items-center justify-center border bg-light-surface dark:bg-dark-surface";
  const startText = schedule.start
    ? "text-light-text dark:text-dark-text font-bold text-[14px]"
    : "text-light-muted dark:text-dark-muted font-regular text-[14px]";
  const endText = schedule.end
    ? "text-light-text dark:text-dark-text font-bold text-[14px]"
    : "text-light-muted dark:text-dark-muted font-regular text-[14px]";

  return (
    <View className="mb-3">
      <View className="flex-row items-center gap-3">
        <TouchableOpacity
          className={badgeBase}
          style={
            hasBoth && !timeError
              ? {
                  backgroundColor: colors.primary,
                  borderColor: colors.primary,
                }
              : hasAny
                ? {
                    backgroundColor: isDark ? "rgba(123, 17, 19, 0.15)" : "rgba(123, 17, 19, 0.08)",
                    borderColor: isDark ? "rgba(123, 17, 19, 0.4)" : "rgba(123, 17, 19, 0.35)",
                  }
                : {
                    backgroundColor: isDark ? "#2B2D31" : "#FFFFFF",
                    borderColor: colors.border,
                  }
          }
          onPress={() => hasAny && onClear(day)}
          activeOpacity={hasAny ? 0.7 : 1}
          accessibilityLabel={hasAny ? `Clear ${day}` : day}
        >
          <Text
            className="font-bold text-[13px]"
            style={{
              color: hasBoth && !timeError
                ? "#FFFFFF"
                : hasAny
                  ? colors.primary
                  : (colors.muted),
            }}
          >
            {day}
          </Text>
          {hasAny && (
            <Text
              className="text-[9px] font-book opacity-80 mt-0.5 text-center"
              style={{ color: hasBoth && !timeError ? "#FFFFFF" : undefined }}
            >
              Clear
            </Text>
          )}
        </TouchableOpacity>

        <View className="flex-row items-center flex-1 gap-2">
          <TouchableOpacity
            className={timeBase}
            style={{
              borderColor: schedule.start
                ? (isDark ? "rgba(123, 17, 19, 0.6)" : "rgba(123, 17, 19, 0.5)")
                : (colors.border),
              ...(schedule.start
                ? {
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.06,
                    shadowRadius: 2,
                    elevation: 1,
                  }
                : {}),
            }}
            onPress={() => onOpenPicker({ day, field: "start" })}
            activeOpacity={0.8}
          >
            <Text className={startText}>{schedule.start || "Start"}</Text>
          </TouchableOpacity>

          <Text className="font-book text-[13px] text-light-muted dark:text-dark-muted px-0.5">
            to
          </Text>

          <TouchableOpacity
            className={timeBase}
            style={{
              borderColor: schedule.end
                ? (isDark ? "rgba(123, 17, 19, 0.6)" : "rgba(123, 17, 19, 0.5)")
                : (colors.border),
              ...(schedule.end
                ? {
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.06,
                    shadowRadius: 2,
                    elevation: 1,
                  }
                : {}),
            }}
            onPress={() => onOpenPicker({ day, field: "end" })}
            activeOpacity={0.8}
          >
            <Text className={endText}>{schedule.end || "End"}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {timeError ? (
        <View className="flex-row items-center gap-1.5 mt-1 ml-[76px]">
          <AlertCircle size={14} color={colors.danger} strokeWidth={2.5} />
          <Text className="text-light-text dark:text-dark-danger font-book text-[13px] leading-5">
            End must be after start
          </Text>
        </View>
      ) : null}
    </View>
  );
}

