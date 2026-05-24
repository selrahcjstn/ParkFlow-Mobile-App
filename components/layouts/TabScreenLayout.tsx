import type { ReactNode } from "react";
import { Text, View } from "react-native";
import ContentWrapper from "./ContentWrapper";

type TabScreenLayoutProps = {
  title: string;
  children: ReactNode;
};

export default function TabScreenLayout({
  title,
  children,
}: TabScreenLayoutProps) {
  return (
    <ContentWrapper>
      <View className="flex-1 pt-4">
        <Text className="font-black text-xl text-center text-light-text">
          {title}
        </Text>
        <View className="flex-1 mt-4">{children}</View>
      </View>
    </ContentWrapper>
  );
}
