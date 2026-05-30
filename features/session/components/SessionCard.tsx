import { GetActiveParkingSessionResponse } from "@/features/session/types/parking-log.types";
import { useAppTheme } from "@/hooks/useAppTheme";
import { AlertTriangle, ChevronRight, Timer } from "lucide-react-native";
import React, { useMemo } from "react";
import { Text, TouchableOpacity, View } from "react-native";

interface SessionCardProps {
  session: GetActiveParkingSessionResponse;
  onPress?: () => void;
}

/**
 * A flat, borderless, shadowless session card used in the Sessions tab.
 * Shows: Plate number, brand, duration, status icon, and chevron.
 */
export default function SessionCard({ session, onPress }: SessionCardProps) {
  const { colors, isDark } = useAppTheme();

  // Check if session has exceeded the maximum exit time
  const isOverstay = useMemo(() => {
    if (!session.maximumExitTime) return false;
    const maxExit = new Date(session.maximumExitTime);
    return new Date() > maxExit;
  }, [session.maximumExitTime]);

  // Format active duration
  const duration = useMemo(() => {
    let rawDuration = "";
    if (session.totalParkingHours) {
      rawDuration = String(session.totalParkingHours);
    } else if (session.entryTime) {
      const entry = new Date(session.entryTime);
      const diffMs = new Date().getTime() - entry.getTime();
      if (diffMs <= 0) {
        rawDuration = "0m";
      } else {
        const totalMins = Math.floor(diffMs / 60000);
        const hrs = Math.floor(totalMins / 60);
        const mins = totalMins % 60;
        rawDuration = hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`;
      }
    } else {
      rawDuration = "—";
    }

    // Shorten "hours", "hour", "minutes", "mins" to standard symbols "h", "m"
    return rawDuration
      .toLowerCase()
      .replace(/\s*hours?/g, "h")
      .replace(/\s*minutes?/g, "m")
      .replace(/\s*mins?/g, "m")
      .trim();
  }, [session.entryTime, session.totalParkingHours]);

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      className="bg-light-surface dark:bg-dark-surface rounded-2xl px-5 py-3.5"
    >
      <View className="flex-row items-center justify-between">
        {/* ── Left side: Icon Avatar + Core Info Texts ── */}
        <View className="flex-row items-center flex-1 pr-3">
          {/* Status Icon on the far left (big) */}
          {isOverstay ? (
            <View className="bg-amber-100 dark:bg-amber-950/30 p-3.5 rounded-full mr-4">
              <AlertTriangle size={22} color={colors.warning} strokeWidth={2.5} />
            </View>
          ) : (
            <View className="bg-emerald-100 dark:bg-emerald-950/30 p-3.5 rounded-full mr-4">
              <Timer size={22} color={colors.success} strokeWidth={2.5} />
            </View>
          )}

          {/* Info Stack */}
          <View className="flex-1 justify-center">
            {/* Plate Number */}
            <Text className="text-light-text dark:text-dark-text font-black text-[15px]">
              {session.plateNumber || "N/A"}
            </Text>

            {/* Brand */}
            {session.brand ? (
              <Text className="text-light-muted dark:text-dark-muted font-light text-[12px] mt-1">
                {session.brand}
              </Text>
            ) : null}
          </View>
        </View>

        {/* ── Right side: Duration + Chevron ── */}
        <View className="flex-row items-center gap-3.5">
          <Text className="text-light-muted dark:text-dark-muted font-regular text-[13px]">
            {duration}
          </Text>
          <ChevronRight size={18} color={isDark ? "#71717A" : "#A1A1AA"} strokeWidth={2} />
        </View>
      </View>
    </TouchableOpacity>
  );
}
