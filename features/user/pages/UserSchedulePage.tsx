import TabPlaceholderContent from "@/components/layouts/TabPlaceholderContent";
import TabScreenLayout from "@/components/layouts/TabScreenLayout";

export default function UserSchedulePage() {
  return (
    <TabScreenLayout title="Schedule">
      <TabPlaceholderContent message="Manage your campus parking schedule here." />
    </TabScreenLayout>
  );
}
