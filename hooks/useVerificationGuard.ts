import { useAuthStore } from "@/features/auth/store/auth.store";
import { router } from "expo-router";
import { useCallback, useMemo } from "react";
import { Alert } from "react-native";

export type VerificationState = "not_submitted" | "pending" | "rejected" | "approved";

export interface VerificationGuardResult {
  state: VerificationState;
  isApproved: boolean;
  title: string;
  noticeMessage: string;
  rejectionReason?: string;
  rejectedTarget?: string;
  checkAccessOrRedirect: (onApproved: () => void, featureName?: string) => boolean;
  navigateToVerification: () => void;
  refreshUserStatus: () => Promise<void>;
}

export function useVerificationGuard(): VerificationGuardResult {
  const { user, loadUser } = useAuthStore();

  const statusNum = user?.corVerificationStatus;
  const rejectionReason = user?.rejectionReason;
  const rejectedTarget = user?.rejectedTarget;

  const state: VerificationState = useMemo(() => {
    if (statusNum === 2) return "approved";
    if (statusNum === 1) return "pending";
    if (statusNum === 3) return "rejected";
    return "not_submitted";
  }, [statusNum]);

  const isApproved = state === "approved";

  const title = useMemo(() => {
    switch (state) {
      case "approved":
        return "Account Verified";
      case "pending":
        return "Verification Pending Review";
      case "rejected":
        return rejectedTarget === "vehicle"
          ? "Vehicle Registration Rejected"
          : "Registration Verification Rejected";
      case "not_submitted":
      default:
        return "Verification Required";
    }
  }, [state, rejectedTarget]);

  const noticeMessage = useMemo(() => {
    switch (state) {
      case "approved":
        return "Your account is verified and fully approved.";
      case "pending":
        return "Your verification is currently being reviewed by an admin. Please wait until your account is approved before using reservations.";
      case "rejected":
        return rejectionReason
          ? `Your verification was not approved. Reason: ${rejectionReason}. Please review the requirements and submit the required document again.`
          : "Your verification was not approved. Please review the requirements and submit the required document again.";
      case "not_submitted":
      default:
        return "Your account needs to be verified before you can use reservations. Please submit the required document for admin verification.";
    }
  }, [state, rejectionReason]);

  const navigateToVerification = useCallback(() => {
    if (state === "approved") {
      router.push("/(settings)/schedule");
    } else if (rejectedTarget === "vehicle") {
      router.push("/(settings)/vehicle");
    } else {
      router.push("/(settings)/setup-schedule");
    }
  }, [state, rejectedTarget]);

  const refreshUserStatus = useCallback(async () => {
    try {
      await loadUser();
    } catch (_e) {}
  }, [loadUser]);

  const checkAccessOrRedirect = useCallback(
    (onApproved: () => void, featureName: string = "reservations"): boolean => {
      if (isApproved) {
        onApproved();
        return true;
      }

      // Feature blocked -> Show status alert notice and route to verification
      Alert.alert(
        title,
        noticeMessage,
        [
          {
            text: "Cancel",
            style: "cancel",
          },
          {
            text: state === "pending" ? "Refresh Status" : "Go to Verification",
            onPress: () => {
              if (state === "pending") {
                refreshUserStatus();
              } else {
                navigateToVerification();
              }
            },
          },
        ],
        { cancelable: true }
      );

      return false;
    },
    [isApproved, title, noticeMessage, state, navigateToVerification, refreshUserStatus]
  );

  return {
    state,
    isApproved,
    title,
    noticeMessage,
    rejectionReason,
    rejectedTarget,
    checkAccessOrRedirect,
    navigateToVerification,
    refreshUserStatus,
  };
}
