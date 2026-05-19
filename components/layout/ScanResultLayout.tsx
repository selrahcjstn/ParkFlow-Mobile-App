import DetailRow, { type DetailRowProps } from "@/components/layout/DetailRow";
import SectionCard from "@/components/layout/SectionCard";
import { AppButton } from "@/components/ui";
import { Body, Title } from "@/components/ui/Typography";
import { X } from "lucide-react-native";
import React from "react";
import { ScrollView, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function ScanResultLayout({
  ownerRows,
  sessionRows,
  statusTitle,
  statusDescription,
  statusColorClass,
  statusIcon,
  footerMessage,
  footerLabel = "Okay",
  onBack,
  onFooterPress,
}: {
  ownerRows: DetailRowProps[];
  sessionRows: DetailRowProps[];
  statusTitle?: string;
  statusDescription?: React.ReactNode | string; // Changed to accept JSX for bold text
  statusColorClass?: string;
  statusIcon?: React.ReactNode;
  footerMessage?: string;
  footerLabel?: string;
  onBack?: () => void;
  onFooterPress?: () => void;
}) {
  const insets = useSafeAreaInsets();

  const handleBack = () => {
    if (onBack) onBack();
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
          paddingTop: 12,
        }}
      >
        <View className="items-center mb-8 px-4">
          {statusIcon && <View className="mb-4">{statusIcon}</View>}

          {statusTitle && (
            <Title
              className={`font-black text-[20px] leading-[26px] text-center mb-2 ${statusColorClass}`}
            >
              {statusTitle}
            </Title>
          )}

          {/* Renders the rich text JSX securely */}
          {statusDescription &&
            (typeof statusDescription === "string" ? (
              <Body className="text-light-muted font-book text-[13px] leading-[18px] text-center px-4">
                {statusDescription}
              </Body>
            ) : (
              <View className="px-4">{statusDescription}</View>
            ))}
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
