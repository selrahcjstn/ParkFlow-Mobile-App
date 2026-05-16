import { DashboardHeader, DashboardLayout } from "@/components/layout";
import ContentWrapper from "@/components/layout/ContentWrapper";
import { lightColors } from "@/constants/theme";
import { useVehicleStore } from "@/store/useVehicleStore";
import { useFocusEffect } from "expo-router";
import { AlertTriangle, Bike, CalendarCheck } from "lucide-react-native";
import { useCallback } from "react";
import { View } from "react-native";
import {
    ParkingHistoryList,
    QRCodeDisplay,
    QuickActionCard,
    StatCard,
    UserProfileCard,
} from "../../../components/shared";

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
    fee: "₱15",
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
  const vehicle = useVehicleStore((s) => s.vehicle);
  const isLoading = useVehicleStore((s) => s.isLoading);
  const hasHydrated = useVehicleStore((s) => s.hasHydrated);
  const loadVehicle = useVehicleStore((s) => s.loadVehicle);

  useFocusEffect(
    useCallback(() => {
      loadVehicle();
    }, [loadVehicle]),
  );

  return (
    <DashboardLayout>
      <DashboardHeader title="Dashboard" />
      <ContentWrapper>
        <UserProfileCard />
        <QRCodeDisplay
          vehicle={vehicle}
          isLoading={isLoading}
          hasHydrated={hasHydrated}
        />
        <StatCard
          icon={
            <Bike size={36} color={lightColors.primary} strokeWidth={1.6} />
          }
          value="12"
          label="Total Parks"
          sublabel="₱15 Current Charges"
        />
        <View className="flex-row gap-3 mx-5 mt-4">
          <View className="flex-1">
            <QuickActionCard
              icon={
                <AlertTriangle
                  size={28}
                  color={lightColors.primary}
                  strokeWidth={1.8}
                />
              }
              title="View Charges"
              subtitle="See parking fees"
            />
          </View>
          <View className="flex-1">
            <QuickActionCard
              icon={
                <CalendarCheck
                  size={28}
                  color={lightColors.primary}
                  strokeWidth={1.8}
                />
              }
              title="Request Schedule"
              subtitle="Reserve parking slot"
            />
          </View>
        </View>
        <ParkingHistoryList entries={MOCK_HISTORY} />
      </ContentWrapper>
    </DashboardLayout>
  );
}
