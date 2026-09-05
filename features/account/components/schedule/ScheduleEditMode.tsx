import { AppButton } from "@/components/ui";
import ScheduleDayRow from "@/components/ui/ScheduleDayRow";
import { SCHEDULE_DAYS } from "@/constants/scheduleDays";
import * as DocumentPicker from "expo-document-picker";
import { FileText, UploadCloud, X } from "lucide-react-native";
import { useAppTheme } from "@/hooks/useAppTheme";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";

interface ScheduleDayData {
  start?: string;
  end?: string;
}

interface ScheduleEditModeProps {
  editSchedule: Record<string, ScheduleDayData>;
  onClearDay: (dayShortLabel: string) => void;
  onOpenPicker: (day: string, field: "start" | "end") => void;
  onPickFile: () => void;
  selectedFile: DocumentPicker.DocumentPickerAsset | null;
  onClearFile: () => void;
  isUploading: boolean;
  onCancel: () => void;
  onSubmit: () => void;
}

export default function ScheduleEditMode({
  editSchedule,
  onClearDay,
  onOpenPicker,
  onPickFile,
  selectedFile,
  onClearFile,
  isUploading,
  onCancel,
  onSubmit,
}: ScheduleEditModeProps) {
  const { colors } = useAppTheme();

  return (
    <View className="px-0.5">
      {/* Section title */}
      <Text className="text-light-muted dark:text-dark-muted font-regular text-[13px] mb-4">
        Update your campus schedule and upload your COR document. Changes require administrator verification.
      </Text>

      {/* Schedule grid */}
      <View className="gap-2 bg-light-surface dark:bg-dark-surface p-3 rounded-card border border-light-border/40 dark:border-dark-border/30 shadow-soft">
        {SCHEDULE_DAYS.map((d) => (
          <ScheduleDayRow
            key={d.shortLabel}
            day={d.shortLabel as any}
            schedule={editSchedule[d.shortLabel] ?? {}}
            timeError={false}
            onOpenPicker={({ field }) => onOpenPicker(d.shortLabel, field)}
            onClear={() => onClearDay(d.shortLabel)}
          />
        ))}
      </View>

      {/* Dedicated COR Upload */}
      <View className="mt-5">
        <Text className="text-light-text dark:text-dark-text font-heavy text-[13px] mb-2 uppercase tracking-wide">
          Certificate of Registration (COR) / Employee ID
        </Text>
        <TouchableOpacity
          className="w-full border-2 border-dashed border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface rounded-card p-5 items-center justify-center flex-row gap-3 active:bg-light-surfaceMuted dark:active:bg-dark-surfaceMuted shadow-soft"
          onPress={onPickFile}
          activeOpacity={0.7}
        >
          <UploadCloud size={20} color={colors.accent} strokeWidth={2.2} />
          <Text className="text-light-accent dark:text-dark-accent font-heavy text-[14px]">
            Upload COR Document
          </Text>
        </TouchableOpacity>

        {selectedFile && (
          <View className="w-full mt-3 bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border rounded-button p-3 flex-row items-center justify-between shadow-soft">
            <View className="flex-row items-center gap-2 flex-1 mr-2">
              <FileText size={18} color={colors.primary} strokeWidth={2} />
              <Text
                className="text-light-text dark:text-dark-text font-book text-[13px] flex-1"
                numberOfLines={1}
              >
                {selectedFile.name}
              </Text>
            </View>
            <TouchableOpacity
              onPress={onClearFile}
              className="w-7 h-7 bg-light-surfaceMuted dark:bg-dark-surfaceMuted items-center justify-center rounded-pill active:bg-light-border dark:active:bg-dark-border"
              activeOpacity={0.7}
            >
              <X size={14} color={colors.muted} strokeWidth={2.5} />
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Action buttons */}
      <View className="flex-row gap-3 mt-8">
        <View className="flex-1">
          <AppButton label="Cancel" variant="outline" onPress={onCancel} />
        </View>
        <View className="flex-1">
          <AppButton
            label="Submit"
            variant="primary"
            uppercase={false}
            loading={isUploading}
            disabled={isUploading}
            onPress={onSubmit}
          />
        </View>
      </View>
    </View>
  );
}
