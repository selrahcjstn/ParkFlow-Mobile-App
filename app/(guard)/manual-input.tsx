import SubScreenLayout from "@/components/layouts/SubScreenLayout";
import ManualInputPreview, {
  ManualInputPreviewData,
} from "@/features/guard/components/ManualInputPreview";
import { router } from "expo-router";

const dummyManualInputData: ManualInputPreviewData = {
  plateNumber: "ABC-1234",
  vehicleType: "Sedan",
  brand: "Toyota",
  color: "Silver",
  ownerName: "Juan Dela Cruz",
  status: "Pending verification",
  notes: "Dummy payload for manual input preview from the parent screen.",
};

export default function ManualInput() {
  return (
    <SubScreenLayout title="Manual Input" onBack={() => router.back()}>
      <ManualInputPreview data={dummyManualInputData} />
    </SubScreenLayout>
  );
}
