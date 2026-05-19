import DetailRow, { type DetailRowProps } from "@/components/layout/DetailRow";
import SectionCard from "@/components/layout/SectionCard";
import { AppButton } from "@/components/ui";
import { Body, Title } from "@/components/ui/Typography";
import { X } from "lucide-react-native";
import React from "react";
import { ScrollView, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function ScanResultLayout({
  plateNumber,
  plateLabel = "Plate Number",
  subText,
  ownerRows,
  sessionRows,
  statusRow,
  footerMessage,
  footerLabel = "Okay",
  onBack,
  onFooterPress,
}: {
  plateNumber: string;
  plateLabel?: string;
  subText?: string;
  ownerRows: DetailRowProps[];
  sessionRows: DetailRowProps[];
  statusRow: DetailRowProps;
  footerMessage?: string;
  footerLabel?: string;
  onBack?: () => void;
  onFooterPress?: () => void;
}) {
  const insets = useSafeAreaInsets();

  const handleBack = () => {
    if (onBack) onBack();
    // intentionally do not perform routing here; parent should control navigation
  };

  return (
    <View className="flex-1 bg-light-background">
      <View
        style={{ paddingTop: Math.max(insets.top, 16) }}
        className="bg-light-background px-4 pb-2 flex-row justify-start items-center z-10"
      >
        <TouchableOpacity
          onPress={handleBack}
          className="w-10 h-10 -ml-2 items-center justify-center rounded-full"
        >
          <X size={28} color="#111827" />
        </TouchableOpacity>
      </View>

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingBottom: 24,
          paddingTop: 8,
        }}
      >
        <View className="items-center mb-8">
          <Body className="text-light-muted font-book uppercase tracking-[0.15em] mb-1.5 text-[10px]">
            {plateLabel}
          </Body>
          <Title className="text-light-text font-black text-[28px] leading-[36px] text-center">
            {plateNumber}
          </Title>
          {subText ? (
            <Body className="text-light-muted font-book mt-1.5 text-[12px]">
              {subText}
            </Body>
          ) : null}
        </View>

        <SectionCard title="Owner">
          {ownerRows.map((r, i) => (
            <DetailRow key={i} {...r} />
          ))}
        </SectionCard>

        <SectionCard title="Session">
          {sessionRows.map((r, i) => (
            <DetailRow key={i} {...r} />
          ))}
        </SectionCard>

        <View className="mb-4 bg-light-surface rounded-2xl px-4 py-1">
          <DetailRow {...statusRow} />
        </View>
      </ScrollView>

      <View
        className="px-4 pt-2 bg-light-background"
        style={{ paddingBottom: Math.max(insets.bottom, 24) }}
      >
        {footerMessage ? (
          <Body className="text-light-muted font-book text-center px-4 text-[13px] mb-4 leading-[18px]">
            {footerMessage}
          </Body>
        ) : null}

        <AppButton
          label={footerLabel}
          variant="primary"
          size="lg"
          onPress={onFooterPress ?? handleBack}
        />
      </View>
    </View>
  );
}
