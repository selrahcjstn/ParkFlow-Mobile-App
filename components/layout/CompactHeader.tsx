import { Title } from "@/components/ui/Typography";
import { View } from "react-native";

interface CompactHeaderProps {
  title?: string;
}

export default function CompactHeader({
  title = "ParkFlow",
}: CompactHeaderProps) {
  return (
    <View className="bg-light-primary px-6 pt-4 pb-5 items-center">
      <Title className="text-white text-2xl tracking-wide">{title}</Title>
    </View>
  );
}
