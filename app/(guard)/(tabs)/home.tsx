import { DashboardLayout } from "@/components/layout";
import ContentWrapper from "@/components/layout/ContentWrapper";
import DashboardHeader from "@/components/layout/DashboardHeader";
import { ParkingHistoryList, UserProfileCard } from "@/components/shared";
import GuardActionButtons from "@/components/shared/GuardActionButtons";
import GuardStatCards from "@/components/shared/GuardStatCards";
import { useDashboardStore } from "@/store/useDashboardStore";
import { router, useFocusEffect } from "expo-router";
import { useCallback } from "react";
import { View } from "react-native";

export default function GuardHome() {
  const totalParkedToday = useDashboardStore((state) => state.totalCount);
  const limit = useDashboardStore((state) => state.limit);
  const history = useDashboardStore((state) => state.history);
  const loadTodayLogs = useDashboardStore((state) => state.loadTodayLogs);
  const loadHistory = useDashboardStore((state) => state.loadHistory);

  // Use raw history from the store so components receive the full API shape
  const historyEntries = history;

  useFocusEffect(
    useCallback(() => {
      loadTodayLogs();
      loadHistory();
    }, [loadTodayLogs, loadHistory]),
  );

  return (
    <DashboardLayout>
      <DashboardHeader title="ParkFlow" />
      <ContentWrapper>
        <UserProfileCard />
        <GuardStatCards
          totalParkedToday={totalParkedToday}
          totalSlots={limit}
        />
        <GuardActionButtons
          onScan={() => router.push("/(guard)/(scan)/scan-qr")}
          onSearch={() => router.push("/(guard)/search-parkee")}
        />
        <View>
          <ParkingHistoryList entries={historyEntries} />
        </View>
      </ContentWrapper>
    </DashboardLayout>
  );
}
