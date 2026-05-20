import { Body, Title } from "@/components/ui/Typography";
import { GetActiveParkingSessionResponse } from "@/types/parkingLog";
import { History } from "lucide-react-native";
import { TouchableOpacity, View } from "react-native";
import ActiveParkingSessionRow from "./ActiveParkingSessionRow";

interface ActiveParkingSessionListProps {
  entries: GetActiveParkingSessionResponse[];
  isGuardSide?: boolean;
}

export default function ActiveParkingSessionList({
  entries,
  isGuardSide = false,
}: ActiveParkingSessionListProps) {
  const handleViewAll = () => {
    if (isGuardSide) {
      // router.push("/(guard)/logs");
    } else {
      // router.push("/(tabs)/logs");
    }
  };

  return (
    <View className="mt-6 mb-8">
      {/* ── Header ── */}
      <View className="flex-row items-center justify-between mb-4 px-1">
        <Title className="text-light-text font-black text-[18px]">
          Active Sessions
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

      {/* ── Content (Wrapped in ONE unified card) ── */}
      <View className="bg-light-surface rounded-3xl px-4 py-1">
        {entries.length === 0 ? (
          <View className="items-center justify-center py-12 opacity-70">
            <View className="w-14 h-14 rounded-2xl bg-light-background items-center justify-center mb-3">
              <History size={28} color="#94A3B8" strokeWidth={1.8} />
            </View>
            <Body className="text-light-muted font-book text-[13px]">
              No active sessions.
            </Body>
          </View>
        ) : (
          entries.map((entry, index) => (
            <ActiveParkingSessionRow
              key={`${entry.plateNumber}-${index}`}
              entry={entry}
              isLast={index === entries.length - 1}
            />
          ))
        )}
      </View>
    </View>
  );
}
