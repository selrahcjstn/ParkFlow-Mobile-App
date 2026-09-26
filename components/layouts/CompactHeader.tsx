import { Text, View } from "react-native";

interface CompactHeaderProps {
  title?: string;
}

export default function CompactHeader({
  title = "ParkFlow",
}: CompactHeaderProps) {
  return (
    <View className="bg-light-background dark:bg-dark-background px-6 pt-4 pb-3 items-center">
      <Text className="font-black text-2xl leading-8 tracking-wide text-light-text dark:text-dark-text">
        {title}
      </Text>
    </View>
  );
}
