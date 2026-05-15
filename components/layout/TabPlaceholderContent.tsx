import { Body, Caption, Title } from "@/components/ui/Typography";
import { View } from "react-native";

type TabPlaceholderContentProps = {
  title?: string;
  message?: string;
};

export default function TabPlaceholderContent({
  title = "Coming soon",
  message = "This page is a placeholder for now.",
}: TabPlaceholderContentProps) {
  return (
    <View className="flex-1 items-center justify-center px-8 pb-16">
      <Title className="text-lg text-center">{title}</Title>
      <Caption className="mt-2 text-center">{message}</Caption>
      <Body className="text-light-muted text-center mt-4 leading-6">
        Content for this section will be added in a future update.
      </Body>
    </View>
  );
}
