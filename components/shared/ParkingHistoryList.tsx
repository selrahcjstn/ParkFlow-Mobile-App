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
      className={`py-3.5 px-4 flex-row items-center justify-between bg-white ${
        !isLast ? "border-b border-light-border/30" : ""
      }`}
    >
      {/* Left Side: Icon & Main Info */}
      <View className="flex-row items-center flex-1">
        <View className="w-11 h-11 rounded-xl bg-[#E8F0FE] items-center justify-center mr-3">
          <CarFront size={20} color="#3B82F6" strokeWidth={1.5} />
        </View>

        <View className="flex-1 pr-2">
          <Body
            className="text-light-text font-heavy"
            style={{ fontSize: 14 }}
            numberOfLines={1}
          >
            {entry.plateNumber}
          </Body>
          <Body
            className="text-light-muted font-book mt-0.5"
            style={{ fontSize: 11 }}
            numberOfLines={1}
          >
            {entry.entryDate} {entry.entryTime}
          </Body>
        </View>
      </View>

      {/* Right Side: Brand & "Status" Pill (Vehicle Type) */}
      <View className="items-end">
        <Body className="text-light-text font-heavy" style={{ fontSize: 14 }}>
          {entry.brand}
        </Body>
        <View className="bg-[#E8F5E9] px-2 py-0.5 rounded mt-1">
          <Body
            className="text-[#4CAF50] font-heavy"
            style={{ fontSize: 10, textTransform: "lowercase" }}
          >
            {entry.vehicleType}
          </Body>
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
      <View
        className="bg-white rounded-3xl border border-light-border/50 overflow-hidden pb-2"
        style={{
          shadowColor: "#000",
          shadowOpacity: 0.03,
          shadowRadius: 10,
          shadowOffset: { width: 0, height: 3 },
          elevation: 2,
        }}
      >
        {/* Header Section */}
        <View className="flex-row items-center justify-between pt-5 pb-3 px-4">
          <Title
            className="text-light-text font-heavy"
            style={{ fontSize: 18 }}
          >
            Recent transactions
          </Title>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={handleViewAll}
            className="px-4 py-1.5 border-light-border/50"
          >
            <Body
              className="text-light-text font-book"
              style={{ fontSize: 13 }}
            >
              View all
            </Body>
          </TouchableOpacity>
        </View>

        {/* ── Thin Visual Separator Line ── */}
        <View className="h-px bg-light-border/50 mx-4" />

        {/* Thin Strips List */}
        {recentEntries.length === 0 ? (
          <View className="items-center justify-center py-10 opacity-60">
            <History
              size={32}
              color={lightColors.muted}
              strokeWidth={1.5}
              className="mb-3"
            />
            <Body className="text-light-muted font-book">
              No transactions yet.
            </Body>
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
