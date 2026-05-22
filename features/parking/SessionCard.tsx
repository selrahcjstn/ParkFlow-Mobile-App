import { Body, Caption } from "@/components/ui/Typography";
import { GetActiveParkingSessionResponse } from "@/types/parkingLog";
import { AlertTriangle, ChevronRight, Timer } from "lucide-react-native";
import { useMemo } from "react";
import { TouchableOpacity, View } from "react-native";

interface SessionCardProps {
  session: GetActiveParkingSessionResponse;
  onPress?: () => void;
}

/**
 * A flat, borderless, shadowless session card used in the Sessions tab.
 * Shows: Plate number, brand, duration, status icon, and chevron.
 */
export default function SessionCard({ session, onPress }: SessionCardProps) {
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
      className="bg-light-surface rounded-2xl px-5 py-3.5"
    >
      <View className="flex-row items-center justify-between">
        {/* ── Left side: Icon Avatar + Core Info Texts ── */}
        <View className="flex-row items-center flex-1 pr-3">
          {/* Status Icon on the far left (big) */}
          {isOverstay ? (
            <View className="bg-amber-100 p-3.5 rounded-full mr-4">
              <AlertTriangle size={22} color="#F59E0B" strokeWidth={2.5} />
            </View>
          ) : (
            <View className="bg-emerald-100 p-3.5 rounded-full mr-4">
              <Timer size={22} color="#10B981" strokeWidth={2.5} />
            </View>
          )}

          {/* Info Stack */}
          <View className="flex-1 justify-center">
            {/* Plate Number */}
            <Body className="text-light-text font-black text-[15px]">
              {session.plateNumber || "N/A"}
            </Body>

            {/* Brand */}
            {session.brand ? (
              <Caption className="text-light-muted font-book text-[12px] mt-1">
                {session.brand}
              </Caption>
            ) : null}
          </View>
        </View>

        {/* ── Right side: Duration + Chevron ── */}
        <View className="flex-row items-center gap-3.5">
          <Body className="text-light-muted font-book text-[13px]">
            {duration}
          </Body>
          <ChevronRight size={18} color="#A1A1AA" strokeWidth={2} />
        </View>
      </View>
    </TouchableOpacity>
  );
}
