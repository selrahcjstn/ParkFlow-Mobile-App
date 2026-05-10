import { useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { ChevronDown, ChevronUp } from "lucide-react-native";
import type { SelectOption } from "./AppSelect";

interface TimeSlot {
  start: string;
  end: string;
}

interface ScheduleRowProps {
  day: string;
  value?: TimeSlot;
  onChange?: (slot: TimeSlot | undefined) => void;
}

const TIME_OPTIONS: SelectOption[] = [
  { label: "7:00 AM", value: "7:00 AM" },
  { label: "7:30 AM", value: "7:30 AM" },
  { label: "8:00 AM", value: "8:00 AM" },
  { label: "8:30 AM", value: "8:30 AM" },
  { label: "9:00 AM", value: "9:00 AM" },
  { label: "9:30 AM", value: "9:30 AM" },
  { label: "10:00 AM", value: "10:00 AM" },
  { label: "10:30 AM", value: "10:30 AM" },
  { label: "11:00 AM", value: "11:00 AM" },
  { label: "11:30 AM", value: "11:30 AM" },
  { label: "12:00 PM", value: "12:00 PM" },
  { label: "12:30 PM", value: "12:30 PM" },
  { label: "1:00 PM", value: "1:00 PM" },
  { label: "1:30 PM", value: "1:30 PM" },
  { label: "2:00 PM", value: "2:00 PM" },
  { label: "2:30 PM", value: "2:30 PM" },
  { label: "3:00 PM", value: "3:00 PM" },
  { label: "3:30 PM", value: "3:30 PM" },
  { label: "4:00 PM", value: "4:00 PM" },
  { label: "4:30 PM", value: "4:30 PM" },
  { label: "5:00 PM", value: "5:00 PM" },
  { label: "5:30 PM", value: "5:30 PM" },
  { label: "6:00 PM", value: "6:00 PM" },
  { label: "6:30 PM", value: "6:30 PM" },
  { label: "7:00 PM", value: "7:00 PM" },
  { label: "7:30 PM", value: "7:30 PM" },
  { label: "8:00 PM", value: "8:00 PM" },
];

type OpenPicker = "start" | "end" | null;

/**
 * A single schedule row for one day of the week.
 * Shows the day label, start time picker, "to", and end time picker.
 */
export default function ScheduleRow({ day, value, onChange }: ScheduleRowProps) {
  const [openPicker, setOpenPicker] = useState<OpenPicker>(null);

  const hasValue = value?.start || value?.end;

  const handleSelect = (field: "start" | "end", time: string) => {
    const current = value || { start: "", end: "" };
    onChange?.({ ...current, [field]: time });
    setOpenPicker(null);
  };

  return (
    <View className="mb-2">
      <View className="flex-row items-center">
        {/* Day label */}
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

        {/* Start time */}
        <TouchableOpacity
          className={`flex-1 rounded-lg px-2 py-2.5 border items-center ${
            value?.start
              ? "bg-white border-light-accent"
              : "bg-stone-100 border-stone-200"
          }`}
          onPress={() => setOpenPicker(openPicker === "start" ? null : "start")}
          activeOpacity={0.7}
        >
          <View className="flex-row items-center gap-1">
            <Text
              className={`text-xs ${
                value?.start ? "text-light-text font-semibold" : "text-light-muted"
              }`}
            >
              {value?.start || "Start"}
            </Text>
            {openPicker === "start" ? (
              <ChevronUp size={12} color="#6B7280" />
            ) : (
              <ChevronDown size={12} color="#6B7280" />
            )}
          </View>
        </TouchableOpacity>

        <Text className="text-light-muted text-xs font-medium mx-1.5">to</Text>

        {/* End time */}
        <TouchableOpacity
          className={`flex-1 rounded-lg px-2 py-2.5 border items-center ${
            value?.end
              ? "bg-white border-light-accent"
              : "bg-stone-100 border-stone-200"
          }`}
          onPress={() => setOpenPicker(openPicker === "end" ? null : "end")}
          activeOpacity={0.7}
        >
          <View className="flex-row items-center gap-1">
            <Text
              className={`text-xs ${
                value?.end ? "text-light-text font-semibold" : "text-light-muted"
              }`}
            >
              {value?.end || "End"}
            </Text>
            {openPicker === "end" ? (
              <ChevronUp size={12} color="#6B7280" />
            ) : (
              <ChevronDown size={12} color="#6B7280" />
            )}
          </View>
        </TouchableOpacity>
      </View>

      {/* Time picker dropdown */}
      {openPicker && (
        <View className="bg-white border border-light-border rounded-xl mt-1 max-h-40 overflow-hidden shadow-sm">
          {TIME_OPTIONS.map((opt, i) => (
            <TouchableOpacity
              key={opt.value}
              className={`px-4 py-2 ${
                i < TIME_OPTIONS.length - 1 ? "border-b border-light-border" : ""
              }`}
              onPress={() => handleSelect(openPicker, opt.value)}
              activeOpacity={0.6}
            >
              <Text className="text-light-text text-sm">{opt.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}
