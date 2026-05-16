import { Title } from "@/components/ui/Typography";
import { lightColors } from "@/constants/theme";
import { ChevronLeft } from "lucide-react-native";
import type { ReactNode } from "react";
import { Pressable, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type SubScreenLayoutProps = {
  title: string;
  onBack: () => void;
  children: ReactNode;
};

/** Stack screen pushed from home — title top-left with back control. */
export default function SubScreenLayout({
  title,
  onBack,
  children,
}: SubScreenLayoutProps) {
  return (
    <SafeAreaView className="flex-1 bg-light-background" edges={["top"]}>
      <View className="flex-1 pt-4">
        <View className="px-5">
          <Pressable
            className="flex-row items-center gap-2 self-start"
            onPress={onBack}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <ChevronLeft
              size={20}
              color={lightColors.accent}
              strokeWidth={2.5}
            />
            <Title className="text-light-text text-xl font-extrabold">
              {title}
            </Title>
          </Pressable>
        </View>
        <View className="flex-1 mt-4">{children}</View>
      </View>
    </SafeAreaView>
  );
}
