import { formatDate } from "@/utils/formatDate";
import { formatTime } from "@/utils/formatTime";
import { useSegments } from "expo-router";
import { CreditCard, X } from "lucide-react-native";
import { Modal, Pressable, Text, TouchableOpacity, View } from "react-native";
import { ParkingHistoryResponse } from "../types/history.types";
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

interface ParkingLogDetailModalProps {
  visible: boolean;
  onClose: () => void;
  log: ParkingHistoryResponse | null;
}

export function ParkingLogDetailModal({
  visible,
  onClose,
  log,
}: ParkingLogDetailModalProps) {
  const segments = useSegments() as string[];
  const isGuardSide = segments.includes("(guard)");

  if (!log) return null;

  const entryTime = log.entryTime ? formatTime(log.entryTime) : "N/A";
  const entryDate = log.entryTime ? formatDate(log.entryTime) : "N/A";
  const exitTime = log.exitTime ? formatTime(log.exitTime) : "—";
  const exitDate = log.exitTime ? formatDate(log.exitTime) : "";
  const plateNumber = log.plateNumber || "N/A";
  const fullName =
    `${log.firstName ?? ""} ${log.lastName ?? ""}`.trim() || "N/A";

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
              Parking Session
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
              Plate Number
            </Text>
            <Text className="text-light-text text-[26px] font-black tracking-wide text-center">
              {plateNumber}
            </Text>
          </View>

          <View className="mb-6">
            <Text className="text-light-text font-black text-[14px] mb-1">
              Session Details
            </Text>
            <View className="px-1">
              {isGuardSide && (
                <>
                  <InfoRow label="Name" value={fullName} />
                  <InfoRow label="Role" value={log.roleName || "N/A"} />
                </>
              )}
              <InfoRow label="Vehicle" value={`${log.brand} (${log.type})`} />
              <InfoRow label="Entry" value={`${entryTime} · ${entryDate}`} />
              <InfoRow
                label="Exit"
                value={`${exitTime} ${exitDate ? `· ${exitDate}` : ""}`}
              />
              <InfoRow
                label="Duration"
                value={`${log.parkingDuration.toFixed(1)} ${log.parkingDuration === 1 ? "hour" : "hours"}`}
              />
              <InfoRow
                label="Violation"
                value={log.hasViolation ? "Yes" : "No"}
                isLast
              />
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
