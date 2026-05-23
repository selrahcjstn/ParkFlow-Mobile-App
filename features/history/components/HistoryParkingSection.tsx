import { formatTime } from "@/utils/formatTime";
import { Receipt } from "lucide-react-native";
import {
    ActivityIndicator,
    SectionList,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { ParkingHistoryResponse } from "../types/history.types";
import HistoryEmptyState from "./HistoryEmptyState";

interface SectionItem {
  title: string;
  data: ParkingHistoryResponse[];
}

interface ParkingLogCardProps {
  log: ParkingHistoryResponse;
  onPress: () => void;
}

function ParkingLogCard({ log, onPress }: ParkingLogCardProps) {
  const entryTime = log.entryTime ? formatTime(log.entryTime) : "N/A";
  const exitTime = log.exitTime ? formatTime(log.exitTime) : "";
  const title = log.plateNumber || "N/A";
  const durationText = log.exitTime
    ? `${log.parkingDuration.toFixed(1)} ${log.parkingDuration === 1 ? "hr" : "hrs"}`
    : "Active";

  return (
    <TouchableOpacity
      activeOpacity={0.6}
      onPress={onPress}
      className="flex-row items-center justify-between py-4 px-4 bg-light-surface"
    >
      <View className="flex-1 pr-4 ">
        <View className="flex-row items-center gap-2">
          <Text className="text-light-text font-black text-[16px] tracking-wide">
            {title}
          </Text>
          {log.hasViolation && (
            <View className="bg-light-danger/10 px-2 py-0.5 rounded">
              <Text className="text-light-danger font-heavy text-[10px] uppercase tracking-wide">
                Violation
              </Text>
            </View>
          )}
        </View>
        <View className="flex-row items-center gap-2 mt-1">
          <Text className="text-light-muted font-book text-[13px]">
            {log.brand || "Generic"}
          </Text>
        </View>
      </View>

      <View className="items-end">
        <Text
          className={`font-black text-[14px] ${log.exitTime ? "text-light-text" : "text-light-primary"}`}
        >
          {durationText}
        </Text>
        <Text className="text-light-muted font-book text-[12px] mt-1">
          {exitTime || log.roleName || "Guest"}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

interface HistoryParkingSectionProps {
  sections: SectionItem[];
  hasMore: boolean;
  loadingMore: boolean;
  onLoadMore: () => void;
  onPressLog: (log: ParkingHistoryResponse) => void;
}

export default function HistoryParkingSection({
  sections,
  hasMore,
  loadingMore,
  onLoadMore,
  onPressLog,
}: HistoryParkingSectionProps) {
  return (
    <SectionList
      sections={sections}
      keyExtractor={(_, index) => `log-${index}`}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: 24 }}
      renderSectionHeader={({ section: { title } }) => (
        <View className="py-2 mt-4">
          <Text className="text-light-primary font-black text-[12px] uppercase tracking-wider">
            {title}
          </Text>
        </View>
      )}
      renderItem={({ item }) => (
        <ParkingLogCard log={item} onPress={() => onPressLog(item)} />
      )}
      ItemSeparatorComponent={() => (
        <View className="border-b border-light-border/40" />
      )}
      ListEmptyComponent={
        <HistoryEmptyState
          icon={
            <Receipt size={24} className="text-light-muted" strokeWidth={2} />
          }
          title="No Logs Found"
          description="Active entries and cycle logs will list here."
        />
      }
      ListFooterComponent={
        hasMore ? (
          <TouchableOpacity
            onPress={onLoadMore}
            activeOpacity={0.7}
            className="items-center justify-center mt-6 py-2"
          >
            {loadingMore ? (
              <ActivityIndicator size="small" color="#D22730" />
            ) : (
              <Text className="text-light-primary font-heavy text-[14px]">
                Load More Logs
              </Text>
            )}
          </TouchableOpacity>
        ) : null
      }
    />
  );
}
