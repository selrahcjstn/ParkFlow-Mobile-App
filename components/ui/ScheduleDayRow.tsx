// inline danger color for alert
import { AlertCircle } from "lucide-react-native";
import { Text, TouchableOpacity, View } from "react-native";

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
  const hasAny = Boolean(schedule.start || schedule.end);
  const hasBoth = Boolean(schedule.start && schedule.end);

  const badgeBase = "rounded-xl px-2.5 py-2.5 border min-w-[62px] items-center justify-center";
  const badgeStyles =
    hasBoth && !timeError
      ? "bg-light-primary border-light-primary dark:bg-dark-primary dark:border-dark-primary"
      : hasAny
        ? "bg-light-primary/10 border-light-primary/40 dark:bg-dark-primary/20 dark:border-dark-primary/40"
        : "bg-light-surface border-light-border dark:bg-dark-surface dark:border-dark-border";
  const badgeTextStyles =
    hasBoth && !timeError
      ? "text-white dark:text-white"
      : hasAny
        ? "text-light-primary dark:text-dark-primary"
        : "text-light-muted dark:text-dark-muted";

  const timeBase = "flex-1 rounded-xl px-3 py-3 items-center justify-center border";
  const startStyles = schedule.start
    ? "bg-light-surface dark:bg-dark-surface border-light-primary/50 dark:border-dark-primary/60 shadow-soft"
    : "bg-light-surface dark:bg-dark-surface border-light-border dark:border-dark-border";
  const endStyles = schedule.end
    ? "bg-light-surface dark:bg-dark-surface border-light-primary/50 dark:border-dark-primary/60 shadow-soft"
    : "bg-light-surface dark:bg-dark-surface border-light-border dark:border-dark-border";
  const startText = schedule.start
    ? "text-light-text dark:text-dark-text font-heavy text-[14px]"
    : "text-light-muted dark:text-dark-muted font-regular text-[14px]";
  const endText = schedule.end
    ? "text-light-text dark:text-dark-text font-heavy text-[14px]"
    : "text-light-muted dark:text-dark-muted font-regular text-[14px]";

  return (
    <View className="mb-3">
      <View className="flex-row items-center gap-3">
        <TouchableOpacity
          className={`${badgeBase} ${badgeStyles}`}
          onPress={() => hasAny && onClear(day)}
          activeOpacity={hasAny ? 0.7 : 1}
          accessibilityLabel={hasAny ? `Clear ${day}` : day}
        >
          <Text className={`font-heavy text-[13px] ${badgeTextStyles}`}>
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
            className={`${timeBase} ${startStyles}`}
            onPress={() => onOpenPicker({ day, field: "start" })}
            activeOpacity={0.8}
          >
            <Text className={startText}>{schedule.start || "Start"}</Text>
          </TouchableOpacity>

          <Text className="font-book text-[13px] text-light-muted dark:text-dark-muted px-0.5">
            to
          </Text>

          <TouchableOpacity
            className={`${timeBase} ${endStyles}`}
            onPress={() => onOpenPicker({ day, field: "end" })}
            activeOpacity={0.8}
          >
            <Text className={endText}>{schedule.end || "End"}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {timeError ? (
        <View className="flex-row items-center gap-1.5 mt-1 ml-[76px]">
          <AlertCircle size={14} color="#EF4444" strokeWidth={2.5} />
          <Text className="text-light-danger dark:text-dark-danger font-book text-[13px] leading-5">
            End must be after start
          </Text>
        </View>
      ) : null}
    </View>
  );
}

