import { Title } from "@/components/ui/Typography";
import type { ReactNode } from "react";
import { View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type TabScreenLayoutProps = {
  title: string;
  children: ReactNode;
};

export default function TabScreenLayout({
  title,
  children,
}: TabScreenLayoutProps) {
  return (
    <SafeAreaView className="flex-1 bg-light-background" edges={["top"]}>
      <View className="flex-1 px-5 pt-4">
        <Title className="text-light-text text-xl font-extrabold">
          {title}
        </Title>
        <View className="flex-1 mt-6">{children}</View>
      </View>
    </SafeAreaView>
  );
}
