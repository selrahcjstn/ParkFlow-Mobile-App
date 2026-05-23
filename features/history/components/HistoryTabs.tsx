import { Label } from "@/components/ui/Typography";
import { TouchableOpacity, View } from "react-native";

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
    <View className="flex-row bg-light-surface p-1 rounded-full">
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => onChangeTab("parking")}
        className={`flex-1 py-2 rounded-full items-center justify-center ${
          activeTab === "parking" ? "bg-light-background" : ""
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
        <Label
          className={`text-[13px] tracking-wide ${
            activeTab === "parking"
              ? "text-light-text font-black"
              : "text-light-muted"
          }`}
        >
          Parking Log
        </Label>
      </TouchableOpacity>

      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => onChangeTab("payment")}
        className={`flex-1 py-2 rounded-full items-center justify-center ${
          activeTab === "payment" ? "bg-light-background" : ""
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
        <Label
          className={`text-[13px] tracking-wide ${
            activeTab === "payment"
              ? "text-light-text font-black"
              : "text-light-muted"
          }`}
        >
          Payment History
        </Label>
      </TouchableOpacity>
    </View>
  );
}


