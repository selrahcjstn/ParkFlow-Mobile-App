import { AppButton } from "@/components/ui";
import { useAppTheme } from "@/hooks/useAppTheme";
import {
    AlertCircle,
    Calendar,
    Clock,
    LogIn,
    LogOut,
    Pencil,
    ShieldCheck,
} from "lucide-react-native";
import React from "react";
import { Text, View } from "react-native";

interface DaySchedule {
  dayName: string;
  startTime: string;
  endTime: string;
  isActive: boolean;
}

interface ScheduleViewModeProps {
  mappedSchedules: DaySchedule[];
  activeCount: number;
  onStartEditing: () => void;
  gracePeriod: {
    entryBeforeMin: number;
    exitAfterMin: number;
  };
}

export default function ScheduleViewMode({
  mappedSchedules,
  activeCount,
  onStartEditing,
  gracePeriod,
}: ScheduleViewModeProps) {
  const { colors, isDark } = useAppTheme();
  const iconColor = colors.text;

  return (
    <View className="px-0.5">
      {/* Verified access card */}
      <View className="bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border rounded-card overflow-hidden mb-7 shadow-soft">
        <View className="p-4 flex-row items-center gap-3">
          <View className="w-9 h-9 rounded-button items-center justify-center bg-light-success/10 dark:bg-dark-success/10">
            <ShieldCheck
              size={18}
              color={colors.success}
              strokeWidth={2.2}
            />
          </View>

          <View className="flex-1">
            <Text className="text-light-text dark:text-dark-text font-black text-[14px] tracking-tight">
              Verified Access Profile
            </Text>
            <Text className="text-light-muted dark:text-dark-muted font-regular text-[12px] mt-0.5">
              Parking permissions active for {activeCount} days this week
            </Text>
          </View>
        </View>

        <View className="px-4 py-3 flex-row items-center justify-between border-t border-light-border dark:border-dark-border">
          <View className="flex-row items-center gap-1.5">
            <LogIn size={13} color={colors.muted} strokeWidth={2.2} />
            <Text className="text-light-muted dark:text-dark-muted font-book text-[11px]">
              Early Entry:{" "}
              <Text className="font-heavy text-light-text dark:text-dark-text">
                -{gracePeriod.entryBeforeMin}m
              </Text>
            </Text>
          </View>

          <View className="w-px h-3 bg-light-border dark:bg-dark-border" />

          <View className="flex-row items-center gap-1.5">
            <LogOut size={13} color={colors.muted} strokeWidth={2.2} />
            <Text className="text-light-muted dark:text-dark-muted font-book text-[11px]">
              Late Exit:{" "}
              <Text className="font-heavy text-light-text dark:text-dark-text">
                +{gracePeriod.exitAfterMin}m
              </Text>
            </Text>
          </View>
        </View>
      </View>

      {/* Week section header */}
      <View className="flex-row items-center gap-1.5 mb-3 px-0.5">
        <Calendar size={13} color={colors.muted} />
        <Text className="text-light-muted dark:text-dark-muted font-heavy text-[11px] uppercase tracking-wider">
          Week at a glance
        </Text>
      </View>

      {/* Day rows */}
      <View className="gap-2">
        {mappedSchedules.map((day) => (
          <View
            key={day.dayName}
            className={`flex-row items-center justify-between px-4 py-3.5 rounded-card border ${
              day.isActive
                ? "bg-light-surface dark:bg-dark-surface border-light-border/50 dark:border-dark-border/40 shadow-soft"
                : "bg-light-surfaceMuted/40 dark:bg-dark-surfaceMuted/20 border-light-border/60 dark:border-dark-border/30 opacity-55"
            }`}
          >
            <Text
              className={`font-heavy text-[14px] ${
                day.isActive
                  ? "text-light-text dark:text-dark-text"
                  : "text-light-muted dark:text-dark-muted"
              }`}
            >
              {day.dayName}
            </Text>

            {day.isActive ? (
              <View className="flex-row items-center gap-1.5">
                <Clock size={12} color={colors.muted} strokeWidth={2} />
                <Text className="text-light-text dark:text-dark-text font-book text-[12px]">
                  {day.startTime} – {day.endTime}
                </Text>
              </View>
            ) : (
              <Text className="text-light-muted dark:text-dark-muted font-regular text-[12px] italic mr-1">
                No campus hours
              </Text>
            )}
          </View>
        ))}
      </View>

      {/* Info notice */}
      <View className="mt-6 bg-light-primary/10 dark:bg-dark-primary/22 border border-light-primary/20 dark:border-dark-primary/35 rounded-card p-3.5 flex-row gap-2.5 items-center shadow-soft">
        <AlertCircle size={15} color={colors.primary} strokeWidth={2.2} />
        <Text className="text-light-text dark:text-dark-text font-regular text-[11.5px] flex-1 leading-[16px]">
          To modify your schedule, tap "Update Schedule" below and submit an
          updated Certificate of Registration (COR) for administrator review.
        </Text>
      </View>

      {/* Update button */}
      <AppButton
        label="Update Schedule"
        variant="primary"
        size="lg"
        className="mt-8"
        onPress={onStartEditing}
        icon={<Pencil size={16} color="#FFF" strokeWidth={2.5} />}
      />
    </View>
  );
}
