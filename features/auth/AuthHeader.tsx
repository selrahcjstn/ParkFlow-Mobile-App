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
    <View className="items-center justify-center pt-10 pb-8 px-6">
      <View className="w-20 h-20 rounded-full overflow-hidden mb-4 border-[3px] border-white/60">
        <Image source={logo} className="w-full h-full" resizeMode="cover" />
      </View>

      <Title className="text-3xl tracking-wide text-white">{title}</Title>

      <Body className="font-book mt-1 tracking-wider text-[13px] text-white">
        {subtitle}
      </Body>
    </View>
  );
}
