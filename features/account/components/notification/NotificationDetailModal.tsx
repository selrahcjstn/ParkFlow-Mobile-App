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
    if (notif.actionRoute) {
      router.push(notif.actionRoute as any);
    }
  };

  const getThemeConfig = () => {
    switch (notif.type) {
      case "approved":
        return {
          icon: CheckCircle2,
          badgeLabel: "APPROVED & ACTIVE",
          badgeBg: isDark ? "rgba(16, 185, 129, 0.15)" : "#ECFDF5",
          badgeBorder: isDark ? "rgba(16, 185, 129, 0.3)" : "#A7F3D0",
          badgeText: isDark ? "#34D399" : "#059669",
          iconBg: isDark ? "rgba(16, 185, 129, 0.2)" : "#D1FAE5",
          iconColor: isDark ? "#10B981" : "#059669",
          glowColor: "rgba(16, 185, 129, 0.12)",
        };

      case "rejected":
        return {
          icon: XCircle,
          badgeLabel: "ACTION REQUIRED",
          badgeBg: isDark ? "rgba(239, 68, 68, 0.15)" : "#FEF2F2",
          badgeBorder: isDark ? "rgba(239, 68, 68, 0.3)" : "#FCA5A5",
          badgeText: isDark ? "#F87171" : "#DC2626",
          iconBg: isDark ? "rgba(239, 68, 68, 0.2)" : "#FEE2E2",
          iconColor: isDark ? "#EF4444" : "#DC2626",
          glowColor: "rgba(239, 68, 68, 0.12)",
        };

      case "overdue":
        return {
          icon: AlertTriangle,
          badgeLabel: "OVERDUE PARKING ALERT",
          badgeBg: isDark ? "rgba(245, 158, 11, 0.18)" : "#FFFBEB",
          badgeBorder: isDark ? "rgba(245, 158, 11, 0.35)" : "#FDE68A",
          badgeText: isDark ? "#FBBF24" : "#D97706",
          iconBg: isDark ? "rgba(245, 158, 11, 0.22)" : "#FEF3C7",
          iconColor: isDark ? "#F59E0B" : "#D97706",
          glowColor: "rgba(245, 158, 11, 0.14)",
        };

      case "welcome":
        return {
          icon: Sparkles,
          badgeLabel: "WELCOME TO PARKFLOW",
          badgeBg: isDark ? "rgba(99, 102, 241, 0.15)" : "#EEF2FF",
          badgeBorder: isDark ? "rgba(99, 102, 241, 0.3)" : "#C7D2FE",
          badgeText: isDark ? "#818CF8" : "#4F46E5",
          iconBg: isDark ? "rgba(99, 102, 241, 0.2)" : "#E0E7FF",
          iconColor: isDark ? "#6366F1" : "#4F46E5",
          glowColor: "rgba(99, 102, 241, 0.12)",
        };

      case "reminder":
        return {
          icon: Clock,
          badgeLabel: "DAILY REMINDER",
          badgeBg: isDark ? "rgba(14, 165, 233, 0.15)" : "#F0F9FF",
          badgeBorder: isDark ? "rgba(14, 165, 233, 0.3)" : "#BAE6FD",
          badgeText: isDark ? "#38BDF8" : "#0284C7",
          iconBg: isDark ? "rgba(14, 165, 233, 0.2)" : "#E0F2FE",
          iconColor: isDark ? "#0EA5E9" : "#0284C7",
          glowColor: "rgba(14, 165, 233, 0.12)",
        };

      case "system":
      default:
        return {
          icon: Info,
          badgeLabel: "SYSTEM INFO",
          badgeBg: isDark ? "rgba(148, 163, 184, 0.15)" : "#F8FAFC",
          badgeBorder: isDark ? "rgba(148, 163, 184, 0.3)" : "#E2E8F0",
          badgeText: isDark ? "#CBD5E1" : "#475569",
          iconBg: isDark ? "rgba(148, 163, 184, 0.2)" : "#F1F5F9",
          iconColor: isDark ? "#94A3B8" : "#475569",
          glowColor: "rgba(148, 163, 184, 0.1)",
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
          <View className="flex-row items-center gap-2.5">
            <View
              className="px-2.5 py-1 rounded-full border"
              style={{
                backgroundColor: theme.badgeBg,
                borderColor: theme.badgeBorder,
              }}
            >
              <Text
                className="font-bold text-[10px] tracking-wider uppercase"
                style={{ color: theme.badgeText }}
              >
                {theme.badgeLabel}
              </Text>
            </View>
          </View>
        </View>

        {/* Hero Icon Badge */}
        <View className="items-center mb-5">
          <View
            className="w-20 h-20 rounded-full items-center justify-center"
            style={{ backgroundColor: theme.iconBg }}
          >
            <HeroIcon size={40} color={theme.iconColor} strokeWidth={2.2} />
          </View>
        </View>

        {/* Title & Subtitle */}
        <View className="items-center mb-5">
          <Text className="text-xl font-bold text-light-text dark:text-dark-text text-center leading-tight mb-1">
            {notif.title}
          </Text>
          <Text className="text-xs font-semibold text-light-muted dark:text-dark-muted text-center">
            {notif.subtitle}
          </Text>
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
            Notification Metadata
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
              <Text className="text-white font-bold text-sm">
                {notif.actionText}
              </Text>
              <ExternalLink size={16} color="#FFFFFF" strokeWidth={2.2} />
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
