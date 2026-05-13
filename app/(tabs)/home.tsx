import { useAuthStore } from "@/store/useAuthStore";
import { useRouter } from "expo-router";
import { AlertTriangle, Bike, CalendarCheck } from "lucide-react-native";
import { View } from "react-native";
import { DashboardHeader, DashboardLayout } from "../../components/layout";
import {
  ParkingHistoryList,
  QRCodeDisplay,
  QuickActionCard,
  StatCard,
  UserProfileCard,
} from "../../components/shared";

/* ── Static dummy data (no backend yet) ────────────── */
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
  {
    id: "3",
    entryTime: "5:17 AM",
    entryDate: "March 15, 2026",
    exitTime: "9:18 AM",
    exitDate: "March 15, 2026",
    duration: "4 hrs",
    fee: "Free ✓",
    status: "Completed" as const,
  },
];

export default function Home() {
  const { user, logout } = useAuthStore();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.replace("/(auth)/login");
  };

  const displayName = user ? user.name || "ParkFlow User" : "ParkFlow User";
  const displayPhone = user?.phoneNumber ?? "—";

  return (
    <DashboardLayout>
      {/* ── Header bar ───────────────────────────── */}
      <DashboardHeader
        hasNotification
        onNotificationPress={() => {}}
        onLogoutPress={handleLogout}
      />

      {/* ── Body (off-white card area) ───────────── */}
      <View className="flex-1 bg-light-background rounded-t-3xl -mt-1 pt-2">
        {/* User info */}
        <UserProfileCard name={displayName} phone={displayPhone} />

        {/* QR Code */}
        <QRCodeDisplay />

        {/* Stat card – Total Parking This Month */}
        <StatCard
          icon={<Bike size={36} color="#9D0215" strokeWidth={1.6} />}
          value="1,044"
          label="Total Parking This Month"
          sublabel="+8% from last month"
        />

        {/* Quick actions row */}
        <View className="flex-row gap-3 mx-5 mt-4">
          <QuickActionCard
            icon={<AlertTriangle size={28} color="#9D0215" strokeWidth={1.8} />}
            title="Penalty"
            subtitle="No Unpaid Fee"
          />
          <QuickActionCard
            icon={<CalendarCheck size={28} color="#9D0215" strokeWidth={1.8} />}
            title="Request Parking Reservation"
          />
        </View>

        {/* Parking History */}
        <ParkingHistoryList entries={MOCK_HISTORY} />
      </View>
    </DashboardLayout>
  );
}
