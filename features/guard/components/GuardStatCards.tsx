import { Text, View } from "react-native";

interface GuardStatCardsProps {
  totalSlots?: number;
  totalParkedToday?: number;
}

export default function GuardStatCards({
  totalSlots = 100,
  totalParkedToday = 34,
}: GuardStatCardsProps) {
  const occupancyPercent = Math.round((totalParkedToday / totalSlots) * 100);
  const availableSlots = totalSlots - totalParkedToday;

  const availColor =
    availableSlots > 20
      ? "#10B981"
      : availableSlots > 5
        ? "#F59E0B"
        : "#EF4444";

  return (
    <View className="mt-4">
      <View className="bg-light-surface rounded-2xl px-5 py-4">
        {/* Header row */}
        <View className="flex-row justify-between items-center mb-1">
          <Text className="font-bold uppercase tracking-widest text-[10px] text-light-muted">
            Facility Capacity
          </Text>
        </View>

        <View className="flex-row items-baseline mb-3">
          <Text className="font-black text-light-text text-[28px] leading-[34px]">
            {totalParkedToday}
          </Text>
          <Text className="text-light-muted font-bold ml-1 text-[14px] leading-[34px]">
            / {totalSlots}
          </Text>
        </View>

        <View className="h-1.5 bg-light-background rounded-full overflow-hidden">
          <View
            className="h-full rounded-full bg-light-primary"
            style={{ width: `${occupancyPercent}%` }}
          />
        </View>

        <View className="flex-row justify-between items-center mt-2.5">
          <View className="flex-row items-center gap-1.5">
            <Text className="font-bold text-[13px] text-light-text">
              {availableSlots} Available
            </Text>
          </View>
          <View className="px-2 py-0.5">
            <Text className="font-bold text-[13px] text-light-text">
              {occupancyPercent}% full
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}
