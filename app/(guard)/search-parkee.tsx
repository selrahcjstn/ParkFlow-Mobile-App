import { router } from "expo-router";
import { ChevronLeft } from "lucide-react-native";
import { Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const tailwindConfig = require("../../tailwind.config");
const THEME_COLORS = tailwindConfig?.theme?.extend?.colors?.light || {};

export default function SearchParkee() {
  return (
    <SafeAreaView className="flex-1 bg-light-primary">
      <View className="bg-light-primary flex-row items-center justify-between px-5 pt-3 pb-4">
        <Text className="text-white text-xl font-extrabold tracking-wider italic">
          ParkFlow
        </Text>
        <Text className="text-white text-xl font-extrabold tracking-wider">
          Search
        </Text>
      </View>

      <View className="flex-1 bg-light-background rounded-t-3xl -mt-1 px-5 pt-4">
        <Pressable
          className="flex-row items-center gap-2"
          onPress={() => router.replace("/(guard)/guard-dashboard")}
        >
          <ChevronLeft
            size={18}
            color={THEME_COLORS.accent}
            strokeWidth={2.5}
          />
          <Text className="text-light-accent text-sm font-semibold">
            Back to Dashboard
          </Text>
        </Pressable>

        <View className="flex-1 items-center justify-center">
          <Text className="text-light-text text-lg font-extrabold">
            Coming soon
          </Text>
          <Text className="text-light-muted text-sm font-medium mt-2 text-center px-8">
            This page is a placeholder for now.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}
