import { Text, TouchableOpacity, View } from "react-native";

export type HistoryTab = "parking" | "payment";

interface HistoryTabsProps {
  activeTab: HistoryTab;
  onChangeTab: (tab: HistoryTab) => void;
}

const TABS: Array<{ id: HistoryTab; label: string }> = [
  { id: "parking", label: "Parking Log" },
  { id: "payment", label: "Payment History" },
];

/** Segmented control: thin border, no shadow. */
export default function HistoryTabs({ activeTab, onChangeTab }: HistoryTabsProps) {
  return (
    <View className="flex-row p-1 rounded-card bg-light-surfaceMuted dark:bg-dark-surfaceMuted border border-light-border dark:border-dark-border">
      {TABS.map((tab) => {
        const active = activeTab === tab.id;
        return (
          <TouchableOpacity
            key={tab.id}
            activeOpacity={0.8}
            onPress={() => onChangeTab(tab.id)}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            className={`flex-1 py-2 rounded-button items-center justify-center border ${
              active
                ? "bg-light-surface dark:bg-dark-surface border-light-border dark:border-dark-border"
                : "border-transparent"
            }`}
          >
            <Text
              className={`text-[13px] ${
                active
                  ? "text-light-text dark:text-dark-text font-bold"
                  : "text-light-muted dark:text-dark-muted font-book"
              }`}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
