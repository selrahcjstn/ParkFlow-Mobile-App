import { DashboardSectionHeader } from "@/components/shared";
import ParkingHistoryListItem from "@/components/shared/ParkingHistoryListItem";
import { ParkingHistoryResponse } from "@/features/history/types/history.types";
import { Text, TouchableOpacity, View } from "react-native";

interface UserParkingHistoryPreviewProps {
  logs: ParkingHistoryResponse[];
  onPressLog: (log: ParkingHistoryResponse) => void;
  onViewAll: () => void;
}

export default function UserParkingHistoryPreview({
  logs,
  onPressLog,
  onViewAll,
}: UserParkingHistoryPreviewProps) {
  const recentLogs = logs.slice(0, 5);

  return (
    <View>
      <View className="flex-row items-center justify-between mt-7 px-1">
        <DashboardSectionHeader
          title="Parking History"
          containerClassName="px-1"
        />
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={onViewAll}
          className="py-1 px-2"
        >
          <Text className="text-light-primary font-bold text-[13px]">
            View all
          </Text>
        </TouchableOpacity>
      </View>

      <View className="mt-3">
        {recentLogs.length === 0 ? (
          <View className="bg-light-surface rounded-2xl py-8 px-4 items-center justify-center">
            <Text className="text-light-muted font-regular text-[13px]">
              No recent parking logs
            </Text>
          </View>
        ) : (
          recentLogs.map((log, index) => (
            <ParkingHistoryListItem
              key={`home-log-${index}`}
              log={log}
              containerClassName="bg-light-surface px-4 py-4 rounded-2xl mb-2.5"
              onPress={() => onPressLog(log)}
            />
          ))
        )}
      </View>
    </View>
  );
}
