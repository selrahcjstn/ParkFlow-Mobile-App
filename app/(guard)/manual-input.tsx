import SubScreenLayout from "@/components/layout/SubScreenLayout";
import TabPlaceholderContent from "@/components/layout/TabPlaceholderContent";
import { router } from "expo-router";

export default function ManualInput() {
  return (
    <SubScreenLayout title="Manual Input" onBack={() => router.back()}>
      <TabPlaceholderContent message="Enter parkee details manually here." />
    </SubScreenLayout>
  );
}
