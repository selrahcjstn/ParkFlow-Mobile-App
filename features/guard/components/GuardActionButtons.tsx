import { ChevronRight, Keyboard, ScanLine } from "lucide-react-native";
import { Text, TouchableOpacity, View } from "react-native";

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
        <Text className="text-light-text font-black text-[18px] leading-6">
          Quick Actions
        </Text>
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
          <Text className="text-light-text font-black text-[16px] leading-6">
            Scan QR Code
          </Text>
          <Text className="text-light-muted font-regular text-[13px] mt-0.5 leading-4">
            Quick automated entry
          </Text>
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
          <Text className="text-light-text font-black text-[16px] leading-6">
            Manual Input
          </Text>
          <Text className="text-light-muted font-regular text-[13px] mt-0.5 leading-4">
            Enter plate number for entry
          </Text>
        </View>

        <ChevronRight size={20} color="#94A3B8" strokeWidth={2} />
      </TouchableOpacity>
    </View>
  );
}
