import { ContentWrapper } from "@/components/layouts";
import AppButton from "@/components/ui/AppButton";
import { useAppTheme } from "@/hooks/useAppTheme";
import { useRouter } from "expo-router";
import { CalendarRange } from "lucide-react-native";
import React from "react";
import { Text, View } from "react-native";

export default function SchedulePage() {
  const { colors } = useAppTheme();
  const router = useRouter();

  const handleBack = () => {
    router.back();
  };

  return (
    <ContentWrapper noPaddingY>
      <View className="flex-1 items-center justify-center px-6 pb-16 bg-light-background dark:bg-dark-background">
        <View className="w-24 h-24 rounded-full bg-light-warning/10 dark:bg-dark-warning/20 items-center justify-center mb-6">
          <View className="w-16 h-16 rounded-full bg-light-warning/15 dark:bg-dark-warning/30 items-center justify-center">
            <CalendarRange size={36} color={colors.warning} strokeWidth={2.2} />
          </View>
        </View>

        <Text className="text-light-text dark:text-dark-text font-black text-center text-[22px] mb-3">
          Feature Under Development
        </Text>

        <Text className="text-light-muted dark:text-dark-muted font-regular text-center leading-6 text-[13px] mb-8">
          The Request Schedule feature is currently under active development. 
          Soon, you will be able to reserve parking slots and submit schedule proofs 
          directly from the mobile app.
        </Text>

        <AppButton
          label="Back to Home"
          variant="outline"
          size="md"
          onPress={handleBack}
          className="rounded-2xl px-8"
        />
      </View>
    </ContentWrapper>
  );
}
