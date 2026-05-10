import { useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { ChevronDown, ChevronUp, Check } from "lucide-react-native";

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

      {/* Trigger box — shows the selected value or placeholder */}
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

        {/* Chevron flips direction based on open/closed state */}
        {open ? (
          <ChevronUp size={18} color="#6B7280" strokeWidth={2} />
        ) : (
          <ChevronDown size={18} color="#6B7280" strokeWidth={2} />
        )}
      </TouchableOpacity>

      {/* Options list that appears below the trigger */}
      {open && (
        <View className="bg-white border border-light-border rounded-xl mt-1 overflow-hidden shadow-sm">
          {options.map((option, index) => {
            const isSelected = option.value === value;
            return (
              <TouchableOpacity
                key={option.value}
                className={`px-4 py-3 flex-row justify-between items-center ${
                  index < options.length - 1 ? "border-b border-light-border" : ""
                } ${isSelected ? "bg-stone-50" : ""}`}
                onPress={() => {
                  onChange?.(option.value);
                  setOpen(false);
                }}
                activeOpacity={0.6}
              >
                <Text
                  className={`text-base ${
                    isSelected ? "text-light-accent font-semibold" : "text-light-text"
                  }`}
                >
                  {option.label}
                </Text>

                {/* Checkmark on the currently selected item */}
                {isSelected && (
                  <Check size={16} color="#1E3A5F" strokeWidth={2.5} />
                )}
              </TouchableOpacity>
            );
          })}
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
