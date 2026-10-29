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
    <View className="flex-row p-1 rounded-card bg-light-surface dark:bg-dark-surfaceMuted">
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => onChangeTab("parking")}
        className={`flex-1 py-2 rounded-card items-center justify-center ${
          activeTab === "parking" ? "bg-light-accent dark:bg-dark-surfaceLighter" : ""
        }`}
        style={
          activeTab === "parking"
            ? {
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.08,
                shadowRadius: 1.5,
                elevation: 2,
              }
            : undefined
        }
      >
        <Text
          className={`text-[13px] tracking-wide ${
            activeTab === "parking"
              ? "text-light-textInverse dark:text-dark-text font-bold"
              : "text-light-muted dark:text-dark-muted font-book"
          }`}
        >
          Parking Log
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => onChangeTab("payment")}
        className={`flex-1 py-2 rounded-card items-center justify-center ${
          activeTab === "payment" ? "bg-light-accent dark:bg-dark-surfaceLighter" : ""
        }`}
        style={
          activeTab === "payment"
            ? {
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.08,
                shadowRadius: 1.5,
                elevation: 2,
              }
            : undefined
        }
      >
        <Text
          className={`text-[13px] tracking-wide ${
            activeTab === "payment"
              ? "text-light-textInverse dark:text-dark-text font-bold"
              : "text-light-muted dark:text-dark-muted font-book"
          }`}
        >
          Payment History
        </Text>
      </TouchableOpacity>
    </View>
  );
}
