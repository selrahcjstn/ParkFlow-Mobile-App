import React, { useEffect } from "react";
import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { useAppTheme } from "@/hooks/useAppTheme";
import { ContentWrapper } from "@/components/layouts";
import {
  useNotificationStore,
} from "@/features/notification/store/notification.store";
import NotificationDetailModal from "@/features/account/components/notification/NotificationDetailModal";

export default function NotificationDetailPage() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const store = useNotificationStore();

  useEffect(() => {
    if (id) {
      const found = store.notifications.find((n) => n.id === id);
      if (found) {
        store.openNotificationDetail(found);
      }
    }
  }, [id]);

  return (
    <ContentWrapper>
      <View className="flex-1 items-center justify-center py-10">
        <Text className="text-light-muted dark:text-dark-muted font-heavy text-sm">
          Loading Notification Details...
        </Text>
      </View>
      <NotificationDetailModal
        visible={store.isDetailOpen || Boolean(store.selectedNotification)}
        notification={store.selectedNotification}
        onClose={() => {
          store.closeNotificationDetail();
          router.back();
        }}
      />
    </ContentWrapper>
  );
}
