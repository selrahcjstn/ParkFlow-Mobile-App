import { GetActiveParkingSessionResponse } from "@/features/session/types/parking-log.types";
import { formatDate } from "@/utils/formatDate";
import { formatTime } from "@/utils/formatTime";
import { QrCode, Keyboard } from "lucide-react-native";
import { Text, View } from "react-native";

interface ActiveParkingSessionRowProps {
  entry: GetActiveParkingSessionResponse;
  isLast: boolean;
}

export default function ActiveParkingSessionRow({
  entry,
  isLast,
}: ActiveParkingSessionRowProps) {
  // No conditional logic needed for active sessions.
  // We just fetch and format the exact data coming in.
  const rawTimeStr = entry.entryTime;
  const displayTime = rawTimeStr ? formatTime(rawTimeStr) : "N/A";
  const displayDate = rawTimeStr ? formatDate(rawTimeStr) : "";

  return (
    <View
      className={`py-4 flex-row items-center justify-between ${
        !isLast ? "border-b border-light-border/60 dark:border-dark-border/60" : ""
      }`}
    >
      {/* ── Left: Icon & Vehicle Info ── */}
      <View className="flex-row items-center flex-1 pr-4">
        {/* Icon based on entry method */}
        {String(entry.entryMethod).toLowerCase().startsWith("manual") || entry.entryMethod === 1 || entry.entryMethod === 2 ? (
          <View className="w-12 h-12 rounded-full items-center justify-center mr-3.5 bg-blue-500/15 dark:bg-blue-500/20">
            <Keyboard size={22} color="#3B82F6" strokeWidth={2.5} />
          </View>
        ) : (
          <View className="w-12 h-12 rounded-full items-center justify-center mr-3.5 bg-emerald-500/15 dark:bg-emerald-500/20">
            <QrCode size={22} color="#10B981" strokeWidth={2.5} />
          </View>
        )}

        <View className="flex-1 justify-center gap-y-0.5">
          {/* Plate Number as the bold title */}
          <Text
            className="text-light-text dark:text-dark-text font-bold text-[15px]"
            numberOfLines={1}
          >
            {entry.plateNumber || "N/A"}
          </Text>

          {/* Brand as the bottom subtitle */}
          <Text
            className="text-light-muted dark:text-dark-muted font-light text-[12px]"
            numberOfLines={1}
          >
            {entry.brand || "Unknown"}
          </Text>
        </View>
      </View>

      {/* ── Right: Time & Date ── */}
      <View className="items-end justify-center gap-y-0.5">
        <Text className="text-light-text dark:text-dark-text font-bold text-[14px]">
          {displayTime}
        </Text>

        {/* Only renders the date if the auto-formatter successfully parsed it */}
        {displayDate ? (
          <Text className="text-light-muted dark:text-dark-muted font-light text-[11px]">
            {displayDate}
          </Text>
        ) : null}
      </View>
    </View>
  );
}
