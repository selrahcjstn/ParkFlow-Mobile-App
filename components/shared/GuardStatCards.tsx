// components/shared/GuardStatCards.tsx
import { Caption, Title } from "@/components/ui/Typography";
import { ParkingSquare } from "lucide-react-native";
import { View } from "react-native";

interface GuardStatCardsProps {
  totalSlots?: number;
  totalParkedToday?: number;
}

export default function GuardStatCards({
  totalSlots = 100,
  totalParkedToday = 0,
}: GuardStatCardsProps) {
  const occupancyPercent = Math.round((totalParkedToday / totalSlots) * 100);
  const availableSlots = totalSlots - totalParkedToday;

  return (
    <View className="mx-5">
      <View className="bg-light-surface border border-light-border rounded-2xl overflow-hidden">
        {/* Header — icon + label */}
        <View className="flex-row items-center gap-x-2 px-4 pt-4 pb-3">
          <View className="w-8 h-8 rounded-lg bg-light-background border border-light-border items-center justify-center">
            <ParkingSquare size={16} color="#9D0215" strokeWidth={1.8} />
          </View>
          <Caption className="uppercase tracking-widest font-black text-light-muted">
            Parking Slots
          </Caption>
        </View>

        {/* Divider */}
        <View className="h-px bg-light-border mx-4" />

        {/* Split — Parked Today | Total Slots */}
        <View className="flex-row">
          {/* Parked Today */}
          <View className="flex-1 items-center py-4 gap-y-0.5">
            <Title className="text-3xl text-light-text">
              {totalParkedToday}
            </Title>
            <Caption className="uppercase tracking-widest font-black text-light-muted">
              Parked Today
            </Caption>
            <Caption className="text-light-secondary">
              {occupancyPercent}% full
            </Caption>
          </View>

          {/* Vertical divider */}
          <View className="w-px bg-light-border my-3" />

          {/* Total Slots */}
          <View className="flex-1 items-center py-4 gap-y-0.5">
            <Title className="text-3xl text-light-text">{totalSlots}</Title>
            <Caption className="uppercase tracking-widest font-black text-light-muted">
              Total Slots
            </Caption>
            <Caption className="text-light-secondary">
              {availableSlots} available
            </Caption>
          </View>
        </View>

        {/* Occupancy progress bar */}
        <View className="mx-4 mb-4 h-1.5 bg-light-border rounded-full overflow-hidden">
          <View
            className="h-full bg-light-primary rounded-full"
            style={{ width: `${occupancyPercent}%` }}
          />
        </View>
      </View>
    </View>
  );
}
