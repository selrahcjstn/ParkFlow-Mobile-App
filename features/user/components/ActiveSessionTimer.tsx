import React, { useEffect, useState } from "react";
import { Text, View, TouchableOpacity } from "react-native";
import { Clock, LogOut } from "lucide-react-native";
import { formatTime } from "@/utils/formatTime";

interface ActiveSessionTimerProps {
  startedAt: string;
  exitBy: string;
  accruedCharge: number;
  onExitPress: () => void;
}

export default function ActiveSessionTimer({
  startedAt,
  exitBy,
  accruedCharge,
  onExitPress,
}: ActiveSessionTimerProps) {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const exitTime = new Date(exitBy);
  const diffSeconds = Math.floor((exitTime.getTime() - currentTime.getTime()) / 1000);
  const isOvertime = diffSeconds < 0;
  const absSeconds = Math.abs(diffSeconds);

  const getElapsedTimeText = () => {
    const startTime = new Date(startedAt);
    const diffMs = Math.max(0, currentTime.getTime() - startTime.getTime());
    const totalMins = Math.floor(diffMs / 60000);
    const hrs = Math.floor(totalMins / 60);
    const mins = totalMins % 60;
    if (hrs > 0) {
      return `${hrs}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const formatSeconds = (totalSeconds: number) => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    const pad = (num: number) => String(num).padStart(2, "0");
    return `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
  };

  return (
    <View className="px-6 pb-2 pt-2">
      <View className="items-center mb-5">
        <Text className="font-heavy uppercase tracking-widest text-[11px] text-light-muted dark:text-dark-muted mb-2">
          {isOvertime ? "Time Exceeded" : "Time Remaining"}
        </Text>
        <Text className={`text-4xl font-black tracking-widest ${isOvertime ? "text-light-primary" : "text-light-text dark:text-dark-text"}`}>
          {isOvertime ? "+" : ""}{formatSeconds(absSeconds)}
        </Text>

        {isOvertime ? (
          <View className="flex-row items-center gap-1.5 mt-3 bg-light-primary/10 px-3 py-1 rounded-full">
            <View className="w-1.5 h-1.5 rounded-full bg-light-primary" />
            <Text className="text-light-primary font-heavy text-[10px] uppercase tracking-wider">
              Overtime Exceeded
            </Text>
          </View>
        ) : (
          <View className="flex-row items-center gap-1.5 mt-3 bg-light-success/10 px-3 py-1 rounded-full">
            <View className="w-1.5 h-1.5 rounded-full bg-light-success" />
            <Text className="text-light-success font-heavy text-[10px] uppercase tracking-wider">
              Active Parking Session
            </Text>
          </View>
        )}
      </View>

      <TouchableOpacity
        activeOpacity={0.7}
        onPress={onExitPress}
        className="flex-row items-center justify-center gap-1.5 self-center mb-5 bg-light-primary/5 px-4 py-1.5 rounded-full"
      >
        <LogOut size={13} color="#D22730" strokeWidth={2.5} />
        <Text className="text-light-primary font-heavy text-xs uppercase tracking-wider">
          Exit Terminal
        </Text>
      </TouchableOpacity>

      <View className="gap-3 bg-light-background/40 dark:bg-dark-background/20 rounded-2xl p-4">
        <View className="flex-row justify-between items-center">
          <Text className="font-regular text-sm text-light-muted dark:text-dark-muted">
            Accrued Charge
          </Text>
          <Text className="text-light-text dark:text-dark-text font-heavy text-base">
            ₱{accruedCharge.toFixed(2)}
          </Text>
        </View>

        <View className="w-full h-[1px] bg-light-border dark:bg-dark-border" />

        <View className="flex-row justify-between items-center">
          <Text className="font-regular text-sm text-light-muted dark:text-dark-muted">
            Must Exit By
          </Text>
          <Text className="text-light-text dark:text-dark-text font-heavy text-base">
            {formatTime(exitBy)}
          </Text>
        </View>

        <View className="w-full h-[1px] bg-light-border dark:bg-dark-border" />

        <View className="flex-row justify-between items-center">
          <Text className="font-regular text-sm text-light-muted dark:text-dark-muted">
            Time Elapsed
          </Text>
          <Text className="text-light-text dark:text-dark-text font-heavy text-base">
            {getElapsedTimeText()}
          </Text>
        </View>
      </View>
    </View>
  );
}
