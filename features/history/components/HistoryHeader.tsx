import { Text, View } from "react-native";

interface HistoryHeaderProps {
  title: string;
  subtitle: string;
}

export default function HistoryHeader({ title, subtitle }: HistoryHeaderProps) {
  return (
    <View className="mb-6">
      <Text className="text-light-text text-[26px] font-black tracking-tight">
        {title}
      </Text>
      <Text className="text-light-muted font-book text-[14px] mt-0.5">
        {subtitle}
      </Text>
    </View>
  );
}
