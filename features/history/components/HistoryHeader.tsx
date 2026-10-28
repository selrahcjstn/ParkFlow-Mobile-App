import { formatDate } from "@/utils/formatDate";
import { useAppTheme } from "@/hooks/useAppTheme";
import { FileText } from "lucide-react-native";
import React from "react";
import { Text, View } from "react-native";

interface HistoryHeaderProps {
  generatedAt: string | null;
}

export default function HistoryHeader({
  generatedAt,
}: HistoryHeaderProps) {
  const { colors } = useAppTheme();
  const displayGeneratedAt = generatedAt;

  return (
    <View className="bg-light-background dark:bg-dark-background pt-4 pb-3 z-10 -mx-4 px-4 border-b border-light-border dark:border-dark-border">

      {displayGeneratedAt && (
        <View className="mt-5 flex-row items-center justify-between px-1">
          <Text
            className="font-book text-[14px] text-light-text dark:text-dark-text"
            style={{ letterSpacing: 0.5 }}
          >
            As of {formatDate(displayGeneratedAt)}
          </Text>
          <FileText size={16} color={colors.primary} strokeWidth={2.2} />
        </View>
      )}
    </View>
  );
}
