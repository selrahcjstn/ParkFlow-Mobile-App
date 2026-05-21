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
    <View className="items-center justify-center pt-10 pb-6 px-6 bg-light-background">
      <View className="w-20 h-20 rounded-full overflow-hidden border-[3px] border-light-primary mb-4">
        <Image source={logo} className="w-full h-full" resizeMode="cover" />
      </View>

      <Title className="text-light-text text-3xl tracking-wide">
        {title}
      </Title>

      <Body className="text-light-muted font-book mt-1 tracking-wider text-[13px]">
        {subtitle}
      </Body>
    </View>
  );
}
