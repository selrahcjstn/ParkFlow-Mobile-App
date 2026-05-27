import { formatTime } from "@/utils/formatTime";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { CreditCard } from "lucide-react-native";
import { memo, useCallback, useMemo } from "react";
import { SectionList, Text, TouchableOpacity, View } from "react-native";
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
      ? "text-light-success"
      : payment.status === "Pending"
        ? "text-light-warning"
        : "text-light-muted";

  const statusBg =
    payment.status === "Paid"
      ? "bg-light-success/20"
      : payment.status === "Pending"
        ? "bg-light-warning/20"
        : "bg-light-surfaceSoft";

  return (
    <TouchableOpacity
      activeOpacity={0.6}
      onPress={onPress}
      className="bg-light-surface px-4 py-4 rounded-card mb-2.5 border border-light-border"
    >
      <View className="flex-row items-center justify-between mb-1.5">
        <Text className="text-[15px] font-heavy tracking-wide text-light-text">
          Violation Payment
        </Text>
        <Text className="text-[15px] font-black tracking-tight text-light-text">
          ₱{payment.amount.toFixed(2)}
        </Text>
      </View>

      <View className="flex-row items-center justify-between">
        <Text className="text-[12px] font-regular text-light-muted">
          {payTime}
        </Text>
        <View className={`${statusBg} px-2 py-0.5 rounded-pill`}>
          <Text className={`${statusColor} text-[10px] font-heavy leading-4`}>
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
  onPressPayment: (payment: PaymentRecord) => void;
  onScrollActive?: (scrolled: boolean) => void;
  isGuardSide?: boolean;
}

export default function HistoryPaymentSection({
  payments,
  onPressPayment,
  onScrollActive,
  isGuardSide = false,
}: HistoryPaymentSectionProps) {
  const tabBarHeight = useBottomTabBarHeight();

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
      <View className="mt-6 pb-2.5 pl-1 bg-light-background">
        <Text className="text-light-text text-[12px] tracking-wide font-heavy">
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
      ListEmptyComponent={
        <HistoryEmptyState
          icon={
            <CreditCard
              size={24}
              className="text-light-muted"
              strokeWidth={2}
            />
          }
          title="No Financial Records"
          description="Processed transaction histories will render here."
        />
      }
    />
  );
}
