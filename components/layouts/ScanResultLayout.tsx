import DetailRow, { type DetailRowProps } from "@/components/layouts/DetailRow";
import SectionCard from "@/components/layouts/SectionCard";
import { AppButton } from "@/components/ui";
import { ChevronLeft, X } from "lucide-react-native";
import React, { useState } from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAppTheme } from "@/hooks/useAppTheme";

export default function ScanResultLayout({
  ownerRows,
  sessionRows,
  statusTitle,
  statusDescription,
  statusColorClass,
  statusIcon,
  footerMessage,
  footerLabel = "Okay",
  footerButtonVariant = "primary",
  footerButtonLoading = false,
  backIconType = "close",
  ownerTitle = "Owner",
  sessionTitle = "Session Details",
  showBorderOnScroll = true,
  onBack,
  onFooterPress,
  children,
}: {
  ownerRows: DetailRowProps[];
  sessionRows: DetailRowProps[];
  statusTitle?: string;
  statusDescription?: React.ReactNode | string; // Changed to accept JSX for bold text
  statusColorClass?: string;
  statusIcon?: React.ReactNode;
  footerMessage?: React.ReactNode | string;
  footerLabel?: string;
  footerButtonVariant?:
    | "primary"
    | "secondary"
    | "outline"
    | "ghost"
    | "danger";
  footerButtonLoading?: boolean;
  backIconType?: "close" | "back";
  ownerTitle?: string;
  sessionTitle?: string;
  showBorderOnScroll?: boolean;
  onBack?: () => void;
  onFooterPress?: () => void;
  children?: React.ReactNode;
}) {
  const insets = useSafeAreaInsets();
  const { isDark } = useAppTheme();
  const [hasScrolled, setHasScrolled] = useState(false);
  const backColor = isDark ? "#FAFAFA" : "#111827";

  const handleBack = () => {
    if (onBack) onBack();
  };

  const handleScroll = (event: any) => {
    const yOffset = event?.nativeEvent?.contentOffset?.y;
    if (yOffset !== undefined && yOffset !== null) {
      const scrolled = yOffset > 0;
      setHasScrolled((prev) => {
        if (prev !== scrolled) {
          return scrolled;
        }
        return prev;
      });
    }
  };

  const showBorder = showBorderOnScroll && hasScrolled;

  return (
    <View className="flex-1 bg-light-background dark:bg-dark-background">
      <View
        style={[
          { paddingTop: Math.max(insets.top, 16) },
          showBorder && {
            borderBottomWidth: 1,
            borderBottomColor: isDark ? "#3A3C43" : "#E5E7EB",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.05,
            shadowRadius: 2,
            elevation: 2,
          },
        ]}
        className="bg-light-background dark:bg-dark-background px-4 pb-3 flex-row justify-start items-center z-10"
      >
        {onBack && (
          <TouchableOpacity
            onPress={handleBack}
            className="w-10 h-10 -ml-2 items-center justify-center rounded-full"
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            {backIconType === "back" ? (
              <ChevronLeft size={28} color={backColor} />
            ) : (
              <X size={28} color={backColor} />
            )}
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingBottom: 24,
          paddingTop: 12,
        }}
      >
        <View className="items-center mb-8 px-4">
          {statusIcon && <View className="mb-4">{statusIcon}</View>}

          {statusTitle && (
            <Text
              className={`font-black text-[20px] leading-[26px] text-center mb-2 ${statusColorClass}`}
            >
              {statusTitle}
            </Text>
          )}

          {/* Renders the rich text JSX securely */}
          {statusDescription &&
            (typeof statusDescription === "string" ? (
              <Text className="text-light-muted font-regular text-[13px] leading-[18px] text-center px-4">
                {statusDescription}
              </Text>
            ) : (
              <View className="px-4">{statusDescription}</View>
            ))}
        </View>

        {ownerRows && ownerRows.length > 0 && (
          <SectionCard title={ownerTitle}>
            {ownerRows.map((r, i) => (
              <DetailRow key={i} {...r} />
            ))}
          </SectionCard>
        )}

        {children}

        {sessionRows && sessionRows.length > 0 && (
          <SectionCard title={sessionTitle}>
            {sessionRows.map((r, i) => (
              <DetailRow key={i} {...r} />
            ))}
          </SectionCard>
        )}
      </ScrollView>

      <View
        className="px-4 pt-4 bg-light-background dark:bg-dark-background border-t border-light-border dark:border-dark-border"
        style={{ paddingBottom: Math.max(insets.bottom, 24) }}
      >
        {footerMessage ? (
          typeof footerMessage === "string" ? (
            <Text className="text-light-muted font-regular text-center px-4 text-[13px] mb-4 leading-[18px]">
              {footerMessage}
            </Text>
          ) : (
            footerMessage
          )
        ) : null}

        <AppButton
          label={footerLabel}
          variant={footerButtonVariant}
          size="lg"
          loading={footerButtonLoading}
          onPress={onFooterPress ?? handleBack}
        />
      </View>
    </View>
  );
}
