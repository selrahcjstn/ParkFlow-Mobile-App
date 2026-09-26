import { ContentWrapper } from "@/components/layouts";
import { useNavigation } from "expo-router";
import React, { useRef } from "react";
import { ScrollView } from "react-native";
import { NotificationPreferences } from "../components/notification";

export default function NotificationSettingsPage() {
  const navigation = useNavigation();
  const lastScrolledRef = useRef(false);

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

  return (
    <ContentWrapper noPaddingY>
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        contentContainerStyle={{ paddingTop: 16, paddingBottom: 40 }}
      >
        <NotificationPreferences />
      </ScrollView>
    </ContentWrapper>
  );
}
