import TabPlaceholderContent from "@/components/layout/TabPlaceholderContent";
import TabScreenLayout from "@/components/layout/TabScreenLayout";

export default function ParkingHistoryTab() {
  return (
    <TabScreenLayout title="Parking Historys">
      <TabPlaceholderContent message="View your past parking sessions and fees here." />
    </TabScreenLayout>
  );
}
