import React, { useRef, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
} from "react-native";
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Sparkles,
  Clock,
  Info,
  ShieldCheck,
  Car,
  FileText,
  ExternalLink,
  User,
} from "lucide-react-native";
import { router } from "expo-router";
import { useAppTheme } from "@/hooks/useAppTheme";
import {
  NotificationItem,
  useNotificationStore,
} from "@/features/notification/store/notification.store";
import AppBottomSheet from "@/components/shared/AppBottomSheet";
import { BottomSheetModal } from "@gorhom/bottom-sheet";

interface NotificationDetailModalProps {
  visible?: boolean;
  notification?: NotificationItem | null;
  onClose?: () => void;
}

export default function NotificationDetailModal({
  visible,
  notification: propNotification,
  onClose: propOnClose,
}: NotificationDetailModalProps) {
  const { colors, isDark } = useAppTheme();
  const store = useNotificationStore();
  const bottomSheetRef = useRef<BottomSheetModal>(null);

  // Use props if provided, otherwise fallback to store state
  const isVisible = visible !== undefined ? visible : store.isDetailOpen;
  const notif = propNotification !== undefined ? propNotification : store.selectedNotification;

  useEffect(() => {
    if (isVisible && notif) {
      bottomSheetRef.current?.present();
    } else {
      bottomSheetRef.current?.dismiss();
    }
  }, [isVisible, notif]);

  const handleClose = () => {
    if (propOnClose) {
      propOnClose();
    } else {
      store.closeNotificationDetail();
    }
  };

  if (!notif) return null;

  const handleAction = () => {
    handleClose();
    if (!notif.actionRoute) return;

    let targetRoute = notif.actionRoute.toLowerCase().trim();

    if (targetRoute.includes("vehicle")) {
      router.push("/(settings)/vehicle" as any);
    } else if (targetRoute.includes("schedule") || targetRoute.includes("reservation")) {
      router.push("/(settings)/schedule" as any);

    } else if (targetRoute.includes("register") || targetRoute.includes("onboarding")) {
      router.push("/(auth)/register" as any);
    } else if (targetRoute.includes("history")) {
      router.push("/(users)/(tabs)/history" as any);
    } else if (targetRoute.includes("home")) {
      router.push("/(users)/(tabs)/home" as any);
    } else if (targetRoute.includes("notification")) {
      router.push("/(settings)/notifications-log" as any);
    } else {
      try {
        router.push(notif.actionRoute as any);
      } catch (err) {
        console.warn("Navigation failed for actionRoute:", notif.actionRoute, err);
      }
    }
  };

  const getThemeConfig = () => {
    switch (notif.type) {
      case "approved":
        return {
          icon: CheckCircle2,
          badgeLabel: "Approved",
          badgeBg: isDark ? colors.success + "26" : colors.success + "1A",
          badgeBorder: colors.success + "4D",
          badgeText: colors.success,
          iconBg: colors.success + "33",
          iconColor: colors.success,
        };

      case "rejected":
        return {
          icon: XCircle,
          badgeLabel: "Action Required",
          badgeBg: isDark ? colors.danger + "26" : colors.danger + "1A",
          badgeBorder: colors.danger + "4D",
          badgeText: colors.danger,
          iconBg: colors.danger + "33",
          iconColor: colors.danger,
        };

      case "overdue":
        return {
          icon: AlertTriangle,
          badgeLabel: "Parking Alert",
          badgeBg: isDark ? colors.warning + "2E" : colors.warning + "1A",
          badgeBorder: isDark ? colors.warning + "59" : colors.warning + "40",
          badgeText: colors.warning,
          iconBg: isDark ? colors.warning + "38" : colors.warning + "33",
          iconColor: colors.warning,
        };

      case "welcome":
        return {
          icon: Sparkles,
          badgeLabel: "Welcome",
          badgeBg: isDark ? colors.primary + "26" : colors.primary + "1A",
          badgeBorder: colors.primary + "4D",
          badgeText: colors.primary,
          iconBg: colors.primary + "33",
          iconColor: colors.primary,
        };

      case "reminder":
        return {
          icon: Clock,
          badgeLabel: "Reminder",
          badgeBg: isDark ? colors.primary + "26" : colors.primary + "1A",
          badgeBorder: colors.primary + "4D",
          badgeText: colors.primary,
          iconBg: colors.primary + "33",
          iconColor: colors.primary,
        };

      case "system":
      default:
        return {
          icon: Info,
          badgeLabel: "Notice",
          badgeBg: isDark ? colors.muted + "26" : colors.surfaceMuted,
          badgeBorder: isDark ? colors.muted + "4D" : colors.border,
          badgeText: colors.text,
          iconBg: isDark ? colors.muted + "33" : colors.surfaceMuted,
          iconColor: isDark ? colors.muted : colors.text,
        };
    }
  };

  const theme = getThemeConfig();
  const HeroIcon = theme.icon;

  return (
    <AppBottomSheet
      ref={bottomSheetRef}
      snapPoints={["85%"]}
      onDismiss={handleClose}
      scrollable={true}
    >
      <View className="pb-4">
        {/* Header Badge */}
        <View className="flex-row items-center justify-between pb-3 mb-2 border-b border-light-border/60 dark:border-dark-border/40">
          <View className="flex-row items-center gap-2">
            <View
              className="px-2.5 py-0.5 rounded-md border"
              style={{
                backgroundColor: theme.badgeBg,
                borderColor: theme.badgeBorder,
              }}
            >
              <Text
                className="font-bold text-[11px]"
                style={{ color: theme.badgeText }}
              >
                {theme.badgeLabel}
              </Text>
            </View>
          </View>
        </View>

        {/* Hero Icon */}
        <View className="items-center mb-4 mt-2">
          <View
            className="w-16 h-16 rounded-full items-center justify-center"
            style={{ backgroundColor: theme.iconBg }}
          >
            <HeroIcon size={32} color={theme.iconColor} strokeWidth={2.2} />
          </View>
        </View>

        {/* Title & Subtitle */}
        <View className="items-center mb-5 px-2">
          <Text className="text-lg font-bold text-light-text dark:text-dark-text text-center leading-snug mb-1">
            {notif.title}
          </Text>
          {Boolean(notif.subtitle) && (
            <Text className="text-xs font-medium text-light-muted dark:text-dark-muted text-center">
              {notif.subtitle}
            </Text>
          )}
          <Text className="text-[11px] font-medium text-light-muted/70 dark:text-dark-muted/70 mt-1.5">
            {notif.date} ({notif.timestamp})
          </Text>
        </View>

        {/* Description Body Card */}
        <View className="bg-light-surface-muted dark:bg-dark-surface-muted rounded-2xl p-4 border border-light-border/70 dark:border-dark-border/50 mb-5">
          <Text className="text-[13px] font-regular text-light-text dark:text-dark-text leading-relaxed">
            {notif.body}
          </Text>
        </View>

        {/* Metadata Box */}
        <View className="bg-light-surface dark:bg-dark-surface rounded-2xl p-4 border border-light-border dark:border-dark-border gap-2.5 mb-6">
          <Text className="text-[10.5px] font-bold uppercase tracking-wider text-light-muted dark:text-dark-muted mb-0.5">
            Notification Details
          </Text>

          {Boolean(notif.driverName) && (
            <View className="flex-row items-center justify-between gap-3">
              <View className="flex-row items-center gap-2 flex-shrink-0">
                <User size={14} color={colors.muted} />
                <Text className="text-[12px] font-medium text-light-muted dark:text-dark-muted">
                  User Details
                </Text>
              </View>
              <View className="items-end">
                <Text className="text-[12px] font-bold text-light-text dark:text-dark-text">
                  {notif.driverName}
                </Text>
                {Boolean(notif.driverRole) && (
                  <Text className="text-[10px] font-semibold text-light-muted dark:text-dark-muted capitalize">
                    {notif.driverRole}
                  </Text>
                )}
              </View>
            </View>
          )}

          {Boolean(notif.referenceCode) && (
            <View className="flex-row items-center justify-between gap-3">
              <View className="flex-row items-center gap-2 flex-shrink-0">
                <FileText size={14} color={colors.muted} />
                <Text className="text-[12px] font-medium text-light-muted dark:text-dark-muted">
                  Reference Code
                </Text>
              </View>
              <Text
                className="text-[12px] font-bold text-light-text dark:text-dark-text font-mono flex-1 text-right"
                numberOfLines={1}
                ellipsizeMode="middle"
              >
                {notif.referenceCode}
              </Text>
            </View>
          )}

          {(Boolean(notif.vehiclePlate) || Boolean(notif.vehicleBrand)) && (
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center gap-2">
                <Car size={14} color={colors.muted} />
                <Text className="text-[12px] font-medium text-light-muted dark:text-dark-muted">
                  Target Vehicle
                </Text>
              </View>
              <View className="flex-row items-center gap-1.5">
                {Boolean(notif.vehicleBrand) && (
                  <Text className="text-[11px] font-semibold text-light-muted dark:text-dark-muted">
                    {notif.vehicleBrand}
                  </Text>
                )}
                {Boolean(notif.vehiclePlate) && (
                  <View className="px-2 py-0.5 rounded bg-light-surface-muted dark:bg-dark-surface-muted border border-light-border dark:border-dark-border">
                    <Text className="text-[12px] font-bold text-light-primary dark:text-dark-primary font-mono">
                      {notif.vehiclePlate}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          )}

          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-2">
              <ShieldCheck size={14} color={colors.muted} />
              <Text className="text-[12px] font-medium text-light-muted dark:text-dark-muted">
                Issued By
              </Text>
            </View>
            <Text className="text-[12px] font-semibold text-light-text dark:text-dark-text">
              {notif.issuer || "ParkFlow Security"}
            </Text>
          </View>
        </View>

        {/* Actions Area */}
        <View className="gap-3">
          {notif.actionText ? (
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleAction}
              className="bg-light-primary dark:bg-dark-primary py-3.5 px-4 rounded-xl flex-row items-center justify-center gap-2 shadow-soft"
            >
              <Text className="text-light-textInverse dark:text-dark-background font-bold text-sm">
                {notif.actionText}
              </Text>
              <ExternalLink size={16} color={colors.background} strokeWidth={2.2} />
            </TouchableOpacity>
          ) : null}

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={handleClose}
            className="py-3 px-4 rounded-xl border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface items-center justify-center"
          >
            <Text className="text-light-text dark:text-dark-text font-bold text-xs">
              Dismiss
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </AppBottomSheet>
  );
}
