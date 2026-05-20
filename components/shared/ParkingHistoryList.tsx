import { Body, Title } from "@/components/ui/Typography";
import { History } from "lucide-react-native";
import { TouchableOpacity, View } from "react-native";
import ParkingHistoryRow, {
  type ParkingHistoryEntry,
} from "./ParkingHistoryRow";

interface ParkingHistoryListProps {
  entries: ParkingHistoryEntry[];
  isGuardSide?: boolean;
}

export default function ParkingHistoryList({
  entries,
  isGuardSide = false,
}: ParkingHistoryListProps) {
  const recentEntries = entries.slice(0, 5);

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
      <View className="flex-row items-center justify-between mb-3 px-1">
        <Title className="text-light-text font-black text-[18px]">
          Recent Transactions
        </Title>

        <TouchableOpacity
          activeOpacity={0.7}
          onPress={handleViewAll}
          className="py-1 px-2"
        >
          {/* Changed View All to Primary color for better call-to-action */}
          <Body className="text-light-primary font-heavy text-[13px]">
            View all
          </Body>
        </TouchableOpacity>
      </View>

      {/* ── Content (Wrapped in a unified surface card) ── */}
      <View className="bg-light-surface rounded-3xl px-4 py-2">
        {recentEntries.length === 0 ? (
          <View className="items-center justify-center py-12 opacity-70">
            <View className="w-14 h-14 rounded-2xl bg-light-background items-center justify-center mb-3">
              <History size={28} color="#94A3B8" strokeWidth={1.8} />
            </View>
            <Body className="text-light-muted font-book text-[13px]">
              No transactions yet.
            </Body>
          </View>
        ) : (
          recentEntries.map((entry, index) => (
            <ParkingHistoryRow
              key={entry.id}
              entry={entry}
              isLast={index === recentEntries.length - 1}
            />
          ))
        )}
      </View>
    </View>
  );
}
