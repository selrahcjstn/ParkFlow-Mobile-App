import { ContentWrapper } from "@/components/layouts";
import { AlertModal } from "@/components/shared";
import { useNavigation } from "expo-router";
import React, { useRef, useState } from "react";
import { ScrollView } from "react-native";
import { AccountCenterDetails, SecuritySettings } from "../components/account-center";

export default function AccountCenterPage() {
  const navigation = useNavigation();
  const lastScrolledRef = useRef(false);

  // Modal State
  const [modal, setModal] = useState({
    visible: false,
    title: "",
    message: "",
    variant: "info" as "error" | "warning" | "info" | "success",
  });

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
    setModal({
      visible: true,
      title: "Password Reset Sent",
      message:
        "A secure password recovery link has been sent to your registered email address. Please follow the instructions to set a new password.",
      variant: "success",
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
        {/* Profile Info Card Section */}
        <AccountCenterDetails />

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
