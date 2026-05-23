import { useHistoryStore } from "@/features/history/store/history.store";
import { ParkingHistoryResponse } from "@/features/history/types/history.types";
import { formatDate } from "@/utils/formatDate";
import { formatTime } from "@/utils/formatTime";
import { useSegments } from "expo-router";
import { CreditCard, Receipt, X } from "lucide-react-native";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  SectionList,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// ── Tab type ──
type HistoryTab = "parking" | "payment";

// ── Payment record type ──
export type PaymentRecord = {
  id: string;
  plateNumber: string;
  name: string;
  amount: number;
  date: string;
  status: "Paid" | "Pending" | "Waived";
};

// ── Mock payments for compatibility ──
const MOCK_PAYMENTS: PaymentRecord[] = [
  {
    id: "1",
    plateNumber: "ABC-1234",
    name: "Juan Dela Cruz",
    amount: 50,
    date: "2026-05-21T14:30:00Z",
    status: "Paid",
  },
  {
    id: "2",
    plateNumber: "NQR-6680",
    name: "Ana Garcia",
    amount: 30,
    date: "2026-05-20T16:45:00Z",
    status: "Paid",
  },
  {
    id: "3",
    plateNumber: "TRM-2307",
    name: "Carlos Mendoza",
    amount: 75,
    date: "2026-05-19T15:00:00Z",
    status: "Pending",
  },
  {
    id: "4",
    plateNumber: "PLD-7719",
    name: "Sofia Ramos",
    amount: 0,
    date: "2026-05-18T11:20:00Z",
    status: "Waived",
  },
];

// ── Helpers ──
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

