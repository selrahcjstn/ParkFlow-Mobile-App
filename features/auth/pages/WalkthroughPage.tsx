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

  const handleDotPress = (index: number) => {
    flatListRef.current?.scrollToIndex({ index, animated: true });
    setCurrentIndex(index);
  };

  const handleMomentumScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const slideSize = event.nativeEvent.layoutMeasurement.width;
    if (slideSize > 0) {
      const index = Math.round(event.nativeEvent.contentOffset.x / slideSize);
      if (index >= 0 && index < slides.length) {
        setCurrentIndex(index);
      }
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-light-background dark:bg-dark-background justify-between">
      {/* Top Header */}
      <View className="flex-row items-center justify-between px-8 pt-4 pb-2">
        <View className="bg-red-500/10 dark:bg-red-500/20 px-3 py-1 rounded-full border border-red-500/20">
          <Text className="text-red-500 font-bold text-xs tracking-widest uppercase">
            Step {currentIndex + 1} of {slides.length}
          </Text>
        </View>

        <TouchableOpacity onPress={handleFinish} activeOpacity={0.7} className="py-1 px-2">
          <Text className="text-light-muted dark:text-dark-muted font-semibold text-xs tracking-wider uppercase">
            Skip
          </Text>
        </TouchableOpacity>
      </View>

      {/* Main Content Carousel */}
      <FlatList
        ref={flatListRef}
        data={slides}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleMomentumScrollEnd}
        getItemLayout={(_, index) => ({
          length: SCREEN_WIDTH,
          offset: SCREEN_WIDTH * index,
          index,
        })}
        onScrollToIndexFailed={(info) => {
          flatListRef.current?.scrollToOffset({
            offset: info.averageItemLength * info.index,
            animated: true,
          });
        }}
        renderItem={({ item }) => (
          <View style={{ width: SCREEN_WIDTH }} className="px-8 justify-between py-4">
            {/* Title */}
            <View className="min-h-[80px] justify-center">
              <Text className="text-3xl font-black text-light-text dark:text-dark-text leading-tight tracking-tight">
                {item.title}
              </Text>
            </View>

            {/* Illustration / Image Container */}
            <View className="items-center justify-center my-4 h-64 bg-light-card/60 dark:bg-dark-card/60 rounded-3xl p-4 border border-light-border dark:border-dark-border shadow-sm">
              <Image
                source={item.imageSource}
                style={{ width: SCREEN_WIDTH * 0.7, height: 210 }}
                contentFit="contain"
              />
            </View>

            {/* Description */}
            <View className="items-center px-2 min-h-[70px] justify-center">
              <Text className="text-center text-light-muted dark:text-dark-muted text-sm leading-relaxed font-normal">
                {item.description}
              </Text>
            </View>
          </View>
        )}
      />

      {/* Bottom Navigation Control Bar */}
      <View className="flex-row items-center justify-between px-8 py-6 pb-8">
        {/* Animated Active Pill Pagination Dots */}
        <View className="flex-row items-center gap-2">
          {slides.map((_, index) => {
            const isActive = index === currentIndex;
            return (
              <TouchableOpacity
                key={index}
                onPress={() => handleDotPress(index)}
                activeOpacity={0.8}
                className={`h-2.5 rounded-full transition-all duration-300 ${
                  isActive
                    ? "w-8 bg-red-500"
                    : "w-2.5 bg-gray-300 dark:bg-gray-700"
                }`}
              />
            );
          })}
        </View>

        {/* Next / Finish Arrow Button */}
        <TouchableOpacity
          onPress={handleNext}
          activeOpacity={0.8}
          className="w-14 h-14 rounded-full bg-red-500 items-center justify-center shadow-lg shadow-red-500/30 active:scale-95 transition-all"
        >
          <ArrowRight color="#FFFFFF" size={22} strokeWidth={2.5} />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
