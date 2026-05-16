import TabPlaceholderContent from "@/components/layout/TabPlaceholderContent";
import TabScreenLayout from "@/components/layout/TabScreenLayout";

export default function ScheduleTab() {
  return (
    <TabScreenLayout title="Schedule">
      <TabPlaceholderContent message="Manage your campus parking schedule here." />
    </TabScreenLayout>
  );
}
