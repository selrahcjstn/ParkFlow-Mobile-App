import { ParkingHistoryListItem } from "@/components/shared";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { History } from "lucide-react-native";
import { useCallback, useMemo } from "react";
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
  let tabBarHeight = 0;
  try {
    tabBarHeight = useBottomTabBarHeight();
  } catch {
    tabBarHeight = 0;
  }

  const keyExtractor = useCallback(
    (item: ParkingHistoryResponse) =>
      `${item.plateNumber}-${item.entryTime}-${item.exitTime || "active"}`,
    [],
  );

  const renderSectionHeader = useCallback(
    ({ section: { title } }: { section: { title: string } }) => (
      <View className="mt-6 pb-2.5 pl-1 bg-light-background">
        <Text className="text-light-text text-[12px] tracking-wide font-heavy">
          {title}
        </Text>
      </View>
    ),
    [],
  );

  const renderItem = useCallback(
    ({ item }: { item: ParkingHistoryResponse }) => (
      <ParkingHistoryListItem
        log={item}
        onPress={() => onPressLog(item)}
        containerClassName="bg-light-surface px-4 py-4 rounded-card mb-2.5 border border-light-border"
        isGuardSide={isGuardSide}
      />
    ),
    [isGuardSide, onPressLog],
  );

  const handleScroll = useCallback(
    (event: { nativeEvent: { contentOffset: { y: number } } }) => {
      onScrollActive?.(event.nativeEvent.contentOffset.y > 5);
    },
    [onScrollActive],
  );

  const listFooter = useMemo(() => {
    if (!hasMore) return null;

    return (
      <TouchableOpacity
        onPress={onLoadMore}
        activeOpacity={0.7}
        className="items-center justify-center mt-4 py-1"
      >
        {loadingMore ? (
          <ActivityIndicator size="small" color="#D22730" />
        ) : (
          <Text className="text-light-primary text-[14px] font-heavy leading-5">
            Load More Logs
          </Text>
        )}
      </TouchableOpacity>
    );
  }, [hasMore, loadingMore, onLoadMore]);

  return (
    <SectionList
      sections={sections}
      keyExtractor={keyExtractor}
      showsVerticalScrollIndicator={false}
      initialNumToRender={12}
      maxToRenderPerBatch={12}
      windowSize={7}
      removeClippedSubviews
      contentContainerStyle={{
        paddingBottom: isGuardSide ? tabBarHeight + 40 : 16,
      }}
      stickySectionHeadersEnabled={false}
      onScroll={handleScroll}
      scrollEventThrottle={16}
      renderSectionHeader={renderSectionHeader}
      renderItem={renderItem}
      ListEmptyComponent={
        <HistoryEmptyState
          icon={
            <History size={24} color="#D22730" strokeWidth={2.2} />
          }
          title="No Logs Found"
          description="Active entries and cycle logs will list here."
        />
      }
      ListFooterComponent={listFooter}
    />
  );
}
