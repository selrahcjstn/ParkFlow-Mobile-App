import DateTimePicker from "@react-native-community/datetimepicker";
import { Clock } from "lucide-react-native";
import { memo, useState } from "react";
import { Platform, Text, TouchableOpacity, View } from "react-native";

interface TimeSlot {
  start: string;
  end: string;
}

interface ScheduleRowProps {
  day: string;
  value?: TimeSlot;
  onChange?: (day: string, slot: TimeSlot | undefined) => void;
}

function formatTime(date: Date): string {
  let hours = date.getHours();
  const minutes = date.getMinutes();
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12 || 12;
  const mins = minutes.toString().padStart(2, "0");
  return `${hours}:${mins} ${ampm}`;
}

function parseTime(timeStr: string): Date {
  const date = new Date();
  date.setHours(8, 0, 0, 0); // Default to a safe date
  if (!timeStr) return date;

  const parts = timeStr.split(" ");
  const time = parts[0];
  const ampm = parts[1];
  if (!time) return date;

  const timeParts = time.split(":");
  let hours = Number(timeParts[0]);
  let minutes = Number(timeParts[1]);

  if (isNaN(hours)) hours = 8;
  if (isNaN(minutes)) minutes = 0;

  if (ampm === "PM" && hours !== 12) hours += 12;
  if (ampm === "AM" && hours === 12) hours = 0;

  date.setHours(hours, minutes, 0, 0);

  // Safeguard against any remaining invalid date cases
  if (isNaN(date.getTime())) {
    const fallback = new Date();
    fallback.setHours(8, 0, 0, 0);
    return fallback;
  }

  return date;
}

type ActivePicker = "start" | "end" | null;

export default memo(function ScheduleRow({
  day,
  value,
  onChange,
}: ScheduleRowProps) {
  const [activePicker, setActivePicker] = useState<ActivePicker>(null);
  const hasValue = value?.start || value?.end;

  const handleTimeChange = (field: "start" | "end", selectedDate?: Date) => {
    if (!selectedDate) {
      setActivePicker(null);
      return;
    }

    const formatted = formatTime(selectedDate);
    const current = value || { start: "", end: "" };
    onChange?.(day, { ...current, [field]: formatted });

    if (Platform.OS === "android") {
      setActivePicker(null);
    }
  };

  const getPickerDate = (field: "start" | "end"): Date => {
    const timeStr = field === "start" ? value?.start : value?.end;
    if (timeStr) return parseTime(timeStr);

    const d = new Date();
    d.setHours(field === "start" ? 8 : 17, 0, 0, 0);
    return d;
  };

  return (
    <View className="mb-2">
      <View className="flex-row items-center">
        <View
          className={`rounded-lg px-3 py-2.5 mr-2 min-w-[60px] items-center ${hasValue ? "bg-light-primary" : "bg-light-background"
            }`}
        >
          <Text
            className={`text-sm font-heavy ${hasValue ? "text-white" : "text-light-muted"
              }`}
          >
            {day}
          </Text>
        </View>

        <TouchableOpacity
          className={`flex-1 rounded-lg px-2 py-2.5 border items-center ${value?.start
              ? "bg-light-surface border-light-accent"
              : "bg-light-background border-light-border"
            }`}
          onPress={() =>
            setActivePicker(activePicker === "start" ? null : "start")
          }
          activeOpacity={0.7}
        >
          <View className="flex-row items-center gap-1">
            <Text
              className={value?.start ? "font-heavy text-light-text text-sm" : "text-light-muted text-sm"}
            >
              {value?.start || "Start"}
            </Text>
            <Clock size={12} color="#6B7280" />
          </View>
        </TouchableOpacity>

        <Text className="font-book mx-1.5 text-base leading-5 text-light-text">to</Text>

        <TouchableOpacity
          className={`flex-1 rounded-lg px-2 py-2.5 border items-center ${value?.end
              ? "bg-light-surface border-light-accent"
              : "bg-light-background border-light-border"
            }`}
          onPress={() => setActivePicker(activePicker === "end" ? null : "end")}
          activeOpacity={0.7}
        >
          <View className="flex-row items-center gap-1">
            <Text className={value?.end ? "font-heavy text-light-text text-sm" : "text-light-muted text-sm"}>
              {value?.end || "End"}
            </Text>
            <Clock size={12} color="#6B7280" />
          </View>
        </TouchableOpacity>
      </View>

      {activePicker ? (
        <View className="mt-1">
          <DateTimePicker
            value={getPickerDate(activePicker)}
            mode="time"
            is24Hour={false}
            display={Platform.OS === "ios" ? "spinner" : "default"}
            minuteInterval={5}
            onChange={(_, date) => handleTimeChange(activePicker, date)}
          />
          {Platform.OS === "ios" ? (
            <TouchableOpacity
              className="self-end mt-1 mr-1"
              onPress={() => setActivePicker(null)}
            >
              <Text className="text-light-accent font-heavy text-base leading-6">Done</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      ) : null}
    </View>
  );
});

