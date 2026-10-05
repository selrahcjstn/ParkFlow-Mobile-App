import { formatDate } from "@/utils/formatDate";
import { FileText } from "lucide-react-native";
import React from "react";
import { Text, View } from "react-native";
import HistoryTabs, { HistoryTab } from "./HistoryTabs";

interface HistoryHeaderProps {
  activeTab: HistoryTab;
  onChangeTab: (tab: HistoryTab) => void;
  generatedAt: string | null;
}

export default function HistoryHeader({
  activeTab,
  onChangeTab,
  generatedAt,
}: HistoryHeaderProps) {
  const displayGeneratedAt = generatedAt || "2026-05-23T12:51:11.470Z";

  return (
    <View className="bg-light-background dark:bg-dark-background pt-4 pb-3 z-10 -mx-4 px-4 border-b border-light-border dark:border-dark-border">
      <View className="-mx-1">
        <HistoryTabs activeTab={activeTab} onChangeTab={onChangeTab} />
      </View>

      {displayGeneratedAt && (
        <View className="mt-5 flex-row items-center justify-between px-1">
          <Text
            className="font-book text-[14px] text-light-text dark:text-dark-text"
            style={{ letterSpacing: 0.5 }}
          >
            As of {formatDate(displayGeneratedAt)}
          </Text>
          <FileText size={16} color="#7B1113" strokeWidth={2.2} />
        </View>
      )}
    </View>
  );
}
