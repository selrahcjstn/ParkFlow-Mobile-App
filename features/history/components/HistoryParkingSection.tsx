import ParkingHistoryListItem from "@/components/shared/ParkingHistoryListItem";
import { Receipt } from "lucide-react-native";
import {
  ActivityIndicator,
  SectionList,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { ParkingHistoryResponse } from "../types/history.types";
import HistoryEmptyState from "./HistoryEmptyState";

interface SectionItem {
  title: string;
  data: ParkingHistoryResponse[];
}

interface HistoryParkingSectionProps {
  sections: SectionItem[];
  hasMore: boolean;
  loadingMore: boolean;
  onLoadMore: () => void;
  onPressLog: (log: ParkingHistoryResponse) => void;
}

export default function HistoryParkingSection({
  sections,
  hasMore,
  loadingMore,
  onLoadMore,
  onPressLog,
}: HistoryParkingSectionProps) {
  return (
    <SectionList
      sections={sections}
      keyExtractor={(_, index) => `log-${index}`}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: 32 }}
      renderSectionHeader={({ section: { title } }) => (
        <View className="py-2 mt-4 px-1">
          <Text className="text-light-primary font-black text-[12px] uppercase tracking-wider">
            {title}
          </Text>
        </View>
      )}
      renderItem={({ item, index, section }) => {
        const isFirst = index === 0;
        const isLast = index === section.data.length - 1;

        // Dynamically apply corner radiuses to compile standalone section block strips
        let roundingClass = "";
        if (isFirst && isLast) roundingClass = "rounded-2xl";
        else if (isFirst) roundingClass = "rounded-t-2xl";
        else if (isLast) roundingClass = "rounded-b-2xl";

        return (
          <View
            className={`bg-light-surface px-4 ${roundingClass}`}
            style={{ marginBottom: isLast ? 0 : 8 }}
          >
            <ParkingHistoryListItem
              log={item}
              onPress={() => onPressLog(item)}
            />
          </View>
        );
      }}
      ItemSeparatorComponent={null}
      ListEmptyComponent={
        <HistoryEmptyState
          icon={
            <Receipt size={24} className="text-light-muted" strokeWidth={2} />
          }
          title="No Logs Found"
          description="Active entries and cycle logs will list here."
        />
      }
      ListFooterComponent={
        hasMore ? (
          <TouchableOpacity
            onPress={onLoadMore}
            activeOpacity={0.7}
            className="items-center justify-center mt-6 py-2"
          >
            {loadingMore ? (
              <ActivityIndicator size="small" color="#D22730" />
            ) : (
              <Text className="text-light-primary font-heavy text-[14px]">
                Load More Logs
              </Text>
            )}
          </TouchableOpacity>
        ) : null
      }
    />
  );
}
