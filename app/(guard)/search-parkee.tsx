import { lightColors } from "@/constants/theme";
import { Body, Caption, Title } from "@/components/ui/Typography";
import { router } from "expo-router";
import { ChevronLeft } from "lucide-react-native";
import { Pressable, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function SearchParkee() {
  return (
    <SafeAreaView className="flex-1 bg-light-primary">
      <View className="bg-light-primary flex-row items-center justify-between px-5 pt-3 pb-4">
        <Title className="text-white text-xl tracking-wider italic">ParkFlow</Title>
        <Title className="text-white text-xl tracking-wider">Search</Title>
      </View>

      <View className="flex-1 bg-light-background rounded-t-3xl -mt-1 px-5 pt-4">
        <Pressable
          className="flex-row items-center gap-2"
          onPress={() => router.replace("/(guard)/guard-dashboard")}
        >
          <ChevronLeft
            size={18}
            color={lightColors.accent}
            strokeWidth={2.5}
          />
          <Body className="text-light-accent font-semibold">
            Back to Dashboard
          </Body>
        </Pressable>

        <View className="flex-1 items-center justify-center">
          <Title className="text-lg">Coming soon</Title>
          <Caption className="mt-2 text-center px-8">
            This page is a placeholder for now.
          </Caption>
        </View>
      </View>
    </SafeAreaView>
  );
}
