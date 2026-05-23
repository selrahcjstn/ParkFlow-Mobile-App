import { formatTime } from "@/utils/formatTime";
import { CreditCard } from "lucide-react-native";
import { FlatList, Text, TouchableOpacity, View } from "react-native";
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
      className="flex-row items-center justify-between py-4 px-0"
    >
      <View className="flex-1 pr-4">
        <View className="flex-row items-center gap-2">
          <Text className="text-light-text font-black text-[16px] tracking-wide">
            {payment.plateNumber}
          </Text>
          <View className={`${statusBg} px-2 py-0.5 rounded`}>
            <Text
              className={`${statusColor} font-heavy text-[10px] uppercase tracking-wide`}
            >
              {payment.status}
            </Text>
          </View>
        </View>
        <View className="flex-row items-center gap-2 mt-1">
          <Text className="text-light-text font-heavy text-[13px]">
            {payment.name}
          </Text>
          <View className="w-[3px] h-[3px] rounded-full bg-light-muted/30" />
          <Text className="text-light-muted font-book text-[13px]">
            {payTime}
          </Text>
        </View>
      </View>

      <View className="items-end">
        <Text className="text-light-text font-black text-[16px] tracking-tight">
          ₱{payment.amount.toFixed(2)}
        </Text>
        <Text className="text-light-muted font-book text-[11px] mt-1">
          TRX #{payment.id}
        </Text>
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
  return (
    <FlatList
      data={payments}
      keyExtractor={(item) => item.id}
      showsVerticalScrollIndicator={false}
      className="flex-1 pb-6"
      onScroll={(event) => {
        const offsetY = event.nativeEvent.contentOffset.y;
        onScrollActive?.(offsetY > 5);
      }}
      scrollEventThrottle={16}
      ItemSeparatorComponent={() => (
        <View style={{ borderBottomWidth: 1, borderBottomColor: "rgba(228, 228, 231, 0.4)" }} />
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

