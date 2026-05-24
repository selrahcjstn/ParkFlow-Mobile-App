import { SystemMessageCard } from "@/components/shared";
import { AppButton } from "@/components/ui";
import { ChevronLeft, X, XCircle } from "lucide-react-native";
import React from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type QrScanErrorCardProps = {
  message: string;
  onRetry?: () => void;
  onBack?: () => void;
  backIconType?: "close" | "back";
};

export default function ScanErrorPage({
  message,
  onRetry,
  onBack,
  backIconType = "close",
}: QrScanErrorCardProps) {
  const insets = useSafeAreaInsets();
  const handleBack = () => {
    if (onBack) onBack();
  };

  return (
    <View className="flex-1 bg-light-background">
      {/* ── Header Row (Back/Close Actions) ── */}
      <View
        style={{ paddingTop: Math.max(insets.top, 16) }}
        className="bg-light-background px-4 pb-2 flex-row justify-start items-center z-10"
      >
        {onBack && (
          <TouchableOpacity
            onPress={handleBack}
            className="w-10 h-10 -ml-2 items-center justify-center rounded-full"
          >
            {backIconType === "back" ? (
              <ChevronLeft size={28} color="#111827" />
            ) : (
              <X size={28} color="#111827" />
            )}
          </TouchableOpacity>
        )}
      </View>

      {/* ── Main Content Area ── */}
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingBottom: 24,
          paddingTop: 12,
        }}
      >
        {/* Card background styling removed entirely */}
        <View className="p-2">
          {/* Icon */}
          <View className="items-center mb-4">
            <XCircle size={56} color="#EF4444" strokeWidth={2.5} />
          </View>

          {/* Heading Blocks */}
          <View className="items-center mb-6 px-4">
            <Text className="font-black text-[20px] leading-[26px] text-center text-light-danger mb-2">
              Entry Denied
            </Text>

            <Text className="text-light-muted font-regular text-[13px] leading-[18px] text-center">
              The credentials or authentication token presented could not be
              validated for entry.
            </Text>
          </View>

          {/* Textarea-Style Error Box */}
          <SystemMessageCard message={message} variant="danger" />
        </View>
      </ScrollView>

      {/* ── Perfectly Aligned Sticky Footer Section ── */}
      <View
        className="px-4 pt-2 bg-light-background"
        style={{ paddingBottom: Math.max(insets.bottom, 24) }}
      >
        <Text className="text-light-muted font-regular text-center px-4 text-[13px] mb-4 leading-[18px]">
          Scan Error: Verify the driver’s identity before granting access to the
          facility.
        </Text>

        <AppButton
          label={onRetry ? "Try Again" : "Okay"}
          variant={onRetry ? "primary" : "outline"}
          size="lg"
          onPress={onRetry ?? handleBack}
        />
      </View>
    </View>
  );
}
