import SubScreenLayout from "@/components/layouts/SubScreenLayout";
import { router } from "expo-router";
import { Text } from "react-native";

export default function ManualInput() {
  return (
    <SubScreenLayout title="Manual Input" onBack={() => router.back()}>
      {/* Placeholder content */}
      <Text>dwadwa</Text>
    </SubScreenLayout>
  );
}
