import { Caption, Title } from "@/components/ui/Typography";
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
          {/* Caption already has text-light-muted + font-book — override weight only */}
          <Caption className="font-heavy uppercase tracking-widest text-[10px]">
            Facility Capacity
          </Caption>
          {/* Dynamic color — use style, not className */}
        </View>

        {/* Main stat */}
        <View className="flex-row items-baseline mb-3">
          {/* Title already has text-light-text */}
          <Title className="text-[28px] leading-[34px]">
            {totalParkedToday}
          </Title>
          {/* Caption already has text-light-muted */}
          <Caption className="font-heavy ml-1 text-[14px] leading-[34px]">
            / {totalSlots}
          </Caption>
        </View>

        {/* Progress bar */}
        <View className="h-1.5 bg-light-background rounded-full overflow-hidden">
          <View
            className="h-full rounded-full bg-light-primary"
            style={{ width: `${occupancyPercent}%` }}
          />
        </View>

        {/* Footer row */}
        <View className="flex-row justify-between items-center mt-2.5">
          <View className="flex-row items-center gap-1.5">
            <Text
              style={{
                fontSize: 13,
                fontFamily: "AvenirHeavy",
              }}
            >
              {availableSlots} Available
            </Text>
          </View>
          <View className="px-2 py-0.5">
            {/* Label = heavy weight, but text-light-text — override color via style */}
            <Text
              style={{
                fontSize: 13,
                fontFamily: "AvenirHeavy",
              }}
            >
              {occupancyPercent}% full
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}
