import SubScreenLayout from "@/layouts/SubScreenLayout";
import TabPlaceholderContent from "@/layouts/TabPlaceholderContent";
import { router } from "expo-router";

export default function ManualInput() {
  return (
    <SubScreenLayout title="Manual Input" onBack={() => router.back()}>
      <TabPlaceholderContent message="Enter parkee details manually here." />
    </SubScreenLayout>
  );
}
