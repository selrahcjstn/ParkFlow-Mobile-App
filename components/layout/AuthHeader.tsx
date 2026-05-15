import { Body, Title } from "@/components/ui/Typography";
import type { ImageSourcePropType } from "react-native";
import { Image, View } from "react-native";

interface AuthHeaderProps {
  logo: ImageSourcePropType;
  title: string;
  subtitle: string;
}

export default function AuthHeader({ logo, title, subtitle }: AuthHeaderProps) {
  return (
    <View className="items-center justify-center pt-10 pb-8 px-6 bg-light-primary">
      <View className="w-24 h-24 rounded-full overflow-hidden border-4 border-light-warning mb-4 shadow-lg">
        <Image source={logo} className="w-full h-full" resizeMode="cover" />
      </View>

      <Title className="text-white text-4xl tracking-wide">{title}</Title>

      <Body className="text-white font-semibold mt-1 tracking-wider">
        {subtitle}
      </Body>
    </View>
  );
}
