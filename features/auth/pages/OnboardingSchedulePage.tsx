import { parseTime } from "@/utils/timeParser";
import { getRegistrationErrorMessage } from "@/utils/registrationError";
import { AlertModal } from "@/components/shared";
import { AppButton } from "@/components/ui";
import { Roles } from "@/constants/roles";
import { useOnboardingStore } from "@/features/auth/store/onboarding.store";
import ScheduleDayRow from "@/components/ui/ScheduleDayRow";
import { SCHEDULE_DAYS } from "@/constants/scheduleDays";
import AuthLayout from "@/features/auth/components/AuthLayout";
import { onboardingService } from "@/features/auth/services/onboarding.service";
import { useAuthStore } from "@/features/auth/store/auth.store";
import { useApiMutation } from "@/hooks";
import DateTimePicker from "@react-native-community/datetimepicker";
import * as DocumentPicker from "expo-document-picker";
import { validateFileSize } from "@/utils/fileValidation";
import { useRouter } from "expo-router";
import { ChevronLeft, FileText, UploadCloud, X } from "lucide-react-native";
import { useAppTheme } from "@/hooks/useAppTheme";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { Animated, Platform, Text, TouchableOpacity, View } from "react-native";

function formatTime(date: Date): string {
  let hours = date.getHours();
  const minutes = date.getMinutes();
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12 || 12;
  const mins = minutes.toString().padStart(2, "0");
  return `${hours}:${mins} ${ampm}`;
}


