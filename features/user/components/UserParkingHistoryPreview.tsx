import ParkingHistoryListItem from "@/components/shared/ParkingHistoryListItem";
import { SessionListItemSkeleton } from "@/components/ui/Skeleton";
import { ParkingHistoryResponse } from "@/features/history/types/history.types";
import { useAppTheme } from "@/hooks/useAppTheme";
import HistoryEmptyState from "@/features/history/components/HistoryEmptyState";
import { History } from "lucide-react-native";
import { Text, TouchableOpacity, View } from "react-native";

interface UserParkingHistoryPreviewProps {
  logs: ParkingHistoryResponse[];
  isLoading?: boolean;
  onPressLog: (log: ParkingHistoryResponse) => void;
  onViewAll: () => void;
}

export default function UserParkingHistoryPreview({
  logs,
  isLoading = false,
  onPressLog,
  onViewAll,
}: UserParkingHistoryPreviewProps) {
  const { colors } = useAppTheme();
  const recentLogs = logs.slice(0, 5);

  return (
    <View>
      <View className="flex-row items-center justify-between mt-7 px-1">
        <Text className="text-light-text dark:text-dark-text font-bold text-[18px] leading-6">
          Parking History
        </Text>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={onViewAll}
          className="py-1 px-2"
        >
          <Text
            style={{ color: colors.primary }}
            className="font-bold text-[13px]"
          >
            View all
          </Text>
        </TouchableOpacity>
      </View>

      <View className="mt-3">
        {isLoading ? (
          <>
            <SessionListItemSkeleton />
            <SessionListItemSkeleton />
            <SessionListItemSkeleton />
          </>
        ) : recentLogs.length === 0 ? (
          <HistoryEmptyState
            className="mt-0"
            icon={<History size={20} color={colors.primary} strokeWidth={2.2} />}
            title="No recent parking logs"
            description="Your latest gate entries and exits will show here."
          />
        ) : (
          recentLogs.map((log, index) => (
            <ParkingHistoryListItem
              key={`home-log-${index}`}
              log={log}
              containerClassName="bg-light-surface dark:bg-dark-surface px-4 py-4 rounded-2xl mb-2.5 border border-light-border dark:border-dark-border"
              onPress={() => onPressLog(log)}
            />
          ))
        )}
      </View>
    </View>
  );
}

