import { ContentWrapper } from "@/components/layouts";
import { AlertModal } from "@/components/shared";
import { AppButton } from "@/components/ui";
import EmailVerificationView from "@/features/auth/components/EmailVerificationView";
import { authService } from "@/features/auth/services/auth.service";
import { userService } from "@/features/user/services/user.service";
import type { UserCredentialsResponse } from "@/features/user/types/user.types";
import { useAppTheme } from "@/hooks/useAppTheme";
import {
    useFocusEffect,
    useLocalSearchParams,
    useNavigation,
    useRouter,
} from "expo-router";
import { AlertTriangle, Lock, ShieldCheck } from "lucide-react-native";
import React, { useCallback, useRef, useState } from "react";
import {
    ActivityIndicator,
    InteractionManager,
    Keyboard,
    ScrollView,
    Text,
    View,
} from "react-native";

export default function EmailDetailsPage() {
  const { colors, isDark } = useAppTheme();
  const router = useRouter();
  const navigation = useNavigation();
  const lastScrolledRef = useRef(false);
  const { provider } = useLocalSearchParams<{ provider: string }>();

  const [credentials, setCredentials] =
    useState<UserCredentialsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [primaryLoading, setPrimaryLoading] = useState(false);
  const [disconnectLoading, setDisconnectLoading] = useState(false);
  const [showOtp, setShowOtp] = useState(false);
  const [pendingAction, setPendingAction] = useState<"none" | "confirm" | "disconnect">("none");

  const [modal, setModal] = useState({
    visible: false,
    title: "",
    message: "",
    variant: "success" as "error" | "warning" | "info" | "success",
  });

  const loadCredentials = useCallback(async () => {
    try {
      const res = await userService.getUserCredentials();
      if (res?.isSuccess && res.data) {
        setCredentials(res.data);
      }
    } catch (e) {
      console.error("Failed to load user credentials:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      const task = InteractionManager.runAfterInteractions(() => {
        void loadCredentials();
      });
      return () => task.cancel();
    }, [loadCredentials]),
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

  const rawPrimary = credentials?.primaryProvider;
  const primaryStr = rawPrimary !== undefined && rawPrimary !== null ? String(rawPrimary).trim() : "";
  const primaryLower = primaryStr.toLowerCase();
  const userEmail = credentials?.email ?? "";

  const isMicrosoftPrimary =
    primaryLower === "microsoft" ||
    primaryLower === "1" ||
    primaryStr === "";

  const isManualPrimary =
    primaryLower === "manual" ||
    primaryLower === "local" ||
    primaryLower === "email" ||
    primaryLower === "0";

  // Locate current provider identity details
  const isManual = provider === "manual";
  const identity = credentials?.linkedIdentities.find((link) =>
    isManual
      ? link.provider === "Manual" ||
        link.provider === "0" ||
        link.provider === "Local" ||
        link.provider === "Email"
      : link.provider === "Microsoft" || link.provider === "1",
  );

  const isConfigured = isManual
    ? isManualPrimary || !!identity
    : isMicrosoftPrimary || !!identity;
  const emailVal = isManual
    ? isManualPrimary
      ? userEmail
      : (identity?.email ?? "")
    : isMicrosoftPrimary
      ? userEmail
      : (identity?.email ?? "");

  const isPrimary = identity?.isPrimary ?? (isManual ? isManualPrimary : isMicrosoftPrimary);
  const isVerified = isManual
    ? isManualPrimary
      ? true
      : (identity?.isVerified ?? false)
    : isMicrosoftPrimary
      ? true
      : (identity?.isVerified ?? false);

  const label = isManual ? "Direct Access" : "Microsoft Account";

  const handleSetPrimary = async () => {
    setPrimaryLoading(true);
    try {
      const res = await userService.updatePrimaryEmail(emailVal);
      if (res?.isSuccess) {
        setModal({
          visible: true,
          title: "Primary Updated",
          message: `${emailVal} is now set as your primary login email address.`,
          variant: "success",
        });
        void loadCredentials();
      } else {
        setModal({
          visible: true,
          title: "Action Failed",
          message: res?.message || "Failed to switch primary provider.",
          variant: "error",
        });
      }
    } catch (e: any) {
      const backendMessage =
        e?.response?.data?.message ||
        e?.message ||
        "An unexpected error occurred.";
      setModal({
        visible: true,
        title: "Action Failed",
        message: backendMessage,
        variant: "error",
      });
    } finally {
      setPrimaryLoading(false);
    }
  };

  const handleStartDisconnectVerification = async () => {
    Keyboard.dismiss();
    setDisconnectLoading(true);
    try {
      const res = await authService.sendEmailOtp(emailVal);
      if (res?.isSuccess) {
        setPendingAction("disconnect");
        setShowOtp(true);
      } else {
        setModal({
          visible: true,
          title: "Send OTP Failed",
          message:
            res?.message || "Failed to send verification code to your email.",
          variant: "error",
        });
      }
    } catch (e: any) {
      const backendMessage =
        e?.response?.data?.message ||
        e?.message ||
        "An unexpected error occurred.";
      setModal({
        visible: true,
        title: "Send OTP Failed",
        message: backendMessage,
        variant: "error",
      });
    } finally {
      setDisconnectLoading(false);
    }
  };

  const handleConfirmEmail = async () => {
    Keyboard.dismiss();
    setConfirmLoading(true);
    try {
      const res = await authService.sendEmailOtp(emailVal);
      if (res?.isSuccess) {
        setPendingAction("confirm");
        setShowOtp(true);
      } else {
        setModal({
          visible: true,
          title: "Send OTP Failed",
          message:
            res?.message || "Failed to send verification code to your email.",
          variant: "error",
        });
      }
    } catch (e: any) {
      const backendMessage =
        e?.response?.data?.message ||
        e?.message ||
        "An unexpected error occurred.";
      setModal({
        visible: true,
        title: "Send OTP Failed",
        message: backendMessage,
        variant: "error",
      });
    } finally {
      setConfirmLoading(false);
    }
  };

  const handleOtpVerifiedSuccess = async () => {
    setShowOtp(false);
    if (pendingAction === "disconnect") {
      setDisconnectLoading(true);
      try {
        const res = await authService.unlinkProvider(provider ?? "");
        if (res?.isSuccess) {
          setModal({
            visible: true,
            title: "Account Disconnected",
            message: `Your ${label} connection has been disconnected successfully.`,
            variant: "success",
          });
        } else {
          setModal({
            visible: true,
            title: "Unlinking Failed",
            message: res?.message || "Failed to disconnect this account.",
            variant: "error",
          });
        }
      } catch (e: any) {
        const backendMessage =
          e?.response?.data?.message ||
          e?.message ||
          "An unexpected error occurred.";
        setModal({
          visible: true,
          title: "Unlinking Failed",
          message: backendMessage,
          variant: "error",
        });
      } finally {
        setDisconnectLoading(false);
        setPendingAction("none");
      }
    } else {
      setModal({
        visible: true,
        title: "Email Confirmed",
        message: `Your linked email address ${emailVal} has been successfully verified!`,
        variant: "success",
      });
      setPendingAction("none");
      void loadCredentials();
    }
  };

  const handleModalClose = () => {
    const shouldGoBack = modal.title === "Account Disconnected";
    setModal((p) => ({ ...p, visible: false }));
    if (shouldGoBack) {
      router.back();
    }
  };

  return (
    <ContentWrapper noPaddingY>
      {loading ? (
        <View className="flex-1 items-center justify-center bg-light-background dark:bg-dark-background">
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : showOtp ? (
        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingTop: 16, paddingBottom: 40 }}
        >
          <View className="bg-light-surface dark:bg-dark-surface rounded-card border border-light-border dark:border-dark-border p-5 shadow-soft">
            <EmailVerificationView
              email={emailVal}
              onVerifySuccess={handleOtpVerifiedSuccess}
              onBack={() => setShowOtp(false)}
              title={pendingAction === "disconnect" ? "Verify Disconnection" : "Confirm Linked Email"}
              subtitle={
                pendingAction === "disconnect"
                  ? `Enter the 6-digit code sent to ${emailVal} to verify disconnection of this account.`
                  : `Verify ownership of your linked account email address:\n${emailVal}`
              }
            />
          </View>
        </ScrollView>
      ) : (
        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          contentContainerStyle={{ paddingTop: 16, paddingBottom: 40 }}
        >
          {/* Details Overview Card */}
          <View className="bg-light-surface dark:bg-dark-surface rounded-card border border-light-border dark:border-dark-border p-5 shadow-soft mb-5">
            <View className="flex-row items-center justify-between border-b border-light-border/40 dark:border-dark-border/40 pb-4 mb-4">
              <View>
                <Text className="text-light-muted dark:text-dark-muted font-regular text-[11px] uppercase tracking-wider">
                  Provider Type
                </Text>
                <Text className="text-light-text dark:text-dark-text font-black text-[15px] mt-0.5">
                  {label}
                </Text>
              </View>
              {isPrimary ? (
                <View className="bg-light-primary/10 dark:bg-dark-primary/22 px-2 py-0.5 rounded-md">
                  <Text className="text-light-primary dark:text-dark-primary font-heavy text-[10px]">
                    Primary
                  </Text>
                </View>
              ) : isVerified ? (
                <View className="bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded-md">
                  <Text className="text-emerald-600 dark:text-emerald-400 font-heavy text-[10px]">
                    Linked
                  </Text>
                </View>
              ) : (
                <View className="bg-amber-50 dark:bg-amber-500/10 px-2 py-0.5 rounded-md">
                  <Text className="text-amber-600 dark:text-amber-500 font-heavy text-[10px]">
                    Unverified
                  </Text>
                </View>
              )}
            </View>

            <View className="mb-4">
              <Text className="text-light-muted dark:text-dark-muted font-regular text-[11px] uppercase tracking-wider">
                Email Address
              </Text>
              <Text
                className="text-light-text dark:text-dark-text font-heavy text-[13.5px] mt-1"
                numberOfLines={1}
              >
                {isConfigured ? emailVal : "Not Linked"}
              </Text>
            </View>

            <View className="flex-row items-center gap-2">
              <View
                className={`w-6 h-6 rounded-pill items-center justify-center ${
                  isVerified
                    ? "bg-emerald-50 dark:bg-emerald-500/20"
                    : "bg-amber-50 dark:bg-amber-500/20"
                }`}
              >
                {isVerified ? (
                  <ShieldCheck size={14} color="#10B981" />
                ) : (
                  <AlertTriangle size={14} color="#F59E0B" />
                )}
              </View>
              <Text
                className={`font-heavy text-[12px] ${
                  isVerified ? "text-[#10B981]" : "text-[#F59E0B]"
                }`}
              >
                {isVerified
                  ? "Verified Safe Credentials"
                  : "Unverified Credentials Setup"}
              </Text>
            </View>
          </View>

          {/* Primary Provider Banner */}
          {isPrimary && (
            <View className="bg-light-surface dark:bg-dark-surface rounded-card border border-light-border dark:border-dark-border p-5 shadow-soft mb-5 flex-row items-start gap-3">
              <Lock size={18} color={colors.muted} className="mt-0.5" />
              <View className="flex-1">
                <Text className="text-light-text dark:text-dark-text font-heavy text-[13px] tracking-tight">
                  Symmetric Account Primary Safety Lock
                </Text>
                <Text className="text-light-muted dark:text-dark-muted font-regular text-[11.5px] mt-1 leading-[16px]">
                  This credentials address is currently set as your **Primary
                  Provider** and cannot be deleted. If you wish to unlink this
                  account, you must set another connected login provider as
                  primary first.
                </Text>
              </View>
            </View>
          )}

          {/* Dynamic Interactive Action Buttons */}
          <View className="gap-3 px-1">
            {/* Confirm Email OTP Trigger */}
            {!isVerified && (
              <AppButton
                label="Confirm Email"
                variant="outline"
                uppercase={false}
                loading={confirmLoading}
                disabled={confirmLoading || primaryLoading || disconnectLoading}
                onPress={handleConfirmEmail}
              />
            )}

            {/* Set as Primary Button */}
            {!isPrimary && isVerified && (
              <AppButton
                label="Set Primary"
                variant="outline"
                uppercase={false}
                loading={primaryLoading}
                disabled={confirmLoading || primaryLoading || disconnectLoading}
                onPress={handleSetPrimary}
              />
            )}

            {/* Edit/Change Email Button for manual email */}
            {isManual && isVerified && (
              <AppButton
                label="Update"
                variant="outline"
                uppercase={false}
                disabled={confirmLoading || primaryLoading || disconnectLoading}
                onPress={() =>
                  router.push({
                    pathname: "/(settings)/set-password",
                    params: { mode: "change" },
                  })
                }
              />
            )}

            {/* Disconnect/Delete Provider Button */}
            {!isPrimary && (
              <AppButton
                label="Delete"
                variant="outline"
                uppercase={false}
                loading={disconnectLoading}
                disabled={confirmLoading || primaryLoading || disconnectLoading}
                textClassName="text-light-danger dark:text-dark-danger"
                onPress={handleStartDisconnectVerification}
              />
            )}
          </View>
        </ScrollView>
      )}

      <AlertModal
        visible={modal.visible}
        onClose={handleModalClose}
        title={modal.title}
        message={modal.message}
        variant={modal.variant}
      />
    </ContentWrapper>
  );
}
