import { DashboardHeader, DashboardLayout } from "@/components/layout";
import { StatCard, UserProfileCard } from "@/components/shared";
import { useAuthStore } from "@/store/useAuthStore";
import { Bike } from "lucide-react-native";
import { View } from "react-native";
export default function GuardDashboard() {
  const { user } = useAuthStore();

  return (
    <DashboardLayout>
      <DashboardHeader title="Guard Dashboard" />
      <View className="flex-1 bg-light-background rounded-t-3xl -mt-1 pt-2">
        <UserProfileCard />
        <StatCard
          icon={<Bike size={36} color="#9D0215" strokeWidth={1.6} />}
          value="1,044"
          label="Total Parking This Month"
          sublabel="+8% from last month"
        />
      </View>
    </DashboardLayout>
  );
}
