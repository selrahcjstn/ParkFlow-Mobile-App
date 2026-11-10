import { ReactNode } from "react";
import { Text, TouchableOpacity, View } from "react-native";

interface HistoryEmptyStateProps {
  icon: ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  /** Overrides the default top margin (mt-6). */
  className?: string;
}

/** Thin-bordered panel, no shadow: icon, one headline, one sentence, optional action. */
export default function HistoryEmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  className = "mt-6",
}: HistoryEmptyStateProps) {
  return (
    <View className={`rounded-card border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface px-5 py-8 items-center ${className}`}>
      <View className="w-11 h-11 rounded-button items-center justify-center bg-light-surfaceMuted dark:bg-dark-surfaceMuted mb-3">
        {icon}
      </View>
      <Text className="font-bold text-[15px] text-light-text dark:text-dark-text text-center">
        {title}
      </Text>
      <Text className="font-regular text-[12.5px] text-light-muted dark:text-dark-muted text-center mt-1 leading-relaxed">
        {description}
      </Text>
      {actionLabel && onAction ? (
        <TouchableOpacity
          onPress={onAction}
          activeOpacity={0.8}
          accessibilityRole="button"
          className="mt-4 min-h-[40px] px-4 rounded-button border border-light-border dark:border-dark-border items-center justify-center"
        >
          <Text className="font-bold text-[12.5px] text-light-text dark:text-dark-text">
            {actionLabel}
          </Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}
