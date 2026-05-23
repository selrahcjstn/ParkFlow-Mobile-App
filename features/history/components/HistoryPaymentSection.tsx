import { Caption, Label } from "@/components/ui/Typography";
import { formatTime } from "@/utils/formatTime";
import { CreditCard } from "lucide-react-native";
import { useMemo } from "react";
import { SectionList, TouchableOpacity, View } from "react-native";
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
      ? "bg-light-success/10"
      : payment.status === "Pending"
        ? "bg-light-warning/10"
        : "bg-light-surfaceSoft";

  return (
    <TouchableOpacity
      activeOpacity={0.6}
      onPress={onPress}
      className="py-4 px-0"
    >
      {/* Top Row: Title & Amount */}
      <View className="flex-row items-center justify-between mb-1.5">
        <Label className="text-[16px] font-heavy tracking-wide text-light-text">
          Violation Payment
        </Label>
        <Label className="text-[16px] font-heavy tracking-tight text-light-text">
          ₱{payment.amount.toFixed(2)}
        </Label>
      </View>

      {/* Bottom Row: Time & Status Badge */}
      <View className="flex-row items-center justify-between">
        <Caption className="text-[12.5px] font-book text-light-muted">
          {payTime}
        </Caption>
        <View className={`${statusBg} px-1.5 py-[1px] rounded-full`}>
          <Label
            className={`${statusColor} text-[8px] font-heavy uppercase tracking-wide`}
          >
            {payment.status === "Paid" ? "Settled" : payment.status}
          </Label>
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
        <View className="mt-4 pb-1 bg-light-background">
          <Label className="text-light-primary text-[12px] tracking-wider">
            {title}
          </Label>
        </View>
      )}
      renderItem={({ item }) => (
        <PaymentCard payment={item} onPress={() => onPressPayment(item)} />
      )}
      ItemSeparatorComponent={() => (
        <View style={{ borderBottomWidth: 1, borderBottomColor: "rgba(228, 228, 231, 0.4)" }} />
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
