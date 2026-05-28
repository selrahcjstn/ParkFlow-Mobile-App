import { ReactNode } from "react";
import { Text, View } from "react-native";

interface HistoryEmptyStateProps {
  icon: ReactNode;
  title: string;
  description: string;
}

export default function HistoryEmptyState({
  icon,
  title,
  description,
}: HistoryEmptyStateProps) {
  return (
    <View className="flex-1 items-center justify-center py-24 px-6">
      {/* Sleek, nested glassmorphic circle container for the icon */}
      <View className="w-20 h-20 rounded-full bg-light-surfaceMuted/50 dark:bg-dark-surfaceMuted/20 items-center justify-center mb-5 border border-light-border/60 dark:border-dark-border/40 shadow-sm">
        <View className="w-14 h-14 rounded-full bg-light-surface dark:bg-dark-surface items-center justify-center border border-light-border/30 dark:border-dark-border/30 shadow-soft">
          {icon}
        </View>
      </View>

      {/* Styled text elements */}
      <Text className="font-heavy text-[16px] mb-1.5 text-light-text dark:text-dark-text text-center">
        {title}
      </Text>
      <Text className="font-regular text-[13px] text-center px-6 text-light-muted dark:text-dark-muted leading-relaxed">
        {description}
      </Text>
    </View>
  );
}

