import { formatDate } from "@/utils/formatDate";
import { FileText } from "lucide-react-native";
import React from "react";
import { Text, View } from "react-native";
import HistoryTabs, { HistoryTab } from "./HistoryTabs";

interface HistoryHeaderProps {
  activeTab: HistoryTab;
  onChangeTab: (tab: HistoryTab) => void;
  isScrolled: boolean;
  generatedAt: string | null;
}

export default function HistoryHeader({
  activeTab,
  onChangeTab,
  isScrolled,
  generatedAt,
}: HistoryHeaderProps) {
  const displayGeneratedAt = generatedAt || "2026-05-23T12:51:11.470Z";

  return (
    <View
      className="bg-light-background pb-3 z-10 -mx-4 px-4"
      style={
        isScrolled
          ? {
              borderBottomWidth: 1,
              borderBottomColor: "#E5E7EB",
              borderTopWidth: 0,
              borderLeftWidth: 0,
              borderRightWidth: 0,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.04,
              shadowRadius: 2.2,
              elevation: 0,
            }
          : {
              borderBottomWidth: 0,
              borderTopWidth: 0,
              borderLeftWidth: 0,
              borderRightWidth: 0,
              elevation: 0,
            }
      }
    >
      <View className="-mx-1">
        <HistoryTabs activeTab={activeTab} onChangeTab={onChangeTab} />
      </View>
      {displayGeneratedAt && (
        <View className="mt-5 flex-row items-center justify-between px-1">
          <Text
            className="font-medium text-[14px] text-light-text"
            style={{ letterSpacing: 0.5 }}
          >
            As of {formatDate(displayGeneratedAt)}
          </Text>
          <FileText size={16} color="#D22730" strokeWidth={2.2} />
        </View>
      )}
    </View>
  );
}
