import { QuickActionCard, SectionHeader } from "@/components/shared";
import { AlertTriangle, CalendarCheck } from "lucide-react-native";
import { View } from "react-native";

interface UserQuickActionsProps {
  onViewCharges?: () => void;
  onRequestSchedule?: () => void;
}

export default function UserQuickActions({
  onViewCharges,
  onRequestSchedule,
}: UserQuickActionsProps) {
  return (
    <View>
      <SectionHeader title="Quick Actions" />
      <View className="flex-row gap-3 mt-3">
        <View className="flex-1">
          <QuickActionCard
            icon={<AlertTriangle size={26} color="#D22730" strokeWidth={1.8} />}
            title="View Charges"
            subtitle="See parking fees"
            onPress={onViewCharges}
          />
        </View>
        <View className="flex-1">
          <QuickActionCard
            icon={<CalendarCheck size={26} color="#D22730" strokeWidth={1.8} />}
            title="Request Schedule"
            subtitle="Reserve parking slot"
            onPress={onRequestSchedule}
          />
        </View>
      </View>
    </View>
  );
}
