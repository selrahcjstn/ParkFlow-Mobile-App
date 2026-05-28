import { ContentWrapper } from "@/components/layouts";
import {
  AlertCircle,
  Calendar,
  Clock,
  LogIn,
  LogOut,
  ShieldCheck,
} from "lucide-react-native";
import React, { useRef, useCallback } from "react";
import { Platform, ScrollView, Text, View, ActivityIndicator } from "react-native";
import { useNavigation, useFocusEffect } from "expo-router";
import { useScheduleStore } from "../store/schedule.store";
import { formatTime } from "@/utils/formatTime";

const GRACE_PERIOD = {
  entryBeforeMin: 15,
  exitAfterMin: 45,
};

export default function UserSchedulePage() {
  const navigation = useNavigation();
  const lastScrolledRef = useRef(false);

  const { schedules, isLoading, fetchSchedules } = useScheduleStore();

  useFocusEffect(
    useCallback(() => {
      fetchSchedules();
    }, [])
  );

  const handleScroll = (event: any) => {
    const yOffset = event?.nativeEvent?.contentOffset?.y;
    if (yOffset !== undefined && yOffset !== null) {
      const scrolled = yOffset > 0;
      if (lastScrolledRef.current !== scrolled) {
        lastScrolledRef.current = scrolled;
        navigation.setParams({ hasScrolled: scrolled } as any);
      }
    }
  };

  const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0]; // Monday to Sunday
  const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  const mappedSchedules = DAY_ORDER.map((dayNum) => {
    const backendSched = schedules.find((s) => s.dayOfWeek === dayNum);
    return {
      dayName: DAY_NAMES[dayNum],
      startTime: backendSched ? formatTime(backendSched.startTime) : "",
      endTime: backendSched ? formatTime(backendSched.endTime) : "",
      isActive: !!backendSched,
    };
  });

  const activeCount = mappedSchedules.filter((d) => d.isActive).length;

  return (
    <ContentWrapper noPaddingY>
      <View className="flex-1 bg-light-background dark:bg-dark-background">
        {isLoading && schedules.length === 0 ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color="#D22730" />
          </View>
        ) : (
          <ScrollView
            className="flex-1 pt-6"
            showsVerticalScrollIndicator={false}
            onScroll={handleScroll}
            scrollEventThrottle={16}
            contentContainerStyle={{ paddingBottom: 40 }}
          >
            <View className="bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border rounded-card overflow-hidden mb-7 shadow-soft">
              <View className="p-4 flex-row items-center gap-3">
                <View className="w-9 h-9 rounded-button items-center justify-center bg-light-success/10 dark:bg-dark-success/10">
                  <ShieldCheck
                    size={18}
                    color={Platform.OS === "ios" ? "#10B981" : "#34D399"}
                    strokeWidth={2.2}
                  />
                </View>

                <View className="flex-1">
                  <Text className="text-light-text dark:text-dark-text font-black text-[14px] tracking-tight">
                    Verified Access Profile
                  </Text>
                  <Text className="text-light-muted dark:text-dark-muted font-regular text-[12px] mt-0.5">
                    Parking permissions active for {activeCount} days this week
                  </Text>
                </View>
              </View>

              <View className="px-4 py-3 flex-row items-center justify-between border-t border-light-border dark:border-dark-border">
                <View className="flex-row items-center gap-1.5">
                  <LogIn size={13} color="#71717A" strokeWidth={2.2} />
                  <Text className="text-light-muted dark:text-dark-muted font-book text-[11px]">
                    Early Entry:{" "}
                    <Text className="font-heavy text-light-text dark:text-dark-text">
                      -{GRACE_PERIOD.entryBeforeMin}m
                    </Text>
                  </Text>
                </View>

                <View className="w-px h-3 bg-light-border dark:bg-dark-border" />

                <View className="flex-row items-center gap-1.5">
                  <LogOut size={13} color="#71717A" strokeWidth={2.2} />
                  <Text className="text-light-muted dark:text-dark-muted font-book text-[11px]">
                    Late Exit:{" "}
                    <Text className="font-heavy text-light-text dark:text-dark-text">
                      +{GRACE_PERIOD.exitAfterMin}m
                    </Text>
                  </Text>
                </View>
              </View>
            </View>

            <View className="flex-row items-center gap-1.5 mb-3 px-0.5">
              <Calendar size={13} color="#71717A" />
              <Text className="text-light-muted dark:text-dark-muted font-heavy text-[11px] uppercase tracking-wider">
                Week at a glance
              </Text>
            </View>

            <View className="gap-2">
              {mappedSchedules.map((day) => (
                <View
                  key={day.dayName}
                  className={`flex-row items-center justify-between px-4 py-3.5 rounded-card border ${
                    day.isActive
                      ? "bg-light-surface dark:bg-dark-surface border-light-border/50 dark:border-dark-border/50 shadow-soft"
                      : "bg-light-surfaceMuted/40 dark:bg-dark-surfaceMuted/20 border-light-border/60 dark:border-dark-border/40 opacity-55"
                  }`}
                >
                  <Text
                    className={`font-heavy text-[14px] ${
                      day.isActive
                        ? "text-light-text dark:text-dark-text"
                        : "text-light-muted dark:text-dark-muted"
                    }`}
                  >
                    {day.dayName}
                  </Text>

                  {day.isActive ? (
                    <View className="flex-row items-center gap-1.5 bg-light-background dark:bg-dark-background px-2.5 py-1.5 rounded-button border border-light-border/60 dark:border-dark-border/60">
                      <Clock size={12} color="#71717A" strokeWidth={2} />
                      <Text className="text-light-text dark:text-dark-text font-book text-[12px]">
                        {day.startTime} – {day.endTime}
                      </Text>
                    </View>
                  ) : (
                    <Text className="text-light-muted dark:text-dark-muted font-regular text-[12px] italic mr-1">
                      No campus hours
                    </Text>
                  )}
                </View>
              ))}
            </View>

            <View className="mt-6 bg-light-surfaceMuted/40 dark:bg-dark-surfaceMuted/20 border border-light-border dark:border-dark-border rounded-card p-3.5 flex-row gap-2.5 items-center">
              <AlertCircle size={15} color="#71717A" strokeWidth={2.2} />
              <Text className="text-light-muted dark:text-dark-muted font-regular text-[11px] flex-1 leading-normal">
                To modify your schedule, submit an updated Certificate of
                Registration (COR) via account settings for administrator review.
              </Text>
            </View>
          </ScrollView>
        )}
      </View>
    </ContentWrapper>
  );
}
