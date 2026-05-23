import { Caption, Label } from "@/components/ui/Typography";
import { ReactNode } from "react";
import { View } from "react-native";

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
    <View className="flex-1 items-center justify-center py-24">
      <View className="w-14 h-14 rounded-full bg-light-surfaceSoft items-center justify-center mb-4">
        {icon}
      </View>
      <Label className="text-[15px] mb-1">
        {title}
      </Label>
      <Caption className="text-[13px] text-center px-8">
        {description}
      </Caption>
    </View>
  );
}
