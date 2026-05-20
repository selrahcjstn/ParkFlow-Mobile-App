import { Body, Caption } from "@/components/ui/Typography";
import { formatDate } from "@/utils/formatDate";
import { formatTime } from "@/utils/formatTime";
import { ArrowDownLeft, ArrowUpRight } from "lucide-react-native";
import { View } from "react-native";
import type { HistoryResponse } from "./ParkingHistoryList";

interface ParkingHistoryRowProps {
  entry: HistoryResponse;
  isLast: boolean;
}

export default function ParkingHistoryRow({
  entry,
  isLast,
}: ParkingHistoryRowProps) {
  // 1. Determine if inbound (parked) or outbound (exit)
  const isEntry =
    entry.status?.toLowerCase() === "parked" ||
    entry.status?.toLowerCase() === "entry";

  const rawTimeStr = isEntry ? entry.entryTime : entry.exitTime;
  const displayTime = rawTimeStr ? formatTime(rawTimeStr) : "N/A";
  const displayDate = rawTimeStr ? formatDate(rawTimeStr) : "";

  return (
    <View
      className={`py-4 flex-row items-center justify-between ${
        !isLast ? "border-b border-light-border/60" : ""
      }`}
    >
      {/* ── Left: Icon & Vehicle Info ── */}
      <View className="flex-row items-center flex-1 pr-4">
        {/* Directional Icons mimicking the exact image design */}
        <View
          className={`w-12 h-12 rounded-full items-center justify-center mr-3.5 ${
            isEntry ? "bg-light-success/15" : "bg-light-warning/15"
          }`}
        >
          {isEntry ? (
            <ArrowDownLeft size={24} color="#10B981" strokeWidth={2.5} />
          ) : (
            <ArrowUpRight size={24} color="#F59E0B" strokeWidth={2.5} />
          )}
        </View>

        <View className="flex-1 justify-center gap-y-0.5">
          {/* Plate Number as the bold title */}
          <Body
            className="text-light-text font-black text-[15px]"
            numberOfLines={1}
          >
            {entry.plateNumber || "N/A"}
          </Body>

          {/* Brand only, moved to the bottom subtitle */}
          <Caption
            className="text-light-muted font-book text-[12px]"
            numberOfLines={1}
          >
            {entry.brand || "Unknown"}
          </Caption>
        </View>
      </View>

      {/* ── Right: Time & Date (No Status Text) ── */}
      <View className="items-end justify-center gap-y-0.5">
        <Body className="text-light-text font-black text-[14px]">
          {displayTime}
        </Body>

        {/* Only renders the date if the auto-formatter successfully parsed it */}
        {displayDate ? (
          <Caption className="text-light-muted font-book text-[11px]">
            {displayDate}
          </Caption>
        ) : null}
      </View>
    </View>
  );
}
