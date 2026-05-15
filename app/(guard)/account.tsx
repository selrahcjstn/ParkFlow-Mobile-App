import TabPlaceholderContent from "@/components/layout/TabPlaceholderContent";
import TabScreenLayout from "@/components/layout/TabScreenLayout";

export default function GuardAccountTab() {
  return (
    <TabScreenLayout title="Account">
      <TabPlaceholderContent message="Guard profile and account settings will appear here." />
    </TabScreenLayout>
  );
}