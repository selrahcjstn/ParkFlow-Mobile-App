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
  const { colors } = useAppTheme();
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

  const isLast = currentIndex === slides.length - 1;

  return (
    <SafeAreaView className="flex-1 bg-light-background dark:bg-dark-background justify-between">
      {/* Top Corporate Bar */}
      <View className="flex-row items-center justify-between px-8 pt-6 pb-2">
        <View className="bg-light-primary/10 dark:bg-dark-primary/20 px-3.5 py-1.5 rounded-full border border-light-primary/20 dark:border-dark-primary/20">
          <Text className="text-light-primary dark:text-dark-primary font-bold text-[11px] tracking-[0.18em] uppercase">
            {slides[currentIndex]?.header || "PARKFLOW GUIDE"} • {currentIndex + 1}/{slides.length}
          </Text>
        </View>

        <TouchableOpacity onPress={handleFinish} activeOpacity={0.7} className="py-1 px-2">
          <Text className="text-light-muted dark:text-dark-muted font-semibold text-xs tracking-widest uppercase">
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
          <View style={{ width: SCREEN_WIDTH }} className="px-8 justify-between py-2">
            {/* Title Section */}
            <View className="min-h-[75px] justify-center mt-2">
              <Text className="text-3xl font-extrabold text-light-text dark:text-dark-text leading-[1.2] tracking-tight">
                {item.title}
              </Text>
            </View>

            {/* Large Hero SVG Illustration */}
            <View className="items-center justify-center my-4 h-80 bg-light-surface dark:bg-dark-surface rounded-3xl p-6 border border-light-border dark:border-dark-border shadow-sm">
              <Image
                source={item.imageSource}
                style={{ width: SCREEN_WIDTH * 0.82, height: 270 }}
                contentFit="contain"
              />
            </View>

            {/* Corporate Description */}
            <View className="px-1 min-h-[75px] justify-center">
              <Text className="text-light-muted dark:text-dark-muted text-sm leading-relaxed font-normal tracking-wide">
                {item.description}
              </Text>
            </View>
          </View>
        )}
      />

      {/* Bottom Navigation & Corporate Action Bar */}
      <View className="flex-row items-center justify-between px-8 py-6 pb-8 border-t border-light-border dark:border-dark-border/40">
        {/* Active Pill Pagination */}
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
                    ? "w-8 bg-light-primary dark:bg-dark-primary"
                    : "w-2.5 bg-light-border dark:bg-dark-border"
                }`}
              />
            );
          })}
        </View>

        {/* Corporate Next / Get Started Action Button */}
        <TouchableOpacity
          onPress={handleNext}
          activeOpacity={0.85}
          className="flex-row items-center px-6 py-3.5 bg-light-primary dark:bg-dark-primary rounded-2xl shadow-lg shadow-light-primary/30 dark:shadow-dark-primary/30 active:scale-95 transition-all"
        >
          <Text className="text-light-textInverse dark:text-dark-background font-bold text-xs tracking-wider uppercase mr-2.5">
            {isLast ? "Get Started" : "Next"}
          </Text>
          <ArrowRight color={colors.background} size={16} strokeWidth={2.5} />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
