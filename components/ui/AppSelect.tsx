import { lightColors } from "@/constants/theme";
import { Check, ChevronDown, ChevronUp } from "lucide-react-native";
import { useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { Body, Caption, Label } from "./Typography";

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
      {label ? <Label className="mb-1 ml-1">{label}</Label> : null}

      <TouchableOpacity
        className={`bg-light-surface rounded-xl px-4 py-3.5 border flex-row justify-between items-center shadow-sm ${borderColor} ${triggerClassName}`}
        onPress={() => setOpen((prev) => !prev)}
        activeOpacity={0.7}
      >
        <Body
          className={
            selected
              ? `text-light-text ${textClassName}`
              : `text-light-muted ${textClassName}`
          }
        >
          {selected ? selected.label : placeholder}
        </Body>

        {open ? (
          <ChevronUp size={18} color={lightColors.muted} strokeWidth={2} />
        ) : (
          <ChevronDown size={18} color={lightColors.muted} strokeWidth={2} />
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
                <Body
                  className={
                    isSelected
                      ? `text-light-accent font-semibold ${optionTextClassName}`
                      : optionTextClassName
                  }
                >
                  {option.label}
                </Body>

                {isSelected ? (
                  <Check
                    size={16}
                    color={lightColors.accent}
                    strokeWidth={2.5}
                  />
                ) : null}
              </TouchableOpacity>
            );
          })}
        </View>
      ) : null}

      {error ? (
        <Caption className="text-light-danger font-medium mt-1 ml-1">
          {error}
        </Caption>
      ) : null}
    </View>
  );
}
