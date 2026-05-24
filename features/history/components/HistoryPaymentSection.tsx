import { formatTime } from "@/utils/formatTime";
import { CreditCard } from "lucide-react-native";
import { useMemo } from "react";
import { SectionList, Text, TouchableOpacity, View } from "react-native";
import { PaymentRecord } from "../types/payment.types";
import HistoryEmptyState from "./HistoryEmptyState";

interface PaymentCardProps {
  payment: PaymentRecord;
  onPress: () => void;
}

function PaymentCard({ payment, onPress }: PaymentCardProps) {
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
      className="bg-light-surface px-4 py-4 rounded-card mb-2.5"
    >
      {/* Top Row: Title & Amount */}
      <View className="flex-row items-center justify-between mb-1.5">
        {/* 🎯 FIX 1: Set card title to font-heavy and a cleaner text-[14px] standard size */}
        <Text className="text-[14px] font-heavy tracking-wide text-light-text">
          Violation Payment
        </Text>
        {/* 🎯 FIX 2: Set primary financial metric amount to font-black for top priority */}
        <Text className="text-[15px] font-black tracking-tight text-light-text">
          ₱{payment.amount.toFixed(2)}
        </Text>
      </View>

      {/* Bottom Row: Time & Status Badge */}
      <View className="flex-row items-center justify-between">
        {/* Supporting Metadata stays font-regular */}
        <Text className="text-[12px] font-regular text-light-muted">
          {payTime}
        </Text>
        <View className={`${statusBg} px-2 py-0.5 rounded-pill`}>
          {/* 🎯 FIX 3: Set status badge layout text to font-heavy */}
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
}

interface HistoryPaymentSectionProps {
  payments: PaymentRecord[];
  onPressPayment: (payment: PaymentRecord) => void;
  onScrollActive?: (scrolled: boolean) => void;
}

export default function HistoryPaymentSection({
  payments,
  onPressPayment,
  onScrollActive,
}: HistoryPaymentSectionProps) {
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

  return (
    <SectionList
      sections={sections}
      keyExtractor={(item) => item.id}
      showsVerticalScrollIndicator={false}
      className="flex-1 pb-6"
      stickySectionHeadersEnabled={false}
      onScroll={(event) => {
        const offsetY = event.nativeEvent.contentOffset.y;
        onScrollActive?.(offsetY > 5);
      }}
      scrollEventThrottle={16}
      renderSectionHeader={({ section: { title } }) => (
        <View className="mt-4 pb-2.5 pl-1 bg-light-background">
          {/* 🎯 FIX 4: Set sticky date segment group headers to font-heavy */}
          <Text className="text-light-text text-[12px] tracking-wide font-heavy">
            {title}
          </Text>
        </View>
      )}
      renderItem={({ item }) => (
        <PaymentCard payment={item} onPress={() => onPressPayment(item)} />
      )}
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
