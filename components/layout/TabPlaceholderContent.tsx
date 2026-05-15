import { Body, Caption, Title } from "@/components/ui/Typography";
import { View } from "react-native";

type TabPlaceholderContentProps = {
  message?: string;
};

export default function TabPlaceholderContent({
  message = "This page is a placeholder for now.",
}: TabPlaceholderContentProps) {
  return (
    <View className="flex-1 items-center justify-center px-4 pb-16">
      <Title className="text-lg text-center">Coming soon</Title>
      <Caption className="mt-2 text-center">{message}</Caption>
      <Body className="text-light-muted text-center mt-4 leading-6">
        Content for this section will be added in a future update.
      </Body>
    </View>
  );
}
