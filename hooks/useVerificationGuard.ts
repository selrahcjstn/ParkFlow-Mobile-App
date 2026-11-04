import { useAuthStore } from "@/features/auth/store/auth.store";
import { useVehicleStore } from "@/features/user/store/vehicle.store";
import { router } from "expo-router";
import { useCallback, useMemo } from "react";
import { appDialog } from "@/services/app-dialog";

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
  const { vehicle, vehicles, loadVehicle } = useVehicleStore();

  const corStatusNum = user?.corVerificationStatus;
  const corRejectionReason = user?.rejectionReason;
  const userRejectedTarget = user?.rejectedTarget;

  const isPersonnel =
    user?.profileType === "personnel" ||
    user?.role === "Faculty" ||
    user?.role === "UniversityStaff" ||
    user?.role === "Staff" ||
    user?.role === "NonAcademicPersonnel" ||
    Boolean(user?.employeeIdNumber);

  // COR state (personnel accounts do not have COR)
  const isCorApproved = isPersonnel || corStatusNum === 2;
  const isCorPending = !isPersonnel && [1, 4, 5, 6].includes(corStatusNum ?? 0);
  const isCorRejected = !isPersonnel && corStatusNum === 3;

  // Vehicle state
  const activeVehicle = vehicle || (vehicles && vehicles.length > 0 ? vehicles[0] : null);
  const vehicleStatusNum = activeVehicle?.verificationStatus;
  const isVehicleApproved = activeVehicle && (vehicleStatusNum === 2 || (vehicleStatusNum as any) === "Verified");
  const isVehiclePending = activeVehicle && ([1, 4, 5, 6].includes(Number(vehicleStatusNum)) || ["Pending", "Processing", "PreVerified", "NeedsReview"].includes(String(vehicleStatusNum)));
  const isVehicleRejected = activeVehicle && (vehicleStatusNum === 3 || (vehicleStatusNum as any) === "Rejected");

  const requiresDriverDocuments = user?.profileType === "student" || user?.profileType === "personnel";
  const driverReady = !requiresDriverDocuments || !!user?.driversLicenseUrl && !!user?.profilePictureUrl && [2, 'Verified'].includes(user?.licenseStatus ?? '');
  const driverRejected = [3, 'Rejected'].includes(user?.licenseStatus ?? '');
  const state: VerificationState = useMemo(() => {
    if (!driverReady) return driverRejected ? 'rejected' : user?.driversLicenseUrl ? 'pending' : 'not_submitted';
    if (!isCorApproved) {
      if (isCorPending) return "pending";
      if (isCorRejected) return "rejected";
      return "not_submitted";
    }
    if (!activeVehicle) return "not_submitted";
    if (isVehicleApproved) return (user?.status?.toLowerCase() === "active" || user?.status === "2" || isPersonnel || (!user?.status && user?.profileType !== "student")) ? "approved" : "pending";
    if (isVehiclePending) return "pending";
    if (isVehicleRejected) return "rejected";
    return "not_submitted";
  }, [driverReady, driverRejected, user?.driversLicenseUrl, isCorApproved, isCorPending, isCorRejected, activeVehicle, isVehicleApproved, isVehiclePending, isVehicleRejected, user?.status, isPersonnel]);

  const rejectedTarget = useMemo(() => {
    if (!isCorApproved) {
      return userRejectedTarget || "cor";
    }
    if (!isVehicleApproved) {
      return "vehicle";
    }
    return undefined;
  }, [isCorApproved, isVehicleApproved, userRejectedTarget]);

  const accountApproved = user?.status?.toLowerCase() === "active" || user?.status === "2" || isPersonnel || (!user?.status && user?.profileType !== "student");
  const isApproved = driverReady && isCorApproved && !!isVehicleApproved && accountApproved;

  const title = useMemo(() => {
    if (!driverReady) return driverRejected ? "Driver’s license rejected" : !user?.driversLicenseUrl || !user?.profilePictureUrl ? "Driver documents required" : "Driver’s license review pending";
    if (isApproved) return "Account & Vehicle Verified";
    if (!accountApproved) return user?.profileType === "student"
      ? isCorApproved && activeVehicle ? isVehicleRejected ? "Vehicle Registration Rejected" : "Vehicle Approval Pending" : "Complete Student Registration"
      : "Account Verification Pending Review";
    if (!isCorApproved) {
      if (isCorPending) return "COR Processing Pending";
      if (isCorRejected) return "COR Registration Rejected";
      return "COR Verification Required";
    }
    if (!activeVehicle) return "Vehicle Registration Required";
    if (isVehiclePending) return "Vehicle Verification Pending";
    if (isVehicleRejected) return "Vehicle Registration Rejected";
    return "Vehicle Verification Required";
  }, [driverReady, driverRejected, user?.driversLicenseUrl, user?.profilePictureUrl, isApproved, accountApproved, isCorApproved, isCorPending, isCorRejected, activeVehicle, isVehiclePending, isVehicleRejected, user?.profileType]);

  const noticeMessage = useMemo(() => {
    if (!driverReady) return driverRejected ? `Your driver’s license was rejected. ${user?.licenseRejectionReason || "Upload a valid license."}` : !user?.driversLicenseUrl || !user?.profilePictureUrl ? "Upload your driver’s license and a clear profile photo in Driver documents before vehicle entry." : "Your driver’s license is awaiting admin review in Vehicles.";
    if (isApproved) return "Your account and vehicle are verified and fully approved.";
    if (!accountApproved) return user?.profileType === "student"
      ? isCorApproved && activeVehicle
        ? isVehicleRejected ? "Your vehicle registration was rejected. Review your OR/CR and vehicle photo, then submit them again for admin approval."
          : "Your student account is awaiting admin approval of your OR/CR and vehicle photo. Parking and reservations will be available after approval."
        : "Complete and confirm your COR registration information, then submit your vehicle documents for admin approval."
      : "Your account is awaiting administrator approval. You can view each verification result on Home.";
    if (!isCorApproved) {
      if (isCorPending) return user?.profileType === "student" ? "Wait for COR extraction, then confirm your information and read-only schedule. No admin approval is required." : "Your employee ID is awaiting admin review.";
      if (isCorRejected) return corRejectionReason
        ? `Your verification was not approved. Reason: ${corRejectionReason}. Please review the requirements and submit the required document again.`
        : "Your verification was not approved. Please submit an updated document for administrator review.";
      return "Your account needs a verified Certificate of Registration (COR) / ID before you can create reservations. Please upload your document for verification.";
    }
    if (!activeVehicle) return "You must register and verify a vehicle before creating reservations.";
    if (isVehiclePending) return `Your vehicle (${activeVehicle.plateNumber}) is currently pending admin verification. You cannot create a reservation until your vehicle is approved.`;
    if (isVehicleRejected) return `Your vehicle (${activeVehicle.plateNumber}) registration was rejected. Please review vehicle details and re-submit.`;
    return "Your vehicle needs to be verified before you can create reservations.";
  }, [driverReady, driverRejected, user?.driversLicenseUrl, user?.profilePictureUrl, user?.licenseRejectionReason, isApproved, accountApproved, isCorApproved, isCorPending, isCorRejected, corRejectionReason, activeVehicle, isVehiclePending, isVehicleRejected, user?.profileType]);

  const navigateToVerification = useCallback(() => {
    if (!driverReady) { router.push("/(settings)/driver-documents" as any); return; }
    if (isApproved) {
      router.push("/(settings)/schedule");
    } else if (rejectedTarget === "vehicle" || (!isVehicleApproved && isCorApproved)) {
      router.push("/(settings)/vehicle");
    } else {
      router.push("/(settings)/setup-schedule");
    }
  }, [driverReady, isApproved, rejectedTarget, isVehicleApproved, isCorApproved]);

  const refreshUserStatus = useCallback(async () => {
    try {
      await Promise.all([loadUser(), loadVehicle(true)]);
    } catch (_e) {}
  }, [loadUser, loadVehicle]);

  const checkAccessOrRedirect = useCallback(
    (onApproved: () => void, featureName: string = "reservations"): boolean => {
      if (isApproved) {
        onApproved();
        return true;
      }

      // Feature blocked -> Show status alert notice and route to verification
      appDialog.show(
        title,
        noticeMessage,
        [
          {
            text: "Cancel",
            style: "cancel",
          },
          {
            text: state === "pending" && driverReady ? "Refresh Status" : "Go to Verification",
            onPress: () => {
              if (state === "pending" && driverReady) {
                return refreshUserStatus();
              } else {
                navigateToVerification();
              }
            },
          },
        ],
        { cancelable: true, variant: "warning" }
      );

      return false;
    },
    [driverReady, isApproved, title, noticeMessage, state, navigateToVerification, refreshUserStatus]
  );

  return {
    state,
    isApproved,
    title,
    noticeMessage,
    rejectionReason: corRejectionReason,
    rejectedTarget,
    checkAccessOrRedirect,
    navigateToVerification,
    refreshUserStatus,
  };
}
