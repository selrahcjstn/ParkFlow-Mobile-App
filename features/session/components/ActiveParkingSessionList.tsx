import { DashboardSectionHeader } from "@/components/shared";
import { GetActiveParkingSessionResponse } from "@/features/session/types/parking-log.types";
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
        !isLast ? "border-b border-light-border/60" : ""
      }`}
    >
      {/* ── Left: Icon + Plate + Brand ── */}
      <View className="flex-row items-center flex-1 pr-4">
        {/* Status Icon on the far left */}
        {isOverstay ? (
          <View className="bg-amber-100 p-2.5 rounded-full mr-3">
            <AlertTriangle size={18} color="#F59E0B" strokeWidth={2.5} />
          </View>
        ) : (
          <View className="bg-emerald-100 p-2.5 rounded-full mr-3">
            <Timer size={18} color="#10B981" strokeWidth={2.5} />
          </View>
        )}

        <View className="flex-1 justify-center">
          <Text
            className="text-light-text font-black text-[14px]"
            numberOfLines={1}
          >
            {entry.plateNumber || "N/A"}
          </Text>
          {entry.brand ? (
            <Text className="text-light-muted font-light text-[11px] mt-0.5">
              {entry.brand}
            </Text>
          ) : null}
        </View>
      </View>

      {/* ── Right: Entry Time + Entry Date stacked ── */}
      <View className="items-end justify-center">
        <Text className="text-light-text font-heavy text-[13px]">
          {entryTime}
        </Text>
        {entryDate ? (
          <Text className="text-light-muted font-light text-[11px] mt-0.5">
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
  // Limit only to 5 recent since this list is for the Guard dashboard
  const recentEntries = useMemo(() => {
    return entries.slice(0, 5);
  }, [entries]);

  return (
    <View className="mt-6 mb-8">
      <View className="flex-row items-center justify-between mb-4 px-1">
        <DashboardSectionHeader title="Sessions" containerClassName="px-1" />

        <TouchableOpacity
          activeOpacity={0.7}
          onPress={onViewAll}
          className="py-1 px-2"
        >
          <Text className="text-light-primary font-heavy text-[13px]">
            View all
          </Text>
        </TouchableOpacity>
      </View>

      <View className="bg-light-surface rounded-3xl px-4 py-1">
        {recentEntries.length === 0 ? (
          <View className="items-center justify-center py-12 opacity-70">
            <View className="w-14 h-14 rounded-2xl bg-light-background items-center justify-center mb-3">
              <History size={28} color="#94A3B8" strokeWidth={1.8} />
            </View>
            <Text className="text-light-muted font-regular text-[13px]">
              No active sessions.
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

