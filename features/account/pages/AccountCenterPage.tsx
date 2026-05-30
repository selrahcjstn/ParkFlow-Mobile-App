import { ContentWrapper } from "@/components/layouts";
import { AlertModal } from "@/components/shared";
import { userService } from "@/features/user/services/user.service";
import type { UserCredentialsResponse } from "@/features/user/types/user.types";
import { useFocusEffect, useNavigation, router } from "expo-router";
import React, { useCallback, useRef, useState } from "react";
import { ScrollView } from "react-native";
import { AccountCenterDetails, SecuritySettings, AccountLinking } from "../components/account-center";

export default function AccountCenterPage() {
  const navigation = useNavigation();
  const lastScrolledRef = useRef(false);

  // States
  const [credentials, setCredentials] = useState<UserCredentialsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Modal State
  const [modal, setModal] = useState({
    visible: false,
    title: "",
    message: "",
    variant: "info" as "error" | "warning" | "info" | "success",
  });

  // Load credentials on page focus
  useFocusEffect(
    useCallback(() => {
      const fetchCreds = async () => {
        try {
          const res = await userService.getUserCredentials();
          if (res?.isSuccess && res.data) {
            setCredentials(res.data);
          }
        } catch (e) {
          console.error("Failed to load user credentials:", e);
        } finally {
          setIsLoading(false);
        }
      };
      fetchCreds();
    }, [])
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
    router.push("/(settings)/set-password");
  };

  const handleTriggerSetPassword = () => {
    router.push("/(settings)/set-password");
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
        {/* Profile Info Card Section */}
        <AccountCenterDetails />

        {/* Linked Accounts Section */}
        <AccountLinking
          credentials={credentials}
          onShowSuccessAlert={(title, message) =>
            setModal({ visible: true, title, message, variant: "success" })
          }
          onTriggerSetPassword={handleTriggerSetPassword}
        />

        {/* Security / Toggles Section */}
        <SecuritySettings onTriggerPasswordReset={handleTriggerPasswordReset} />
      </ScrollView>

      {/* Alert Modal */}
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
