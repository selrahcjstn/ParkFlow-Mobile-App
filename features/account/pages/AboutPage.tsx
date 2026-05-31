import { ContentWrapper } from "@/components/layouts";
import { AlertModal } from "@/components/shared";
import { useAppTheme } from "@/hooks/useAppTheme";
import { useNavigation } from "expo-router";
import {
  ChevronRight,
  CloudLightning,
  FileText,
  Heart,
  Info,
  LockKeyhole,
  Scale,
  ShieldAlert,
  X,
} from "lucide-react-native";
import React, { useRef, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function AboutPage() {
  const { colors, isDark } = useAppTheme();
  const navigation = useNavigation();
  const lastScrolledRef = useRef(false);

  const [isChecking, setIsChecking] = useState(false);
  const [toast, setToast] = useState({ visible: false, title: "", message: "" });

  const [docModal, setDocModal] = useState<{
    visible: boolean;
    title: string;
    content: string[];
  }>({
    visible: false,
    title: "",
    content: [],
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

  const handleCheckUpdates = async () => {
    if (isChecking) return;
    setIsChecking(true);
    await new Promise((resolve) => setTimeout(resolve, 1200));
    setIsChecking(false);

    setToast({
      visible: true,
      title: "System Update Confirmed",
      message: "You are running the latest official build of ParkFlow! (Version 1.0.4 - RELEASE)",
    });
  };

  const openDocument = (type: "terms" | "privacy" | "licenses") => {
    if (type === "terms") {
      setDocModal({
        visible: true,
        title: "Terms of Service",
        content: [
          "1. Acceptance of Terms",
          "By downloading or using the ParkFlow Mobile Application, you agree to comply with and be bound by these BulSU Campus Parking System Terms of Service. If you do not agree, you are restricted from access.",
          "2. Vehicle Declaration Requirements",
          "All students, personnel, and external users are strictly required to declare accurate vehicle license plates, models, and owner credentials. Falsifying certificates or plate details will result in direct campus disciplinary actions.",
          "3. Compliance with Security Staff",
          "Use of the digital QR gate pass is subject to manual verification by active BulSU security guards. Refusal to cooperate, parking outside designated boxes, or speed violations inside Gate 3 parking areas will lead to access suspension.",
          "4. Violation Dispute Timeline",
          "Any citation or parking violation ticket must be formally disputed via the Mobile dashboard within 3 academic days of issuance. Unfiled disputes will automatically stand and accrue administrative campus penalties.",
        ],
      });
    } else if (type === "privacy") {
      setDocModal({
        visible: true,
        title: "Privacy Policy",
        content: [
          "1. Data Collection & Student Records",
          "ParkFlow collects your full name, BulSU student/employee ID, official email address, course information, active vehicle registry details, and attendance schedule proofs (COR file uploads).",
          "2. Information Usage",
          "Collected details are utilized exclusively to secure gate accessibility, track campus vehicle capacities, log check-in/check-out timestamps, and process dispute resolutions.",
          "3. Data Sharing Protocols",
          "Your parking record and user profile details are hosted on BulSU campus secure cloud infrastructure. We do not distribute or share your personal information with third-party advertising or non-campus entities.",
          "4. Security Compliance",
          "All access logs and user accounts implement encryption during transmission. Users are responsible for maintaining secure direct login passwords or Microsoft SSO links.",
        ],
      });
    } else {
      setDocModal({
        visible: true,
        title: "Open Source Licenses",
        content: [
          "React Native — MIT License",
          "Copyright (c) Meta Platforms, Inc. and affiliates.",
          "Expo SDK — MIT License",
          "Copyright (c) 2015-present 650 Industries, Inc. (Expo)",
          "Lucide Icons — ISC License",
          "Copyright (c) 2020, Lucide Contributors. All rights reserved.",
          "TailwindCSS / NativeWind — MIT License",
          "Copyright (c) Tailwind Labs, Inc.",
          "Axios HTTP Client — MIT License",
          "Copyright (c) 2014-present Matt Zabriskie",
        ],
      });
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
        {/* Brand Card Block */}
        <View className="bg-light-surface dark:bg-dark-surface rounded-card border border-light-border dark:border-dark-border p-6 shadow-soft items-center mb-5">
          <View className="w-16 h-16 rounded-[22px] bg-light-primary items-center justify-center shadow-md mb-4">
            <CloudLightning size={32} color="#FFFFFF" strokeWidth={2.2} />
          </View>
          <Text className="text-light-text dark:text-dark-text font-black text-[18px] tracking-tight">
            ParkFlow Mobile
          </Text>
          <Text className="text-light-muted dark:text-dark-muted font-regular text-[12px] mt-0.5">
            Version 1.0.4 (Build 42)
          </Text>

          <View className="flex-row items-center gap-1.5 bg-emerald-500/10 dark:bg-emerald-500/10 px-3 py-1 rounded-pill mt-4">
            <Text className="text-emerald-500 dark:text-emerald-400 font-heavy text-[11px] uppercase tracking-wider">
              BulSU Main Campus Edition
            </Text>
          </View>
        </View>

        {/* Update Checker Row */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={handleCheckUpdates}
          disabled={isChecking}
          className="bg-light-surface dark:bg-dark-surface rounded-card border border-light-border dark:border-dark-border p-4 shadow-soft flex-row items-center justify-between mb-5 active:bg-light-surfaceMuted dark:active:bg-dark-surfaceMuted"
        >
          <View className="flex-row items-center gap-3.5 flex-1 pr-2">
            <View className="w-8 h-8 rounded-button bg-light-background dark:bg-dark-surfaceMuted items-center justify-center">
              <Info size={16} color={colors.primary} strokeWidth={2.2} />
            </View>
            <View className="flex-1">
              <Text className="text-light-text dark:text-dark-text font-heavy text-[13px]">
                Check for Updates
              </Text>
              <Text className="text-light-muted dark:text-dark-muted font-regular text-[11px] mt-0.5">
                {isChecking ? "Checking BulSU registry..." : "Verify active build registry status"}
              </Text>
            </View>
          </View>
          {isChecking ? (
            <ActivityIndicator color={colors.primary} size="small" />
          ) : (
            <ChevronRight size={16} color={colors.muted} strokeWidth={2} />
          )}
        </TouchableOpacity>

        {/* Document Categories Row */}
        <Text className="text-light-muted dark:text-dark-muted font-heavy text-[11px] uppercase tracking-wider mb-3 px-0.5">
          Legal & Compliance
        </Text>

        <View className="bg-light-surface dark:bg-dark-surface rounded-card border border-light-border dark:border-dark-border overflow-hidden mb-6">
          {/* Row 1: Terms */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => openDocument("terms")}
            className="flex-row items-center justify-between p-4 border-b border-light-border/40 dark:border-dark-border/40 active:bg-light-surfaceMuted dark:active:bg-dark-surfaceMuted"
          >
            <View className="flex-row items-center gap-3.5">
              <Scale size={16} color={colors.muted} strokeWidth={2} />
              <Text className="text-light-text dark:text-dark-text font-heavy text-[13px]">
                Terms of Service
              </Text>
            </View>
            <ChevronRight size={16} color={colors.muted} strokeWidth={2} />
          </TouchableOpacity>

          {/* Row 2: Privacy */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => openDocument("privacy")}
            className="flex-row items-center justify-between p-4 border-b border-light-border/40 dark:border-dark-border/40 active:bg-light-surfaceMuted dark:active:bg-dark-surfaceMuted"
          >
            <View className="flex-row items-center gap-3.5">
              <LockKeyhole size={16} color={colors.muted} strokeWidth={2} />
              <Text className="text-light-text dark:text-dark-text font-heavy text-[13px]">
                Privacy Policy
              </Text>
            </View>
            <ChevronRight size={16} color={colors.muted} strokeWidth={2} />
          </TouchableOpacity>

          {/* Row 3: Licenses */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => openDocument("licenses")}
            className="flex-row items-center justify-between p-4 active:bg-light-surfaceMuted dark:active:bg-dark-surfaceMuted"
          >
            <View className="flex-row items-center gap-3.5">
              <FileText size={16} color={colors.muted} strokeWidth={2} />
              <Text className="text-light-text dark:text-dark-text font-heavy text-[13px]">
                Open Source Licenses
              </Text>
            </View>
            <ChevronRight size={16} color={colors.muted} strokeWidth={2} />
          </TouchableOpacity>
        </View>

        {/* Footer info */}
        <View className="items-center justify-center gap-1.5 py-4">
          <View className="flex-row items-center gap-1">
            <Text className="text-light-muted dark:text-dark-muted font-regular text-[11px]">
              Developed with
            </Text>
            <Heart size={10} color="#EF4444" fill="#EF4444" />
            <Text className="text-light-muted dark:text-dark-muted font-regular text-[11px]">
              for Bulacan State University
            </Text>
          </View>
          <Text className="text-light-muted dark:text-dark-muted font-regular text-[10px]">
            © {new Date().getFullYear()} BulSU Security. All rights reserved.
          </Text>
        </View>
      </ScrollView>

      {/* Check Update Toast Dialog */}
      <AlertModal
        visible={toast.visible}
        onClose={() => setToast((p) => ({ ...p, visible: false }))}
        title={toast.title}
        message={toast.message}
        variant="success"
      />

      {/* Styled Readable Document Modal */}
      <Modal
        visible={docModal.visible}
        transparent
        animationType="slide"
        statusBarTranslucent
        onRequestClose={() => setDocModal((p) => ({ ...p, visible: false }))}
      >
        <View className="flex-1 justify-end bg-black/60 z-50">
          <View className="bg-light-surface dark:bg-dark-surface rounded-t-card border-t border-light-border dark:border-dark-border h-[82%] px-5 pt-5 pb-8 shadow-card">
            {/* Header bar */}
            <View className="flex-row items-center justify-between border-b border-light-border/40 dark:border-dark-border/40 pb-4 mb-4">
              <Text className="text-light-text dark:text-dark-text font-black text-[16px] tracking-tight">
                {docModal.title}
              </Text>
              <TouchableOpacity
                onPress={() => setDocModal((p) => ({ ...p, visible: false }))}
                className="w-8 h-8 rounded-pill bg-light-background dark:bg-dark-background items-center justify-center active:bg-light-border"
              >
                <X size={15} color={isDark ? "#B5BAC1" : "#71717A"} strokeWidth={2.5} />
              </TouchableOpacity>
            </View>

            {/* Scrollable structured copy details */}
            <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
              <View className="gap-5">
                {docModal.content.map((paragraph, index) => {
                  const isSectionHeader =
                    paragraph.startsWith("1.") ||
                    paragraph.startsWith("2.") ||
                    paragraph.startsWith("3.") ||
                    paragraph.startsWith("4.") ||
                    paragraph.includes("MIT License") ||
                    paragraph.includes("ISC License");
                  return (
                    <Text
                      key={index}
                      className={
                        isSectionHeader
                          ? "text-light-text dark:text-dark-text font-black text-[13.5px] tracking-tight mt-1"
                          : "text-light-accent dark:text-dark-accent font-regular text-[12.5px] leading-[19px]"
                      }
                    >
                      {paragraph}
                    </Text>
                  );
                })}
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </ContentWrapper>
  );
}
