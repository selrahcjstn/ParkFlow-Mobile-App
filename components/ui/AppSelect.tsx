import { Check, ChevronDown, ChevronUp } from "lucide-react-native";
import { useState } from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { useAppTheme } from "@/hooks/useAppTheme";

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
  const { colors } = useAppTheme();
  
  const selected = options.find((o) => o.value === value);
  const borderColor = error 
    ? "border-light-danger dark:border-dark-danger" 
    : "border-light-border dark:border-dark-border";
    
  const containerClasses = ["mb-4", containerClassName]
    .filter(Boolean)
    .join(" ");

  return (
    <View className={containerClasses}>
      {label ? (
        <Text className="font-book text-base leading-5 text-light-text dark:text-dark-text mb-1 ml-1">
          {label}
        </Text>
      ) : null}

      <TouchableOpacity
        className={`bg-light-surface dark:bg-dark-surface rounded-xl px-4 py-3.5 border flex-row justify-between items-center shadow-sm ${borderColor} ${triggerClassName}`}
        onPress={() => setOpen((prev) => !prev)}
        activeOpacity={0.7}
      >
        <Text
          className={
            selected
              ? `font-regular text-base leading-6 text-light-text dark:text-dark-text ${textClassName}`
              : `font-regular text-base leading-6 text-light-muted dark:text-dark-muted ${textClassName}`
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
        <ScrollView
          style={{ maxHeight: 260 }}
          nestedScrollEnabled={true}
          showsVerticalScrollIndicator={true}
          className={`bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border rounded-xl mt-1 shadow-sm ${listClassName}`}
        >
          {options.map((option, index) => {
            const isSelected = option.value === value;
            return (
              <TouchableOpacity
                key={option.value}
                className={`px-4 py-3 flex-row justify-between items-center ${
                  index < options.length - 1
                    ? "border-b border-light-border dark:border-dark-border"
                    : ""
                } ${isSelected ? "bg-light-background dark:bg-dark-background" : ""}`}
                onPress={() => {
                  onChange?.(option.value);
                  setOpen(false);
                }}
                activeOpacity={0.6}
              >
                <Text
                  className={
                    isSelected
                      ? `font-regular text-base leading-6 text-light-primary dark:text-dark-primary font-bold ${optionTextClassName}`
                      : `font-regular text-base leading-6 text-light-text dark:text-dark-text ${optionTextClassName}`
                  }
                >
                  {option.label}
                </Text>

                {isSelected ? (
                  <Check size={16} color={colors.primary} strokeWidth={2.5} />
                ) : null}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      ) : null}

      {error ? (
        <Text className="text-light-danger dark:text-dark-danger font-book text-[13px] leading-5 mt-1 ml-1">
          {error}
        </Text>
      ) : null}
    </View>
  );
}
