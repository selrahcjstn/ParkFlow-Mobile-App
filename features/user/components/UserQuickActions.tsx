import { QuickActionCard, SectionHeader } from "@/components/shared";
import { CalendarCheck } from "lucide-react-native";
import { View } from "react-native";
import { useAppTheme } from "@/hooks/useAppTheme";

interface UserQuickActionsProps {
  onRequestSchedule?: () => void;
}

export default function UserQuickActions({
  onRequestSchedule,
}: UserQuickActionsProps) {
  const { colors } = useAppTheme();

  return (
    <View>
      <SectionHeader title="Quick Actions" />
      <View className="flex-row gap-3 mt-3">
        <View className="flex-1">
          <QuickActionCard
            icon={<CalendarCheck size={23} color={colors.success} strokeWidth={2} />}
            title="Request Schedule"
            subtitle="Reserve parking slot"
            onPress={onRequestSchedule}
            iconContainerClassName="bg-light-success/10 dark:bg-dark-success/20"
          />
        </View>
      </View>
    </View>
  );
}

