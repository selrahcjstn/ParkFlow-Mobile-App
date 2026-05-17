import { Body, Title } from "@/components/ui/Typography";
import { lightColors } from "@/constants/theme";
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
    <View className="mx-5 mb-8 mt-4">
      <View
        className="bg-white rounded-3xl border border-light-border/50 overflow-hidden"
        style={{
          shadowColor: "#000",
          shadowOpacity: 0.03,
          shadowRadius: 10,
          shadowOffset: { width: 0, height: 3 },
          elevation: 2,
        }}
      >
        {/* Header */}
        <View className="flex-row items-center justify-between pt-5 pb-3 px-4">
          <Title
            className="text-light-text font-black"
            style={{ fontSize: 18 }}
          >
            Recent Transactions
          </Title>

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={handleViewAll}
            className="px-1 py-1"
          >
            <Body
              className="text-light-accent font-heavy"
              style={{ fontSize: 13 }}
            >
              View all
            </Body>
          </TouchableOpacity>
        </View>

        {/* Divider */}
        <View className="h-px bg-light-border/50 mx-4" />

        {/* Content */}
        {recentEntries.length === 0 ? (
          <View className="items-center justify-center py-12 opacity-70">
            <View className="w-14 h-14 rounded-2xl bg-light-accent/15 items-center justify-center mb-3">
              <History size={28} color={lightColors.accent} strokeWidth={1.8} />
            </View>

            <Body className="text-light-muted font-book">
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
