import SubScreenLayout from "@/components/layouts/SubScreenLayout";
import TabPlaceholderContent from "@/components/layouts/TabPlaceholderContent";
import { router } from "expo-router";

export default function ManualInput() {
  return (
    <SubScreenLayout title="Manual Input" onBack={() => router.back()}>
      <TabPlaceholderContent message="Enter parkee details manually here." />
    </SubScreenLayout>
  );
}
