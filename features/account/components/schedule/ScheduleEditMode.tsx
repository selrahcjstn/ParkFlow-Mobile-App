import { AppButton } from "@/components/ui";
import ScheduleDayRow from "@/components/ui/ScheduleDayRow";
import { SCHEDULE_DAYS } from "@/constants/scheduleDays";
import * as DocumentPicker from "expo-document-picker";
import { FileText, Info, UploadCloud, X } from "lucide-react-native";
import { formatFileSize } from "@/utils/fileValidation";
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
  const { colors, isDark } = useAppTheme();

  return (
    <View className="px-0.5">
      {/* Section notice */}
      <View
        className="mb-4 rounded-card p-3 flex-row gap-2.5 items-center border"
        style={{
          backgroundColor: isDark ? "rgba(255, 255, 255, 0.03)" : "#F8FAFC",
          borderColor: isDark ? "#3A3C43" : "#E2E8F0",
        }}
      >
        <Info size={15} color={colors.muted} strokeWidth={2} />
        <Text className="text-light-muted dark:text-dark-muted font-regular text-[12px] flex-1 leading-[17px]">
          Update your campus schedule and upload your COR document. Changes require administrator verification.
        </Text>
      </View>

      {/* Schedule grid header */}
      <View className="flex-row items-center justify-between mb-2 px-0.5">
        <Text className="text-light-text dark:text-dark-text font-heavy text-[13px] uppercase tracking-wide">
          Weekly Schedule
        </Text>
        <Text className="text-light-muted dark:text-dark-muted font-regular text-[11px]">
          Tap day badge to clear
        </Text>
      </View>

      {/* Schedule grid */}
      <View
        className="gap-2 bg-light-surface dark:bg-dark-surface p-3 rounded-card border border-light-border dark:border-dark-border"
        style={{
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: isDark ? 0.2 : 0.04,
          shadowRadius: 3,
          elevation: 1,
        }}
      >
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
      <View className="mt-6">
        <View className="flex-row items-center justify-between mb-2 px-0.5">
          <Text className="text-light-text dark:text-dark-text font-heavy text-[13px] uppercase tracking-wide">
            Certificate of Registration (COR)
          </Text>
          <Text className="text-light-muted dark:text-dark-muted font-regular text-[11px]">
            Required (PDF)
          </Text>
        </View>

        <TouchableOpacity
          className="w-full border border-dashed border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface rounded-card p-5 items-center justify-center active:bg-light-surfaceMuted dark:active:bg-dark-surfaceMuted"
          onPress={onPickFile}
          activeOpacity={0.7}
        >
          <View className="w-10 h-10 rounded-full bg-light-surfaceMuted dark:bg-dark-surfaceMuted items-center justify-center mb-2">
            <UploadCloud size={18} color={colors.muted} strokeWidth={2} />
          </View>
          <Text className="text-light-muted dark:text-dark-muted font-heavy text-[13.5px] text-center">
            {selectedFile ? "Replace COR Document" : "Upload COR Document"}
          </Text>
          <Text className="text-light-muted/70 dark:text-dark-muted/70 font-regular text-[11.5px] mt-0.5 text-center">
            PDF document only • Maximum file size 5MB
          </Text>
        </TouchableOpacity>

        {selectedFile && (
          <View className="w-full mt-3 bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border rounded-button p-3 flex-row items-center justify-between">
            <View className="flex-row items-center gap-2.5 flex-1 mr-2">
              <View className="w-8 h-8 rounded-button bg-light-surfaceMuted dark:bg-dark-surfaceMuted items-center justify-center">
                <FileText size={16} color={colors.primary} strokeWidth={2} />
              </View>
              <View className="flex-1">
                <Text
                  className="text-light-text dark:text-dark-text font-heavy text-[13px]"
                  numberOfLines={1}
                >
                  {selectedFile.name}
                </Text>
                {selectedFile.size ? (
                  <Text className="text-light-muted dark:text-dark-muted font-regular text-[11px] mt-0.5">
                    {formatFileSize(selectedFile.size)} • Ready to submit
                  </Text>
                ) : null}
              </View>
            </View>
            <TouchableOpacity
              onPress={onClearFile}
              className="w-7 h-7 bg-light-surfaceMuted dark:bg-dark-surfaceMuted items-center justify-center rounded-pill active:bg-light-border dark:active:bg-dark-border"
              activeOpacity={0.7}
              accessibilityLabel="Remove selected document"
            >
              <X size={14} color={colors.muted} strokeWidth={2.5} />
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Action buttons */}
      <View className="flex-row gap-3 mt-7">
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
