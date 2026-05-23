import { TabScreenLayout } from "@/components/layouts";
import {
  HistoryParkingSection,
  HistoryPaymentSection,
  HistoryTabs,
  ParkingLogDetailModal,
  PaymentDetailModal,
  type HistoryTab,
} from "@/features/history/components";
import { useHistoryStore } from "@/features/history/store/history.store";
import { ParkingHistoryResponse } from "@/features/history/types/history.types";
import { PaymentRecord } from "@/features/history/types/payment.types";
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
    <TabScreenLayout title="History">
      <View className="pt-4">
        <HistoryTabs activeTab={activeTab} onChangeTab={setActiveTab} />
      </View>

      <View className="flex-1">
        {activeTab === "parking" ? (
          <HistoryParkingSection
            sections={sections}
            hasMore={hasMore}
            loadingMore={loadingMore}
            onLoadMore={loadMoreParkingHistory}
            onPressLog={handleLogPress}
          />
        ) : (
          <HistoryPaymentSection
            payments={MOCK_PAYMENTS}
            onPressPayment={handlePaymentPress}
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
