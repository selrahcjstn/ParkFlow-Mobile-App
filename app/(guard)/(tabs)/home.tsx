import { DashboardLayout } from "@/components/layout";
import ContentWrapper from "@/components/layout/ContentWrapper";
import DashboardHeader from "@/components/layout/DashboardHeader";
import { ParkingHistoryList, UserProfileCard } from "@/components/shared";
import GuardActionButtons from "@/components/shared/GuardActionButtons";
import GuardStatCards from "@/components/shared/GuardStatCards";
import { router } from "expo-router";
import { View } from "react-native";

const MOCK_HISTORY = [
  {
    id: "1",
    plateNumber: "GDR-1108",
    brand: "Toyota",
    vehicleType: "SUV",
    entryTime: "8:05 AM",
    entryDate: "May 17, 2026",
  },
  {
    id: "2",
    plateNumber: "LKM-3401",
    brand: "Honda",
    vehicleType: "Motorcycle",
    entryTime: "7:30 AM",
    entryDate: "May 17, 2026",
  },
  {
    id: "3",
    plateNumber: "PTR-5562",
    brand: "Isuzu",
    vehicleType: "Van",
    entryTime: "6:45 AM",
    entryDate: "May 16, 2026",
  },
  {
    id: "4",
    plateNumber: "WEX-9097",
    brand: "Hyundai",
    vehicleType: "Sedan",
    entryTime: "9:10 AM",
    entryDate: "May 16, 2026",
  },
  {
    id: "5",
    plateNumber: "QAZ-7712",
    brand: "Kawasaki",
    vehicleType: "Sport Bike",
    entryTime: "5:55 AM",
    entryDate: "May 15, 2026",
  },
  {
    id: "6",
    plateNumber: "CVM-1220",
    brand: "Nissan",
    vehicleType: "Pickup",
    entryTime: "4:50 AM",
    entryDate: "May 15, 2026",
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
