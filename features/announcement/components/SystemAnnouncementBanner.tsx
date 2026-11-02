import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import {
  AlertTriangle,
  Sparkles,
  Info,
  Wrench,
  AlertOctagon,
  X,
  ChevronDown,
  ChevronUp,
} from "lucide-react-native";
import {
  getActiveSystemAnnouncement,
  SystemAnnouncementDto,
} from "../services/system-announcement.service";
import { SecureStore } from "@/services/storage";
import { useAppTheme } from "@/hooks/useAppTheme";

const DISMISS_KEY = "parkflow_dismissed_announcement_ts";

export default function SystemAnnouncementBanner() {
  const { colors, isDark } = useAppTheme();
  const [announcement, setAnnouncement] = useState<SystemAnnouncementDto | null>(null);
  const [isDismissed, setIsDismissed] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function load() {
      const data = await getActiveSystemAnnouncement();
      if (isMounted && data && data.isActive) {
        setAnnouncement(data);
        const dismissedTs = await SecureStore.getItemAsync(DISMISS_KEY);
        const currentTs = data.updatedAt || data.id;
        if (dismissedTs === currentTs) {
          setIsDismissed(true);
        }
      }
    }
    void load();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleDismiss = async () => {
    setIsDismissed(true);
    if (announcement) {
      const currentTs = announcement.updatedAt || announcement.id;
      await SecureStore.setItemAsync(DISMISS_KEY, currentTs);
    }
  };

  if (!announcement || !announcement.isActive || isDismissed) {
    return null;
  }

  const getThemeConfig = () => {
    switch (announcement.iconType) {
      case "caution":
        return {
          accentColor: colors.warning,
          accentBorderClass: "border-l-amber-500",
          iconBgClass: "bg-amber-500/15 dark:bg-amber-500/25",
          badgeBgClass: "bg-amber-500/10 dark:bg-amber-500/20",
          badgeTextClass: "text-amber-700 dark:text-amber-300",
          badgeLabel: "CAUTION",
          Icon: AlertTriangle,
        };
      case "good_news":
        return {
          accentColor: colors.success,
          accentBorderClass: "border-l-emerald-500",
          iconBgClass: "bg-emerald-500/15 dark:bg-emerald-500/25",
          badgeBgClass: "bg-emerald-500/10 dark:bg-emerald-500/20",
          badgeTextClass: "text-emerald-700 dark:text-emerald-300",
          badgeLabel: "ANNOUNCEMENT",
          Icon: Sparkles,
        };
      case "info":
        return {
          accentColor: colors.primary,
          accentBorderClass: "border-l-blue-500",
          iconBgClass: "bg-blue-500/15 dark:bg-blue-500/25",
          badgeBgClass: "bg-blue-500/10 dark:bg-blue-500/20",
          badgeTextClass: "text-blue-700 dark:text-blue-300",
          badgeLabel: "CAMPUS INFO",
          Icon: Info,
        };
      case "maintenance":
        return {
          accentColor: "#9333EA",
          accentBorderClass: "border-l-purple-500",
          iconBgClass: "bg-purple-500/15 dark:bg-purple-500/25",
          badgeBgClass: "bg-purple-500/10 dark:bg-purple-500/20",
          badgeTextClass: "text-purple-700 dark:text-purple-300",
          badgeLabel: "MAINTENANCE",
          Icon: Wrench,
        };
      case "urgent":
      default:
        return {
          accentColor: colors.danger,
          accentBorderClass: "border-l-rose-500",
          iconBgClass: "bg-rose-500/15 dark:bg-rose-500/25",
          badgeBgClass: "bg-rose-500/10 dark:bg-rose-500/20",
          badgeTextClass: "text-rose-700 dark:text-rose-300",
          badgeLabel: "URGENT BROADCAST",
          Icon: AlertOctagon,
        };
    }
  };

  const theme = getThemeConfig();
  const IconComponent = theme.Icon;
  const isLongMessage = (announcement.message || "").length > 130;

  return (
    <View
      className={`mb-4 overflow-hidden rounded-2xl bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border border-l-4 ${theme.accentBorderClass} p-4 shadow-sm`}
    >
      {/* ── Top Row: Themed Icon, Category Pill, and Dismiss Button ── */}
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center gap-2.5 flex-1 pr-2">
          <View
            className={`w-8 h-8 rounded-xl items-center justify-center ${theme.iconBgClass}`}
          >
            <IconComponent size={16} color={theme.accentColor} strokeWidth={2.3} />
          </View>

          <View className={`px-2.5 py-0.5 rounded-full ${theme.badgeBgClass}`}>
            <Text
              className={`text-[10px] font-bold uppercase tracking-wider ${theme.badgeTextClass}`}
            >
              {theme.badgeLabel}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          onPress={handleDismiss}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          className="w-7 h-7 rounded-full bg-light-surfaceMuted dark:bg-dark-surfaceMuted items-center justify-center active:opacity-70"
          accessibilityLabel="Dismiss announcement"
          accessibilityRole="button"
        >
          <X size={14} color={colors.muted} strokeWidth={2.2} />
        </TouchableOpacity>
      </View>

      {/* ── Body: Title and Announcement Message ── */}
      <View className="mt-2.5">
        {Boolean(announcement.title) && (
          <Text className="text-sm font-bold text-light-text dark:text-dark-text tracking-tight mb-1">
            {announcement.title}
          </Text>
        )}

        <Text
          numberOfLines={isExpanded ? undefined : 3}
          className="text-xs leading-5 text-light-muted dark:text-dark-muted font-book"
        >
          {announcement.message}
        </Text>

        {isLongMessage && (
          <TouchableOpacity
            onPress={() => setIsExpanded((prev) => !prev)}
            className="flex-row items-center gap-1 mt-1.5 self-start active:opacity-70"
          >
            <Text className="text-[11px] font-semibold text-light-primary dark:text-dark-primary">
              {isExpanded ? "Show less" : "Read more"}
            </Text>
            {isExpanded ? (
              <ChevronUp size={12} color={colors.primary} />
            ) : (
              <ChevronDown size={12} color={colors.primary} />
            )}
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}
