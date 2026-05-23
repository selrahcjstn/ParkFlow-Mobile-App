import { TabScreenLayout } from "@/components/layouts";
import {
  HistoryParkingSection,
  HistoryPaymentSection,
  HistoryHeader,
  ParkingLogDetailModal,
  PaymentDetailModal,
  type HistoryTab,
} from "@/features/history/components";
import { useHistoryStore } from "@/features/history/store/history.store";
import { ParkingHistoryResponse } from "@/features/history/types/history.types";
import { PaymentRecord } from "@/features/history/types/payment.types";
import { useSegments } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { View } from "react-native";

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

export default function HistoryPage() {
  const [activeTab, setActiveTab] = useState<HistoryTab>("parking");
  const [isScrolled, setIsScrolled] = useState(false);
  const [selectedLog, setSelectedLog] = useState<ParkingHistoryResponse | null>(
    null,
  );
  const [selectedPayment, setSelectedPayment] = useState<PaymentRecord | null>(
    null,
  );
  const [logModalVisible, setLogModalVisible] = useState(false);
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);

  // Parse segments at the page router layer safely
  const segments = useSegments() as string[];
  const isGuardSide = useMemo(() => segments.includes("(guard)"), [segments]);

  const {
    parkingHistory,
    loadingMore,
    getParkingHistory,
    hasMore,
    loadMoreParkingHistory,
    generatedAt,
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

  const handleTabChange = useCallback((tab: HistoryTab) => {
    setActiveTab(tab);
    setIsScrolled(false); // Reset elevation state when switching tabs
  }, []);

  // Chronological group mapping with optimized object lookups
  const sections = useMemo(() => {
    const sectionMap = new Map<string, ParkingHistoryResponse[]>();

    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    const todayStr = today.toDateString();
    const yesterdayStr = yesterday.toDateString();

    parkingHistory.forEach((log) => {
      if (!log.entryTime) return;

      const date = new Date(log.entryTime);
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
      sectionMap.get(title)!.push(log);
    });

    return Array.from(sectionMap.entries()).map(([title, data]) => ({
      title,
      data,
    }));
  }, [parkingHistory]);

  return (
    <TabScreenLayout title="History">
      <HistoryHeader
        activeTab={activeTab}
        onChangeTab={handleTabChange}
        isScrolled={isScrolled}
        generatedAt={generatedAt}
      />

      <View className="flex-1">
        {activeTab === "parking" ? (
          <HistoryParkingSection
            sections={sections}
            hasMore={hasMore}
            loadingMore={loadingMore}
            onLoadMore={loadMoreParkingHistory}
            onPressLog={handleLogPress}
            onScrollActive={setIsScrolled}
            isGuardSide={isGuardSide}
          />
        ) : (
          <HistoryPaymentSection
            payments={MOCK_PAYMENTS}
            onPressPayment={handlePaymentPress}
            onScrollActive={setIsScrolled}
          />
        )}
      </View>

      <ParkingLogDetailModal
        visible={logModalVisible}
        onClose={() => {
          setLogModalVisible(false);
          setSelectedLog(null);
        }}
        log={selectedLog}
        isGuardSide={isGuardSide}
      />

      <PaymentDetailModal
        visible={paymentModalVisible}
        onClose={() => {
          setPaymentModalVisible(false);
          setSelectedPayment(null);
        }}
        payment={selectedPayment}
      />
    </TabScreenLayout>
  );
}
