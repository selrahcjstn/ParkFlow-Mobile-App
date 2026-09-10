import { ContentWrapper } from "@/components/layouts";
import {
  HistoryDetailsSheet,
  HistoryHeader,
  HistoryParkingSection,
  HistoryPaymentSection,
  type HistoryTab,
} from "@/features/history/components";
import { historyService } from "@/features/history/services/history.service";
import { useHistoryStore } from "@/features/history/store/history.store";
import { ParkingHistoryResponse } from "@/features/history/types/history.types";
import { PaymentRecord } from "@/features/history/types/payment.types";
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import { useSegments, useFocusEffect } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { View } from "react-native";

export default function HistoryPage() {
  const [isFocusedState, setIsFocusedState] = useState(true);

  useFocusEffect(
    useCallback(() => {
      setIsFocusedState(true);
      return () => {
        setIsFocusedState(false);
      };
    }, [])
  );

  const [shouldRenderSheet, setShouldRenderSheet] = useState(isFocusedState);
  const [activeTab, setActiveTab] = useState<HistoryTab>("parking");
  const [selectedLog, setSelectedLog] = useState<ParkingHistoryResponse | null>(
    null,
  );
  const [selectedPayment, setSelectedPayment] = useState<PaymentRecord | null>(
    null,
  );

  const detailsSheetRef = useRef<BottomSheetModal>(null);

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

  const isMountedRef = useRef(true);
  const paymentPageRef = useRef(1);

  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [loadingPayments, setLoadingPayments] = useState(false);
  const [loadingMorePayments, setLoadingMorePayments] = useState(false);
  const [hasMorePayments, setHasMorePayments] = useState(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (isFocusedState) {
      setShouldRenderSheet(true);
    } else {
      detailsSheetRef.current?.dismiss();
      setSelectedLog(null);
      setSelectedPayment(null);
      
      const timer = setTimeout(() => {
        setShouldRenderSheet(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isFocusedState]);

  const getPaymentsHistory = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) {
        setLoadingPayments(true);
      } else {
        setLoadingMorePayments(true);
      }

      try {
        const pageToFetch = isRefresh ? 1 : paymentPageRef.current;
        const res = await historyService.getViolationHistory(pageToFetch, 15);
        
        if (!isMountedRef.current) return;

        const items = res?.data?.items ?? [];
        const formatted: PaymentRecord[] = items.map((item: any) => ({
          id: item.violationId || Math.random().toString(),
          plateNumber: item.plateNumber || "N/A",
          name:
            `${item.firstName ?? ""} ${item.lastName ?? ""}`.trim() || "N/A",
          amount: item.penaltyFee ?? 0,
          date: item.issuedAt || item.entryTime || "",
          status: item.isPaid
            ? "Paid"
            : item.settlementStatus === "Paid"
              ? "Paid"
              : item.settlementStatus === "Waived"
                ? "Waived"
                : "Pending",

          firstName: item.firstName,
          lastName: item.lastName,
          roleName: item.roleName,
          brand: item.brand,
          vehicleType: item.vehicleType,
          violationId: item.violationId,
          referenceNumber: item.referenceNumber,
          violationType: item.violationType,
          penaltyFee: item.penaltyFee,
          settlementStatus: item.settlementStatus,
          isPaid: item.isPaid,
          entryTime: item.entryTime,
          exitTime: item.exitTime,
          issuedAt: item.issuedAt,
        }));

        if (isRefresh) {
          setPayments(formatted);
          paymentPageRef.current = 2;
          setHasMorePayments(formatted.length >= 15);
        } else {
          setPayments((prev) => [...prev, ...formatted]);
          paymentPageRef.current += 1;
          setHasMorePayments(formatted.length >= 15);
        }
      } catch (err) {
        console.error("Failed to load violation history", err);
      } finally {
        if (isMountedRef.current) {
          setLoadingPayments(false);
          setLoadingMorePayments(false);
        }
      }
    },
    [],
  );

  useEffect(() => {
    void getParkingHistory(true);
    void getPaymentsHistory(true);
  }, [getParkingHistory, getPaymentsHistory]);

  const handleLogPress = useCallback((log: ParkingHistoryResponse) => {
    setSelectedPayment(null);
    setSelectedLog(log);
    detailsSheetRef.current?.present();
  }, []);

  const handlePaymentPress = useCallback((payment: PaymentRecord) => {
    setSelectedLog(null);
    setSelectedPayment(payment);
    detailsSheetRef.current?.present();
  }, []);

  useEffect(() => {
    if (selectedLog || selectedPayment) {
      detailsSheetRef.current?.present();
    }
  }, [selectedLog, selectedPayment]);

  const handleSheetClose = useCallback(() => {
    if (isMountedRef.current) {
      setSelectedLog(null);
      setSelectedPayment(null);
    }
  }, []);

  const handleTabChange = useCallback((tab: HistoryTab) => {
    setActiveTab(tab);
  }, []);

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
      if (isNaN(date.getTime())) return;
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

  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([getParkingHistory(true), getPaymentsHistory(true)]);
    } catch (err) {
      console.error("Failed to refresh history", err);
    } finally {
      if (isMountedRef.current) {
        setRefreshing(false);
      }
    }
  }, [getParkingHistory, getPaymentsHistory]);

  return (
    <ContentWrapper noPaddingY>
      <View className="flex-1">
        <HistoryHeader
          activeTab={activeTab}
          onChangeTab={handleTabChange}
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
              isGuardSide={isGuardSide}
              refreshing={refreshing}
              onRefresh={handleRefresh}
            />
          ) : (
            <HistoryPaymentSection
              payments={payments}
              onPressPayment={handlePaymentPress}
              isGuardSide={isGuardSide}
              onLoadMore={() => getPaymentsHistory(false)}
              hasMore={hasMorePayments}
              loadingMore={loadingMorePayments}
              refreshing={refreshing}
              onRefresh={handleRefresh}
            />
          )}
        </View>

        {shouldRenderSheet && (
          <HistoryDetailsSheet
            ref={detailsSheetRef}
            log={selectedLog}
            payment={selectedPayment}
            isGuardSide={isGuardSide}
            onClose={handleSheetClose}
          />
        )}
      </View>
    </ContentWrapper>
  );
}
