import { Body, Title } from "@/components/ui/Typography";
import type { ImageSourcePropType } from "react-native";
import { Image, View } from "react-native";

interface AuthHeaderProps {
  logo: ImageSourcePropType;
  title: string;
  subtitle: string;
  /**
   * When true, renders white text and a white logo border.
   * Use this whenever AuthLayout has a colored background (e.g. bg-light-primary).
   */
  inverted?: boolean;
}

export default function AuthHeader({
  logo,
  title,
  subtitle,
  inverted = false,
}: AuthHeaderProps) {
  return (
    <View className="items-center justify-center pt-10 pb-8 px-6">
      {/* Logo ring */}
      <View
        className={`w-20 h-20 rounded-full overflow-hidden mb-4 border-[3px] ${
          inverted ? "border-white/60" : "border-light-primary"
        }`}
      >
        <Image source={logo} className="w-full h-full" resizeMode="cover" />
      </View>

      {/* App name */}
      <Title
        className={`text-3xl tracking-wide ${
          inverted ? "text-white" : "text-light-text"
        }`}
      >
        {title}
      </Title>

      {/* Tagline */}
      <Body
        className={`font-book mt-1 tracking-wider text-[13px] ${
          inverted ? "text-white/70" : "text-light-muted"
        }`}
      >
        {subtitle}
      </Body>
    </View>
  );
}
