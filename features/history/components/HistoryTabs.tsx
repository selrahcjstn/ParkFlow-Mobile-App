import { Text, TouchableOpacity, View } from "react-native";

export type HistoryTab = "parking" | "payment";

interface HistoryTabsProps {
  activeTab: HistoryTab;
  onChangeTab: (tab: HistoryTab) => void;
}

export default function HistoryTabs({
  activeTab,
  onChangeTab,
}: HistoryTabsProps) {
  return (
    <View className="flex-row mb-4 border-b border-light-border">
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => onChangeTab("parking")}
        className={`pb-3 mr-6 items-center border-b-2 ${
          activeTab === "parking"
            ? "border-light-primary"
            : "border-transparent"
        }`}
      >
        <Text
          className={`font-heavy text-[14px] ${
            activeTab === "parking" ? "text-light-text" : "text-light-muted"
          }`}
        >
          Parking Log
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => onChangeTab("payment")}
        className={`pb-3 items-center border-b-2 ${
          activeTab === "payment"
            ? "border-light-primary"
            : "border-transparent"
        }`}
      >
        <Text
          className={`font-heavy text-[14px] ${
            activeTab === "payment" ? "text-light-text" : "text-light-muted"
          }`}
        >
          Payment History
        </Text>
      </TouchableOpacity>
    </View>
  );
}
