import type { ImageSourcePropType } from "react-native";
import { Image, Text, View } from "react-native";

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

      <Text className="font-black text-3xl leading-9 tracking-wide text-white">{title}</Text>

      <Text className="font-regular mt-1 tracking-wider text-[13px] leading-5 text-white">
        {subtitle}
      </Text>
    </View>
  );
}
