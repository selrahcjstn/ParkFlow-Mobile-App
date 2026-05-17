import { DashboardLayout } from "@/components/layout";
import ContentWrapper from "@/components/layout/ContentWrapper";
import DashboardHeader from "@/components/layout/DashboardHeader";
import { Title } from "@/components/ui";
import { useVehicleStore } from "@/store/useVehicleStore";
import { useFocusEffect } from "expo-router";
import { AlertTriangle, CalendarCheck } from "lucide-react-native";
import { useCallback } from "react";
import { View } from "react-native";
import {
  ParkingHistoryList,
  QRCodeDisplay,
  QuickActionCard,
  UserProfileCard,
} from "../../../components/shared";
import type { ParkingHistoryEntry } from "../../../components/shared/ParkingHistoryRow";

const MOCK_HISTORY: ParkingHistoryEntry[] = [
  {
    id: "1",
    plateNumber: "ABC-1234",
    brand: "Toyota",
    vehicleType: "Sedan",
    entryTime: "8:05 AM",
    entryDate: "May 17, 2026",
    action: "ENTRY",
  },
  {
    id: "2",
    plateNumber: "XYZ-9801",
    brand: "Honda",
    vehicleType: "Motorcycle",
    entryTime: "7:42 AM",
    entryDate: "May 17, 2026",
    action: "EXIT",
  },
  {
    id: "3",
    plateNumber: "JKT-4472",
    brand: "Mitsubishi",
    vehicleType: "Hatchback",
    entryTime: "6:51 AM",
    entryDate: "May 16, 2026",
    action: "ENTRY",
  },
  {
    id: "4",
    plateNumber: "NQR-6680",
    brand: "Ford",
    vehicleType: "SUV",
    entryTime: "9:15 AM",
    entryDate: "May 16, 2026",
    action: "EXIT",
  },
  {
    id: "5",
    plateNumber: "TRM-2307",
    brand: "Yamaha",
    vehicleType: "Scooter",
    entryTime: "5:33 AM",
    entryDate: "May 15, 2026",
    action: "ENTRY",
  },
  {
    id: "6",
    plateNumber: "PLD-7719",
    brand: "Nissan",
    vehicleType: "Pickup",
    entryTime: "4:22 AM",
    entryDate: "May 15, 2026",
    action: "EXIT",
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
      <DashboardHeader title="ParkFlow" />
      <ContentWrapper>
        <UserProfileCard />
        {/* <StatCard
          icon={
            <Bike size={36} color="#D22730" strokeWidth={1.6} />
          }
          value="12"
          label="Total Parks"
          sublabel="Current Charges"
        /> */}
        <QRCodeDisplay
          vehicle={vehicle}
          isLoading={isLoading}
          hasHydrated={hasHydrated}
        />

        <Title
          className="text-light-text font-black mt-4"
          style={{ fontSize: 18 }}
        >
          Quick Actions
        </Title>
        <View className="flex-row gap-3 mt-4">
          <View className="flex-1">
            <QuickActionCard
              icon={
                <AlertTriangle size={28} color="#D22730" strokeWidth={1.8} />
              }
              title="View Charges"
              subtitle="See parking fees"
            />
          </View>
          <View className="flex-1">
            <QuickActionCard
              icon={
                <CalendarCheck size={28} color="#D22730" strokeWidth={1.8} />
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
