import { Body, Caption, Title } from "@/components/ui/Typography";
import { useHistoryStore } from "@/features/history/store/history.store";
import { ParkingHistoryResponse } from "@/features/history/types/history.types";
import { formatDate } from "@/utils/formatDate";
import { formatTime } from "@/utils/formatTime";
import {
  ChevronRight,
  CreditCard,
  Receipt,
  X,
} from "lucide-react-native";
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
import { useSegments } from "expo-router";

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
function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row justify-between items-center py-2.5">
      <Caption className="font-book text-[13px]">{label}</Caption>
      <Body className="text-light-text font-heavy text-[13px]">{value}</Body>
    </View>
  );
}

// ── Parking Log Card ──
export function ParkingLogCard({
  log,
  onPress,
}: {
  log: ParkingHistoryResponse;
  onPress: () => void;
}) {
  const entryTime = log.entryTime ? formatTime(log.entryTime) : "N/A";
  const entryDate = log.entryTime ? formatDate(log.entryTime) : "";
  const title = log.plateNumber || "N/A";

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      className="bg-light-surface rounded-2xl px-4 py-4"
    >
      <View className="flex-row items-center justify-between">
        <View className="flex-1 pr-3">
          <View className="flex-row items-center gap-2.5">
            <Body className="text-light-text font-black text-[14px]">
              {title}
            </Body>
            {log.hasViolation && (
              <View className="bg-light-danger/10 px-2 py-0.5 rounded-full">
                <Text
                  style={{
                    fontFamily: "AvenirHeavy",
                    fontSize: 9,
                    color: "#EF4444",
                  }}
                >
                  Violation
                </Text>
              </View>
            )}
          </View>
          <View className="flex-row items-center gap-2.5 mt-1.5">
            <Caption className="text-light-muted font-book text-[12px]">
              {entryTime}
            </Caption>
            {entryDate ? (
              <>
                <View className="w-[3px] h-[3px] rounded-full bg-light-muted/40" />
                <Caption className="text-light-muted font-book text-[12px]">
                  {entryDate}
                </Caption>
              </>
            ) : null}
          </View>
        </View>
        <ChevronRight size={18} color="#A1A1AA" strokeWidth={2} />
      </View>
    </TouchableOpacity>
  );
}

