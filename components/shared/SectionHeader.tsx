import { Text, View } from "react-native";

interface SectionHeaderProps {
  title: string;
  containerClassName?: string;
  textClassName?: string;
}

export default function SectionHeader({
  title,
  containerClassName = "mt-6",
  textClassName = "text-[18px] leading-6",
}: SectionHeaderProps) {
  return (
    <View className={containerClassName}>
      <Text className={`text-light-text font-black ${textClassName}`}>
        {title}
      </Text>
    </View>
  );
}
