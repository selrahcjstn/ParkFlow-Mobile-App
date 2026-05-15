import { DashboardHeader, DashboardLayout } from "@/components/layout";
import ContentWrapper from "@/components/layout/ContentWrapper";
import { ParkingHistoryList, UserProfileCard } from "@/components/shared";
import GuardActionButtons from "@/components/shared/GuardActionButtons";
import GuardStatCards from "@/components/shared/GuardStatCards";
import { router } from "expo-router";
import { View } from "react-native";

const MOCK_HISTORY = [
  {
    id: "1",
    entryTime: "8:05 AM",
    entryDate: "February 12, 2026",
    exitTime: undefined,
    exitDate: undefined,
    duration: "22 mins",
    fee: "Free ✓",
    status: "Active" as const,
  },
  {
    id: "2",
    entryTime: "6:51 AM",
    entryDate: "March 12, 2026",
    exitTime: "12:01 PM",
    exitDate: "March 20, 2026",
    duration: "5 hrs",
    fee: "No ✓",
    status: "Completed" as const,
  },
];

export default function GuardHome() {
  return (
    <DashboardLayout>
      <DashboardHeader title="Dashboard" />
      <ContentWrapper>
        <UserProfileCard />
        <GuardStatCards totalSlots={100} totalParkedToday={34} />
        <GuardActionButtons
          onScan={() => router.push("/(guard)/scan-qr")}
          onSearch={() => router.push("/(guard)/search-parkee")}
        />
        <View className="pb-4">
          <ParkingHistoryList entries={MOCK_HISTORY} />
        </View>
      </ContentWrapper>
    </DashboardLayout>
  );
}
