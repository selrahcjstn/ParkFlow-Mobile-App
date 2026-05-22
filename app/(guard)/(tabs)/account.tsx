import TabPlaceholderContent from "@/layouts/TabPlaceholderContent";
import TabScreenLayout from "@/layouts/TabScreenLayout";

export default function GuardAccountTab() {
  return (
    <TabScreenLayout title="Account">
      <TabPlaceholderContent message="Guard profile and account settings will appear here." />
    </TabScreenLayout>
  );
}