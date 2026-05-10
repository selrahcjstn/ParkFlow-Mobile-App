import { Text, View } from "react-native";

interface CompactHeaderProps {
  /** Brand name shown at the top */
  title?: string;
}

/**
 * A slim version of the header for screens that need more room for content.
 * Just shows the app name on the primary background — no logo, no subtitle.
 */
export default function CompactHeader({ title = "ParkFlow" }: CompactHeaderProps) {
  return (
    <View className="bg-light-primary px-6 pt-4 pb-5 items-center">
      <Text className="text-white text-2xl font-extrabold tracking-wide">
        {title}
      </Text>
    </View>
  );
}
