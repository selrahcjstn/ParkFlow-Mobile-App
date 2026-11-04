import { ContentWrapper } from "@/components/layouts";
import {
  HistoryDetailsSheet,
  HistoryHeader,
  HistoryParkingSection,
} from "@/features/history/components";
import { useHistoryStore } from "@/features/history/store/history.store";
import { ParkingHistoryResponse } from "@/features/history/types/history.types";
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import { useSegments, useFocusEffect } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { View } from "react-native";

export default function HistoryPage() {
  const [isFocusedState, setIsFocusedState] = useState(true);

  const {
    parkingHistory,
    loading: isHistoryLoading,
    loadingMore,
    getParkingHistory,
    hasMore,
    loadMoreParkingHistory,
    generatedAt,
  } = useHistoryStore();

  useFocusEffect(
    useCallback(() => {
      setIsFocusedState(true);
      void getParkingHistory(true);
      return () => {
        setIsFocusedState(false);
      };
    }, [getParkingHistory])
  );

  const [shouldRenderSheet, setShouldRenderSheet] = useState(isFocusedState);
  const [selectedLog, setSelectedLog] = useState<ParkingHistoryResponse | null>(
    null,
  );

  const detailsSheetRef = useRef<BottomSheetModal>(null);

  const segments = useSegments() as string[];
  const isGuardSide = useMemo(() => segments.includes("(guard)"), [segments]);

  const isMountedRef = useRef(true);
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
      
      const timer = setTimeout(() => {
        setShouldRenderSheet(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isFocusedState]);

  useEffect(() => {
    void getParkingHistory(true);
  }, [getParkingHistory]);

  const handleLogPress = useCallback((log: ParkingHistoryResponse) => {
    setSelectedLog(log);
    detailsSheetRef.current?.present();
  }, []);

  useEffect(() => {
    if (selectedLog) {
      detailsSheetRef.current?.present();
    }
  }, [selectedLog]);

  const handleSheetClose = useCallback(() => {
    if (isMountedRef.current) {
      setSelectedLog(null);
    }
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
        const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        title = `${months[date.getMonth()]} ${date.getDate()}`;
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
      await getParkingHistory(true);
    } catch (err) {
      console.error("Failed to refresh history", err);
    } finally {
      if (isMountedRef.current) {
        setRefreshing(false);
      }
    }
  }, [getParkingHistory]);

  return (
    <ContentWrapper noPaddingY>
      <View className="flex-1">
        <HistoryHeader
          generatedAt={generatedAt}
        />

        <View className="flex-1">
            <HistoryParkingSection
              sections={sections}
              isLoading={isHistoryLoading}
              hasMore={hasMore}
              loadingMore={loadingMore}
              onLoadMore={loadMoreParkingHistory}
              onPressLog={handleLogPress}
              isGuardSide={isGuardSide}
              refreshing={refreshing}
              onRefresh={handleRefresh}
            />
        </View>

        {shouldRenderSheet && (
          <HistoryDetailsSheet
            ref={detailsSheetRef}
            log={selectedLog}
            isGuardSide={isGuardSide}
            onClose={handleSheetClose}
          />
        )}
      </View>
    </ContentWrapper>
  );
}
