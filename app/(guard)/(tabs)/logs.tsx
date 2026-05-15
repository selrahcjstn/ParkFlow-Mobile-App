import TabPlaceholderContent from "@/components/layout/TabPlaceholderContent";
import TabScreenLayout from "@/components/layout/TabScreenLayout";

export default function LogsTab() {
  return (
    <TabScreenLayout title="Logs">
      <TabPlaceholderContent message="View parking entry and exit activity logs here." />
    </TabScreenLayout>
  );
}
