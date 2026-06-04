import ParkingHistoryListItem from "@/components/shared/ParkingHistoryListItem";
import { ParkingHistoryResponse } from "@/features/history/types/history.types";
import { useAppTheme } from "@/hooks/useAppTheme";
import { History } from "lucide-react-native";
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
  const { colors, isDark } = useAppTheme();
  const recentLogs = logs.slice(0, 5);

  return (
    <View>
      <View className="flex-row items-center justify-between mt-7 px-1">
        <Text className="text-light-text dark:text-dark-text font-black text-[18px] leading-6">
          Parking History
        </Text>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={onViewAll}
          className="py-1 px-2"
        >
          <Text
            style={{ color: colors.primary }}
            className="font-heavy text-[13px]"
          >
            View all
          </Text>
        </TouchableOpacity>
      </View>

      <View className="mt-3">
        {recentLogs.length === 0 ? (
          <View className="bg-light-surface dark:bg-dark-surface rounded-2xl border border-light-border dark:border-dark-border py-8 px-4 items-center justify-center shadow-soft">
            <View className="w-16 h-16 rounded-full bg-light-surfaceMuted/50 dark:bg-dark-surfaceMuted/20 items-center justify-center mb-3.5 border border-light-border/60 dark:border-dark-border/40 shadow-sm">
              <View className="w-11 h-11 rounded-full bg-light-surface dark:bg-dark-surface items-center justify-center border border-light-border/30 dark:border-dark-border/30 shadow-soft">
                <History size={20} color="#D22730" strokeWidth={2.2} />
              </View>
            </View>
            <Text className="font-heavy text-[14px] mb-1.5 text-light-text dark:text-dark-text text-center">
              No recent parking logs
            </Text>
            <Text className="font-regular text-[12px] text-center px-4 text-light-muted dark:text-dark-muted leading-normal">
              Active entries and cycle logs will preview here.
            </Text>
          </View>
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

