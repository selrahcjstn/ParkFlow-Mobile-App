import { ContentWrapper } from "@/components/layouts";
import { AlertModal } from "@/components/shared";
import { userService } from "@/features/user/services/user.service";
import type { UserCredentialsResponse } from "@/features/user/types/user.types";
import { useFocusEffect, useNavigation, router } from "expo-router";
import React, { useCallback, useRef, useState } from "react";
import { ScrollView, InteractionManager } from "react-native";
import { AccountCenterDetails, SecuritySettings, AccountLinking } from "../components/account-center";

export default function AccountCenterPage() {
  const navigation = useNavigation();
  const lastScrolledRef = useRef(false);

  const [credentials, setCredentials] = useState<UserCredentialsResponse | null>(null);

  const [modal, setModal] = useState({
    visible: false,
    title: "",
    message: "",
    variant: "info" as "error" | "warning" | "info" | "success",
  });

  const loadCredentials = useCallback(async () => {
    try {
      const res = await userService.getUserCredentials();
      if (res?.isSuccess && res.data) {
        setCredentials(res.data);
      }
    } catch (e) {
      console.error("Failed to load user credentials:", e);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      const task = InteractionManager.runAfterInteractions(() => {
        void loadCredentials();
      });
      return () => task.cancel();
    }, [loadCredentials])
  );

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

  const handleTriggerPasswordReset = () => {
    router.push({
      pathname: "/(settings)/set-password",
      params: { mode: "reset" },
    });
  };

  const handleTriggerSetPassword = (mode?: string) => {
    router.push({
      pathname: "/(settings)/set-password",
      params: mode ? { mode } : {},
    });
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
        <AccountCenterDetails />

        <AccountLinking
          credentials={credentials}
          onRefreshCredentials={loadCredentials}
        />

        <SecuritySettings onTriggerPasswordReset={handleTriggerPasswordReset} />
      </ScrollView>

      <AlertModal
        visible={modal.visible}
        onClose={() => setModal((p) => ({ ...p, visible: false }))}
        title={modal.title}
        message={modal.message}
        variant={modal.variant}
      />
    </ContentWrapper>
  );
}
