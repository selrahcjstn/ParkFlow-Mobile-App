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
    X
} from "lucide-react-native";
import * as Updates from "expo-updates";
import Constants from "expo-constants";
import React, { useEffect, useRef, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Animated,
    Modal,
    Pressable,
    ScrollView,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

export default function AboutPage() {
  const { colors, isDark } = useAppTheme();
  const navigation = useNavigation();
  const lastScrolledRef = useRef(false);
  const iconColor = colors.text;

  const appVersion = Constants.expoConfig?.version ?? Constants.nativeAppVersion ?? "1.0.0";
  const buildVersion = Constants.nativeBuildVersion ?? "1";
  const updateIdShort = Updates.updateId ? Updates.updateId.substring(0, 7) : null;
  const jsReleaseVersion = "1.8.0";

  const { isDownloading, downloadProgress, isUpdateAvailable } = Updates.useUpdates();

  const [isChecking, setIsChecking] = useState(false);
  const [isSimulatingDownload, setIsSimulatingDownload] = useState(false);
  const [simulatedProgress, setSimulatedProgress] = useState(0);
  const [simulatedUpdateAvailable, setSimulatedUpdateAvailable] = useState(false);

  const isDownloadingUpdate = isDownloading || isSimulatingDownload;
  const downloadProgressPercentage = isSimulatingDownload ? simulatedProgress : ((downloadProgress ?? 0) * 100);
  const hasUpdateBadge = isUpdateAvailable || (simulatedUpdateAvailable && !isSimulatingDownload && !isChecking);

  // Background update simulation for development/Expo Go
  useEffect(() => {
    if (!Updates.isEnabled) {
      const timer = setTimeout(() => {
        setSimulatedUpdateAvailable(true);
      }, 2500); // show simulated badge after 2.5s
      return () => clearTimeout(timer);
    }
  }, []);

  useEffect(() => {
    let interval: any;
    if (isSimulatingDownload) {
      interval = setInterval(() => {
        setSimulatedProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            setIsSimulatingDownload(false);
            
            // Show finish alert
            Alert.alert(
              "Update Downloaded",
              "A simulated update has been downloaded. Would you like to restart the app now to apply changes?",
              [
                { text: "Later", style: "cancel" },
                {
                  text: "Restart Now",
                  onPress: () => {
                    setTimeout(async () => {
                      try {
                        await Updates.reloadAsync();
                      } catch (err) {
                        console.warn("Updates.reloadAsync is not supported in this dev environment.");
                      }
                    }, 300);
                  }
                }
              ]
            );
            return 100;
          }
          return prev + 5; // increment by 5% every 150ms
        });
      }, 150);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isSimulatingDownload]);
  const [toast, setToast] = useState({
    visible: false,
    title: "",
    message: "",
  });

  const [docModal, setDocModal] = useState<{
    visible: boolean;
    title: string;
    content: string[];
  }>({
    visible: false,
    title: "",
    content: [],
  });

  const slideAnim = useRef(new Animated.Value(1000)).current;

  useEffect(() => {
    if (docModal.visible) {
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      slideAnim.setValue(1000);
    }
  }, [docModal.visible]);

  const closeDocModal = () => {
    Animated.timing(slideAnim, {
      toValue: 1000,
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      setDocModal((p) => ({ ...p, visible: false }));
    });
  };

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
    if (isChecking || isDownloadingUpdate) return;
    setIsChecking(true);

    try {
      if (!Updates.isEnabled) {
        // Simulate update check in development
        await new Promise((resolve) => setTimeout(resolve, 1500));
        setIsChecking(false);

        if (simulatedUpdateAvailable) {
          setSimulatedUpdateAvailable(false);
          setIsSimulatingDownload(true);
          setSimulatedProgress(0);
        } else {
          Alert.alert(
            "Update Simulation",
            "Updates are disabled in this environment (development/Expo Go). Would you like to simulate finding and downloading a new update?",
            [
              {
                text: "Cancel",
                style: "cancel"
              },
              {
                text: "Simulate Download",
                onPress: () => {
                  setIsSimulatingDownload(true);
                  setSimulatedProgress(0);
                }
              }
            ]
          );
        }
        return;
      }

      const updateCheck = await Updates.checkForUpdateAsync();
      if (updateCheck.isAvailable) {
        // Fetch the update safely
        const fetched = await Updates.fetchUpdateAsync();
        setIsChecking(false);

        if (fetched.isNew) {
          Alert.alert(
            "Update Ready",
            "A new update has been downloaded. Would you like to restart the app now to apply the changes?",
            [
              { text: "Later", style: "cancel" },
              {
                text: "Restart Now",
                onPress: () => {
                  setTimeout(async () => {
                    try {
                      await Updates.reloadAsync();
                    } catch (reloadErr) {
                      console.error("Failed to reload app after update:", reloadErr);
                    }
                  }, 300);
                }
              }
            ]
          );
        } else {
          setToast({
            visible: true,
            title: "System Update Confirmed",
            message: `You are running the latest release of ParkFlow! (Release ${jsReleaseVersion})`,
          });
        }
      } else {
        setIsChecking(false);
        setToast({
          visible: true,
          title: "System Update Confirmed",
          message:
            `You are running the latest release of ParkFlow! (Release ${jsReleaseVersion})`,
        });
      }
    } catch (error: any) {
      setIsChecking(false);
      console.error("[updates] check failed", error);
      setToast({
        visible: true,
        title: "Update Check Failed",
        message: error?.message || "An error occurred while checking for updates. Please try again.",
      });
    }
  };

  const openDocument = (type: "terms" | "privacy" | "licenses") => {
    if (type === "terms") {
      setDocModal({
        visible: true,
        title: "Terms of Service",
        content: [
          "1. Acceptance of Terms",
          "By downloading or using the ParkFlow Mobile Application, you agree to comply with and be bound by these ParkFlow Campus Parking System Terms of Service. If you do not agree, you are restricted from access.",
          "2. Vehicle Declaration Requirements",
          "All students, personnel, and external users are strictly required to declare accurate vehicle license plates, models, and owner credentials. Falsifying certificates or plate details will result in direct campus disciplinary actions.",
          "3. Compliance with Security Staff",
          "Use of the digital QR gate pass is subject to manual verification by active ParkFlow security guards. Refusal to cooperate, parking outside designated boxes, or speed violations inside Gate 3 parking areas will lead to access suspension.",
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
          "ParkFlow collects your full name, student/employee ID, official email address, course information, active vehicle registry details, and attendance schedule proofs (COR file uploads).",
          "2. Information Usage",
          "Collected details are utilized exclusively to secure gate accessibility, track campus vehicle capacities, log check-in/check-out timestamps, and process dispute resolutions.",
          "3. Data Sharing Protocols",
          "Your parking record and user profile details are hosted on ParkFlow campus secure cloud infrastructure. We do not distribute or share your personal information with third-party advertising or non-campus entities.",
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
          <Text className="text-light-text dark:text-dark-text font-bold text-[18px] tracking-tight">
            ParkFlow Mobile
          </Text>
          <Text className="text-light-muted dark:text-dark-muted font-regular text-[12px] mt-0.5">
            Release {jsReleaseVersion}
          </Text>

          <View className="flex-row items-center gap-1.5 bg-emerald-500/10 dark:bg-emerald-500/10 px-3 py-1 rounded-pill mt-4">
            <Text className="text-emerald-500 dark:text-emerald-400 font-bold text-[11px] uppercase tracking-wider">
              ParkFlow Edition
            </Text>
          </View>
        </View>

        {/* Update Checker Row */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={handleCheckUpdates}
          disabled={isChecking || isDownloadingUpdate}
          className="bg-light-surface dark:bg-dark-surface rounded-card border border-light-border dark:border-dark-border p-4 shadow-soft flex-row items-center justify-between mb-5 active:bg-light-surfaceMuted dark:active:bg-dark-surfaceMuted relative overflow-hidden"
        >
          <View className="flex-row items-center gap-3.5 flex-1 pr-2">
            <View className="w-8 h-8 rounded-button bg-light-surfaceLighter dark:bg-dark-surfaceLighter items-center justify-center">
              <Info size={16} color={iconColor} strokeWidth={2.2} />
            </View>
            <View className="flex-1">
              <View className="flex-row items-center gap-1.5">
                <Text className="text-light-text dark:text-dark-text font-bold text-[13px]">
                  {isDownloadingUpdate ? "Downloading Update" : "Check for Updates"}
                </Text>
                {hasUpdateBadge && (
                  <View className="w-2 h-2 rounded-full bg-light-primary dark:bg-dark-primary" />
                )}
              </View>
              <Text className="text-light-muted dark:text-dark-muted font-regular text-[11px] mt-0.5">
                {isDownloadingUpdate
                  ? `Installing system files... ${Math.round(downloadProgressPercentage)}%`
                  : isChecking
                  ? "Checking registry..."
                  : hasUpdateBadge
                  ? "New update available! Tap to install."
                  : "Verify active build registry status"}
              </Text>
            </View>
          </View>
          {isChecking || isDownloadingUpdate ? (
            <View className="flex-row items-center gap-2">
              {isDownloadingUpdate && (
                <Text className="text-light-primary dark:text-dark-primary font-bold text-[12px]">
                  {Math.round(downloadProgressPercentage)}%
                </Text>
              )}
              <ActivityIndicator color={colors.primary} size="small" />
            </View>
          ) : (
            <ChevronRight size={16} color={colors.muted} strokeWidth={2} />
          )}

          {/* Minimal Bottom Progress Bar */}
          {isDownloadingUpdate && (
            <View
              className="absolute bottom-0 left-0 h-[3px] bg-light-primary dark:bg-dark-primary"
              style={{ width: `${downloadProgressPercentage}%` }}
            />
          )}
        </TouchableOpacity>

        {/* Document Categories Row */}
        <Text className="text-light-muted dark:text-dark-muted font-bold text-[11px] uppercase tracking-wider mb-3 px-0.5">
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
              <Text className="text-light-text dark:text-dark-text font-bold text-[13px]">
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
              <Text className="text-light-text dark:text-dark-text font-bold text-[13px]">
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
              <Text className="text-light-text dark:text-dark-text font-bold text-[13px]">
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
              for ParkFlow
            </Text>
          </View>
          <Text className="text-light-muted dark:text-dark-muted font-regular text-[10px]">
            © {new Date().getFullYear()} ParkFlow Security. All rights reserved.
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
        animationType="fade"
        statusBarTranslucent
        onRequestClose={closeDocModal}
      >
        <Pressable
          className="flex-1 justify-end bg-black/60"
          onPress={closeDocModal}
        >
          <Pressable
            onPress={(e) => e.stopPropagation()}
            className="w-full h-[82%]"
          >
            <Animated.View
              style={{ transform: [{ translateY: slideAnim }] }}
              className="flex-1 bg-light-surface dark:bg-dark-surface rounded-t-card border-t border-light-border dark:border-dark-border px-5 pt-5 pb-8 shadow-card"
            >
              {/* Header bar */}
              <View className="flex-row items-center justify-between border-b border-light-border/40 dark:border-dark-border/40 pb-4 mb-4">
                <Text className="text-light-text dark:text-dark-text font-bold text-[16px] tracking-tight">
                  {docModal.title}
                </Text>
                <TouchableOpacity
                  onPress={closeDocModal}
                  className="w-8 h-8 rounded-pill bg-light-background dark:bg-dark-background items-center justify-center active:bg-light-border"
                >
                  <X
                    size={15}
                    color={isDark ? "#B5BAC1" : "#71717A"}
                    strokeWidth={2.5}
                  />
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
                            ? "text-light-text dark:text-dark-text font-bold text-[13.5px] tracking-tight mt-1"
                            : "text-light-accent dark:text-dark-accent font-regular text-[12.5px] leading-[19px]"
                        }
                      >
                        {paragraph}
                      </Text>
                    );
                  })}
                </View>
              </ScrollView>
            </Animated.View>
          </Pressable>
        </Pressable>
      </Modal>
    </ContentWrapper>
  );
}
