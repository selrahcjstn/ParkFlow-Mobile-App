import { ContentWrapper } from "@/components/layouts";
import { formatTime } from "@/utils/formatTime";
import { formatDate } from "@/utils/formatDate";
import { router, useFocusEffect, useNavigation } from "expo-router";
import {
  AlertCircle,
  Calendar,
  CalendarDays,
  CalendarPlus,
  Car,
  Clock,
  Coins,
  LogIn,
  LogOut,
  ShieldCheck,
} from "lucide-react-native";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { registerScheduleListener, registerVerificationStatusListener } from "@/services/signalr";
import {
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  InteractionManager,
  RefreshControl,
} from "react-native";
import { useScheduleStore } from "../store/schedule.store";
import { useReservationStore, isReservationDone } from "../store/reservation.store";
import { useAuthStore } from "@/features/auth/store/auth.store";
import { useAppTheme } from "@/hooks/useAppTheme";
import { useSystemSettingsQuery } from "@/hooks";
import { MotorcycleIcon } from "@/components/ui/MotorcycleIcon";
import { ScheduleRowSkeleton } from "@/components/ui/Skeleton";
import PersonnelParkingHours from "../components/PersonnelParkingHours";
import AppButton from "@/components/ui/AppButton";

export default function UserSchedulePage() {
  const { user } = useAuthStore();
  const { colors } = useAppTheme();
  if (user?.profileType === "personnel") {
    return <ContentWrapper noPaddingY>
      <ScrollView contentContainerStyle={{ paddingTop: 16, paddingBottom: 40 }}>
        <PersonnelParkingHours />
        <View className="gap-3">
          <AppButton
            label="Employee ID verification"
            variant="primary"
            size="lg"
            uppercase={false}
            icon={<ShieldCheck size={20} color={colors.background} strokeWidth={2} />}
            onPress={() => router.push("/(settings)/setup-schedule")}
          />
          <AppButton
            label="Manage vehicle"
            variant="outline"
            size="lg"
            uppercase={false}
            icon={<Car size={20} color={colors.primary} strokeWidth={2} />}
            className="bg-light-surface dark:bg-dark-surface border-light-primary/30 dark:border-dark-primary/30"
            textClassName="text-light-primary dark:text-dark-primary"
            onPress={() => router.push("/(settings)/vehicle")}
          />
        </View>
      </ScrollView>
    </ContentWrapper>;
  }
  return <StudentSchedulePage />;
}

