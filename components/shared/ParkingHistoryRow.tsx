import { Body, Caption } from "@/components/ui/Typography";
import { ArrowDownLeft, ArrowUpRight } from "lucide-react-native";
import { View } from "react-native";

export interface ParkingHistoryEntry {
  id: string;
  plateNumber: string;
  brand: string;
  vehicleType?: string;
  entryTime: string;
  entryDate: string;
  action: "ENTRY" | "EXIT";
}

interface ParkingHistoryRowProps {
  entry: ParkingHistoryEntry;
  isLast: boolean;
}

export default function ParkingHistoryRow({
  entry,
  isLast,
}: ParkingHistoryRowProps) {
  const isEntry = entry.action === "ENTRY";

  return (
    <View
      className={`py-4 flex-row items-center justify-between ${
        !isLast ? "border-b border-light-border/60" : ""
      }`}
    >
      {/* ── Left: Icon & Vehicle Info ── */}
      <View className="flex-row items-center flex-1 pr-4">
        {/* Fintech-Style Directional Icon (Circles with Diagonal Arrows) */}
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

        {/* Vehicle Text */}
        <View className="flex-1 justify-center">
          <Body
            className="text-light-text font-black text-[15px]"
            numberOfLines={1}
          >
            {entry.plateNumber}
          </Body>

          <View className="flex-row items-center flex-wrap mt-1">
            <Caption
              className="text-light-muted font-book text-[12px]"
              numberOfLines={1}
            >
              {entry.brand}
            </Caption>

            {entry.vehicleType ? (
              <>
                <View className="w-1 h-1 rounded-full bg-light-muted/50 mx-1.5" />
                <Caption className="text-light-muted font-book uppercase text-[11px]">
                  {entry.vehicleType}
                </Caption>
              </>
            ) : null}
          </View>
        </View>
      </View>

      {/* ── Right: Clean Time Info ── */}
      <View className="items-end justify-center">
        <Body className="text-light-text font-black text-[14px]">
          {entry.entryTime}
        </Body>

        <Caption className="text-light-muted font-book text-[11px] mt-0.5">
          {entry.entryDate}
        </Caption>
      </View>
    </View>
  );
}
