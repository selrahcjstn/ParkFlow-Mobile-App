import { DashboardHeader, DashboardLayout } from "@/components/layout";
import {
  ParkingHistoryList,
  QuickActionCard,
  StatCard,
  UserProfileCard,
} from "@/components/shared";
import { router } from "expo-router";
import { Bike, QrCode, Search } from "lucide-react-native";
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

export default function GuardDashboard() {
  return (
    <DashboardLayout>
      <DashboardHeader title="Dashboard" />
      <View className="flex-1 bg-light-background rounded-t-3xl -mt-1 pt-2">
        <UserProfileCard />
        <StatCard
          icon={<Bike size={36} color="#9D0215" strokeWidth={1.6} />}
          value="1,044"
          label="Total Parking This Month"
          sublabel="+8% from last month"
        />

        <View className="flex-row gap-3 mx-5 mt-4">
          <QuickActionCard
            icon={<QrCode size={28} color="#9D0215" strokeWidth={1.8} />}
            title="Scan\nQR Code"
            onPress={() => router.push("/(guard)/scan-qr")}
          />
          <QuickActionCard
            icon={<Search size={28} color="#9D0215" strokeWidth={1.8} />}
            title="Search\nParkee Info"
            onPress={() => router.push("/(guard)/search-parkee")}
          />
        </View>

        <ParkingHistoryList entries={MOCK_HISTORY} />
      </View>
    </DashboardLayout>
  );
}
