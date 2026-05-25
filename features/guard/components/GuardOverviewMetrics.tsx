import { Car, Keyboard, Timer } from "lucide-react-native";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";
import Svg, { Circle } from "react-native-svg";
const MetricRing = ({
  percentage = 0,
  size = 56,
  strokeWidth = 5,
  strokeColor = "#D22730",
  fillColor = "#E4E4E7",
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const validPercentage = Math.min(100, Math.max(0, percentage));
  const strokeDashoffset =
    circumference - (validPercentage / 100) * circumference;

  return (
    <View
      style={{ width: size, height: size }}
      className="items-center justify-center relative rotate-[-90deg]"
    >
      <Svg width={size} height={size}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={fillColor}
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          fill="transparent"
        />
      </Svg>
      <View className="absolute items-center justify-center rotate-[90deg]">
        <Text className="text-light-text font-black text-[11px]">
          {Math.round(validPercentage)}%
        </Text>
      </View>
    </View>
  );
};

export interface GuardOverviewMetricsData {
  totalParked: number;
  totalSlots: number;
  manualEntriesCount: number;
  overstayCount: number;
}

interface GuardOverviewMetricsProps {
  data: GuardOverviewMetricsData;
  onCapacityPress?: () => void;
  onManualPress?: () => void;
  onOverstayPress?: () => void;
}

export default function GuardOverviewMetrics({
  data,
  onCapacityPress,
  onManualPress,
  onOverstayPress,
}: GuardOverviewMetricsProps) {
  const {
    totalParked = 0,
    totalSlots = 100,
    manualEntriesCount = 0,
    overstayCount = 0,
  } = data;
  const occupancyPercent =
    totalSlots > 0 ? (totalParked / totalSlots) * 100 : 0;

  return (
    <View className="mt-6 px-1">
      <View className="flex-row gap-3 h-[164px]">
        <TouchableOpacity
          onPress={onCapacityPress}
          activeOpacity={onCapacityPress ? 0.7 : 1}
          disabled={!onCapacityPress}
          className="w-[47%] bg-light-surface rounded-card p-4 justify-between shadow-soft border border-light-border/40"
        >
          <View className="flex-row items-start justify-between w-full">
            <View className="w-10 h-10 rounded-button bg-light-background items-center justify-center">
              <Car size={20} color="#334155" strokeWidth={2} />
            </View>
            <MetricRing
              percentage={occupancyPercent}
              strokeColor="#D22730"
              size={56}
            />
          </View>

          {/* Bottom Counters */}
          <View className="mt-2">
            <View className="flex-row items-baseline">
              <Text className="text-light-text font-black text-[26px] leading-7">
                {totalParked}
              </Text>
              <Text className="text-light-muted font-heavy text-[13px] ml-1">
                / {totalSlots}
              </Text>
            </View>
            <Text
              className="text-light-muted font-heavy text-[14px] mt-1 leading-5"
              numberOfLines={1}
            >
              Occupancy
            </Text>
          </View>
        </TouchableOpacity>

        <View className="flex-1 flex-col gap-3">
          <TouchableOpacity
            onPress={onManualPress}
            activeOpacity={onManualPress ? 0.7 : 1}
            disabled={!onManualPress}
            className="flex-1 bg-light-surface rounded-card p-3.5 flex-row items-center justify-between shadow-soft border border-light-border/40"
          >
            <View className="flex-1 pr-2">
              <Text className="text-light-text font-black text-[20px] leading-6">
                {manualEntriesCount}
              </Text>
              <Text
                className="text-light-muted font-book text-[14px] mt-0.5 leading-5"
                numberOfLines={1}
              >
                Manual Input
              </Text>
            </View>
            <View className="w-9 h-9 rounded-button bg-light-background items-center justify-center">
              <Keyboard size={18} color="#334155" strokeWidth={2} />
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={onOverstayPress}
            activeOpacity={onOverstayPress ? 0.7 : 1}
            disabled={!onOverstayPress}
            className="flex-1 bg-light-surface rounded-card p-3.5 flex-row items-center justify-between shadow-soft border border-light-border/40"
          >
            <View className="flex-1 pr-2">
              <Text className="text-light-text font-black text-[20px] leading-6">
                {overstayCount}
              </Text>
              <Text
                className="text-light-muted font-heavy text-[14px] mt-0.5 leading-5"
                numberOfLines={1}
              >
                Overstaying
              </Text>
            </View>
            <View className="w-9 h-9 rounded-button bg-light-background items-center justify-center">
              <Timer size={18} color="#334155" strokeWidth={2} />
            </View>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

