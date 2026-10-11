import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import {
  AlertTriangle,
  Sparkles,
  Info,
  Wrench,
  AlertOctagon,
  X,
} from "lucide-react-native";
import {
  getActiveSystemAnnouncement,
  SystemAnnouncementDto,
} from "../services/system-announcement.service";
import { SecureStore } from "@/services/storage";
import { useAppTheme } from "@/hooks/useAppTheme";

const DISMISS_KEY = "parkflow_dismissed_announcement_ts";

export default function SystemAnnouncementBanner() {
  const { colors } = useAppTheme();
  const [announcement, setAnnouncement] = useState<SystemAnnouncementDto | null>(null);
  const [isDismissed, setIsDismissed] = useState(false);

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

  // Theme definitions for 5 icon types
  const getTheme = () => {
    switch (announcement.iconType) {
      case "caution":
        return {
          bg: colors.warning + "1A",
          border: colors.warning + "40",
          text: colors.text,
          badgeLabel: "CAUTION",
          Icon: AlertTriangle,
          iconColor: colors.warning,
        };
      case "good_news":
        return {
          bg: colors.success + "1A",
          border: colors.success + "40",
          text: colors.text,
          badgeLabel: "ANNOUNCEMENT",
          Icon: Sparkles,
          iconColor: colors.success,
        };
      case "info":
        return {
          bg: colors.primary + "1A",
          border: colors.primary + "40",
          text: colors.text,
          badgeLabel: "INFO",
          Icon: Info,
          iconColor: colors.primary,
        };
      case "maintenance":
        return {
          bg: colors.primary + "1A",
          border: colors.primary + "40",
          text: colors.text,
          badgeLabel: "MAINTENANCE",
          Icon: Wrench,
          iconColor: colors.primary,
        };
      case "urgent":
      default:
        return {
          bg: colors.danger + "1A",
          border: colors.danger + "40",
          text: colors.text,
          badgeLabel: "URGENT",
          Icon: AlertOctagon,
          iconColor: colors.danger,
        };
    }
  };

  const theme = getTheme();
  const IconComponent = theme.Icon;

  return (
    <View
      style={{
        backgroundColor: theme.bg,
        borderColor: theme.border,
        borderWidth: 1,
        borderRadius: 14,
        padding: 12,
        marginVertical: 10,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", flex: 1, paddingRight: 8 }}>
        <View
          style={{
            width: 34,
            height: 34,
            borderRadius: 10,
            backgroundColor: colors.surface,
            alignItems: "center",
            justifyContent: "center",
            marginRight: 10,
          }}
        >
          <IconComponent size={18} color={theme.iconColor} />
        </View>

        <View style={{ flex: 1 }}>
          {Boolean(announcement.title) && (
            <Text style={{ color: theme.text, fontSize: 13.5, fontWeight: "700", marginBottom: 2 }}>
              {announcement.title}
            </Text>
          )}

          <Text style={{ color: theme.text, fontSize: 12, fontWeight: "500", lineHeight: 16 }}>
            {announcement.message}
          </Text>
        </View>
      </View>

      <TouchableOpacity
        onPress={handleDismiss}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        style={{
          width: 26,
          height: 26,
          borderRadius: 13,
          backgroundColor: colors.surfaceMuted,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <X size={14} color={theme.text} />
      </TouchableOpacity>
    </View>
  );
}
