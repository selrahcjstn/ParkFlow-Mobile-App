import { Text, View } from "react-native";
import { QrCode } from "lucide-react-native";

interface QRCodeDisplayProps {
  /** Optional label shown below the QR graphic */
  label?: string;
}

/**
 * Large centred QR-code placeholder card.
 * In production this would render a real QR code image;
 * for now it shows a large Lucide QrCode icon.
 */
export default function QRCodeDisplay({ label }: QRCodeDisplayProps) {
  return (
    <View className="items-center py-6 px-5">
      <View className="w-56 h-56 rounded-2xl bg-light-surface border-2 border-light-border items-center justify-center shadow-sm">
        <QrCode size={160} color="#111827" strokeWidth={1} />
      </View>
      {label && (
        <Text className="text-light-muted text-xs mt-3 font-medium">
          {label}
        </Text>
      )}
    </View>
  );
}
