import SubScreenLayout from "@/components/layouts/SubScreenLayout";
import { router } from "expo-router";
import { View, Text } from "react-native";
import { Hammer } from "lucide-react-native";
import { useAppTheme } from "@/hooks/useAppTheme";

export default function ManualInput() {
  const { colors } = useAppTheme();
  
  return (
    <SubScreenLayout title="Manual Input" onBack={() => router.back()}>
      <View className="flex-1 items-center justify-center px-6 bg-light-background dark:bg-dark-background">
        <View className="w-16 h-16 rounded-[22px] bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border items-center justify-center shadow-soft mb-5">
          <Hammer size={32} color={colors.primary} strokeWidth={2} />
        </View>
        <Text className="text-light-text dark:text-dark-text font-black text-[18px] text-center tracking-tight mb-2">
          Feature Under Development
        </Text>
        <Text className="text-light-muted dark:text-dark-muted font-regular text-[13px] text-center leading-[20px] max-w-[280px]">
          The manual plate verification feature is currently being designed and will be available in a future update.
        </Text>
      </View>
    </SubScreenLayout>
  );
}
