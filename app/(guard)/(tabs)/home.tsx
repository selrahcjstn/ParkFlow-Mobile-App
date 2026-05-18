import { DashboardLayout } from "@/components/layout";
import ContentWrapper from "@/components/layout/ContentWrapper";
import DashboardHeader from "@/components/layout/DashboardHeader";
import { ParkingHistoryList, UserProfileCard } from "@/components/shared";
import GuardActionButtons from "@/components/shared/GuardActionButtons";
import GuardStatCards from "@/components/shared/GuardStatCards";
import { useDashboardStore } from "@/store/useDashboardStore";
import { formatDate } from "@/utils/formatDate";
import { formatTime } from "@/utils/formatTime";
import { router, useFocusEffect } from "expo-router";
import { useCallback } from "react";
import { View } from "react-native";
import type { ParkingHistoryEntry } from "../../../components/shared/ParkingHistoryRow";

export default function GuardHome() {
  const totalParkedToday = useDashboardStore((state) => state.totalCount);
  const limit = useDashboardStore((state) => state.limit);
  const history = useDashboardStore((state) => state.history);
  const loadTodayLogs = useDashboardStore((state) => state.loadTodayLogs);
  const loadHistory = useDashboardStore((state) => state.loadHistory);

  const historyEntries: ParkingHistoryEntry[] = history.map((item) => ({
    id: `${item.plateNumber}-${item.entryTime}`,
    plateNumber: item.plateNumber,
    brand: item.brand,
    vehicleType: item.vehicleType,
    entryTime: formatTime(new Date(item.entryTime)),
    entryDate: formatDate(item.entryTime),
    action: item.exitTime ? "EXIT" : "ENTRY",
  }));

  useFocusEffect(
    useCallback(() => {
      loadTodayLogs();
      loadHistory();
    }, [loadTodayLogs, loadHistory]),
  );

  return (
    <DashboardLayout>
      <DashboardHeader title="Dashboard" />
      <ContentWrapper>
        <UserProfileCard />
        <GuardStatCards
          totalParkedToday={totalParkedToday}
          totalSlots={limit}
        />
        <GuardActionButtons
          onScan={() => router.push("/(guard)/scan-qr")}
          onSearch={() => router.push("/(guard)/search-parkee")}
        />
        <View>
          <ParkingHistoryList entries={historyEntries} />
        </View>
      </ContentWrapper>
    </DashboardLayout>
  );
}
