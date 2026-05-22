import { Body, Title } from "@/components/ui/Typography";
import { ChevronRight, Keyboard, ScanLine } from "lucide-react-native";
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
    <View className="mt-6 ">
      {/* ── Section Label ── */}
      <View className="mb-3 px-1">
        <Title className="text-light-text font-black text-[18px]">
          Quick Actions
        </Title>
      </View>

      {/* ── Action 1: Scan ── */}
      <TouchableOpacity
        onPress={onScan}
        activeOpacity={0.7}
        className="bg-light-surface rounded-2xl p-4 flex-row items-center mb-3"
      >
        <View className="w-12 h-12 rounded-full bg-light-primary/10 items-center justify-center mr-4">
          <ScanLine size={24} color="#D22730" strokeWidth={2} />
        </View>

        <View className="flex-1">
          <Body className="text-light-text font-black text-[16px]">
            Scan QR Code
          </Body>
          <Body className="text-light-muted font-book text-[13px] mt-0.5">
            Quick automated entry
          </Body>
        </View>

        <ChevronRight size={20} color="#94A3B8" strokeWidth={2} />
      </TouchableOpacity>

      {/* ── Action 2: Manual Input ── */}
      <TouchableOpacity
        onPress={onSearch}
        activeOpacity={0.7}
        className="bg-light-surface rounded-2xl p-4 flex-row items-center"
      >
        <View className="w-12 h-12 rounded-full bg-light-accent/15 items-center justify-center mr-4">
          <Keyboard size={24} color="#FDB813" strokeWidth={2} />
        </View>

        <View className="flex-1">
          <Body className="text-light-text font-black text-[16px]">
            Manual Input
          </Body>
          <Body className="text-light-muted font-book text-[13px] mt-0.5">
            Enter plate number for entry
          </Body>
        </View>

        <ChevronRight size={20} color="#94A3B8" strokeWidth={2} />
      </TouchableOpacity>
    </View>
  );
}
