import { useAppTheme } from "@/hooks/useAppTheme";
import React, { useEffect, useRef } from "react";
import { Animated, StyleProp, View, ViewStyle } from "react-native";

interface SkeletonProps {
  className?: string;
  style?: StyleProp<ViewStyle>;
  width?: number | string;
  height?: number | string;
  borderRadius?: number;
}

export function Skeleton({
  className = "",
  style,
  width,
  height,
  borderRadius = 12,
}: SkeletonProps) {
  const opacity = useRef(new Animated.Value(0.35)).current;
  const { isDark } = useAppTheme();

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.85,
          duration: 750,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.35,
          duration: 750,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        {
          width: width as any,
          height: height as any,
          borderRadius,
          opacity,
          backgroundColor: isDark ? "#27272A" : "#E4E4E7",
        },
        style,
      ]}
      className={className}
    />
  );
}

/**
 * Specialized Skeleton for User QR Code Access Card
 */
export function QRCodeCardSkeleton() {
  return (
    <View className="mt-7 w-full">
      <View className="bg-light-surface dark:bg-dark-surface rounded-3xl p-6 shadow-card border border-light-border dark:border-dark-border">
        {/* Top Header Placeholder */}
        <View className="flex-row items-center justify-between pb-4">
          <View className="gap-2">
            <Skeleton width={120} height={20} borderRadius={6} />
            <Skeleton width={80} height={14} borderRadius={4} />
          </View>
          <Skeleton width={24} height={24} borderRadius={12} />
        </View>

        {/* Dashed Line separator */}
        <View className="border-b border-dashed border-light-border dark:border-dark-border my-3" />

        {/* QR Code Center Placeholder */}
        <View className="items-center py-6">
          <Skeleton width={185} height={185} borderRadius={20} />
          <Skeleton width={110} height={32} borderRadius={20} className="mt-4" />
        </View>

        {/* Bottom Footer Info Placeholder */}
        <View className="pt-4 border-t border-light-border/40 dark:border-dark-border/40 flex-row justify-between">
          <View className="gap-1.5">
            <Skeleton width={40} height={12} borderRadius={4} />
            <Skeleton width={100} height={14} borderRadius={4} />
          </View>
          <View className="items-end gap-1.5">
            <Skeleton width={50} height={12} borderRadius={4} />
            <Skeleton width={90} height={14} borderRadius={4} />
          </View>
        </View>
      </View>
    </View>
  );
}

/**
 * Specialized Skeleton for Guard Overview Metrics (3 top cards)
 */
export function GuardOverviewMetricsSkeleton() {
  return (
    <View className="mt-5">
      <View className="flex-row gap-2.5">
        {[1, 2, 3].map((key) => (
          <View
            key={key}
            className="flex-1 bg-light-surface dark:bg-dark-surface rounded-2xl p-3.5 border border-light-border dark:border-dark-border justify-between h-[104px]"
          >
            <View className="w-8 h-8 rounded-xl bg-light-surfaceMuted dark:bg-dark-surfaceMuted items-center justify-center mb-2">
              <Skeleton width={16} height={16} borderRadius={4} />
            </View>
            <View className="gap-1.5">
              <Skeleton width="70%" height={20} borderRadius={5} />
              <Skeleton width="50%" height={12} borderRadius={4} />
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

/**
 * Specialized Skeleton for Active Sessions List / History Items
 */
export function SessionListItemSkeleton() {
  return (
    <View className="bg-light-surface dark:bg-dark-surface rounded-2xl p-4 border border-light-border dark:border-dark-border mb-3 flex-row items-center justify-between">
      <View className="flex-row items-center gap-3.5 flex-1">
        <Skeleton width={42} height={42} borderRadius={14} />
        <View className="gap-2 flex-1">
          <Skeleton width="60%" height={16} borderRadius={4} />
          <Skeleton width="40%" height={12} borderRadius={4} />
        </View>
      </View>
      <Skeleton width={65} height={26} borderRadius={12} />
    </View>
  );
}

/**
 * Specialized Skeleton for Schedule Rows
 */
export function ScheduleRowSkeleton() {
  return (
    <View className="bg-light-surface dark:bg-dark-surface rounded-2xl p-4 border border-light-border dark:border-dark-border mb-3 flex-row items-center justify-between">
      <View className="flex-row items-center gap-3 flex-1">
        <Skeleton width={36} height={36} borderRadius={10} />
        <View className="gap-1.5 flex-1">
          <Skeleton width="45%" height={16} borderRadius={4} />
          <Skeleton width="65%" height={12} borderRadius={4} />
        </View>
      </View>
      <Skeleton width={70} height={28} borderRadius={14} />
    </View>
  );
}

export default Skeleton;
