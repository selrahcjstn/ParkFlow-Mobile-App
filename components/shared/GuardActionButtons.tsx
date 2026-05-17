import { Body, Caption } from "@/components/ui/Typography";
import { lightColors } from "@/constants/theme";
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
      <TouchableOpacity
        onPress={onScan}
        activeOpacity={0.85}
        className="flex-1 bg-light-surface border border-light-border rounded-2xl px-4 py-4 flex-row items-center gap-x-3 shadow-sm"
      >
        <View className="w-10 h-10 rounded-xl bg-light-accent/15 items-center justify-center">
          <ScanQrCode size={20} color={lightColors.accent} strokeWidth={1.9} />
        </View>

        <View className="gap-y-0.5">
          <Body className="font-black text-light-text">Scan</Body>
          <Caption className="text-light-muted">QR Code</Caption>
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={onSearch}
        activeOpacity={0.85}
        className="flex-1 bg-light-surface border border-light-border rounded-2xl px-4 py-4 flex-row items-center gap-x-3 shadow-sm"
      >
        <View className="w-10 h-10 rounded-xl bg-light-primary/10 items-center justify-center">
          <Search size={20} color={lightColors.primary} strokeWidth={1.9} />
        </View>

        <View className="gap-y-0.5">
          <Body className="font-black text-light-text">Search</Body>
          <Caption className="text-light-muted">Parkee Info</Caption>
        </View>
      </TouchableOpacity>
    </View>
  );
}
