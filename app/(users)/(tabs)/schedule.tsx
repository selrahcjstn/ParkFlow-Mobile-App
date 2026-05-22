import TabPlaceholderContent from "@/layouts/TabPlaceholderContent";
import TabScreenLayout from "@/layouts/TabScreenLayout";

export default function ScheduleTab() {
  return (
    <TabScreenLayout title="Schedule">
      <TabPlaceholderContent message="Manage your campus parking schedule here." />
    </TabScreenLayout>
  );
}
