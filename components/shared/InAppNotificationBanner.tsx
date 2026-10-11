import React, { useEffect, useRef } from "react";
import {
  Animated,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Bell,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Sparkles,
  Clock,
  Info,
  X,
} from "lucide-react-native";
import { useAppTheme } from "@/hooks/useAppTheme";
import {
  NotificationItem,
  NotificationType,
  useNotificationStore,
} from "@/features/notification/store/notification.store";

export default function InAppNotificationBanner() {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useAppTheme();
  const activePopupNotification = useNotificationStore(
    (state) => state.activePopupNotification
  );
  const dismissPopupNotification = useNotificationStore(
    (state) => state.dismissPopupNotification
  );
  const openNotificationDetail = useNotificationStore(
    (state) => state.openNotificationDetail
  );

  const translateY = useRef(new Animated.Value(-60)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (activePopupNotification) {
      translateY.setValue(-60);
      opacity.setValue(0);
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
          tension: 70,
          friction: 9,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 180,
          useNativeDriver: true,
        }),
      ]).start();

      const timer = setTimeout(() => {
        handleDismiss();
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [activePopupNotification]);

  const handleDismiss = () => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -60,
        duration: 180,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start(() => {
      dismissPopupNotification();
    });
  };

  const handlePress = () => {
    if (activePopupNotification) {
      const item = activePopupNotification;
      handleDismiss();
      openNotificationDetail(item);
    }
  };

  if (!activePopupNotification) {
    return null;
  }

  const getIcon = (type: NotificationType) => {
    switch (type) {
      case "approved":
        return <CheckCircle2 size={18} color={colors.success} strokeWidth={2.2} />;
      case "rejected":
        return <XCircle size={18} color={colors.danger} strokeWidth={2.2} />;
      case "overdue":
        return <AlertTriangle size={18} color={colors.warning} strokeWidth={2.2} />;
      case "welcome":
        return <Sparkles size={18} color={colors.primary} strokeWidth={2.2} />;
      case "reminder":
        return <Clock size={18} color={colors.primary} strokeWidth={2.2} />;
      case "system":
      default:
        return <Bell size={18} color={colors.primary} strokeWidth={2.2} />;
    }
  };

  const topPosition = Math.max(insets.top, 12) + 6;

  return (
    <View pointerEvents="box-none" style={[styles.rootContainer, { top: topPosition }]}>
      <Animated.View
        style={[
          styles.bannerCard,
          {
            backgroundColor: isDark ? colors.background : "#FFFFFF",
            borderColor: colors.border,
            transform: [{ translateY }],
            opacity,
            ...Platform.select({
              ios: {
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.12,
                shadowRadius: 10,
              },
              android: {
                elevation: 6,
              },
            }),
          },
        ]}
      >
        <TouchableOpacity
          activeOpacity={0.88}
          onPress={handlePress}
          style={styles.innerTouchable}
        >
          {/* Icon Box */}
          <View
            style={[
              styles.iconWrapper,
              {
                backgroundColor: isDark ? "#2B2D31" : colors.background,
              },
            ]}
          >
            {getIcon(activePopupNotification.type)}
          </View>

          {/* Texts */}
          <View style={styles.textContainer}>
            <View style={styles.headerRow}>
              <Text
                numberOfLines={1}
                style={[
                  styles.titleText,
                  { color: isDark ? colors.background : colors.text },
                ]}
              >
                {activePopupNotification.title}
              </Text>
              <Text style={styles.timeText}>Just now</Text>
            </View>

            <Text
              numberOfLines={2}
              style={[
                styles.bodyText,
                { color: colors.muted },
              ]}
            >
              {activePopupNotification.body}
            </Text>
          </View>

          {/* Dismiss button */}
          <TouchableOpacity
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            onPress={handleDismiss}
            style={styles.closeBtn}
          >
            <X size={15} color={colors.muted} strokeWidth={2.2} />
          </TouchableOpacity>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  rootContainer: {
    position: "absolute",
    left: 16,
    right: 16,
    zIndex: 9999,
  },
  bannerCard: {
    width: "100%",
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
  },
  innerTouchable: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 14,
    gap: 12,
  },
  iconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  textContainer: {
    flex: 1,
    justifyContent: "center",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 2,
    gap: 6,
  },
  titleText: {
    fontSize: 13,
    fontFamily: "Inter-Bold",
    flex: 1,
  },
  timeText: {
    fontSize: 10,
    fontFamily: "Inter-Medium",
    color: "#A1A1AA",
  },
  bodyText: {
    fontSize: 11.5,
    fontFamily: "Inter-Regular",
    lineHeight: 16,
  },
  closeBtn: {
    padding: 4,
    marginLeft: 2,
  },
});
