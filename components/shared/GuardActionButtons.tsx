// components/shared/GuardActionButtons.tsx
import { Body, Caption } from "@/components/ui/Typography";
import { ScanQrCode, Search } from "lucide-react-native";
import { TouchableOpacity, View } from "react-native";

interface GuardActionButtonsProps {
  onScan?: () => void;
  onSearch?: () => void;
}

export default function GuardActionButtons({
  onScan,
  onSearch,
}: GuardActionButtonsProps) {
  return (
    <View className="flex-row gap-3 mx-5 mt-4">
      {/* Scan QR */}
      <TouchableOpacity
        onPress={onScan}
        activeOpacity={0.8}
        className="flex-1 bg-light-surface border border-light-border rounded-2xl px-4 py-4 flex-row items-center gap-x-3"
      >
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: 12,
            overflow: "hidden",
            backgroundColor: "#F8F9FA",
            borderWidth: 1,
            borderColor: "#E5E7EB",
          }}
          className="items-center justify-center"
        >
          <ScanQrCode size={20} color="#9D0215" strokeWidth={1.8} />
        </View>
        <View className="gap-y-0.5">
          <Body className="font-black">Scan</Body>
          <Caption className="">QR Code</Caption>
        </View>
      </TouchableOpacity>

      {/* Search Parkee */}
      <TouchableOpacity
        onPress={onSearch}
        activeOpacity={0.8}
        className="flex-1 bg-light-surface border border-light-border rounded-2xl px-4 py-4 flex-row items-center gap-x-3"
      >
        <View className="w-10 h-10 rounded-xl bg-light-background border border-light-border items-center justify-center">
          <Search size={20} color="#9D0215" strokeWidth={1.8} />
        </View>
        <View className="gap-y-0.5">
          <Body className="font-black">Search</Body>
          <Caption>Parkee Info</Caption>
        </View>
      </TouchableOpacity>
    </View>
  );
}
