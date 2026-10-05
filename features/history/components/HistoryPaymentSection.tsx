import { formatTime } from "@/utils/formatTime";
import { SessionListItemSkeleton } from "@/components/ui/Skeleton";
import { useTabBarHeight } from "@/hooks/useTabBarHeight";
import { useAppTheme } from "@/hooks/useAppTheme";
import { CreditCard } from "lucide-react-native";
import { memo, useCallback, useMemo } from "react";
import { SectionList, Text, TouchableOpacity, View, ActivityIndicator, RefreshControl } from "react-native";
import { PaymentRecord } from "../types/payment.types";
import HistoryEmptyState from "./HistoryEmptyState";

interface PaymentCardProps {
  payment: PaymentRecord;
  onPress: () => void;
}

const PaymentCard = memo(function PaymentCard({
  payment,
  onPress,
}: PaymentCardProps) {
  const payTime = payment.date ? formatTime(payment.date) : "N/A";

  const statusColor =
    payment.status === "Paid"
      ? "text-light-success dark:text-dark-success"
      : payment.status === "Pending"
        ? "text-light-warning dark:text-dark-warning"
        : "text-light-muted dark:text-dark-muted";

  const statusBg =
    payment.status === "Paid"
      ? "bg-light-success/20 dark:bg-dark-success/15"
      : payment.status === "Pending"
        ? "bg-light-warning/20 dark:bg-dark-warning/15"
        : "bg-light-surfaceMuted dark:bg-dark-surfaceMuted";

  return (
    <TouchableOpacity
      activeOpacity={0.6}
      onPress={onPress}
      className="bg-light-surface dark:bg-dark-surface px-4 py-4 rounded-card mb-2.5 border border-light-border dark:border-dark-border"
    >
      <View className="flex-row items-center justify-between mb-1.5">
        <Text className="text-[15px] font-bold tracking-wide text-light-text dark:text-dark-text">
          Violation Payment
        </Text>
        <Text className="text-[15px] font-bold tracking-tight text-light-text dark:text-dark-text">
          ₱{payment.amount.toFixed(2)}
        </Text>
      </View>

      <View className="flex-row items-center justify-between">
        <Text className="text-[12px] font-regular text-light-muted dark:text-dark-muted">
          {payTime}
        </Text>
        <View className={`${statusBg} px-2 py-0.5 rounded-pill`}>
          <Text className={`${statusColor} text-[10px] font-bold leading-4`}>
            {(payment.status === "Paid"
              ? "settled"
              : payment.status
            ).toLowerCase()}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
});

interface HistoryPaymentSectionProps {
  payments: PaymentRecord[];
  isLoading?: boolean;
  onPressPayment: (payment: PaymentRecord) => void;
  onScrollActive?: (scrolled: boolean) => void;
  isGuardSide?: boolean;
  onLoadMore?: () => void;
  hasMore?: boolean;
  loadingMore?: boolean;
  refreshing?: boolean;
  onRefresh?: () => void;
}

export default function HistoryPaymentSection({
  payments,
  isLoading = false,
  onPressPayment,
  onScrollActive,
  isGuardSide = false,
  onLoadMore,
  hasMore = false,
  loadingMore = false,
  refreshing = false,
  onRefresh,
}: HistoryPaymentSectionProps) {
  const tabBarHeight = useTabBarHeight();
  const { isDark } = useAppTheme();

  if (isLoading && payments.length === 0) {
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

  const sections = useMemo(() => {
    const sectionMap = new Map<string, PaymentRecord[]>();

    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    const todayStr = today.toDateString();
    const yesterdayStr = yesterday.toDateString();

    payments.forEach((payment) => {
      if (!payment.date) return;

      const date = new Date(payment.date);
      const dateStr = date.toDateString();

      let title = "";
      if (dateStr === todayStr) {
        title = "Today";
      } else if (dateStr === yesterdayStr) {
        title = "Yesterday";
      } else {
        title = date.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        });
      }

      if (!sectionMap.has(title)) {
        sectionMap.set(title, []);
      }
      sectionMap.get(title)!.push(payment);
    });

    return Array.from(sectionMap.entries()).map(([title, data]) => ({
      title,
      data,
    }));
  }, [payments]);

  const keyExtractor = useCallback((item: PaymentRecord) => item.id, []);

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
    ({ item }: { item: PaymentRecord }) => (
      <PaymentCard payment={item} onPress={() => onPressPayment(item)} />
    ),
    [onPressPayment],
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
          <ActivityIndicator size="small" color="#7B1113" />
        ) : (
          <Text className="text-light-primary text-[14px] font-bold leading-5">
            Load More Transactions
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
      className="flex-1"
      initialNumToRender={12}
      maxToRenderPerBatch={12}
      windowSize={7}
      removeClippedSubviews
      contentContainerStyle={{
        paddingBottom: isGuardSide ? tabBarHeight + 40 : 24,
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
            colors={["#7B1113"]}
            tintColor={isDark ? "#FFFFFF" : "#7B1113"}
          />
        ) : undefined
      }
      ListFooterComponent={listFooter}
      ListEmptyComponent={
        <HistoryEmptyState
          icon={
            <CreditCard
              size={24}
              color="#7B1113"
              strokeWidth={2.2}
            />
          }
          title="No Financial Records"
          description="Processed transaction histories will render here."
        />
      }
    />
  );
}
