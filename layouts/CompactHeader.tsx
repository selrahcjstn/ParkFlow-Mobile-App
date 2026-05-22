import { Title } from "@/components/ui/Typography";
import { View } from "react-native";

interface CompactHeaderProps {
  title?: string;
}

export default function CompactHeader({
  title = "ParkFlow",
}: CompactHeaderProps) {
  return (
    <View className="bg-light-background px-6 pt-4 pb-3 items-center">
      <Title className="text-light-text text-2xl tracking-wide">
        {title}
      </Title>
    </View>
  );
}
