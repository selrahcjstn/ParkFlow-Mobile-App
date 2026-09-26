import { Text, View } from "react-native";

interface DashboardSectionHeaderProps {
  title: string;
  containerClassName?: string;
  textClassName?: string;
}

export default function DashboardSectionHeader({
  title,
  containerClassName = "mt-6",
  textClassName = "text-[18px] leading-6",
}: DashboardSectionHeaderProps) {
  return (
    <View className={containerClassName}>
      <Text className={`text-light-text dark:text-dark-text font-black ${textClassName}`}>
        {title}
      </Text>
    </View>
  );
}
