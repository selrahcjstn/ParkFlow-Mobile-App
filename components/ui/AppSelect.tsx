// inline muted/accent colors
import { Check, ChevronDown, ChevronUp } from "lucide-react-native";
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
  containerClassName?: string;
  triggerClassName?: string;
  textClassName?: string;
  listClassName?: string;
  optionTextClassName?: string;
}

export default function AppSelect({
  label,
  placeholder = "Pick an Option",
  options,
  value,
  onChange,
  error,
  containerClassName = "",
  triggerClassName = "",
  textClassName = "",
  listClassName = "",
  optionTextClassName = "",
}: AppSelectProps) {
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.value === value);
  const borderColor = error ? "border-light-danger" : "border-light-border";
  const containerClasses = ["mb-4", containerClassName]
    .filter(Boolean)
    .join(" ");

  return (
    <View className={containerClasses}>
      {label ? <Text className="font-medium text-base leading-5 text-light-text mb-1 ml-1">{label}</Text> : null}

      <TouchableOpacity
        className={`bg-light-surface rounded-xl px-4 py-3.5 border flex-row justify-between items-center shadow-sm ${borderColor} ${triggerClassName}`}
        onPress={() => setOpen((prev) => !prev)}
        activeOpacity={0.7}
      >
        <Text
          className={
            selected
              ? `font-regular text-base leading-6 text-light-text ${textClassName}`
              : `font-regular text-base leading-6 text-light-muted ${textClassName}`
          }
        >
          {selected ? selected.label : placeholder}
        </Text>

        {open ? (
          <ChevronUp size={18} color="#6B7280" strokeWidth={2} />
        ) : (
          <ChevronDown size={18} color="#6B7280" strokeWidth={2} />
        )}
      </TouchableOpacity>

      {open ? (
        <View
          className={`bg-light-surface border border-light-border rounded-xl mt-1 overflow-hidden shadow-sm ${listClassName}`}
        >
          {options.map((option, index) => {
            const isSelected = option.value === value;
            return (
              <TouchableOpacity
                key={option.value}
                className={`px-4 py-3 flex-row justify-between items-center ${
                  index < options.length - 1
                    ? "border-b border-light-border"
                    : ""
                } ${isSelected ? "bg-light-background" : ""}`}
                onPress={() => {
                  onChange?.(option.value);
                  setOpen(false);
                }}
                activeOpacity={0.6}
              >
                <Text
                  className={
                    isSelected
                      ? `font-regular text-base leading-6 text-light-accent font-semibold ${optionTextClassName}`
                      : `font-regular text-base leading-6 text-light-text ${optionTextClassName}`
                  }
                >
                  {option.label}
                </Text>

                {isSelected ? (
                  <Check size={16} color="#FDB813" strokeWidth={2.5} />
                ) : null}
              </TouchableOpacity>
            );
          })}
        </View>
      ) : null}

      {error ? (
        <Text className="text-light-danger font-medium text-[13px] leading-5 mt-1 ml-1">
          {error}
        </Text>
      ) : null}
    </View>
  );
}
