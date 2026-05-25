import { QuickActionCard, SectionHeader } from "@/components/shared";
import { Keyboard, ScanLine } from "lucide-react-native";
import { View } from "react-native";

interface GuardActionButtonsProps {
  onScan?: () => void;
  onSearch?: () => void;
}

export default function GuardActionButtons({
  onScan,
  onSearch,
}: GuardActionButtonsProps) {
  return (
    <View className="mt-6">
      <SectionHeader title="Quick Actions" containerClassName="mb-3 px-1" />
      <View className="flex-row gap-3">
        <QuickActionCard
          onPress={onScan}
          title="Scan QR Code"
          subtitle="Quick automated entry"
          icon={<ScanLine size={22} color="#D22730" strokeWidth={2.2} />}
          className="flex-1 min-h-[130px]"
          iconContainerClassName="bg-light-primary/10"
        />

        <QuickActionCard
          onPress={onSearch}
          title="Manual Input"
          subtitle="Type plate number for entry"
          icon={<Keyboard size={22} color="#FDB813" strokeWidth={2.2} />}
          className="flex-1 min-h-[130px]"
          iconContainerClassName="bg-light-accent/15"
        />
      </View>
    </View>
  );
}
