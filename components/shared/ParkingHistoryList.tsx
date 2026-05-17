import { Body, Title } from "@/components/ui/Typography";
import { lightColors } from "@/constants/theme";
import { CarFront, History } from "lucide-react-native";
import { TouchableOpacity, View } from "react-native";

interface ParkingHistoryEntry {
  id: string;
  plateNumber: string;
  brand: string;
  vehicleType: string;
  entryTime: string;
  entryDate: string;
}

interface ParkingHistoryListProps {
  entries: ParkingHistoryEntry[];
  isGuardSide?: boolean;
}

function TransactionRow({
  entry,
  isLast,
}: {
  entry: ParkingHistoryEntry;
  isLast: boolean;
}) {
  return (
    <View
      className={`py-4 px-4 bg-white ${
        !isLast ? "border-b border-light-border/40" : ""
      }`}
    >
      <View className="flex-row items-start">
        <View className="w-10 h-10 rounded-full bg-light-background border border-light-border/50 items-center justify-center mr-3">
          <CarFront size={16} color={lightColors.muted} strokeWidth={2} />
        </View>

        <View className="flex-1">
          <Body
            className="text-light-text font-heavy"
            style={{ fontSize: 14 }}
            numberOfLines={1}
          >
            {entry.plateNumber}
          </Body>
          <View className="mt-1">
            <Body className="text-light-muted font-book" style={{ fontSize: 12 }}>
              Brand: {entry.brand}
            </Body>
            <Body className="text-light-muted font-book" style={{ fontSize: 12 }}>
              Vehicle Type: {entry.vehicleType}
            </Body>
            <Body className="text-light-muted font-book" style={{ fontSize: 12 }}>
              Entry: {entry.entryDate} at {entry.entryTime}
            </Body>
          </View>
        </View>
      </View>
    </View>
  );
}

export default function ParkingHistoryList({
  entries,
  isGuardSide = false,
}: ParkingHistoryListProps) {
  const recentEntries = entries.slice(0, 5);

  const handleViewAll = () => {
    if (isGuardSide) {
      //router.push("/(guard)/logs");
    } else {
      //router.push("/(tabs)/logs");
    }
  };

  return (
    <View className="mx-5 mb-8 mt-4">
      <View className="items-end mb-2 px-1">
        <TouchableOpacity activeOpacity={0.7} onPress={handleViewAll}>
          <Body className="text-light-primary font-heavy" style={{ fontSize: 13 }}>
            View all
          </Body>
        </TouchableOpacity>
      </View>

      <View className="flex-row items-center justify-between mb-3 px-1">
        <Title className="text-light-text font-black" style={{ fontSize: 18 }}>
          Recent Transactions
        </Title>
      </View>

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
        {recentEntries.length === 0 ? (
          <View className="items-center justify-center py-10 opacity-60">
            <History
              size={32}
              color={lightColors.muted}
              strokeWidth={1.5}
              className="mb-3"
            />
            <Body className="text-light-muted font-book">No transactions yet.</Body>
          </View>
        ) : (
          recentEntries.map((entry, index) => (
            <TransactionRow
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
