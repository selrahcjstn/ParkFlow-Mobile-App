import { Body, Caption } from "@/components/ui/Typography";
import { GetActiveParkingSessionResponse } from "@/types/parkingLog";
import { formatDate } from "@/utils/formatDate";
import { formatTime } from "@/utils/formatTime";
import { ChevronRight } from "lucide-react-native";
import { TouchableOpacity, View } from "react-native";

interface SessionCardProps {
  session: GetActiveParkingSessionResponse;
  onPress?: () => void;
}

/**
 * A flat, borderless, shadowless session card used in the Sessions tab.
 * Shows: plate number, entry time, entry date, and an "Ongoing" label.
 */
export default function SessionCard({ session, onPress }: SessionCardProps) {
  const entryTime = session.entryTime ? formatTime(session.entryTime) : "N/A";
  const entryDate = session.entryTime ? formatDate(session.entryTime) : "";

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      className="bg-light-surface rounded-2xl px-4 py-4"
    >
      <View className="flex-row items-center justify-between">
        {/* ── Left: Plate + Status ── */}
        <View className="flex-1 pr-3">
          <View className="flex-row items-center gap-2.5">
            <Body className="text-light-text font-black text-[15px]">
              {session.plateNumber || "N/A"}
            </Body>
            <View className="bg-light-success/15 px-2.5 py-0.5 rounded-full">
              <Caption className="text-light-success font-heavy text-[10px]">
                Ongoing
              </Caption>
            </View>
          </View>

          {/* Time & Date row */}
          <View className="flex-row items-center gap-3 mt-1.5">
            <Caption className="text-light-muted font-book text-[12px]">
              {entryTime}
            </Caption>
            {entryDate ? (
              <>
                <View className="w-[3px] h-[3px] rounded-full bg-light-muted/40" />
                <Caption className="text-light-muted font-book text-[12px]">
                  {entryDate}
                </Caption>
              </>
            ) : null}
          </View>
        </View>

        {/* ── Right: Chevron ── */}
        <ChevronRight size={18} color="#A1A1AA" strokeWidth={2} />
      </View>
    </TouchableOpacity>
  );
}
