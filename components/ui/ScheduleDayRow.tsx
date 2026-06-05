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

  const badgeBase = "rounded-xl px-3 py-3 border min-w-[64px] items-center";
  const badgeStyles =
    hasBoth && !timeError
      ? "bg-light-accent border-light-accent dark:bg-dark-accent dark:border-dark-accent"
      : hasAny
        ? "bg-light-background border-light-border dark:bg-dark-background dark:border-dark-border"
        : "bg-light-surface border-light-border dark:bg-dark-surface dark:border-dark-border";
  const badgeTextStyles =
    hasBoth && !timeError
      ? "text-light-surface dark:text-dark-background"
      : hasAny
        ? "text-light-accent dark:text-dark-accent"
        : "text-light-muted dark:text-dark-muted";

  const timeBase = "flex-1 rounded-xl px-3 py-3.5 items-center border border-light-border/60 dark:border-dark-border/60";
  const startStyles = schedule.start
    ? "bg-light-background dark:bg-dark-background"
    : "bg-light-surfaceMuted dark:bg-dark-surfaceMuted";
  const endStyles = schedule.end
    ? "bg-light-background dark:bg-dark-background"
    : "bg-light-surfaceMuted dark:bg-dark-surfaceMuted";
  const startText = schedule.start
    ? "text-light-accent dark:text-dark-accent font-heavy"
    : "text-light-muted dark:text-dark-muted";
  const endText = schedule.end
    ? "text-light-accent dark:text-dark-accent font-heavy"
    : "text-light-muted dark:text-dark-muted";

  return (
    <View className="mb-3">
      <View className="flex-row items-center gap-3">
        <TouchableOpacity
          className={`${badgeBase} ${badgeStyles}`}
          onPress={() => hasAny && onClear(day)}
          activeOpacity={0.8}
          accessibilityLabel={hasAny ? `Clear ${day}` : day}
        >
          <Text className={`font-heavy text-[13px] ${badgeTextStyles}`}>
            {day}
          </Text>
        </TouchableOpacity>

        <View className="flex-row items-center flex-1 gap-2">
          <TouchableOpacity
            className={`${timeBase} ${startStyles}`}
            onPress={() => onOpenPicker({ day, field: "start" })}
            activeOpacity={0.8}
          >
            <Text className={`font-regular text-base leading-6 ${startText}`}>{schedule.start || "Start"}</Text>
          </TouchableOpacity>

          <Text className="font-book text-base leading-5 text-light-text dark:text-dark-text">to</Text>

          <TouchableOpacity
            className={`${timeBase} ${endStyles}`}
            onPress={() => onOpenPicker({ day, field: "end" })}
            activeOpacity={0.8}
          >
            <Text className={`font-regular text-base leading-6 ${endText}`}>{schedule.end || "End"}</Text>
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

