import React, { useEffect, useState, useRef, useCallback } from "react";
import { AppState, AppStateStatus } from "react-native";
import { useRouter } from "expo-router";
import { Ban, AlertCircle } from "lucide-react-native";
import AlertModal from "./AlertModal";
import { useAuthStore } from "@/features/auth/store/auth.store";
import { useVehicleStore } from "@/features/user/store/vehicle.store";
import { userService } from "@/features/user/services/user.service";
import { getConnection } from "@/services/signalr";
import { useAppTheme } from "@/hooks/useAppTheme";

export default function RealtimeAccountStatusWatcher() {
  const { colors } = useAppTheme();
  const router = useRouter();
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const [suspendedModal, setSuspendedModal] = useState<{
    visible: boolean;
    message: string;
  }>({ visible: false, message: "" });

  const [rejectedModal, setRejectedModal] = useState<{
    visible: boolean;
    message: string;
  }>({ visible: false, message: "" });

  const lastCheckedStatus = useRef<string | null>(null);
  const lastCheckedCorStatus = useRef<number | null>(null);
  const isHandlingAction = useRef<boolean>(false);

  const checkStatus = useCallback(async () => {
    if (!token || isHandlingAction.current) return;

    try {
      const res = await userService.getProfile();
      if (res?.isSuccess && res.data) {
        const profile = res.data;
        const currentStatus = profile.status?.toLowerCase() || "active";
        const currentCorStatus = profile.corVerificationStatus;
        const rejectionReason =
          profile.rejectionReason ||
          "Your documents or vehicle registration were rejected by campus admin.";

        // 1. Check for Suspension
        if (currentStatus === "suspended") {
          if (!suspendedModal.visible) {
            isHandlingAction.current = true;
            setSuspendedModal({
              visible: true,
              message:
                "Your account clearance has been suspended by the campus administrator. Please contact admin support for assistance.",
            });
          }
          return;
        }

        // 2. Check for COR / Vehicle Rejection
        if (currentCorStatus === 3 && lastCheckedCorStatus.current !== 3) {
          lastCheckedCorStatus.current = 3;
          // Update store user object with latest rejected info
          useAuthStore.setState((s) => ({
            user: s.user
              ? {
                  ...s.user,
                  corVerificationStatus: 3,
                  rejectionReason,
                }
              : null,
          }));

          if (!rejectedModal.visible) {
            setRejectedModal({
              visible: true,
              message: `Rejection details: ${rejectionReason}`,
            });
          }
        } else if (currentCorStatus !== 3) {
          lastCheckedCorStatus.current = currentCorStatus ?? null;
        }

        // 3. Check for Approval Transition (from pending to active/verified)
        const wasPending =
          lastCheckedStatus.current === "pendingverification" ||
          lastCheckedStatus.current === "pending" ||
          lastCheckedCorStatus.current === 1 ||
          useAuthStore.getState().user?.corVerificationStatus === 1 ||
          useAuthStore.getState().user?.status?.toLowerCase() === "pendingverification";

        const isNowApproved =
          currentStatus === "active" || currentCorStatus === 2;

        if (wasPending && isNowApproved) {
          console.log("[RealtimeAccountStatusWatcher] Realtime approval detected! Refreshing user & vehicles...");
          lastCheckedCorStatus.current = currentCorStatus ?? 2;
          lastCheckedStatus.current = currentStatus;
          void useAuthStore.getState().loadUser();
          void useVehicleStore.getState().loadVehicle(true);
        }

        lastCheckedStatus.current = currentStatus;
      }
    } catch (err: any) {
      // If 401 or 403 response, account might be deactivated/suspended or token revoked
      if (err?.response?.status === 401 || err?.response?.status === 403) {
        if (!suspendedModal.visible && !isHandlingAction.current) {
          isHandlingAction.current = true;
          setSuspendedModal({
            visible: true,
            message: "Your session has expired or your account status has changed.",
          });
        }
      }
    }
  }, [token, suspendedModal.visible, rejectedModal.visible]);

  // Periodic polling + AppState listener
  useEffect(() => {
    if (!token) {
      lastCheckedCorStatus.current = null;
      lastCheckedStatus.current = null;
      return;
    }

    // Initial check
    checkStatus();

    // 4s Interval Polling
    const interval = setInterval(() => {
      checkStatus();
    }, 4000);

    // AppState Foreground Listener
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === "active") {
        checkStatus();
      }
    };

    const appStateSub = AppState.addEventListener("change", handleAppStateChange);

    return () => {
      clearInterval(interval);
      appStateSub.remove();
    };
  }, [token, checkStatus]);

  // SignalR Event Listener for immediate push updates
  useEffect(() => {
    if (!token) return;

    let conn: any = null;
    try {
      conn = getConnection();
      if (conn) {
        const handleStatusEvent = async () => {
          console.log("[RealtimeAccountStatusWatcher] SignalR status event received! Syncing...");
          await Promise.all([
            useAuthStore.getState().loadUser(),
            useVehicleStore.getState().loadVehicle(true),
          ]);
          checkStatus();
        };

        conn.on("UserStatusChanged", handleStatusEvent);
        conn.on("AccountSuspended", handleStatusEvent);
        conn.on("CorStatusChanged", handleStatusEvent);
        conn.on("CorRejected", handleStatusEvent);
        conn.on("VehicleApprovalChanged", handleStatusEvent);
        conn.on("VerificationStatusChanged", handleStatusEvent);
        conn.on("ApprovalListUpdated", handleStatusEvent);
        conn.on("UserApproved", handleStatusEvent);
        conn.on("VehicleApproved", handleStatusEvent);

        return () => {
          try {
            conn.off("UserStatusChanged", handleStatusEvent);
            conn.off("AccountSuspended", handleStatusEvent);
            conn.off("CorStatusChanged", handleStatusEvent);
            conn.off("CorRejected", handleStatusEvent);
            conn.off("VehicleApprovalChanged", handleStatusEvent);
            conn.off("VerificationStatusChanged", handleStatusEvent);
            conn.off("ApprovalListUpdated", handleStatusEvent);
            conn.off("UserApproved", handleStatusEvent);
            conn.off("VehicleApproved", handleStatusEvent);
          } catch {}
        };
      }
    } catch {}
  }, [token, checkStatus]);

  const handleSuspendedConfirm = async () => {
    setSuspendedModal((p) => ({ ...p, visible: false }));
    isHandlingAction.current = false;
    await logout();
    router.replace("/(auth)/login");
  };

  const handleRejectedConfirm = () => {
    setRejectedModal((p) => ({ ...p, visible: false }));
    router.push("/(settings)/setup-schedule");
  };

  return (
    <>
      <AlertModal
        visible={suspendedModal.visible}
        onClose={handleSuspendedConfirm}
        title="Account Clearance Suspended"
        message={suspendedModal.message}
        variant="error"
        buttonLabel="Understand & Log Out"
        onConfirm={handleSuspendedConfirm}
        icon={<Ban size={30} color={colors.danger} strokeWidth={2} />}
      />

      <AlertModal
        visible={rejectedModal.visible}
        onClose={handleRejectedConfirm}
        title="Verification Documents Rejected"
        message={rejectedModal.message}
        variant="warning"
        buttonLabel="Re-upload Documents"
        onConfirm={handleRejectedConfirm}
        icon={<AlertCircle size={30} color={colors.warning} strokeWidth={2} />}
      />
    </>
  );
}
