import SubScreenLayout from "@/components/layout/SubScreenLayout";
import TabPlaceholderContent from "@/components/layout/TabPlaceholderContent";
import { router } from "expo-router";

export default function SearchParkee() {
  return (
    <SubScreenLayout title="Search Parkee" onBack={() => router.back()}>
      <TabPlaceholderContent message="Look up parkee details by ID or plate number here." />
    </SubScreenLayout>
  );
}