// ── High-Density Borderless Parking Log Row ──
export function ParkingLogCard({
  log,
  onPress,
}: {
  log: ParkingHistoryResponse;
  onPress: () => void;
}) {
  const entryTime = log.entryTime ? formatTime(log.entryTime) : "N/A";
  const exitTime = log.exitTime ? formatTime(log.exitTime) : "";
  const title = log.plateNumber || "N/A";
  const durationText = log.exitTime
    ? `${log.parkingDuration.toFixed(1)} ${log.parkingDuration === 1 ? "hr" : "hrs"}`
    : "Active";

  return (
    <TouchableOpacity
      activeOpacity={0.6}
      onPress={onPress}
      className="flex-row items-center justify-between py-4 px-1"
    >
      {/* Identification & Muted Brand Details */}
      <View className="flex-1 pr-4">
        <View className="flex-row items-center gap-2">
          <Text className="text-light-text font-black text-[16px] tracking-wide">
            {title}
          </Text>
          {log.hasViolation && (
            <View className="bg-light-danger/10 px-2 py-0.5 rounded">
              <Text className="text-light-danger font-heavy text-[10px] uppercase tracking-wide">
                Violation
              </Text>
            </View>
          )}
        </View>
        <View className="flex-row items-center gap-2 mt-1">
          <Text className="text-light-muted font-book text-[13px]">
            {log.brand || "Generic"}
          </Text>
        </View>
      </View>

      {/* Real-time Clean Operational Timestamps */}
      <View className="items-end">
        <Text
          className={`font-black text-[14px] ${log.exitTime ? "text-light-text" : "text-light-primary"}`}
        >
          {durationText}
        </Text>
        <Text className="text-light-muted font-book text-[12px] mt-1">
          {exitTime || log.roleName || "Guest"}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

// ── High-Density Borderless Payment Row ──
function PaymentCard({
  payment,
  onPress,
}: {
  payment: PaymentRecord;
  onPress: () => void;
}) {
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
      className="flex-row items-center justify-between py-4 px-1"
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

// ── Parking Log Detail Modal ──
export function ParkingLogDetailModal({
  visible,
  onClose,
  log,
}: {
  visible: boolean;
  onClose: () => void;
  log: ParkingHistoryResponse | null;
}) {
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

// ── Payment Detail Modal ──
function PaymentDetailModal({
  visible,
  onClose,
  payment,
}: {
  visible: boolean;
  onClose: () => void;
  payment: PaymentRecord | null;
}) {
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

// ══════════════════════════════════════════════
// ── Main Screen Container Layer ──
// ══════════════════════════════════════════════
export default function HistoryScreen() {
  const [activeTab, setActiveTab] = useState<HistoryTab>("parking");
  const [selectedLog, setSelectedLog] = useState<ParkingHistoryResponse | null>(
    null,
  );
  const [selectedPayment, setSelectedPayment] = useState<PaymentRecord | null>(
    null,
  );
  const [logModalVisible, setLogModalVisible] = useState(false);
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);

  const {
    parkingHistory,
    loading,
    loadingMore,
    getParkingHistory,
    hasMore,
    loadMoreParkingHistory,
  } = useHistoryStore();

  useEffect(() => {
    void getParkingHistory(true);
  }, [getParkingHistory]);

  const handleLogPress = useCallback((log: ParkingHistoryResponse) => {
    setSelectedLog(log);
    setLogModalVisible(true);
  }, []);

  const handlePaymentPress = useCallback((payment: PaymentRecord) => {
    setSelectedPayment(payment);
    setPaymentModalVisible(true);
  }, []);

  const sections = useMemo(() => {
    const sectionMap = new Map<string, ParkingHistoryResponse[]>();

    parkingHistory.forEach((log) => {
      if (!log.entryTime) return;

      const date = new Date(log.entryTime);
      const today = new Date();
      const yesterday = new Date();
      yesterday.setDate(today.getDate() - 1);

      let title = "";
      if (date.toDateString() === today.toDateString()) {
        title = "Today";
      } else if (date.toDateString() === yesterday.toDateString()) {
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
      sectionMap.get(title)!.push(log);
    });

    return Array.from(sectionMap.entries()).map(([title, data]) => ({
      title,
      data,
    }));
  }, [parkingHistory]);

  return (
    <SafeAreaView className="flex-1 bg-light-surface" edges={["top"]}>
      <View className="flex-1 px-4 pt-4">
        {/* Header Configuration */}
        <View className="mb-6">
          <Text className="text-light-text text-[26px] font-black tracking-tight">
            History
          </Text>
          <Text className="text-light-muted font-book text-[14px] mt-0.5">
            Monitor records and system transactions
          </Text>
        </View>

        {/* Underline Segment Control Panel */}
        <View className="flex-row mb-4 border-b border-light-border">
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setActiveTab("parking")}
            className={`pb-3 mr-6 items-center border-b-2 ${
              activeTab === "parking"
                ? "border-light-primary"
                : "border-transparent"
            }`}
          >
            <Text
              className={`font-heavy text-[14px] ${
                activeTab === "parking" ? "text-light-text" : "text-light-muted"
              }`}
            >
              Parking Log
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setActiveTab("payment")}
            className={`pb-3 items-center border-b-2 ${
              activeTab === "payment"
                ? "border-light-primary"
                : "border-transparent"
            }`}
          >
            <Text
              className={`font-heavy text-[14px] ${
                activeTab === "payment" ? "text-light-text" : "text-light-muted"
              }`}
            >
              Payment History
            </Text>
          </TouchableOpacity>
        </View>

        {/* Core Rendering Sheet Container */}
        {activeTab === "parking" ? (
          <SectionList
            sections={sections}
            keyExtractor={(_, index) => `log-${index}`}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 24 }}
            renderSectionHeader={({ section: { title } }) => (
              <View className="py-2 mt-4 bg-light-surface">
                <Text className="text-light-primary font-black text-[12px] uppercase tracking-wider">
                  {title}
                </Text>
              </View>
            )}
            renderItem={({ item }) => (
              <ParkingLogCard log={item} onPress={() => handleLogPress(item)} />
            )}
            ItemSeparatorComponent={() => (
              <View className="border-b border-light-border/40" />
            )}
            ListEmptyComponent={
              <View className="flex-1 items-center justify-center py-24">
                <View className="w-14 h-14 rounded-full bg-light-surfaceSoft items-center justify-center mb-4">
                  <Receipt
                    size={24}
                    className="text-light-muted"
                    strokeWidth={2}
                  />
                </View>
                <Text className="text-light-text font-heavy text-[15px] mb-1">
                  No Logs Found
                </Text>
                <Text className="text-light-muted font-book text-[13px] text-center px-8">
                  Active entries and cycle logs will list here.
                </Text>
              </View>
            }
            ListFooterComponent={
              hasMore ? (
                <TouchableOpacity
                  onPress={loadMoreParkingHistory}
                  activeOpacity={0.7}
                  className="items-center justify-center mt-6 py-2"
                >
                  {loadingMore ? (
                    <ActivityIndicator size="small" color="#D22730" />
                  ) : (
                    <Text className="text-light-primary font-heavy text-[14px]">
                      Load More Logs
                    </Text>
                  )}
                </TouchableOpacity>
              ) : null
            }
          />
        ) : (
          <FlatList
            data={MOCK_PAYMENTS}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 24 }}
            ItemSeparatorComponent={() => (
              <View className="border-b border-light-border/40" />
            )}
            renderItem={({ item }) => (
              <PaymentCard
                payment={item}
                onPress={() => handlePaymentPress(item)}
              />
            )}
            ListEmptyComponent={
              <View className="flex-1 items-center justify-center py-24">
                <View className="w-14 h-14 rounded-full bg-light-surfaceSoft items-center justify-center mb-4">
                  <CreditCard
                    size={24}
                    className="text-light-muted"
                    strokeWidth={2}
                  />
                </View>
                <Text className="text-light-text font-heavy text-[15px] mb-1">
                  No Financial Records
                </Text>
                <Text className="text-light-muted font-book text-[13px] text-center px-8">
                  Processed transaction histories will render here.
                </Text>
              </View>
            }
          />
        )}
      </View>

      {/* Interstitial Modal Display Target Context States */}
      <ParkingLogDetailModal
        visible={logModalVisible}
        onClose={() => {
          setLogModalVisible(false);
          setSelectedLog(null);
        }}
        log={selectedLog}
      />
      <PaymentDetailModal
        visible={paymentModalVisible}
        onClose={() => {
          setPaymentModalVisible(false);
          setSelectedPayment(null);
        }}
        payment={selectedPayment}
      />
    </SafeAreaView>
  );
}
