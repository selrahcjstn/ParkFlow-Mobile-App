import { Text, View } from "react-native";

type TabPlaceholderContentProps = {
  message?: string;
};

export default function TabPlaceholderContent({
  message = "This page is a placeholder for now.",
}: TabPlaceholderContentProps) {
  return (
    <View className="flex-1 items-center justify-center px-4 pb-16">
      <Text className="font-black text-lg text-center text-light-text">Coming soon</Text>
      <Text className="font-light text-base leading-5 mt-2 text-center text-light-muted">{message}</Text>
      <Text className="font-regular text-base text-light-muted text-center mt-4 leading-6">
        Content for this section will be added in a future update.
      </Text>
    </View>
  );
}
