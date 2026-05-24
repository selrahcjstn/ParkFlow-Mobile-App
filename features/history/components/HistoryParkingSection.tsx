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
        // 🎯 FIX 1: Synchronized padding completely to match HistoryPaymentSection (mt-4 pb-2.5 pl-1)
        <View className="mt-4 pb-2.5 pl-1 bg-light-background">
          {/* 🎯 FIX 2: Swapped out unmapped font-bold for font-heavy tracking-wide */}
          <Text className="text-light-text text-[12px] tracking-wide font-heavy">
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
              // 🎯 FIX 3: Swapped unmapped font-medium for font-heavy to keep CTA links sharp
              <Text className="text-light-primary text-[14px] font-heavy leading-5">
                Load More Logs
              </Text>
            )}
          </TouchableOpacity>
        ) : null
      }
    />
  );
}