export default function OnboardingSchedulePage() {
  const { colors, isDark } = useAppTheme();
  const router = useRouter();
  const role = useOnboardingStore((state) => state.role);
  const profileType = useAuthStore((state) => state.user?.profileType);
  const isPersonnel = role === Roles.UniversityStaff || role === Roles.NonAcademicPersonnel || profileType === "personnel";
  const { run: submitSchedule, isLoading } = useApiMutation(
    onboardingService.updateSchedule,
  );

  const [schedule, setSchedule] = useState<
    Record<string, { start?: string; end?: string }>
  >(
    () =>
      Object.fromEntries(SCHEDULE_DAYS.map((d) => [d.shortLabel, {}])) as any,
  );

  const [pickerTarget, setPickerTarget] = useState<null | {
    day: string;
    field: "start" | "end";
  }>(null);
  const [draftTime, setDraftTime] = useState<Date>(() => {
    const d = new Date();
    d.setHours(8, 0, 0, 0);
    return d;
  });
  const slideAnim = useRef(new Animated.Value(300)).current;

  const [selectedFile, setSelectedFile] =
    useState<DocumentPicker.DocumentPickerAsset | null>(null);
  const [selectedOrcrFile, setSelectedOrcrFile] =
    useState<DocumentPicker.DocumentPickerAsset | null>(null);
  const [selectedMotorFile, setSelectedMotorFile] =
    useState<DocumentPicker.DocumentPickerAsset | null>(null);

  const [subStep, setSubStep] = useState<"schedule" | "documents">(isPersonnel ? "documents" : "schedule");
  useEffect(() => {
    if (isPersonnel) setSubStep("documents");
  }, [isPersonnel]);
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

  const openPicker = useCallback(
    (day: string, field: "start" | "end") => {
      const existing = schedule[day]?.[field];
      const next =
        parseTime(existing) ??
        (() => {
          const d = new Date();
          d.setHours(field === "start" ? 8 : 17, 0, 0, 0);
          return d;
        })();
      setDraftTime(next);
      setPickerTarget({ day, field });

      if (Platform.OS === "ios") {
        slideAnim.setValue(300);
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
          tension: 45,
          friction: 8,
        }).start();
      }
    },
    [schedule, slideAnim],
  );

  const closePicker = useCallback(() => {
    if (Platform.OS === "ios") {
      Animated.timing(slideAnim, {
        toValue: 300,
        duration: 200,
        useNativeDriver: true,
      }).start(() => setPickerTarget(null));
    } else {
      setPickerTarget(null);
    }
  }, [slideAnim]);

  const confirmPicker = useCallback(() => {
    if (!pickerTarget) return;
    const formatted = formatTime(draftTime);
    setSchedule((prev) => ({
      ...prev,
      [pickerTarget.day]: {
        ...prev[pickerTarget.day],
        [pickerTarget.field]: formatted,
      },
    }));
    closePicker();
  }, [pickerTarget, draftTime, closePicker]);

  const handleAndroidChange = useCallback(
    (event: any, date?: Date) => {
      if (event.type === "dismissed" || !date || !pickerTarget) {
        setPickerTarget(null);
        return;
      }

      setDraftTime(date);
      const currentDay = pickerTarget.day;
      const currentField = pickerTarget.field;

      setPickerTarget(null);

      const formatted = formatTime(date);
      setSchedule((prev) => ({
        ...prev,
        [currentDay]: {
          ...prev[currentDay],
          [currentField]: formatted,
        },
      }));
    },
    [pickerTarget],
  );

  // Android's native dialog reopens when onChange changes identity.
  // Keep this stable across unrelated renders so the chosen time is not reset.
  const handlePickerChange = useCallback(
    (event: { type: string }, date?: Date) => {
      if (Platform.OS === "android") handleAndroidChange(event, date);
      else if (event.type === "set" && date) setDraftTime(date);
    },
    [handleAndroidChange],
  );

  const handlePickFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: isPersonnel ? ["application/pdf", "image/*"] : ["application/pdf"],
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

  const handleScheduleSubmit = async () => {
    if (isPersonnel) { setSubStep("documents"); return; }
    const items = SCHEDULE_DAYS.map((d) => {
      const start = schedule[d.shortLabel]?.start;
      const end = schedule[d.shortLabel]?.end;
      const startDate = parseTime(start);
      const endDate = parseTime(end);
      return {
        dayOfWeek: d.key,
        startTime: startDate
          ? `${String(startDate.getHours()).padStart(2, "0")}:${String(startDate.getMinutes()).padStart(2, "0")}:00`
          : "",
        endTime: endDate
          ? `${String(endDate.getHours()).padStart(2, "0")}:${String(endDate.getMinutes()).padStart(2, "0")}:00`
          : "",
      };
    }).filter((item) => item.startTime && item.endTime);

    if (items.length === 0) {
      showAlert(
        "Missing Schedule",
        "Please set at least one day's schedule.",
        "error",
      );
      return;
    }

    try {
      const scheduleRes = await submitSchedule({ items });
      if (!scheduleRes?.isSuccess) {
        showAlert(
          "Schedule Error",
          scheduleRes?.message || "Failed to submit schedule.",
          "error",
        );
        return;
      }
      setSubStep("documents");
    } catch (err: any) {
      showAlert("Error", err?.message || "Please try again.", "error");
    }
  };

  const handleDocumentsSubmit = async () => {
    if (submittingDocs) return;
    setDocumentError("");
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
      await onboardingService.submitDocuments(selectedFile, selectedOrcrFile, selectedMotorFile);

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

  const pickerLabel = pickerTarget
    ? `${pickerTarget.day} — ${pickerTarget.field === "start" ? "Start" : "End"}`
    : "";

  return (
    <AuthLayout
      header={
        <View className="flex-row items-center justify-between px-4 py-3 bg-light-surface border-b border-light-border/40">
          <TouchableOpacity
            onPress={() =>
              router.canGoBack()
                ? router.back()
                : router.replace("/(auth)/login")
            }
            className="w-10 h-10 items-center justify-center rounded-pill bg-light-background active:bg-light-surfaceMuted"
            activeOpacity={0.7}
          >
            <ChevronLeft size={22} color="#334155" strokeWidth={2.5} />
          </TouchableOpacity>

          <Text className="text-light-text text-[17px] font-bold text-center flex-1 mr-10">
            {isPersonnel || subStep === "documents" ? "Upload Documents" : "Duty Schedule"}
          </Text>
        </View>
      }
    >      <View className="flex-1 bg-light-background px-6 pt-4 pb-12">
        {!isPersonnel && subStep === "schedule" ? (
          <>
            <Text className="text-light-muted font-regular text-[13px] mb-4">
              Set your usual campus schedule for administrative verification.
            </Text>

            <View className="gap-2 bg-light-surface p-3 rounded-card border border-light-border">
              {SCHEDULE_DAYS.map((d) => (
                <ScheduleDayRow
                  key={d.shortLabel}
                  day={d.shortLabel as any}
                  schedule={schedule[d.shortLabel] ?? {}}
                  timeError={false}
                  onOpenPicker={({ field }) => openPicker(d.shortLabel, field)}
                  onClear={() => setSchedule((p) => ({ ...p, [d.shortLabel]: {} }))}
                />
              ))}
            </View>

            <AppButton
              label="Continue to Documents"
              variant="primary"
              size="lg"
              className="mt-8"
              onPress={handleScheduleSubmit}
              loading={isLoading}
              disabled={isLoading}
            />
          </>
        ) : (
          <>
            <Text className="text-light-muted font-regular text-[13px] mb-4">
              {isPersonnel ? "Upload your employee ID and vehicle documents. No schedule upload is needed; faculty/staff parking hours are set by the university." : "Upload your identity and vehicle registration documents for administrative verification."}
            </Text>

            {/* COR Upload */}
            <TouchableOpacity
              className="w-full border border-dashed border-light-border bg-light-surface rounded-card p-5 items-center justify-center active:bg-light-surfaceMuted mt-2 shadow-soft"
              onPress={handlePickFile}
              activeOpacity={0.7}
            >
              <View className="w-10 h-10 rounded-full bg-light-surfaceMuted items-center justify-center mb-2">
                <UploadCloud size={18} color={colors.muted} strokeWidth={2} />
              </View>
              <Text className="text-light-muted font-bold text-[13.5px] text-center">
                {isPersonnel ? (selectedFile ? "Replace Employee ID" : "Upload Employee ID") : (selectedFile ? "Replace COR Document" : "Upload COR Document")}
              </Text>
              <Text className="text-light-muted/70 font-regular text-[11.5px] mt-0.5 text-center">
                {isPersonnel ? "PDF or image • Maximum file size 5MB" : "PDF document only • Maximum file size 5MB"}
              </Text>
            </TouchableOpacity>

            {selectedFile && (
              <View className="w-full mt-2 bg-light-surface border border-light-border rounded-button p-3 flex-row items-center justify-between shadow-soft">
                <View className="flex-row items-center gap-2.5 flex-1 mr-2">
                  <View className="w-8 h-8 rounded-button bg-light-surfaceMuted items-center justify-center">
                    <FileText size={16} color={colors.primary} strokeWidth={2} />
                  </View>
                  <Text
                    className="text-light-text font-bold text-[13px] flex-1"
                    numberOfLines={1}
                  >
                    {selectedFile.name}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => setSelectedFile(null)}
                  className="w-7 h-7 bg-light-surfaceMuted items-center justify-center rounded-pill active:bg-light-border"
                  activeOpacity={0.7}
                >
                  <X size={14} color={colors.muted} strokeWidth={2.5} />
                </TouchableOpacity>
              </View>
            )}

            {/* OR/CR Upload */}
            <TouchableOpacity
              className="w-full border border-dashed border-light-border bg-light-surface rounded-card p-5 items-center justify-center active:bg-light-surfaceMuted mt-3 shadow-soft"
              onPress={handlePickOrcrFile}
              activeOpacity={0.7}
            >
              <View className="w-10 h-10 rounded-full bg-light-surfaceMuted items-center justify-center mb-2">
                <UploadCloud size={18} color={colors.muted} strokeWidth={2} />
              </View>
              <Text className="text-light-muted font-bold text-[13.5px] text-center">
                {selectedOrcrFile ? "Replace OR / CR Document" : "Upload OR / CR Document"}
              </Text>
              <Text className="text-light-muted/70 font-regular text-[11.5px] mt-0.5 text-center">
                PDF document only • Maximum file size 5MB
              </Text>
            </TouchableOpacity>

            {selectedOrcrFile && (
              <View className="w-full mt-2 bg-light-surface border border-light-border rounded-button p-3 flex-row items-center justify-between shadow-soft">
                <View className="flex-row items-center gap-2.5 flex-1 mr-2">
                  <View className="w-8 h-8 rounded-button bg-light-surfaceMuted items-center justify-center">
                    <FileText size={16} color={colors.primary} strokeWidth={2} />
                  </View>
                  <Text
                    className="text-light-text font-bold text-[13px] flex-1"
                    numberOfLines={1}
                  >
                    {selectedOrcrFile.name}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => setSelectedOrcrFile(null)}
                  className="w-7 h-7 bg-light-surfaceMuted items-center justify-center rounded-pill active:bg-light-border"
                  activeOpacity={0.7}
                >
                  <X size={14} color={colors.muted} strokeWidth={2.5} />
                </TouchableOpacity>
              </View>
            )}

            {/* Picture of Motor Upload */}
            <TouchableOpacity
              className="w-full border border-dashed border-light-border bg-light-surface rounded-card p-5 items-center justify-center active:bg-light-surfaceMuted mt-3 shadow-soft"
              onPress={handlePickMotorFile}
              activeOpacity={0.7}
            >
              <View className="w-10 h-10 rounded-full bg-light-surfaceMuted items-center justify-center mb-2">
                <UploadCloud size={18} color={colors.muted} strokeWidth={2} />
              </View>
              <Text className="text-light-muted font-bold text-[13.5px] text-center">
                {selectedMotorFile ? "Replace Picture of Motor" : "Upload Picture of Motor"}
              </Text>
              <Text className="text-light-muted/70 font-regular text-[11.5px] mt-0.5 text-center">
                Please provide a clear picture showing plate number • Max 5MB
              </Text>
            </TouchableOpacity>

            {selectedMotorFile && (
              <View className="w-full mt-2 bg-light-surface border border-light-border rounded-button p-3 flex-row items-center justify-between shadow-soft">
                <View className="flex-row items-center gap-2.5 flex-1 mr-2">
                  <View className="w-8 h-8 rounded-button bg-light-surfaceMuted items-center justify-center">
                    <FileText size={16} color={colors.primary} strokeWidth={2} />
                  </View>
                  <Text
                    className="text-light-text font-bold text-[13px] flex-1"
                    numberOfLines={1}
                  >
                    {selectedMotorFile.name}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => setSelectedMotorFile(null)}
                  className="w-7 h-7 bg-light-surfaceMuted items-center justify-center rounded-pill active:bg-light-border"
                  activeOpacity={0.7}
                >
                  <X size={14} color={colors.muted} strokeWidth={2.5} />
                </TouchableOpacity>
              </View>
            )}

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
              disabled={submittingDocs}
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

      {pickerTarget && (
        <>
          <TouchableOpacity
            activeOpacity={1}
            onPress={closePicker}
            className="absolute inset-0 bg-black/40 dark:bg-black/60 z-40"
          />

          <Animated.View
            style={[
              Platform.OS === "ios"
                ? { transform: [{ translateY: slideAnim }] }
                : {},
            ]}
            className="absolute bottom-0 left-0 right-0 bg-light-surface dark:bg-dark-surface rounded-t-[28px] px-6 pb-9 shadow-card border-t border-light-border dark:border-dark-border z-50"
          >
            <View className="self-center w-10 h-1.5 rounded-pill bg-light-border dark:bg-dark-border mt-3 mb-3" />

            <View className="flex-row items-center justify-between mb-4">
              <View>
                <Text className="text-light-text dark:text-dark-text text-[16px] font-bold">
                  {pickerLabel}
                </Text>
                <Text className="text-light-muted dark:text-dark-muted text-[12px] font-regular">
                  Set {pickerTarget.field === "start" ? "Start" : "End"} Time
                </Text>
              </View>
              <TouchableOpacity
                onPress={closePicker}
                className="px-3.5 py-1.5 rounded-button bg-light-surfaceMuted dark:bg-dark-surfaceMuted active:bg-light-border dark:active:bg-dark-border"
                activeOpacity={0.7}
              >
                <Text className="text-light-text dark:text-dark-text font-bold text-xs">
                  Cancel
                </Text>
              </TouchableOpacity>
            </View>

            <View className="items-center mb-5 bg-light-background dark:bg-dark-background rounded-card p-2 border border-light-border/60 dark:border-dark-border/60 overflow-hidden">
              <DateTimePicker
                value={draftTime}
                mode="time"
                is24Hour={false}
                display={Platform.OS === "ios" ? "spinner" : "default"}
                minuteInterval={1}
                themeVariant={isDark ? "dark" : "light"}
                textColor={colors.text}
                onChange={handlePickerChange}
              />
            </View>

            {Platform.OS === "ios" && (
              <TouchableOpacity
                onPress={confirmPicker}
                className="rounded-button bg-light-primary dark:bg-dark-primary py-3.5 items-center justify-center active:opacity-90 shadow-soft"
                activeOpacity={0.8}
              >
                <Text className="text-light-textInverse dark:text-dark-background font-bold text-[15px]">
                  Confirm Time Selection
                </Text>
              </TouchableOpacity>
            )}
          </Animated.View>
        </>
      )}
    </AuthLayout>
  );
}
