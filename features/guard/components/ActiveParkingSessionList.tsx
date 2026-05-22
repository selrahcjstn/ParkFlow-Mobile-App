import { Body, Caption, Title } from "@/components/ui/Typography";
import { GetActiveParkingSessionResponse } from "@/types/parkingLog";
import { formatDate } from "@/utils/formatDate";
import { formatTime } from "@/utils/formatTime";
import { router } from "expo-router";
import { AlertTriangle, History, Timer } from "lucide-react-native";
import { useMemo } from "react";
import { TouchableOpacity, View } from "react-native";

interface ActiveParkingSessionListProps {
  entries: GetActiveParkingSessionResponse[];
  isGuardSide?: boolean;
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
          <Body
            className="text-light-text font-black text-[14px]"
            numberOfLines={1}
          >
            {entry.plateNumber || "N/A"}
          </Body>
          {entry.brand ? (
            <Caption className="text-light-muted font-book text-[11px] mt-0.5">
              {entry.brand}
            </Caption>
          ) : null}
        </View>
      </View>

      {/* ── Right: Entry Time + Entry Date stacked ── */}
      <View className="items-end justify-center">
        <Body className="text-light-text font-heavy text-[13px]">
          {entryTime}
        </Body>
        {entryDate ? (
          <Caption className="text-light-muted font-book text-[11px] mt-0.5">
            {entryDate}
          </Caption>
        ) : null}
      </View>
    </View>
  );
}

export default function ActiveParkingSessionList({
  entries,
  isGuardSide = false,
}: ActiveParkingSessionListProps) {
  const handleViewAll = () => {
    if (isGuardSide) {
      router.push("/(guard)/(tabs)/session");
    } else {
      // router.push("/(tabs)/sessions");
    }
  };

  // Limit only to 5 recent if on guard side
  const recentEntries = useMemo(() => {
    return isGuardSide ? entries.slice(0, 5) : entries;
  }, [entries, isGuardSide]);

  return (
    <View className="mt-6 mb-8">
      <View className="flex-row items-center justify-between mb-4 px-1">
        <Title className="text-light-text font-black text-[18px]">
          Sessions
        </Title>

        <TouchableOpacity
          activeOpacity={0.7}
          onPress={handleViewAll}
          className="py-1 px-2"
        >
          <Body className="text-light-primary font-heavy text-[13px]">
            View all
          </Body>
        </TouchableOpacity>
      </View>

      <View className="bg-light-surface rounded-3xl px-4 py-1">
        {recentEntries.length === 0 ? (
          <View className="items-center justify-center py-12 opacity-70">
            <View className="w-14 h-14 rounded-2xl bg-light-background items-center justify-center mb-3">
              <History size={28} color="#94A3B8" strokeWidth={1.8} />
            </View>
            <Body className="text-light-muted font-book text-[13px]">
              No active sessions.
            </Body>
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
