import { ContentWrapper } from "@/components/layouts";
import { formatTime } from "@/utils/formatTime";
import { formatDate } from "@/utils/formatDate";
import { router, useFocusEffect, useNavigation } from "expo-router";
import {
  AlertCircle,
  Calendar,
  CalendarDays,
  CalendarPlus,
  Clock,
  LogIn,
  LogOut,
  ShieldCheck,
} from "lucide-react-native";
import React, { useCallback, useRef, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  InteractionManager,
  RefreshControl,
} from "react-native";
import { useScheduleStore } from "../store/schedule.store";
import { useReservationStore } from "../store/reservation.store";
import { useAuthStore } from "@/features/auth/store/auth.store";
import { ReservationStatus } from "../types/reservation.types";
import { useAppTheme } from "@/hooks/useAppTheme";

const GRACE_PERIOD = {
  entryBeforeMin: 15,
  exitAfterMin: 45,
};

export default function UserSchedulePage() {
  const navigation = useNavigation();
  const lastScrolledRef = useRef(false);
  const { colors } = useAppTheme();

  const { user } = useAuthStore();
  const { schedules, isLoading, fetchSchedules } = useScheduleStore();
  const { reservations, activeReservation, fetchMyReservations } =
    useReservationStore();

  const isScheduleNotSetup = !schedules || schedules.length === 0 || user?.corVerificationStatus === 0;

  useFocusEffect(
    useCallback(() => {
      const task = InteractionManager.runAfterInteractions(() => {
        fetchSchedules();
        fetchMyReservations();
      });
      return () => task.cancel();
    }, []),
  );

  const handleScroll = (event: any) => {
    const yOffset = event?.nativeEvent?.contentOffset?.y;
    if (yOffset !== undefined && yOffset !== null) {
      const scrolled = yOffset > 0;
      if (lastScrolledRef.current !== scrolled) {
        lastScrolledRef.current = scrolled;
        try {
          navigation.setParams({ hasScrolled: scrolled } as any);
        } catch {
          // Ignore if navigation is detaching or unmounted
        }
      }
    }
  };

  const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0]; // Monday to Sunday
  const DAY_NAMES = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];

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

  const { isDark } = useAppTheme();
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([fetchSchedules(), fetchMyReservations()]);
    } catch {
      // ignore
    } finally {
      setRefreshing(false);
    }
  }, [fetchSchedules, fetchMyReservations]);

  return (
    <ContentWrapper noPaddingY>
      <View className="flex-1 bg-light-background dark:bg-dark-background">
        {isLoading && schedules.length === 0 ? (
          <View className="flex-1 items-center justify-center bg-light-background dark:bg-dark-background">
            <ActivityIndicator size="large" color="#D22730" />
          </View>
        ) : (
          <ScrollView
            className="flex-1 pt-4"
            showsVerticalScrollIndicator={false}
            onScroll={handleScroll}
            scrollEventThrottle={16}
            contentContainerStyle={{ paddingBottom: 40 }}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                colors={["#8B0000"]}
                tintColor={isDark ? "#FFFFFF" : "#8B0000"}
              />
            }
          >
            {/* Profile & Schedule Status Card */}
            {isScheduleNotSetup ? (
              <View
                className="bg-light-surface dark:bg-dark-surface border rounded-card p-5 mb-6 overflow-hidden"
                style={{
                  borderColor: isDark ? "rgba(245, 158, 11, 0.4)" : "rgba(245, 158, 11, 0.5)",
                }}
              >
                <View className="flex-row items-start gap-3.5 mb-3.5">
                  <View
                    className="w-11 h-11 rounded-2xl items-center justify-center border"
                    style={{
                      backgroundColor: isDark ? "rgba(245, 158, 11, 0.2)" : "rgba(245, 158, 11, 0.15)",
                      borderColor: isDark ? "rgba(245, 158, 11, 0.35)" : "rgba(245, 158, 11, 0.3)",
                    }}
                  >
                    <CalendarDays size={22} color="#D97706" strokeWidth={2.2} />
                  </View>
                  <View className="flex-1">
                    <View className="flex-row items-center gap-2 mb-1">
                      <Text className="text-light-text dark:text-dark-text font-black text-[15.5px] tracking-tight">
                        No Schedule Set Up Yet
                      </Text>
                      <View
                        className="px-2 py-0.5 rounded-full"
                        style={{
                          backgroundColor: isDark ? "rgba(245, 158, 11, 0.25)" : "rgba(245, 158, 11, 0.15)",
                        }}
                      >
                        <Text className="text-amber-700 dark:text-amber-400 font-heavy text-[9.5px] uppercase">
                          Action Required
                        </Text>
                      </View>
                    </View>
                    <Text className="text-light-muted dark:text-dark-muted font-regular text-[12px] leading-relaxed">
                      You haven't configured your attendance schedule or uploaded your Certificate of Registration (COR) yet. Setting up your schedule is required for campus access.
                    </Text>
                  </View>
                </View>

                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={() => router.push("/(settings)/setup-schedule")}
                  className="bg-[#8B0000] dark:bg-[#A50000] py-3.5 px-4 rounded-2xl flex-row items-center justify-center gap-2.5 active:opacity-90 mt-1"
                >
                  <CalendarPlus size={17} color="#FFFFFF" strokeWidth={2.5} />
                  <Text className="text-white font-heavy text-[14px]">
                    Setup Schedule & Upload COR
                  </Text>
                </TouchableOpacity>
              </View>
            ) : user?.corVerificationStatus === 1 ? (
              <View
                className="border rounded-card p-4 mb-6 flex-row items-center gap-3"
                style={{
                  backgroundColor: isDark ? "rgba(245, 158, 11, 0.15)" : "#FFFBEB",
                  borderColor: isDark ? "rgba(245, 158, 11, 0.3)" : "#FDE68A",
                }}
              >
                <View
                  className="w-9 h-9 rounded-xl items-center justify-center"
                  style={{ backgroundColor: "rgba(245, 158, 11, 0.2)" }}
                >
                  <Clock size={18} color="#D97706" strokeWidth={2.2} />
                </View>
                <View className="flex-1">
                  <Text className="text-amber-800 dark:text-amber-400 font-black text-[14px]">
                    COR & Schedule Pending Review
                  </Text>
                  <Text className="text-amber-900/80 dark:text-amber-200/80 font-book text-[12px] mt-0.5">
                    Your uploaded COR document and schedule are currently being reviewed by the admin team.
                  </Text>
                </View>
              </View>
            ) : user?.corVerificationStatus === 3 ? (
              <View
                className="border rounded-card p-4 mb-6"
                style={{
                  backgroundColor: isDark ? "rgba(239, 68, 68, 0.15)" : "#FEF2F2",
                  borderColor: isDark ? "rgba(239, 68, 68, 0.3)" : "#FECACA",
                }}
              >
                <View className="flex-row items-center gap-3 mb-2">
                  <View
                    className="w-9 h-9 rounded-xl items-center justify-center"
                    style={{ backgroundColor: "rgba(239, 68, 68, 0.2)" }}
                  >
                    <AlertCircle size={18} color="#EF4444" strokeWidth={2.2} />
                  </View>
                  <View className="flex-1">
                    <Text className="text-red-800 dark:text-red-400 font-black text-[14px]">
                      Verification Rejected
                    </Text>
                    <Text className="text-red-900/80 dark:text-red-200/80 font-book text-[12px] mt-0.5">
                      {user?.rejectionReason
                        ? `Reason: ${user.rejectionReason}`
                        : "Your verification was not approved. Please review the requirements and submit the required document again."}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={() => router.push("/(auth)/register")}
                  className="bg-red-600 py-2.5 px-4 rounded-xl flex-row items-center justify-center gap-2 mt-1"
                >
                  <Text className="text-white font-heavy text-[12px]">
                    Re-upload Document
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View
                className="bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border rounded-card overflow-hidden mb-7"
                style={{
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: isDark ? 0.2 : 0.04,
                  shadowRadius: 3,
                  elevation: 1,
                }}
              >
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
            )}

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
                      ? "bg-light-surface dark:bg-dark-surface border-light-border dark:border-dark-border"
                      : "bg-light-surfaceMuted dark:bg-dark-surfaceMuted border-light-border dark:border-dark-border opacity-50"
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
                    <View className="flex-row items-center gap-1.5">
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

            {isScheduleNotSetup ? (
              <TouchableOpacity
                onPress={() => router.push("/(settings)/setup-schedule")}
                activeOpacity={0.85}
                className="mt-4 bg-[#8B0000] dark:bg-[#A50000] p-4 rounded-card flex-row items-center justify-between"
              >
                <View className="flex-row items-center gap-3">
                  <View className="w-9 h-9 rounded-full bg-white/20 items-center justify-center">
                    <CalendarPlus size={18} color="#FFFFFF" strokeWidth={2.2} />
                  </View>
                  <View>
                    <Text className="text-white font-heavy text-[14px]">
                      Setup Schedule & Upload COR
                    </Text>
                    <Text className="text-white/85 font-regular text-[11px] mt-0.5">
                      Configure your weekly days and submit COR document
                    </Text>
                  </View>
                </View>
                <Text className="text-white font-black text-[18px] mr-1">›</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                onPress={() => router.push("/(settings)/schedule")}
                activeOpacity={0.85}
                className="mt-4 bg-[#8B0000] p-3.5 rounded-card flex-row items-center justify-between"
              >
                <View className="flex-row items-center gap-3">
                  <View className="w-8 h-8 rounded-full bg-white/20 items-center justify-center">
                    <CalendarPlus size={16} color="#FFFFFF" strokeWidth={2.2} />
                  </View>
                  <View>
                    <Text className="text-white font-heavy text-[13px]">
                      Request Parking Reservation
                    </Text>
                    <Text className="text-white/80 font-regular text-[11px] mt-0.5">
                      Reserve a spot for days outside your schedule
                    </Text>
                  </View>
                </View>
                <Text className="text-white font-black text-[18px] mr-1">›</Text>
              </TouchableOpacity>
            )}

            <View
              className="mt-6 rounded-card p-3.5 flex-row gap-2.5 items-center border"
              style={{
                backgroundColor: isDark ? "rgba(210, 39, 48, 0.15)" : "rgba(210, 39, 48, 0.08)",
                borderColor: isDark ? "rgba(210, 39, 48, 0.3)" : "rgba(210, 39, 48, 0.2)",
              }}
            >
              <AlertCircle size={15} color={colors.primary} strokeWidth={2.2} />
              <Text className="text-light-text dark:text-dark-text font-regular text-[11px] flex-1 leading-normal">
                To modify your schedule, submit an updated Certificate of
                Registration (COR) via account settings or setup flow for administrator review.
              </Text>
            </View>
          </ScrollView>
        )}
      </View>
    </ContentWrapper>
  );
}
