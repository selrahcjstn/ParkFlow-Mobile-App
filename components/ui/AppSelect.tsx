import { useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";

export interface SelectOption {
  label: string;
  value: string;
}

interface AppSelectProps {
  label?: string;
  placeholder?: string;
  options: SelectOption[];
  value?: string;
  onChange?: (value: string) => void;
  error?: string;
}

/**
 * A custom dropdown selector that works nicely in React Native.
 * Tapping it reveals the list of options right below the trigger box.
 */
export default function AppSelect({
  label,
  placeholder = "Pick an Option",
  options,
  value,
  onChange,
  error,
}: AppSelectProps) {
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.value === value);
  const borderColor = error ? "border-light-danger" : "border-light-border";

  return (
    <View className="mb-4">
      {label && (
        <Text className="text-light-accent text-sm font-semibold mb-1 ml-1">
          {label}
        </Text>
      )}

      {/* The clickable trigger */}
      <TouchableOpacity
        className={`bg-white rounded-xl px-4 py-3.5 border flex-row justify-between items-center shadow-sm ${borderColor}`}
        onPress={() => setOpen((prev) => !prev)}
        activeOpacity={0.7}
      >
        <Text
          className={
            selected ? "text-light-text text-base" : "text-[#9CA3AF] text-base"
          }
        >
          {selected ? selected.label : placeholder}
        </Text>
        <Text className="text-light-muted text-base font-bold">
          {open ? "∧" : "∨"}
        </Text>
      </TouchableOpacity>

      {/* Options drop down right below the trigger when open */}
      {open && (
        <View className="bg-white border border-light-border rounded-xl mt-1 overflow-hidden shadow-sm">
          {options.map((option, index) => (
            <TouchableOpacity
              key={option.value}
              className={`px-4 py-3 ${
                index < options.length - 1 ? "border-b border-light-border" : ""
              }`}
              onPress={() => {
                onChange?.(option.value);
                setOpen(false);
              }}
              activeOpacity={0.6}
            >
              <Text className="text-light-text text-base">{option.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {error && (
        <Text className="text-light-danger text-xs font-medium mt-1 ml-1">
          {error}
        </Text>
      )}
    </View>
  );
}
