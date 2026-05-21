import { Body, Caption, Title } from "@/components/ui/Typography";
import { ParkingLogEntryResponse } from "@/types/parkingLog";
import { formatDate } from "@/utils/formatDate";
import { formatTime } from "@/utils/formatTime";
import {
  ChevronRight,
  Clock,
  CreditCard,
  Receipt,
  X,
} from "lucide-react-native";
import { useCallback, useState } from "react";
import {
  FlatList,
  Modal,
  Pressable,
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

// ── Mock data ──
const MOCK_PARKING_LOGS: ParkingLogEntryResponse[] = [
  {
    firstName: "Juan",
    lastName: "Dela Cruz",
    role: "Student",
    phoneNumber: "09171234567",
    status: "Completed",
    plateNumber: "ABC-1234",
    brand: "Toyota Vios",
    vehicleType: "Car",
    entryTime: "2026-05-21T08:15:00Z",
    entryDate: "2026-05-21",
    endTime: "2026-05-21T14:30:00Z",
    maximumExitTime: "2026-05-21T17:00:00Z",
  },
  {
    firstName: "Maria",
    lastName: "Santos",
    role: "Staff",
    phoneNumber: "09181234567",
    status: "Completed",
    plateNumber: "XYZ-9801",
    brand: "Honda Click",
    vehicleType: "Motorcycle",
    entryTime: "2026-05-21T07:42:00Z",
    entryDate: "2026-05-21",
    endTime: "2026-05-21T12:00:00Z",
    maximumExitTime: "2026-05-21T17:00:00Z",
  },
  {
    firstName: "Pedro",
    lastName: "Reyes",
    role: "Student",
    phoneNumber: "09191234567",
    status: "Active",
    plateNumber: "JKT-4472",
    brand: "Mitsubishi Mirage",
    vehicleType: "Car",
    entryTime: "2026-05-21T09:05:00Z",
    entryDate: "2026-05-21",
    endTime: "",
    maximumExitTime: "2026-05-21T17:00:00Z",
  },
  {
    firstName: "Ana",
    lastName: "Garcia",
    role: "Student",
    phoneNumber: "09201234567",
    status: "Completed",
    plateNumber: "NQR-6680",
    brand: "Yamaha Mio",
    vehicleType: "Motorcycle",
    entryTime: "2026-05-20T06:30:00Z",
    entryDate: "2026-05-20",
    endTime: "2026-05-20T16:45:00Z",
    maximumExitTime: "2026-05-20T17:00:00Z",
  },
];

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
function ParkingLogCard({
  log,
  onPress,
}: {
  log: ParkingLogEntryResponse;
  onPress: () => void;
}) {
  const entryTime = log.entryTime ? formatTime(log.entryTime) : "N/A";
  const entryDate = log.entryTime ? formatDate(log.entryTime) : "";

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
              {log.plateNumber || "N/A"}
            </Body>
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
function ParkingLogDetailModal({
  visible,
  onClose,
  log,
}: {
  visible: boolean;
  onClose: () => void;
  log: ParkingLogEntryResponse | null;
}) {
  if (!log) return null;

  const entryTime = log.entryTime ? formatTime(log.entryTime) : "N/A";
  const entryDate = log.entryTime ? formatDate(log.entryTime) : "N/A";
  const exitTime = log.endTime ? formatTime(log.endTime) : "—";
  const maxExit = log.maximumExitTime
    ? formatTime(log.maximumExitTime)
    : "N/A";
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
        className="flex-1 bg-black/50 items-center justify-center px-6"
        onPress={onClose}
      >
        <Pressable className="w-full bg-light-surface rounded-3xl overflow-hidden">
          <View className="px-6 pt-6 pb-4">
            <View className="flex-row items-center justify-between">
              <Body className="text-light-text font-black text-[17px]">
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
            <Title className="text-light-text text-[22px]">
              {log.plateNumber || "N/A"}
            </Title>
          </View>

          <View className="px-6 pb-2">
            <View className="flex-row items-center gap-2 mb-1">
              <Clock size={14} color="#A1A1AA" strokeWidth={2} />
              <Caption className="font-heavy uppercase tracking-widest text-[10px]">
                Details
              </Caption>
            </View>
            <View className="border-b border-light-border/40">
              <InfoRow label="Name" value={fullName} />
            </View>
            <View className="border-b border-light-border/40">
              <InfoRow label="Role" value={log.role || "N/A"} />
            </View>
            <View className="border-b border-light-border/40">
              <InfoRow label="Brand" value={log.brand || "N/A"} />
            </View>
            <View className="border-b border-light-border/40">
              <InfoRow label="Entry" value={`${entryTime} · ${entryDate}`} />
            </View>
            <View className="border-b border-light-border/40">
              <InfoRow label="Exit" value={exitTime} />
            </View>
            <View>
              <InfoRow label="Must Exit By" value={maxExit} />
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
            <View className="border-b border-light-border/40">
              <InfoRow label="Plate Number" value={payment.plateNumber} />
            </View>
            <View className="border-b border-light-border/40">
              <InfoRow label="Name" value={payment.name} />
            </View>
            <View className="border-b border-light-border/40">
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
    useState<ParkingLogEntryResponse | null>(null);
  const [selectedPayment, setSelectedPayment] = useState<PaymentRecord | null>(
    null,
  );
  const [logModalVisible, setLogModalVisible] = useState(false);
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);

  const handleLogPress = useCallback((log: ParkingLogEntryResponse) => {
    setSelectedLog(log);
    setLogModalVisible(true);
  }, []);

  const handlePaymentPress = useCallback((payment: PaymentRecord) => {
    setSelectedPayment(payment);
    setPaymentModalVisible(true);
  }, []);

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

        {/* ── Count ── */}
        <View className="flex-row items-center mb-3">
          <Caption className="font-heavy text-[11px] uppercase tracking-widest">
            {activeTab === "parking"
              ? `${MOCK_PARKING_LOGS.length} records`
              : `${MOCK_PAYMENTS.length} transactions`}
          </Caption>
        </View>

        {/* ── List ── */}
        {activeTab === "parking" ? (
          <FlatList
            data={MOCK_PARKING_LOGS}
            keyExtractor={(_, index) => `log-${index}`}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 32 }}
            ItemSeparatorComponent={() => <View className="h-2.5" />}
            renderItem={({ item }) => (
              <ParkingLogCard
                log={item}
                onPress={() => handleLogPress(item)}
              />
            )}
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
