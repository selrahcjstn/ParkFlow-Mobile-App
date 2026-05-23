import { Title } from "@/components/ui/Typography";
import type { ReactNode } from "react";
import { View } from "react-native";
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
        <Title className="text-light-text text-xl font-extrabold text-center">
          {title}
        </Title>
        <View className="flex-1 mt-4">{children}</View>
      </View>
    </ContentWrapper>
  );
}
