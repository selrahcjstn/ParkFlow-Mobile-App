import RegistrationDocumentField from '../components/RegistrationDocumentField';
import CorScheduleStep from '../components/CorScheduleStep';
import VerificationStatusCard from "../components/VerificationStatusCard";
import { getRegistrationErrorMessage } from "@/utils/registrationError";
import { AlertModal } from "@/components/shared";
import { AppButton } from "@/components/ui";
import { Roles } from "@/constants/roles";
import { useOnboardingStore } from "@/features/auth/store/onboarding.store";
import AuthLayout from "@/features/auth/components/AuthLayout";
import { onboardingService } from "@/features/auth/services/onboarding.service";
import { useAuthStore } from "@/features/auth/store/auth.store";
import * as DocumentPicker from "expo-document-picker";
import { validateFileSize } from "@/utils/fileValidation";
import { useRouter } from "expo-router";
import { ChevronLeft } from "lucide-react-native";
import { useAppTheme } from "@/hooks/useAppTheme";
import React, { useCallback, useEffect, useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";

export default function OnboardingSchedulePage() {
  const { colors } = useAppTheme();
  const router = useRouter();
  const role = useOnboardingStore((state) => state.role);
  const corDraft = useOnboardingStore((state) => state.corDraft);
  const profileType = useAuthStore((state) => state.user?.profileType);
  const isPersonnel = role === Roles.UniversityStaff || role === Roles.NonAcademicPersonnel || profileType === "personnel";
  const [selectedFile, setSelectedFile] =
    useState<DocumentPicker.DocumentPickerAsset | null>(corDraft?.informationConfirmed ? { uri: corDraft.documentUrl, name: 'Reviewed COR', mimeType: 'application/pdf', lastModified: 0 } : null);
  const [selectedOrcrFile, setSelectedOrcrFile] =
    useState<DocumentPicker.DocumentPickerAsset | null>(null);
  const [selectedMotorFile, setSelectedMotorFile] =
    useState<DocumentPicker.DocumentPickerAsset | null>(null);

  const [subStep, setSubStep] = useState<"schedule" | "documents">(isPersonnel || corDraft?.informationConfirmed ? "documents" : "schedule");
  useEffect(() => {
    if (isPersonnel || corDraft?.informationConfirmed) setSubStep("documents");
  }, [isPersonnel, corDraft?.informationConfirmed]);
  const [preparedCorUrl, setPreparedCorUrl] = useState<string | undefined>(corDraft?.informationConfirmed ? corDraft.documentUrl : undefined);
  const [submittingDocs, setSubmittingDocs] = useState(false);
  const [documentError, setDocumentError] = useState("");
  const [modal, setModal] = useState({
    visible: false,
    title: "",
    message: "",
    variant: "error" as any,
  });

  const showAlert = useCallback(
    (
      title: string,
      message: string,
      variant: "error" | "warning" | "info" = "error",
    ) => {
      setModal({ visible: true, title, message, variant });
    },
    [],
  );

  const handlePickFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["application/pdf", "image/jpeg", "image/png"],
        copyToCacheDirectory: true,
      });
      if (result.canceled) return;
      const asset = result.assets?.[0];
      if (!asset) return;

      const validation = validateFileSize(asset, 5);
      if (!validation.isValid) {
        showAlert(
          "File Too Large",
          validation.message || "File size cannot exceed 5MB.",
          "error",
        );
        return;
      }

      setSelectedFile(asset);
    } catch {
      showAlert(
        "Upload Failed",
        "Something went wrong. Please try again.",
        "error",
      );
    }
  };

  const handlePickOrcrFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["application/pdf", "image/*"],
        copyToCacheDirectory: true,
      });
      if (result.canceled) return;
      const asset = result.assets?.[0];
      if (!asset) return;

      const validation = validateFileSize(asset, 5);
      if (!validation.isValid) {
        showAlert(
          "File Too Large",
          validation.message || "File size cannot exceed 5MB.",
          "error",
        );
        return;
      }

      setSelectedOrcrFile(asset);
    } catch {
      showAlert(
        "Upload Failed",
        "Something went wrong. Please try again.",
        "error",
      );
    }
  };

  const handlePickMotorFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["image/*"],
        copyToCacheDirectory: true,
      });
      if (result.canceled) return;
      const asset = result.assets?.[0];
      if (!asset) return;

      const validation = validateFileSize(asset, 5);
      if (!validation.isValid) {
        showAlert(
          "File Too Large",
          validation.message || "File size cannot exceed 5MB.",
          "error",
        );
        return;
      }

      setSelectedMotorFile(asset);
    } catch {
      showAlert(
        "Upload Failed",
        "Something went wrong. Please try again.",
        "error",
      );
    }
  };

  const handleDocumentsSubmit = async () => {
    if (submittingDocs) return;
    setDocumentError("");
    if (!isPersonnel && !preparedCorUrl) { showAlert('Confirm Schedule', 'Scan your COR and confirm the detected schedule first.'); return; }
    if (!selectedFile) {
      showAlert(isPersonnel ? "Missing Employee ID" : "Missing COR Document", isPersonnel ? "Please upload your employee ID before submitting." : "Please upload your COR document before submitting.", "error");
      return;
    }

    if (!selectedOrcrFile) {
      showAlert("Missing OR/CR Document", "Please upload your OR/CR document before submitting.", "error");
      return;
    }

    if (!selectedMotorFile) {
      showAlert("Missing Vehicle Picture", "Please upload your vehicle picture showing the plate number before submitting.", "error");
      return;
    }

    const corValidation = validateFileSize(selectedFile, 5);
    if (!corValidation.isValid) {
      showAlert("File Too Large", `${isPersonnel ? "Employee ID" : "COR Document"}: ${corValidation.message || "File size cannot exceed 5MB."}`, "error");
      return;
    }

    const orcrValidation = validateFileSize(selectedOrcrFile, 5);
    if (!orcrValidation.isValid) {
      showAlert("File Too Large", `OR/CR Document: ${orcrValidation.message || "File size cannot exceed 5MB."}`, "error");
      return;
    }

    const motorValidation = validateFileSize(selectedMotorFile, 5);
    if (!motorValidation.isValid) {
      showAlert("File Too Large", `Vehicle Picture: ${motorValidation.message || "File size cannot exceed 5MB."}`, "error");
      return;
    }

    setSubmittingDocs(true);
    try {
      await onboardingService.submitDocuments(selectedFile, selectedOrcrFile, selectedMotorFile, isPersonnel ? "Employee ID" : corDraft?.academicYear, isPersonnel ? undefined : preparedCorUrl);

      const userRes = await useAuthStore.getState().loadUser();
      if (userRes.success) router.replace("/(users)/(tabs)/home" as any);
      else showAlert("Registration Saved", "Your submission was saved, but we could not check your account. Please try again.");
    } catch (err: any) {
      const message = getRegistrationErrorMessage(err);
      setDocumentError(message);
      showAlert("Registration Failed", message, "error");
    } finally {
      setSubmittingDocs(false);
    }
  };

  return (
    <AuthLayout
      header={
        <View className="flex-row items-center justify-between px-4 py-3 bg-light-surface border-b border-light-border/40 dark:bg-dark-surface dark:border-dark-border/40">
          <TouchableOpacity
            onPress={() =>
              router.canGoBack()
                ? router.back()
                : router.replace("/(auth)/login")
            }
            className="w-10 h-10 items-center justify-center rounded-pill bg-light-background active:bg-light-surfaceMuted dark:bg-dark-background dark:active:bg-dark-surfaceMuted"
            activeOpacity={0.7}
          >
            <ChevronLeft size={22} color={colors.primary} strokeWidth={2.5} />
          </TouchableOpacity>

          <Text className="text-light-text text-[17px] font-bold text-center flex-1 mr-10 dark:text-dark-text">
            {isPersonnel || subStep === "documents" ? "Upload Documents" : "COR Information"}
          </Text>
        </View>
      }
    >      <View className="flex-1 bg-light-background px-6 pt-4 pb-12 dark:bg-dark-background">
        {!isPersonnel && subStep === "schedule" ? (
          <CorScheduleStep onConfirmed={(url) => {
            setPreparedCorUrl(url);
            setSelectedFile({ uri: url, name: 'Scanned COR', mimeType: 'application/pdf', lastModified: Date.now() });
            setSubStep('documents');
          }} />
        ) : (
          <>
            <Text className="text-light-muted font-regular text-[13px] mb-4 dark:text-dark-muted">
              {isPersonnel ? "Upload your employee ID and vehicle documents. No schedule upload is needed; faculty/staff parking hours are set by the university." : "Upload your OR/CR and vehicle photo for admin review. Your COR schedule is already confirmed."}
            </Text>

            <VerificationStatusCard />
            {isPersonnel ? <>
            {/* COR Upload */}
            <RegistrationDocumentField label="Employee ID" helperText="PDF, JPG or PNG - Maximum file size 5MB" file={selectedFile} onPick={handlePickFile} onRemove={() => setSelectedFile(null)} disabled={submittingDocs} />



            </> : preparedCorUrl ? <View className="p-4 rounded-card border border-light-border dark:border-dark-border">
              <Text className="text-light-text dark:text-dark-text">COR information fetched and schedule confirmed. Upload your remaining vehicle documents below.</Text>
              <AppButton label="Replace COR" variant="outline" onPress={() => { setPreparedCorUrl(undefined); setSubStep('schedule'); }} />
            </View> : <CorScheduleStep onConfirmed={(url) => { setPreparedCorUrl(url); setSelectedFile({ uri: url, name: 'Scanned COR', mimeType: 'application/pdf', lastModified: Date.now() }); }} />}

            {/* OR/CR Upload */}
            <RegistrationDocumentField label="OR/CR document" helperText="PDF, JPG or PNG - Maximum file size 5MB" file={selectedOrcrFile} onPick={handlePickOrcrFile} onRemove={() => setSelectedOrcrFile(null)} disabled={submittingDocs} />



            {/* Picture of Motor Upload */}
            <RegistrationDocumentField label="vehicle photo" helperText="Show the plate number clearly - Maximum file size 5MB" file={selectedMotorFile} onPick={handlePickMotorFile} onRemove={() => setSelectedMotorFile(null)} disabled={submittingDocs} />



            {documentError ? (
              <Text accessibilityRole="alert" className="mt-4 text-sm text-light-text dark:text-dark-danger">{documentError}</Text>
            ) : null}
            <AppButton
              label="Complete Verification"
              variant="primary"
              size="lg"
              className="mt-8"
              onPress={handleDocumentsSubmit}
              loading={submittingDocs}
              disabled={submittingDocs || (!isPersonnel && !preparedCorUrl)}
            />
          </>
        )}
      </View>

      <AlertModal
        visible={modal.visible}
        onClose={() => setModal((p) => ({ ...p, visible: false }))}
        title={modal.title}
        message={modal.message}
        variant={modal.variant}
      />

    </AuthLayout>
  );
}
