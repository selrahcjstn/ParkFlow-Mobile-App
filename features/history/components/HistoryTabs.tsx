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
    <View className="flex-row p-1 rounded-card bg-light-surface">
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => onChangeTab("parking")}
        className={`flex-1 py-2 rounded-card items-center justify-center ${
          activeTab === "parking" ? "bg-light-accent" : ""
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
              ? "text-light-textInverse font-black"
              : "text-light-muted font-medium"
          }`}
        >
          Parking Log
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => onChangeTab("payment")}
        className={`flex-1 py-2 rounded-card items-center justify-center ${
          activeTab === "payment" ? "bg-light-accent" : ""
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
              ? "text-light-textInverse font-black"
              : "text-light-muted font-medium"
          }`}
        >
          Payment History
        </Text>
      </TouchableOpacity>
    </View>
  );
}