function StudentSchedulePage() {
  const navigation = useNavigation();
  const lastScrolledRef = useRef(false);
  const { colors } = useAppTheme();

  const { user } = useAuthStore();
  const { schedules, isLoading, fetchSchedules } = useScheduleStore();
  const { activeReservation, fetchMyReservations } =
    useReservationStore();
  const { data: systemSettings } = useSystemSettingsQuery();

  const earlyEntryText = useMemo(() => {
    if (!systemSettings) return "-15m";
    if (!systemSettings.isEarlyParkingAllowed) return "Off";
    return `-${systemSettings.earlyParkingMinutes}m`;
  }, [systemSettings]);

  const lateExitText = useMemo(() => {
    if (!systemSettings) return "+15m";
    if (!systemSettings.isGracePeriodEnabled) return "Off";
    return `+${systemSettings.gracePeriodMinutes}m`;
  }, [systemSettings]);

  const feePolicyText = useMemo(() => {
    if (!systemSettings) return "₱100.00 / hr overstay fee";
    const mode = systemSettings.feeCalculationMode;
    const rate = Number(systemSettings.violationRatePerHour ?? 100).toFixed(2);
    const base = Number(systemSettings.baseFee ?? 50).toFixed(2);

    switch (mode) {
      case "no_fee":
        return "Exempt (No overstay fees applied)";
      case "per_day":
        return `₱${rate} / day flat overstay penalty`;
      case "one_time":
        return `₱${base} one-time overstay penalty`;
      case "one_time_hourly":
        return `₱${base} base + ₱${rate}/hr`;
      case "per_hour":
      default:
        return `₱${rate} / hr overstay rate`;
    }
  }, [systemSettings]);

  const isScheduleNotSetup = !schedules || schedules.length === 0 || user?.corVerificationStatus === 0;

  useFocusEffect(
    useCallback(() => {
      const task = InteractionManager.runAfterInteractions(() => {
        fetchSchedules();
        fetchMyReservations();
      });
      return () => task.cancel();
    }, [fetchSchedules, fetchMyReservations]),
  );

  useEffect(() => {
    const unsubSchedule = registerScheduleListener(() => {
      fetchSchedules();
      fetchMyReservations();
    });
    const unsubVerification = registerVerificationStatusListener(() => {
      fetchSchedules();
      fetchMyReservations();
    });
    return () => {
      unsubSchedule();
      unsubVerification();
    };
  }, [fetchSchedules, fetchMyReservations]);

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

  const mappedSchedules = DAY_ORDER.flatMap((dayNum) => {
    const classes = schedules.filter(s => s.dayOfWeek === dayNum).sort((a, b) => a.startTime.localeCompare(b.startTime));
    return classes.length ? classes.map(s => ({ dayName: DAY_NAMES[dayNum], startTime: formatTime(s.startTime), endTime: formatTime(s.endTime), isActive: true }))
      : [{ dayName: DAY_NAMES[dayNum], startTime: '', endTime: '', isActive: false }];
  });

  const activeCount = new Set(schedules.map(s => s.dayOfWeek)).size;

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
          <View className="flex-1 pt-6 px-1">
            <ScheduleRowSkeleton />
            <ScheduleRowSkeleton />
            <ScheduleRowSkeleton />
            <ScheduleRowSkeleton />
            <ScheduleRowSkeleton />
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
                colors={[colors.primary]}
                tintColor={isDark ? "#FFFFFF" : colors.primary}
              />
            }
          >
            {/* Profile & Schedule Status Card */}
            {isScheduleNotSetup ? (
              <View
                className="bg-light-surface dark:bg-dark-surface border rounded-card p-5 mb-6 overflow-hidden"
                style={{
                  borderColor: isDark ? colors.warning + "66" : colors.warning + "80",
                }}
              >
                <View className="flex-row items-start gap-3.5 mb-3.5">
                  <View
                    className="w-11 h-11 rounded-2xl items-center justify-center border"
                    style={{
                      backgroundColor: isDark ? colors.warning + "33" : colors.warning + "26",
                      borderColor: isDark ? colors.warning + "59" : colors.warning + "4D",
                    }}
                  >
                    <CalendarDays size={22} color={colors.warning} strokeWidth={2.2} />
                  </View>
                  <View className="flex-1">
                    <View className="flex-row items-center gap-2 mb-1">
                      <Text className="text-light-text dark:text-dark-text font-bold text-[15.5px] tracking-tight">
                        No Schedule Set Up Yet
                      </Text>
                      <View
                        className="px-2 py-0.5 rounded-full"
                        style={{
                          backgroundColor: isDark ? colors.warning + "40" : colors.warning + "26",
                        }}
                      >
                        <Text className="text-light-text dark:text-dark-warning font-bold text-[9.5px] uppercase">
                          Action Required
                        </Text>
                      </View>
                    </View>
                    <Text className="text-light-muted dark:text-dark-muted font-regular text-[12px] leading-relaxed">
                      You haven&apos;t configured your attendance schedule or uploaded your Certificate of Registration (COR) yet. Setting up your schedule is required for campus access.
                    </Text>
                  </View>
                </View>

                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={() => router.push("/(settings)/setup-schedule")}
                  className="bg-light-primary dark:bg-dark-primary py-3.5 px-4 rounded-card flex-row items-center justify-center gap-2.5 active:opacity-90 mt-1"
                >
                  <CalendarPlus size={17} color={colors.background} strokeWidth={2.5} />
                  <Text className="text-light-textInverse dark:text-dark-background font-bold text-[14px]">
                    Setup Schedule & Upload COR
                  </Text>
                </TouchableOpacity>
              </View>
            ) : user?.corVerificationStatus === 1 ? (
              <View
                className="border rounded-card p-4 mb-6 flex-row items-center gap-3"
                style={{
                  backgroundColor: isDark ? colors.warning + "26" : colors.warning + "1A",
                  borderColor: isDark ? colors.warning + "4D" : colors.warning + "40",
                }}
              >
                <View
                  className="w-9 h-9 rounded-xl items-center justify-center"
                  style={{ backgroundColor: colors.warning + "33" }}
                >
                  <Clock size={18} color={colors.warning} strokeWidth={2.2} />
                </View>
                <View className="flex-1">
                  <Text className="text-light-text dark:text-dark-warning font-bold text-[14px]">
                    COR & Schedule Pending Review
                  </Text>
                  <Text className="text-light-text/80 dark:text-dark-warning/80 font-book text-[12px] mt-0.5">
                    Your uploaded COR document and schedule are currently being reviewed by the admin team.
                  </Text>
                </View>
              </View>
            ) : user?.corVerificationStatus === 3 ? (
              <View
                className="border rounded-card p-4 mb-6"
                style={{
                  backgroundColor: isDark ? colors.danger + "26" : colors.danger + "1A",
                  borderColor: colors.danger + "4D",
                }}
              >
                <View className="flex-row items-center gap-3 mb-2">
                  <View
                    className="w-9 h-9 rounded-xl items-center justify-center"
                    style={{ backgroundColor: colors.danger + "33" }}
                  >
                    <AlertCircle size={18} color={colors.danger} strokeWidth={2.2} />
                  </View>
                  <View className="flex-1">
                    <Text className="text-light-text dark:text-dark-danger font-bold text-[14px]">
                      Verification Rejected
                    </Text>
                    <Text className="text-light-text/80 dark:text-dark-danger/80 font-book text-[12px] mt-0.5">
                      {user?.rejectionReason
                        ? `Reason: ${user.rejectionReason}`
                        : "Your verification was not approved. Please review the requirements and submit the required document again."}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={() => router.push("/(settings)/setup-schedule")}
                  className="bg-light-primary dark:bg-dark-primary py-2.5 px-4 rounded-xl flex-row items-center justify-center gap-2 mt-1"
                >
                  <Text className="text-light-textInverse dark:text-dark-background font-bold text-[12px]">
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
                      color={Platform.OS === "ios" ? colors.success : colors.success}
                      strokeWidth={2.2}
                    />
                  </View>

                  <View className="flex-1">
                    <Text className="text-light-text dark:text-dark-text font-bold text-[14px] tracking-tight">
                      Verified Access Profile
                    </Text>
                    <Text className="text-light-muted dark:text-dark-muted font-regular text-[12px] mt-0.5">
                      Parking permissions active for {activeCount} days this week
                    </Text>
                  </View>
                </View>

                <View className="px-4 py-3 flex-row items-center justify-between border-t border-light-border dark:border-dark-border">
                  <View className="flex-row items-center gap-1.5">
                    <LogIn size={13} color={colors.muted} strokeWidth={2.2} />
                    <Text className="text-light-muted dark:text-dark-muted font-book text-[11px]">
                      Early Entry:{" "}
                      <Text className="font-bold text-light-text dark:text-dark-text">
                        {earlyEntryText}
                      </Text>
                    </Text>
                  </View>

                  <View className="w-px h-3 bg-light-border dark:bg-dark-border" />

                  <View className="flex-row items-center gap-1.5">
                    <LogOut size={13} color={colors.muted} strokeWidth={2.2} />
                    <Text className="text-light-muted dark:text-dark-muted font-book text-[11px]">
                      Grace Period:{" "}
                      <Text className="font-bold text-light-text dark:text-dark-text">
                        {lateExitText}
                      </Text>
                    </Text>
                  </View>
                </View>

                {/* Overstay Fee Policy Strip */}
                <View className="px-4 py-2.5 bg-light-surfaceMuted/50 dark:bg-dark-surfaceMuted/50 flex-row items-center justify-between border-t border-light-border dark:border-dark-border">
                  <View className="flex-row items-center gap-1.5 flex-1">
                    <Coins size={13} color={colors.warning} strokeWidth={2.2} />
                    <Text className="text-light-muted dark:text-dark-muted font-book text-[11px] flex-1" numberOfLines={1}>
                      Overstay Policy: <Text className="font-bold text-light-text dark:text-dark-text">{feePolicyText}</Text>
                    </Text>
                  </View>
                </View>
              </View>
            )}

            <View className="flex-row items-center gap-1.5 mb-3 px-0.5">
              <Calendar size={13} color={colors.muted} />
              <Text className="text-light-muted dark:text-dark-muted font-bold text-[11px] uppercase tracking-wider">
                Week at a glance
              </Text>
            </View>

            <View className="gap-2">
              {mappedSchedules.map((day) => (
                <View
                  key={`${day.dayName}-${day.startTime}-${day.endTime}`}
                  className={`flex-row items-center justify-between px-4 py-3.5 rounded-card border ${
                    day.isActive
                      ? "bg-light-surface dark:bg-dark-surface border-light-border dark:border-dark-border"
                      : "bg-light-surfaceMuted dark:bg-dark-surfaceMuted border-light-border dark:border-dark-border opacity-50"
                  }`}
                >
                  <Text
                    className={`font-bold text-[14px] ${
                      day.isActive
                        ? "text-light-text dark:text-dark-text"
                        : "text-light-muted dark:text-dark-muted"
                    }`}
                  >
                    {day.dayName}
                  </Text>
                  {day.isActive ? (
                    <View className="flex-row items-center gap-1.5">
                      <Clock size={12} color={colors.muted} strokeWidth={2} />
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
                className="mt-4 bg-light-primary dark:bg-dark-primary p-4 rounded-card flex-row items-center justify-between"
              >
                <View className="flex-row items-center gap-3">
                  <View className="w-9 h-9 rounded-full bg-white/20 items-center justify-center">
                    <CalendarPlus size={18} color={colors.background} strokeWidth={2.2} />
                  </View>
                  <View>
                    <Text className="text-light-textInverse dark:text-dark-background font-bold text-[14px]">
                      Setup Schedule & Upload COR
                    </Text>
                    <Text className="text-white/85 font-regular text-[11px] mt-0.5">
                      Configure your weekly days and submit COR document
                    </Text>
                  </View>
                </View>
                <Text className="text-light-textInverse dark:text-dark-background font-bold text-[18px] mr-1">›</Text>
              </TouchableOpacity>
            ) : activeReservation && !isReservationDone(activeReservation) ? (
              <TouchableOpacity
                onPress={() => router.push({ pathname: "/(settings)/schedule", params: { tab: "pass" } })}
                activeOpacity={0.85}
                className="mt-4 bg-light-surface dark:bg-dark-surface border border-light-success/30 dark:border-dark-success/30 p-3.5 rounded-card flex-row items-center justify-between"
              >
                <View className="flex-row items-center gap-3">
                  <View className="w-8 h-8 rounded-full bg-light-success/10 dark:bg-dark-success/10 items-center justify-center">
                    <MotorcycleIcon size={16} color={colors.success} />
                  </View>
                  <View>
                    <View className="flex-row items-center gap-1.5">
                      <Text className="text-light-text dark:text-dark-text font-bold text-[13px]">
                        Active Reservation Pass
                      </Text>
                      <View className="px-1.5 py-0.2 rounded bg-light-success/10 dark:bg-dark-success/10 border border-light-success/20 dark:border-dark-success/20">
                        <Text className="text-light-text dark:text-dark-success font-bold text-[9px] uppercase">
                          Approved
                        </Text>
                      </View>
                    </View>
                    <Text className="text-light-muted dark:text-dark-muted font-regular text-[11px] mt-0.5">
                      {formatDate(activeReservation.reservationDate)} • {formatTime(activeReservation.startTime)} – {formatTime(activeReservation.endTime)}
                    </Text>
                  </View>
                </View>
                <Text className="text-light-muted dark:text-dark-muted font-bold text-[16px] mr-1">›</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                onPress={() => router.push("/(settings)/schedule")}
                activeOpacity={0.85}
                className="mt-4 bg-light-primary dark:bg-dark-primary p-3.5 rounded-card flex-row items-center justify-between"
              >
                <View className="flex-row items-center gap-3">
                  <View className="w-8 h-8 rounded-full bg-white/20 items-center justify-center">
                    <MotorcycleIcon size={16} color={colors.background} />
                  </View>
                  <View>
                    <Text className="text-light-textInverse dark:text-dark-background font-bold text-[13px]">
                      Request Motorcycle Reservation
                    </Text>
                    <Text className="text-white/80 font-regular text-[11px] mt-0.5">
                      Reserve a spot for days outside your schedule
                    </Text>
                  </View>
                </View>
                <Text className="text-light-textInverse dark:text-dark-background font-bold text-[18px] mr-1">›</Text>
              </TouchableOpacity>
            )}

            <View
              className="mt-6 rounded-card p-3.5 flex-row gap-2.5 items-center border"
              style={{
                backgroundColor: isDark ? "rgba(123, 17, 19, 0.15)" : "rgba(123, 17, 19, 0.08)",
                borderColor: isDark ? "rgba(123, 17, 19, 0.3)" : "rgba(123, 17, 19, 0.2)",
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
