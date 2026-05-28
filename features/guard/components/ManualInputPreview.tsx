import { Text, View } from "react-native";

export interface ManualInputPreviewData {
  plateNumber: string;
  vehicleType: string;
  brand: string;
  color: string;
  ownerName: string;
  status: string;
  notes: string;
}

interface ManualInputPreviewProps {
  data: ManualInputPreviewData;
}

export default function ManualInputPreview({ data }: ManualInputPreviewProps) {
  return (
    <View className="mt-4 rounded-3xl bg-light-surface">
      <Text className="text-light-text font-black text-[18px] leading-6">
        Dummy Manual Inputs
      </Text>
      <Text className="text-light-muted font-regular text-[12px] mt-1">
        Preview data passed from the parent screen.
      </Text>

      <View className="mt-4 gap-3">
        <View>
          <Text className="text-light-muted font-regular text-[11px] uppercase tracking-wide">
            Plate Number
          </Text>
          <Text className="text-light-text font-heavy text-[15px] mt-0.5">
            {data.plateNumber}
          </Text>
        </View>

        <View className="flex-row gap-3">
          <View className="flex-1">
            <Text className="text-light-muted font-regular text-[11px] uppercase tracking-wide">
              Vehicle Type
            </Text>
            <Text className="text-light-text font-heavy text-[14px] mt-0.5">
              {data.vehicleType}
            </Text>
          </View>
          <View className="flex-1">
            <Text className="text-light-muted font-regular text-[11px] uppercase tracking-wide">
              Brand
            </Text>
            <Text className="text-light-text font-heavy text-[14px] mt-0.5">
              {data.brand}
            </Text>
          </View>
        </View>

        <View className="flex-row gap-3">
          <View className="flex-1">
            <Text className="text-light-muted font-regular text-[11px] uppercase tracking-wide">
              Color
            </Text>
            <Text className="text-light-text font-heavy text-[14px] mt-0.5">
              {data.color}
            </Text>
          </View>
          <View className="flex-1">
            <Text className="text-light-muted font-regular text-[11px] uppercase tracking-wide">
              Status
            </Text>
            <Text className="text-light-text font-heavy text-[14px] mt-0.5">
              {data.status}
            </Text>
          </View>
        </View>

        <View>
          <Text className="text-light-muted font-regular text-[11px] uppercase tracking-wide">
            Owner
          </Text>
          <Text className="text-light-text font-heavy text-[14px] mt-0.5">
            {data.ownerName}
          </Text>
        </View>

        <View>
          <Text className="text-light-muted font-regular text-[11px] uppercase tracking-wide">
            Notes
          </Text>
          <Text className="text-light-text font-regular text-[13px] mt-0.5 leading-5">
            {data.notes}
          </Text>
        </View>
      </View>
    </View>
  );
}
