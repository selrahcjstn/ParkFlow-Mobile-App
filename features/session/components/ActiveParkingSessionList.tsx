import { GetActiveParkingSessionResponse } from "@/features/session/types/parking-log.types";
import { useAppTheme } from "@/hooks/useAppTheme";
import { formatDate } from "@/utils/formatDate";
import { formatTime } from "@/utils/formatTime";
import { AlertTriangle, History, Timer } from "lucide-react-native";
import React, { useMemo } from "react";
import { Text, TouchableOpacity, View } from "react-native";

interface ActiveParkingSessionListProps {
  entries: GetActiveParkingSessionResponse[];
  onViewAll: () => void;
}

/**
 * Session row rendered inside the unified home card.
 * Compact: plate on left, ongoing label, time + date on right.
 */
function SessionRow({
  entry,
  isLast,
}: {
  entry: GetActiveParkingSessionResponse;
  isLast: boolean;
}) {
  const { colors } = useAppTheme();
  const entryDate = entry.entryTime ? formatDate(entry.entryTime) : "";
  const entryTime = entry.entryTime ? formatTime(entry.entryTime) : "—";

  // Check if session has exceeded the maximum exit time
  const isOverstay = useMemo(() => {
    if (!entry.maximumExitTime) return false;
    const maxExit = new Date(entry.maximumExitTime);
    return new Date() > maxExit;
  }, [entry.maximumExitTime]);

  return (
    <View
      className={`py-3.5 flex-row items-center justify-between ${
        !isLast ? "border-b border-light-border/60 dark:border-dark-border/40" : ""
      }`}
    >
      {/* ── Left: Icon + Plate + Brand ── */}
      <View className="flex-row items-center flex-1 pr-4">
        {/* Status Icon on the far left */}
        {isOverstay ? (
          <View className="bg-amber-100 dark:bg-amber-950/30 p-2.5 rounded-full mr-3">
            <AlertTriangle size={18} color={colors.warning} strokeWidth={2.5} />
          </View>
        ) : (
          <View className="bg-emerald-100 dark:bg-emerald-950/30 p-2.5 rounded-full mr-3">
            <Timer size={18} color={colors.success} strokeWidth={2.5} />
          </View>
        )}

        <View className="flex-1 justify-center">
          <Text
            className="text-light-text dark:text-dark-text font-black text-[14px]"
            numberOfLines={1}
          >
            {entry.plateNumber || "N/A"}
          </Text>
          {entry.brand ? (
            <Text className="text-light-muted dark:text-dark-muted font-light text-[11px] mt-0.5">
              {entry.brand}
            </Text>
          ) : null}
        </View>
      </View>

      {/* ── Right: Entry Time + Entry Date stacked ── */}
      <View className="items-end justify-center">
        <Text className="text-light-text dark:text-dark-text font-heavy text-[13px]">
          {entryTime}
        </Text>
        {entryDate ? (
          <Text className="text-light-muted dark:text-dark-muted font-light text-[11px] mt-0.5">
            {entryDate}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

export default function ActiveParkingSessionList({
  entries,
  onViewAll,
}: ActiveParkingSessionListProps) {
  const { colors } = useAppTheme();
  // Limit only to 5 recent since this list is for the Guard dashboard
  const recentEntries = useMemo(() => {
    return entries.slice(0, 5);
  }, [entries]);

  return (
    <View className="mt-6 mb-8">
      <View className="flex-row items-center justify-between mb-4 px-1">
        <Text className="text-light-text dark:text-dark-text font-black text-[18px] leading-6">
          Sessions
        </Text>

        <TouchableOpacity
          activeOpacity={0.7}
          onPress={onViewAll}
          className="py-1 px-2"
        >
          <Text
            style={{ color: colors.primary }}
            className="font-heavy text-[13px]"
          >
            View all
          </Text>
        </TouchableOpacity>
      </View>

      <View className="bg-light-surface dark:bg-dark-surface rounded-3xl px-4 py-1 border border-light-border dark:border-dark-border">
        {recentEntries.length === 0 ? (
          <View className="items-center justify-center py-12">
            <View className="w-16 h-16 rounded-full bg-light-surfaceMuted/50 dark:bg-dark-surfaceMuted/20 items-center justify-center mb-3.5 border border-light-border/60 dark:border-dark-border/40 shadow-sm">
              <View className="w-11 h-11 rounded-full bg-light-surface dark:bg-dark-surface items-center justify-center border border-light-border/30 dark:border-dark-border/30 shadow-soft">
                <History size={20} color={colors.primary} strokeWidth={2.2} />
              </View>
            </View>
            <Text className="font-heavy text-[14px] mb-1.5 text-light-text dark:text-dark-text text-center">
              No active sessions
            </Text>
            <Text className="font-regular text-[12px] text-center px-4 text-light-muted dark:text-dark-muted leading-normal">
              Active parking logs will preview here.
            </Text>
          </View>
        ) : (
          recentEntries.map((entry, index) => (
            <SessionRow
              key={`${entry.plateNumber}-${index}`}
              entry={entry}
              isLast={index === recentEntries.length - 1}
            />
          ))
        )}
      </View>
    </View>
  );
}

