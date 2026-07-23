import { useAppTheme } from "@/hooks/useAppTheme";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { ArrowRight } from "lucide-react-native";
import React, { useRef, useState } from "react";
import {
  Dimensions,
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export const HAS_SEEN_WALKTHROUGH_KEY = "@parkflow_has_seen_walkthrough";

type SlideItem = {
  id: string;
  header: string;
  title: string;
  description: string;
  imageSource: any;
};

const slides: SlideItem[] = [
  {
    id: "1",
    header: "Get Started",
    title: "Welcome to\nParkFlow",
    description:
      "Find available parking spaces quickly and enjoy a faster, hassle-free parking experience wherever you go.",
    imageSource: require("@/assets/steps/1.svg"),
  },
  {
    id: "2",
    header: "Get Started",
    title: "Real-Time\nVehicle Monitoring",
    description:
      "Keep track of your vehicle's location and parking status anytime, anywhere through live updates.",
    imageSource: require("@/assets/steps/2.svg"),
  },
  {
    id: "3",
    header: "Get Started",
    title: "Scan and Park",
    description:
      "Use your unique QR code for fast and secure entry and exit without waiting in long lines.",
    imageSource: require("@/assets/steps/3.svg"),
  },
];

export default function WalkthroughPage() {
  const router = useRouter();
  const { isDark } = useAppTheme();
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList<SlideItem>>(null);

  const handleFinish = async () => {
    try {
      await AsyncStorage.setItem(HAS_SEEN_WALKTHROUGH_KEY, "true");
    } catch (_e) {}
    router.replace("/(auth)/login");
  };

  const handleNext = () => {
    if (currentIndex < slides.length - 1) {
      const nextIndex = currentIndex + 1;
      flatListRef.current?.scrollToIndex({ index: nextIndex, animated: true });
      setCurrentIndex(nextIndex);
    } else {
      handleFinish();
    }
  };

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const slideSize = event.nativeEvent.layoutMeasurement.width;
    const index = Math.round(event.nativeEvent.contentOffset.x / slideSize);
    if (index >= 0 && index < slides.length && index !== currentIndex) {
      setCurrentIndex(index);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-dark-background">
      {/* Header */}
      <View className="px-6 pt-4 pb-2">
        <Text className="text-gray-400 font-medium text-sm tracking-wide">
          {slides[currentIndex].header}
        </Text>
      </View>

      {/* Main Content Carousel */}
      <FlatList
        ref={flatListRef}
        data={slides}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        renderItem={({ item }) => (
          <View style={{ width: SCREEN_WIDTH }} className="px-8 justify-between py-6">
            {/* Title */}
            <View className="min-h-[90px]">
              <Text className="text-2xl font-bold text-gray-900 dark:text-white leading-tight">
                {item.title}
              </Text>
            </View>

            {/* Illustration / Image */}
            <View className="items-center justify-center my-6 h-56">
              <Image
                source={item.imageSource}
                style={{ width: SCREEN_WIDTH * 0.75, height: 220 }}
                contentFit="contain"
              />
            </View>

            {/* Description */}
            <View className="items-center px-2 min-h-[70px]">
              <Text className="text-center text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
                {item.description}
              </Text>
            </View>
          </View>
        )}
      />

      {/* Bottom Navigation Control Bar */}
      <View className="flex-row items-center justify-between px-8 py-6 pb-8">
        {/* Skip button */}
        <TouchableOpacity onPress={handleFinish} activeOpacity={0.7} className="py-2 px-1">
          <Text className="text-gray-400 dark:text-gray-500 font-semibold text-xs tracking-wider uppercase">
            SKIP
          </Text>
        </TouchableOpacity>

        {/* Pagination Dots */}
        <View className="flex-row items-center gap-2">
          {slides.map((_, index) => {
            const isActive = index === currentIndex;
            return (
              <View
                key={index}
                className={`w-2.5 h-2.5 rounded-full ${
                  isActive
                    ? "bg-gray-900 dark:bg-white"
                    : "border border-gray-400 dark:border-gray-600 bg-transparent"
                }`}
              />
            );
          })}
        </View>

        {/* Next / Finish Arrow Button */}
        <TouchableOpacity
          onPress={handleNext}
          activeOpacity={0.8}
          className="w-12 h-12 rounded-full bg-red-500 items-center justify-center shadow-md active:bg-red-600"
        >
          <ArrowRight color="#FFFFFF" size={20} />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
