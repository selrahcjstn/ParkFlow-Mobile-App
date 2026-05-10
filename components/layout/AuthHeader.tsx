import { Image, Text, View } from "react-native";
import type { ImageSourcePropType } from "react-native";

interface AuthHeaderProps {
  /** App logo source */
  logo: ImageSourcePropType;
  /** Primary app/brand name */
  title: string;
  /** Tagline or system description */
  subtitle: string;
}

/**
 * Hero section displayed at the top of all auth screens.
 * Renders the logo, app name, and a subtitle on the primary-coloured background.
 */
export default function AuthHeader({ logo, title, subtitle }: AuthHeaderProps) {
  return (
    <View className="items-center justify-center pt-10 pb-8 px-6 bg-light-primary">
      {/* Logo circle */}
      <View className="w-24 h-24 rounded-full overflow-hidden border-4 border-amber-600 mb-4 shadow-lg">
        <Image source={logo} className="w-full h-full" resizeMode="cover" />
      </View>

      {/* App name */}
      <Text className="text-white text-4xl font-extrabold tracking-wide">
        {title}
      </Text>

      {/* Subtitle / tagline */}
      <Text className="text-white text-base font-semibold mt-1 tracking-wider">
        {subtitle}
      </Text>
    </View>
  );
}
