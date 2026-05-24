import { ParkingHistoryListItem } from "@/components/shared";
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

interface HistoryParkingSectionProps {
  sections: SectionItem[];
  hasMore: boolean;
  loadingMore: boolean;
  onLoadMore: () => void;
  onPressLog: (log: ParkingHistoryResponse) => void;
  onScrollActive?: (scrolled: boolean) => void;
  isGuardSide?: boolean;
}

export default function HistoryParkingSection({
  sections,
  hasMore,
  loadingMore,
  onLoadMore,
  onPressLog,
  onScrollActive,
  isGuardSide = false,
}: HistoryParkingSectionProps) {
  return (
    <SectionList
      sections={sections}
      keyExtractor={(_, index) => `log-${index}`}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: 16 }}
      stickySectionHeadersEnabled={false}
      onScroll={(event) => {
        const offsetY = event.nativeEvent.contentOffset.y;
        onScrollActive?.(offsetY > 5);
      }}
      scrollEventThrottle={16}
      renderSectionHeader={({ section: { title } }) => (
        <View className="mt-5 pb-3 pl-2 bg-light-background">
          <Text className="text-light-text text-[12px] tracking-wider font-bold">
            {title}
          </Text>
        </View>
      )}
      renderItem={({ item }) => (
        <ParkingHistoryListItem
          log={item}
          onPress={() => onPressLog(item)}
          containerClassName="bg-light-surface px-4 py-4 rounded-card mb-2.5"
          isGuardSide={isGuardSide}
        />
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
            className="items-center justify-center mt-4 py-1"
          >
            {loadingMore ? (
              <ActivityIndicator size="small" color="#D22730" />
            ) : (
              <Text className="text-light-primary text-[14px] font-medium leading-5">
                Load More Logs
              </Text>
            )}
          </TouchableOpacity>
        ) : null
      }
    />
  );
}
