import { Body, Title } from "@/components/ui/Typography";
import { View } from "react-native";

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

  return (
    <View className="mt-4">
      {/* Borderless flat card */}
      <View className="bg-light-surface rounded-2xl p-5">
        {/* ── Top Header Row ── */}
        <View className="mb-4">
          <Body className="text-light-accent font-heavy uppercase text-[13px]">
            Facility Capacity
          </Body>
        </View>

        {/* ── Main Unified Stat ── */}
        <View className="flex-row items-baseline mb-3">
          <Title className="text-light-text font-black tracking-tight text-[40px] leading-[48px]">
            {totalParkedToday}
          </Title>
          <Title className="text-light-muted font-heavy ml-2 text-[20px]">
            / {totalSlots}
          </Title>
        </View>

        {/* ── Progress Bar ── */}
        <View className="h-2 bg-light-background rounded-full overflow-hidden mb-4">
          <View
            className="h-full rounded-full bg-light-primary"
            style={{
              width: `${occupancyPercent}%`,
            }}
          />
        </View>

        {/* ── Bottom Context Row ── */}
        <View className="flex-row justify-between items-center">
          <Body className="text-light-muted font-heavy text-[12px]">
            {occupancyPercent}% Occupied
          </Body>

          <Body className="text-light-success font-heavy text-[12px]">
            {availableSlots} Available
          </Body>
        </View>
      </View>
    </View>
  );
}
