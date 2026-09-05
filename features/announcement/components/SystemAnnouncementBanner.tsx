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

const DISMISS_KEY = "parkflow_dismissed_announcement_ts";

export default function SystemAnnouncementBanner() {
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
          bg: "#FEF3C7",
          border: "#FDE68A",
          text: "#92400E",
          badgeBg: "#F59E0B",
          badgeText: "#FFFFFF",
          badgeLabel: "CAUTION",
          Icon: AlertTriangle,
          iconColor: "#D97706",
        };
      case "good_news":
        return {
          bg: "#D1FAE5",
          border: "#A7F3D0",
          text: "#065F46",
          badgeBg: "#10B981",
          badgeText: "#FFFFFF",
          badgeLabel: "ANNOUNCEMENT",
          Icon: Sparkles,
          iconColor: "#059669",
        };
      case "info":
        return {
          bg: "#DBEAFE",
          border: "#BFDBFE",
          text: "#1E40AF",
          badgeBg: "#3B82F6",
          badgeText: "#FFFFFF",
          badgeLabel: "INFO",
          Icon: Info,
          iconColor: "#2563EB",
        };
      case "maintenance":
        return {
          bg: "#F3E8FF",
          border: "#E9D5FF",
          text: "#6B21A8",
          badgeBg: "#8B5CF6",
          badgeText: "#FFFFFF",
          badgeLabel: "MAINTENANCE",
          Icon: Wrench,
          iconColor: "#7C3AED",
        };
      case "urgent":
      default:
        return {
          bg: "#FFE4E6",
          border: "#FECDD3",
          text: "#9F1239",
          badgeBg: "#F43F5E",
          badgeText: "#FFFFFF",
          badgeLabel: "URGENT",
          Icon: AlertOctagon,
          iconColor: "#E11D48",
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
            backgroundColor: "rgba(255, 255, 255, 0.7)",
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
          backgroundColor: "rgba(0, 0, 0, 0.06)",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <X size={14} color={theme.text} />
      </TouchableOpacity>
    </View>
  );
}
