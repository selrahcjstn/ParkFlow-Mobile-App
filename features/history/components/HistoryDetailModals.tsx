import { formatDate } from "@/utils/formatDate";
import { formatTime } from "@/utils/formatTime";
import { CreditCard, X } from "lucide-react-native";
import { Modal, Pressable, Text, TouchableOpacity, View } from "react-native";
import { PaymentRecord } from "../types/payment.types";

function InfoRow({
  label,
  value,
  isLast,
}: {
  label: string;
  value: string;
  isLast?: boolean;
}) {
  return (
    <View
      className={`flex-row justify-between items-center py-3.5 ${!isLast ? "border-b border-light-border" : ""}`}
    >
      <Text className="font-book text-light-muted text-[13px]">{label}</Text>
      <Text className="text-light-text font-heavy text-[13px]">{value}</Text>
    </View>
  );
}

interface PaymentDetailModalProps {
  visible: boolean;
  onClose: () => void;
  payment: PaymentRecord | null;
}

export function PaymentDetailModal({
  visible,
  onClose,
  payment,
}: PaymentDetailModalProps) {
  if (!payment) return null;

  const payDate = payment.date ? formatDate(payment.date) : "N/A";
  const payTime = payment.date ? formatTime(payment.date) : "N/A";

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <Pressable
        className="flex-1 bg-black/60 items-center justify-center px-5"
        onPress={onClose}
      >
        <Pressable className="w-full bg-light-surface rounded-3xl overflow-hidden p-6">
          <View className="flex-row items-center justify-between mb-6">
            <Text className="text-light-text font-black text-[18px]">
              Payment Breakdown
            </Text>
            <TouchableOpacity
              onPress={onClose}
              className="w-8 h-8 rounded-full bg-light-background items-center justify-center"
            >
              <X size={16} className="text-light-muted" strokeWidth={2.5} />
            </TouchableOpacity>
          </View>

          <View className="w-full bg-light-surfaceSoft rounded-2xl py-5 items-center mb-6">
            <Text className="font-heavy text-light-muted uppercase tracking-widest text-[10px] mb-1">
              Total Amount
            </Text>
            <Text className="text-light-text text-[28px] font-black tracking-tight">
              ₱{payment.amount.toFixed(2)}
            </Text>
            <View
              className={`mt-2 px-2.5 py-0.5 rounded ${
                payment.status === "Paid"
                  ? "bg-light-success/10"
                  : payment.status === "Pending"
                    ? "bg-light-warning/10"
                    : "bg-light-background"
              }`}
            >
              <Text
                className={`font-heavy text-[10px] uppercase tracking-wide ${
                  payment.status === "Paid"
                    ? "text-light-success"
                    : payment.status === "Pending"
                      ? "text-light-warning"
                      : "text-light-muted"
                }`}
              >
                {payment.status}
              </Text>
            </View>
          </View>

          <View className="mb-6">
            <View className="flex-row items-center gap-1.5 mb-2 px-1">
              <CreditCard
                size={14}
                className="text-light-muted"
                strokeWidth={2.5}
              />
              <Text className="font-heavy text-light-text uppercase tracking-wider text-[11px]">
                Transaction Info
              </Text>
            </View>
            <View className="px-1">
              <InfoRow label="Plate Number" value={payment.plateNumber} />
              <InfoRow label="Account Name" value={payment.name} />
              <InfoRow label="Billing Date" value={payDate} />
              <InfoRow label="Timestamp" value={payTime} isLast />
            </View>
          </View>

          <TouchableOpacity
            onPress={onClose}
            activeOpacity={0.85}
            className="bg-light-primary rounded-2xl py-3.5 items-center w-full"
          >
            <Text className="text-white font-heavy text-[14px]">Close</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
