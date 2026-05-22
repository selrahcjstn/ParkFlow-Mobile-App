import TabPlaceholderContent from "@/layouts/TabPlaceholderContent";
import TabScreenLayout from "@/layouts/TabScreenLayout";

export default function UserAccountPage() {
  return (
    <TabScreenLayout title="Account">
      <TabPlaceholderContent message="Profile and account settings will appear here." />
    </TabScreenLayout>
  );
}
