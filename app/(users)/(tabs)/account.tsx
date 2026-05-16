import TabPlaceholderContent from "@/components/layout/TabPlaceholderContent";
import TabScreenLayout from "@/components/layout/TabScreenLayout";

export default function AccountTab() {
  return (
    <TabScreenLayout title="Account">
      <TabPlaceholderContent message="Profile and account settings will appear here." />
    </TabScreenLayout>
  );
}
