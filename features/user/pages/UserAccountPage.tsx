import TabPlaceholderContent from "@/components/layouts/TabPlaceholderContent";
import TabScreenLayout from "@/components/layouts/TabScreenLayout";

export default function UserAccountPage() {
  return (
    <TabScreenLayout title="Account">
      <TabPlaceholderContent message="Profile and account settings will appear here." />
    </TabScreenLayout>
  );
}
