import { lightColors } from "@/constants/theme";
import { Body, Caption } from "@/components/ui/Typography";
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
          <Text className={`text-sm font-extrabold ${badgeTextStyles}`}>
            {day}
          </Text>
        </TouchableOpacity>

        <View className="flex-row items-center flex-1 gap-2">
          <TouchableOpacity
            className={`${timeBase} ${startStyles}`}
            onPress={() => onOpenPicker({ day, field: "start" })}
            activeOpacity={0.8}
          >
            <Body className={startText}>{schedule.start || "Start"}</Body>
          </TouchableOpacity>

          <Caption className="font-semibold">to</Caption>

          <TouchableOpacity
            className={`${timeBase} ${endStyles}`}
            onPress={() => onOpenPicker({ day, field: "end" })}
            activeOpacity={0.8}
          >
            <Body className={endText}>{schedule.end || "End"}</Body>
          </TouchableOpacity>
        </View>
      </View>

      {timeError ? (
        <View className="flex-row items-center gap-1.5 mt-1 ml-[76px]">
          <AlertCircle
            size={14}
            color={lightColors.danger}
            strokeWidth={2.5}
          />
          <Caption className="text-light-danger font-semibold">
            End must be after start
          </Caption>
        </View>
      ) : null}
    </View>
  );
}