// ── Payment Card ──
function PaymentCard({
  payment,
  onPress,
}: {
  payment: PaymentRecord;
  onPress: () => void;
}) {
  const payDate = payment.date ? formatDate(payment.date) : "";
  const statusColor =
    payment.status === "Paid"
      ? "text-light-success"
      : payment.status === "Pending"
        ? "text-light-warning"
        : "text-light-muted";
  const statusBg =
    payment.status === "Paid"
      ? "bg-light-success/15"
      : payment.status === "Pending"
        ? "bg-light-warning/15"
        : "bg-light-background";

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      className="bg-light-surface rounded-2xl px-4 py-4"
    >
      <View className="flex-row items-center justify-between">
        <View className="flex-1 pr-3">
          <View className="flex-row items-center gap-2.5">
            <Body className="text-light-text font-black text-[14px]">
              {payment.plateNumber}
            </Body>
            <View className={`${statusBg} px-2 py-0.5 rounded-full`}>
              <Caption className={`${statusColor} font-heavy text-[9px]`}>
                {payment.status}
              </Caption>
            </View>
          </View>
          <View className="flex-row items-center gap-2.5 mt-1.5">
            <Caption className="text-light-muted font-book text-[12px]">
              ₱{payment.amount.toFixed(2)}
            </Caption>
            {payDate ? (
              <>
                <View className="w-[3px] h-[3px] rounded-full bg-light-muted/40" />
                <Caption className="text-light-muted font-book text-[12px]">
                  {payDate}
                </Caption>
              </>
            ) : null}
          </View>
        </View>
        <ChevronRight size={18} color="#A1A1AA" strokeWidth={2} />
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
  const fullName = `${log.firstName ?? ""} ${log.lastName ?? ""}`.trim() || "N/A";

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <Pressable
        className="flex-1 bg-black/50 items-center justify-center px-6"
        onPress={onClose}
      >
        <Pressable className="w-full bg-light-surface rounded-3xl overflow-hidden">
          <View className="px-6 pt-6 pb-4">
            <View className="flex-row items-center justify-between">
              <Body className="text-light-text font-black text-[20px]">
                Parking Log
              </Body>
              <TouchableOpacity
                onPress={onClose}
                className="w-8 h-8 rounded-full bg-light-background items-center justify-center"
              >
                <X size={16} color="#71717A" strokeWidth={2.5} />
              </TouchableOpacity>
            </View>
          </View>

          <View className="mx-6 mb-4 bg-light-background rounded-2xl px-5 py-4 items-center">
            <Caption className="font-heavy uppercase tracking-widest text-[10px] mb-1">
              Plate Number
            </Caption>
            <Title className="text-light-text text-[24px] font-black text-center">
              {plateNumber}
            </Title>
          </View>

          <View className="px-6 pb-6">
            <Body className="text-light-text font-heavy text-[13px] mb-2 px-1">
              Session Details
            </Body>

            <View className="px-1">
              {isGuardSide && (
                <>
                  <InfoRow label="Name" value={fullName} />
                  <InfoRow label="Role" value={log.roleName || "N/A"} />
                </>
              )}
              <InfoRow label="Vehicle" value={`${log.brand} (${log.type})`} />
              <InfoRow label="Entry" value={`${entryTime} · ${entryDate}`} />
              <InfoRow label="Exit" value={`${exitTime} ${exitDate ? `· ${exitDate}` : ""}`} />
              <InfoRow
                label="Duration"
                value={`${log.parkingDuration.toFixed(1)} ${
                  log.parkingDuration === 1 ? "hour" : "hours"
                }`}
              />
              <InfoRow
                label="Violation"
                value={log.hasViolation ? "Yes" : "No"}
              />
            </View>
          </View>

          <View className="px-6 pb-6">
            <TouchableOpacity
              onPress={onClose}
              activeOpacity={0.85}
              className="bg-light-primary rounded-2xl py-3.5 items-center"
            >
              <Body className="text-white font-heavy text-[14px]">Close</Body>
            </TouchableOpacity>
          </View>
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
        className="flex-1 bg-black/50 items-center justify-center px-6"
        onPress={onClose}
      >
        <Pressable className="w-full bg-light-surface rounded-3xl overflow-hidden">
          <View className="px-6 pt-6 pb-4">
            <View className="flex-row items-center justify-between">
              <Body className="text-light-text font-black text-[17px]">
                Payment Details
              </Body>
              <TouchableOpacity
                onPress={onClose}
                className="w-8 h-8 rounded-full bg-light-background items-center justify-center"
              >
                <X size={16} color="#71717A" strokeWidth={2.5} />
              </TouchableOpacity>
            </View>
          </View>

          <View className="mx-6 mb-4 bg-light-background rounded-2xl px-5 py-4 items-center">
            <Caption className="font-heavy uppercase tracking-widest text-[10px] mb-1">
              Amount
            </Caption>
            <Title className="text-light-text text-[28px]">
              ₱{payment.amount.toFixed(2)}
            </Title>
            <View
              className={`mt-2 px-3 py-1 rounded-full ${
                payment.status === "Paid"
                  ? "bg-light-success/15"
                  : payment.status === "Pending"
                    ? "bg-light-warning/15"
                    : "bg-light-background"
              }`}
            >
              <Caption
                className={`font-heavy text-[11px] ${
                  payment.status === "Paid"
                    ? "text-light-success"
                    : payment.status === "Pending"
                      ? "text-light-warning"
                      : "text-light-muted"
                }`}
              >
                {payment.status}
              </Caption>
            </View>
          </View>

          <View className="px-6 pb-2">
            <View className="flex-row items-center gap-2 mb-1">
              <CreditCard size={14} color="#A1A1AA" strokeWidth={2} />
              <Caption className="font-heavy uppercase tracking-widest text-[10px]">
                Transaction
              </Caption>
            </View>
            <View>
              <InfoRow label="Plate Number" value={payment.plateNumber} />
            </View>
            <View>
              <InfoRow label="Name" value={payment.name} />
            </View>
            <View>
              <InfoRow label="Date" value={payDate} />
            </View>
            <View>
              <InfoRow label="Time" value={payTime} />
            </View>
          </View>

          <View className="px-6 pt-2 pb-6">
            <TouchableOpacity
              onPress={onClose}
              activeOpacity={0.85}
              className="bg-light-primary rounded-2xl py-3.5 items-center"
            >
              <Body className="text-white font-heavy text-[14px]">Close</Body>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// ══════════════════════════════════════════════
// ── Reusable HistoryScreen Component ──
// ══════════════════════════════════════════════
export default function HistoryScreen() {
  const [activeTab, setActiveTab] = useState<HistoryTab>("parking");
  const [selectedLog, setSelectedLog] =
    useState<ParkingHistoryResponse | null>(null);
  const [selectedPayment, setSelectedPayment] = useState<PaymentRecord | null>(
    null,
  );
  const [logModalVisible, setLogModalVisible] = useState(false);
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);

  const { parkingHistory, loading, getParkingHistory } = useHistoryStore();

  useEffect(() => {
    void getParkingHistory();
  }, [getParkingHistory]);

  const handleLogPress = useCallback((log: ParkingHistoryResponse) => {
    setSelectedLog(log);
    setLogModalVisible(true);
  }, []);

  const handlePaymentPress = useCallback((payment: PaymentRecord) => {
    setSelectedPayment(payment);
    setPaymentModalVisible(true);
  }, []);

  // GCash-style date grouping map
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
    <SafeAreaView className="flex-1 bg-light-background" edges={["top"]}>
      <View className="flex-1 px-5 pt-4">
        {/* ── Header ── */}
        <View className="mb-4">
          <Title className="text-light-text text-xl font-black">History</Title>
          <Caption className="text-light-muted font-book text-[13px] mt-1">
            Parking logs and payment records
          </Caption>
        </View>

        {/* ── Pill Toggle ── */}
        <View className="bg-light-surface rounded-2xl p-1 flex-row mb-4">
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setActiveTab("parking")}
            className={`flex-1 py-2.5 rounded-xl items-center ${
              activeTab === "parking" ? "bg-light-primary" : ""
            }`}
          >
            <Body
              className={`font-heavy text-[13px] ${
                activeTab === "parking" ? "text-white" : "text-light-muted"
              }`}
            >
              Parking Log
            </Body>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setActiveTab("payment")}
            className={`flex-1 py-2.5 rounded-xl items-center ${
              activeTab === "payment" ? "bg-light-primary" : ""
            }`}
          >
            <Body
              className={`font-heavy text-[13px] ${
                activeTab === "payment" ? "text-white" : "text-light-muted"
              }`}
            >
              Payment History
            </Body>
          </TouchableOpacity>
        </View>

        {/* ── Count / Loading indicator ── */}
        <View className="flex-row items-center justify-between mb-3">
          <Caption className="font-heavy text-[11px] uppercase tracking-widest">
            {activeTab === "parking"
              ? `${parkingHistory.length} records`
              : `${MOCK_PAYMENTS.length} transactions`}
          </Caption>
          {loading && activeTab === "parking" && (
            <ActivityIndicator size="small" color="#D22730" />
          )}
        </View>

        {/* ── List ── */}
        {activeTab === "parking" ? (
          <SectionList
            sections={sections}
            keyExtractor={(_, index) => `log-${index}`}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 32 }}
            renderSectionHeader={({ section: { title } }) => (
              <View className="py-2 mt-3 mb-1">
                <Body className="text-light-text font-black text-[14px]">
                  {title}
                </Body>
              </View>
            )}
            renderItem={({ item }) => (
              <ParkingLogCard log={item} onPress={() => handleLogPress(item)} />
            )}
            ItemSeparatorComponent={() => <View className="h-2.5" />}
            ListEmptyComponent={
              <View className="flex-1 items-center justify-center py-20">
                <View className="w-16 h-16 rounded-2xl bg-light-surface items-center justify-center mb-4">
                  <Receipt size={32} color="#A1A1AA" strokeWidth={1.5} />
                </View>
                <Body className="text-light-text font-heavy text-[15px] mb-1">
                  No parking logs
                </Body>
                <Caption className="text-light-muted font-book text-[13px] text-center px-8">
                  Entry and exit records will appear here.
                </Caption>
              </View>
            }
          />
        ) : (
          <FlatList
            data={MOCK_PAYMENTS}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 32 }}
            ItemSeparatorComponent={() => <View className="h-2.5" />}
            renderItem={({ item }) => (
              <PaymentCard
                payment={item}
                onPress={() => handlePaymentPress(item)}
              />
            )}
            ListEmptyComponent={
              <View className="flex-1 items-center justify-center py-20">
                <View className="w-16 h-16 rounded-2xl bg-light-surface items-center justify-center mb-4">
                  <CreditCard size={32} color="#A1A1AA" strokeWidth={1.5} />
                </View>
                <Body className="text-light-text font-heavy text-[15px] mb-1">
                  No payments
                </Body>
                <Caption className="text-light-muted font-book text-[13px] text-center px-8">
                  Payment records will appear here.
                </Caption>
              </View>
            }
          />
        )}
      </View>

      {/* ── Modals ── */}
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
