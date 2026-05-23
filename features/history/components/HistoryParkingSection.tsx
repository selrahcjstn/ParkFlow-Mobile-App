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
        <View className="mt-4 pb-1 bg-light-background">
          <Text className="text-light-primary font-black text-[12px] uppercase tracking-wider">
            {title}
          </Text>
        </View>
      )}
      renderItem={({ item }) => (
        <ParkingHistoryListItem
          log={item}
          onPress={() => onPressLog(item)}
          containerClassName="bg-transparent px-0 py-3.5"
          isGuardSide={isGuardSide}
        />
      )}
      ItemSeparatorComponent={() => (
        <View
          style={{
            borderBottomWidth: 1,
            borderBottomColor: "rgba(228, 228, 231, 0.4)",
          }}
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
