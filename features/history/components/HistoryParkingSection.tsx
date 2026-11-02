import { ParkingHistoryListItem } from "@/components/shared";
import { SessionListItemSkeleton } from "@/components/ui/Skeleton";
import { useTabBarHeight } from "@/hooks/useTabBarHeight";
import { useAppTheme } from "@/hooks/useAppTheme";
import { History } from "lucide-react-native";
import { useCallback, useMemo } from "react";
import {
  ActivityIndicator,
  SectionList,
  Text,
  TouchableOpacity,
  View,
  RefreshControl,
} from "react-native";
import { ParkingHistoryResponse } from "../types/history.types";
import HistoryEmptyState from "./HistoryEmptyState";

interface SectionItem {
  title: string;
  data: ParkingHistoryResponse[];
}

interface HistoryParkingSectionProps {
  sections: SectionItem[];
  isLoading?: boolean;
  hasMore: boolean;
  loadingMore: boolean;
  onLoadMore: () => void;
  onPressLog: (log: ParkingHistoryResponse) => void;
  onScrollActive?: (scrolled: boolean) => void;
  isGuardSide?: boolean;
  refreshing?: boolean;
  onRefresh?: () => void;
}

export default function HistoryParkingSection({
  sections,
  isLoading = false,
  hasMore,
  loadingMore,
  onLoadMore,
  onPressLog,
  onScrollActive,
  isGuardSide = false,
  refreshing = false,
  onRefresh,
}: HistoryParkingSectionProps) {
  const tabBarHeight = useTabBarHeight();
  const { isDark, colors } = useAppTheme();

  if (isLoading && sections.length === 0) {
    return (
      <View className="pt-4 px-1 gap-1">
        <SessionListItemSkeleton />
        <SessionListItemSkeleton />
        <SessionListItemSkeleton />
        <SessionListItemSkeleton />
        <SessionListItemSkeleton />
      </View>
    );
  }

  const keyExtractor = useCallback(
    (item: ParkingHistoryResponse) =>
      `${item.plateNumber}-${item.entryTime}-${item.exitTime || "active"}`,
    [],
  );

  const renderSectionHeader = useCallback(
    ({ section: { title } }: { section: { title: string } }) => (
      <View className="mt-6 pb-2.5 pl-1 bg-light-background dark:bg-dark-background">
        <Text className="text-light-text dark:text-dark-text text-[12px] tracking-wide font-bold">
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
        containerClassName="bg-light-surface dark:bg-dark-surface px-4 py-4 rounded-card mb-2.5 border border-light-border dark:border-dark-border"
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
    if (!hasMore) return undefined;

    return (
      <TouchableOpacity
        onPress={onLoadMore}
        activeOpacity={0.7}
        className="items-center justify-center mt-4 py-1"
      >
        {loadingMore ? (
          <ActivityIndicator size="small" color={colors.primary} />
        ) : (
          <Text className="text-light-primary text-[14px] font-bold leading-5">
            Load More Logs
          </Text>
        )}
      </TouchableOpacity>
    );
  }, [hasMore, loadingMore, onLoadMore, colors.primary]);

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
      refreshControl={
        onRefresh ? (
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
            tintColor={isDark ? "#FFFFFF" : colors.primary}
          />
        ) : undefined
      }
      ListEmptyComponent={
        <HistoryEmptyState
          icon={
            <History size={24} color={colors.primary} strokeWidth={2.2} />
          }
          title="No Logs Found"
          description="Active entries and cycle logs will list here."
        />
      }
      ListFooterComponent={listFooter}
    />
  );
}
