import { useState } from "react";
import { Platform, Text, TouchableOpacity, View } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Clock } from "lucide-react-native";

interface TimeSlot {
  start: string;
  end: string;
}

interface ScheduleRowProps {
  day: string;
  value?: TimeSlot;
  onChange?: (slot: TimeSlot | undefined) => void;
}

// Format a Date object into a readable time string like "8:30 AM"
function formatTime(date: Date): string {
  let hours = date.getHours();
  const minutes = date.getMinutes();
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12 || 12;
  const mins = minutes.toString().padStart(2, "0");
  return `${hours}:${mins} ${ampm}`;
}

// Parse a time string like "8:30 AM" back into a Date object
function parseTime(timeStr: string): Date {
  const date = new Date();
  const [time, ampm] = timeStr.split(" ");
  let [hours, minutes] = time.split(":").map(Number);
  if (ampm === "PM" && hours !== 12) hours += 12;
  if (ampm === "AM" && hours === 12) hours = 0;
  date.setHours(hours, minutes, 0, 0);
  return date;
}

type ActivePicker = "start" | "end" | null;

export default function ScheduleRow({ day, value, onChange }: ScheduleRowProps) {
  const [activePicker, setActivePicker] = useState<ActivePicker>(null);

  const hasValue = value?.start || value?.end;

  const handleTimeChange = (field: "start" | "end", selectedDate?: Date) => {
    if (!selectedDate) {
      setActivePicker(null);
      return;
    }

    const formatted = formatTime(selectedDate);
    const current = value || { start: "", end: "" };
    onChange?.({ ...current, [field]: formatted });

    // On Android the picker auto-closes on selection
    if (Platform.OS === "android") {
      setActivePicker(null);
    }
  };

  const getPickerDate = (field: "start" | "end"): Date => {
    const timeStr = field === "start" ? value?.start : value?.end;
    if (timeStr) return parseTime(timeStr);

    // Default to 8 AM for start, 5 PM for end
    const d = new Date();
    d.setHours(field === "start" ? 8 : 17, 0, 0, 0);
    return d;
  };

  return (
    <View className="mb-2">
      <View className="flex-row items-center">
        {/* Day label — fills with brand color when a time is set */}
        <View
          className={`rounded-lg px-3 py-2.5 mr-2 min-w-[60px] items-center ${
            hasValue ? "bg-light-primary" : "bg-stone-200"
          }`}
        >
          <Text
            className={`text-xs font-bold ${
              hasValue ? "text-white" : "text-light-muted"
            }`}
          >
            {day}
          </Text>
        </View>

        {/* Start time trigger */}
        <TouchableOpacity
          className={`flex-1 rounded-lg px-2 py-2.5 border items-center ${
            value?.start
              ? "bg-white border-light-accent"
              : "bg-stone-100 border-stone-200"
          }`}
          onPress={() =>
            setActivePicker(activePicker === "start" ? null : "start")
          }
          activeOpacity={0.7}
        >
          <View className="flex-row items-center gap-1">
            <Text
              className={`text-xs ${
                value?.start
                  ? "text-light-text font-semibold"
                  : "text-light-muted"
              }`}
            >
              {value?.start || "Start"}
            </Text>
            <Clock size={11} color="#6B7280" />
          </View>
        </TouchableOpacity>

        <Text className="text-light-muted text-xs font-medium mx-1.5">to</Text>

        {/* End time trigger */}
        <TouchableOpacity
          className={`flex-1 rounded-lg px-2 py-2.5 border items-center ${
            value?.end
              ? "bg-white border-light-accent"
              : "bg-stone-100 border-stone-200"
          }`}
          onPress={() =>
            setActivePicker(activePicker === "end" ? null : "end")
          }
          activeOpacity={0.7}
        >
          <View className="flex-row items-center gap-1">
            <Text
              className={`text-xs ${
                value?.end
                  ? "text-light-text font-semibold"
                  : "text-light-muted"
              }`}
            >
              {value?.end || "End"}
            </Text>
            <Clock size={11} color="#6B7280" />
          </View>
        </TouchableOpacity>
      </View>

      {/* Native time picker — opens the system time selector */}
      {activePicker && (
        <View className="mt-1">
          <DateTimePicker
            value={getPickerDate(activePicker)}
            mode="time"
            is24Hour={false}
            display={Platform.OS === "ios" ? "spinner" : "default"}
            minuteInterval={5}
            onChange={(_, date) => handleTimeChange(activePicker, date)}
          />
          {/* iOS needs a done button since the spinner stays open */}
          {Platform.OS === "ios" && (
            <TouchableOpacity
              className="self-end mt-1 mr-1"
              onPress={() => setActivePicker(null)}
            >
              <Text className="text-light-accent text-sm font-bold">Done</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
}
