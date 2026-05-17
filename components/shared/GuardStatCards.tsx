import { Body, Title } from "@/components/ui/Typography";
import { lightColors } from "@/constants/theme";
import { CarFront } from "lucide-react-native";
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
    <View className="mx-5">
      <View
        className="bg-light-surface rounded-3xl p-6 border border-light-border/50"
        style={{
          shadowColor: "#000",
          shadowOpacity: 0.04,
          shadowRadius: 12,
          shadowOffset: { width: 0, height: 4 },
          elevation: 2,
        }}
      >
        {/* ── Top Header Row ── */}
        <View className="flex-row justify-between items-center mb-5">
          <View className="flex-row items-center gap-2.5">
            <View className="w-9 h-9 rounded-full bg-light-primary/10 items-center justify-center">
              <CarFront size={18} color={lightColors.primary} strokeWidth={2} />
            </View>
            <Body
              className="text-light-muted font-heavy tracking-widest uppercase"
              style={{ fontSize: 11 }}
            >
              Facility Capacity
            </Body>
          </View>

          {/* Subtle Live Indicator */}
          <View className="bg-light-success/15 px-2.5 py-1 rounded-md flex-row items-center gap-1.5">
            <View className="w-1.5 h-1.5 rounded-full bg-light-success" />
            <Body
              className="text-light-success font-heavy uppercase tracking-widest"
              style={{ fontSize: 9 }}
            >
              Live
            </Body>
          </View>
        </View>

        {/* ── Main Unified Stat ── */}
        <View className="flex-row items-baseline mb-3">
          <Title
            className="text-light-text font-black tracking-tight"
            style={{ fontSize: 48, lineHeight: 56 }}
          >
            {totalParkedToday}
          </Title>
          <Title
            className="text-light-muted font-heavy ml-2"
            style={{ fontSize: 20 }}
          >
            / {totalSlots}
          </Title>
        </View>

        {/* ── Progress Bar ── */}
        <View className="h-2.5 bg-light-background rounded-full overflow-hidden mb-3.5 border border-light-border/40">
          <View
            className="h-full rounded-full"
            style={{
              width: `${occupancyPercent}%`,
              backgroundColor: lightColors.primary, // Your University Maroon
            }}
          />
        </View>

        {/* ── Bottom Context Row ── */}
        <View className="flex-row justify-between items-center">
          <Body
            className="text-light-muted font-heavy uppercase tracking-wider"
            style={{ fontSize: 11 }}
          >
            {occupancyPercent}% Occupied
          </Body>

          {/* Highlighted availability in Green for quick positive confirmation */}
          <Body
            className="text-light-success font-heavy uppercase tracking-wider"
            style={{ fontSize: 11 }}
          >
            {availableSlots} Available
          </Body>
        </View>
      </View>
    </View>
  );
}
