import { ContentWrapper } from "@/components/layouts";
import { Text, View } from "react-native";

export default function UserSchedulePage() {
  return (
    <ContentWrapper>
      <View className="flex-1">
        <View className="bg-light-background dark:bg-dark-background -mx-5 px-5 pt-4 pb-3 border-b border-transparent">
          <Text className="font-heavy text-xl text-center text-light-text dark:text-dark-text">
            Schedule
          </Text>
        </View>
      </View>
    </ContentWrapper>
  );
}

