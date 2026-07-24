import { AlertModal } from "@/components/shared";
import { AppButton } from "@/components/ui";
import ScheduleDayRow from "@/components/ui/ScheduleDayRow";
import { SCHEDULE_DAYS } from "@/constants/scheduleDays";
import AuthLayout from "@/features/auth/components/AuthLayout";
import { onboardingService } from "@/features/auth/services/onboarding.service";
import { userService } from "@/features/user/services/user.service";
import { useApiMutation } from "@/hooks";
import DateTimePicker from "@react-native-community/datetimepicker";
import * as DocumentPicker from "expo-document-picker";
import { useRouter } from "expo-router";
import { ChevronLeft, FileText, UploadCloud, X } from "lucide-react-native";
import React, { useCallback, useRef, useState } from "react";
import { Animated, Platform, Text, TouchableOpacity, View } from "react-native";

function formatTime(date: Date): string {
  let hours = date.getHours();
  const minutes = date.getMinutes();
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12 || 12;
  const mins = minutes.toString().padStart(2, "0");
  return `${hours}:${mins} ${ampm}`;
}

function parseTime(value?: string): Date | null {
  if (!value) return null;
  const [time, ampm] = value.split(" ");
  if (!time || !ampm) return null;
  let [hours, minutes] = time.split(":").map(Number);
  if (ampm === "PM" && hours !== 12) hours += 12;
  if (ampm === "AM" && hours === 12) hours = 0;
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return date;
}

export default function OnboardingSchedulePage() {
  const router = useRouter();
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

  const [subStep, setSubStep] = useState<"schedule" | "documents">("schedule");
  const [submittingDocs, setSubmittingDocs] = useState(false);
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

  const handlePickFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["application/pdf", "image/*"],
        copyToCacheDirectory: true,
      });
      if (result.canceled) return;
      const asset = result.assets?.[0];
      if (!asset) return;
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
    if (!selectedFile) {
      showAlert("Missing COR", "Please upload COR or Employee ID.", "error");
      return;
    }

    if (!selectedOrcrFile) {
      showAlert("Missing OR/CR", "Please upload OR/CR document.", "error");
      return;
    }

    if (!selectedMotorFile) {
      showAlert(
        "Missing Motor Picture",
        "Please send the picture with plate number.",
        "error",
      );
      return;
    }

    setSubmittingDocs(true);
    try {
      const corRes = await onboardingService.updateCor({
        academicTerm: "2024-2025",
        corDocumentUrl: "pending",
      });
      if (!corRes?.isSuccess) {
        showAlert(
          "Document Upload Failed",
          corRes?.message || "Failed to initialize document submission.",
          "error",
        );
        setSubmittingDocs(false);
        return;
      }

      let corSubmissionId = (corRes.data as string) || "";
      if (!corSubmissionId) {
        const sub = await userService.getMyCorSubmission();
        corSubmissionId = sub?.data?.id || "";
      }

      if (corSubmissionId) {
        if (selectedFile) {
          await userService.uploadCorDocument(
            selectedFile.uri,
            selectedFile.name || `cor_${Date.now()}.jpg`,
            corSubmissionId,
          );
        }
        if (selectedOrcrFile) {
          await userService.uploadOrcrDocument(
            selectedOrcrFile.uri,
            selectedOrcrFile.name || `orcr_${Date.now()}.jpg`,
            corSubmissionId,
          );
        }
        if (selectedMotorFile) {
          await userService.uploadMotorPicture(
            selectedMotorFile.uri,
            selectedMotorFile.name || `motor_${Date.now()}.jpg`,
            corSubmissionId,
          );
        }
      }

      router.replace("/(auth)/pending");
    } catch (err: any) {
      showAlert("Error", err?.message || "Please try again.", "error");
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

          <Text className="text-light-text text-[17px] font-black text-center flex-1 mr-10">
            Duty Schedule
          </Text>
        </View>
      }
    >      <View className="flex-1 bg-light-background px-6 pt-4 pb-12">
        {subStep === "schedule" ? (
          <>
            <Text className="text-light-muted font-regular text-[13px] mb-4">
              Set your usual campus schedule for administrative verification.
            </Text>

            <View className="gap-2 bg-light-surface p-3 rounded-card border border-light-border/40 shadow-soft">
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
              Upload your identity and vehicle registration documents for administrative verification.
            </Text>

            {/* COR Upload */}
            <TouchableOpacity
              className="w-full border-2 border-dashed border-light-border bg-light-surface rounded-card p-5 items-center justify-center flex-row gap-3 active:bg-light-surfaceMuted mt-2 shadow-soft"
              onPress={handlePickFile}
              activeOpacity={0.7}
            >
              <UploadCloud size={20} color="#334155" strokeWidth={2.2} />
              <Text className="text-light-accent font-heavy text-[14px]">
                Upload COR or Employee ID
              </Text>
            </TouchableOpacity>

            {selectedFile && (
              <View className="w-full mt-2 bg-light-surface border border-light-border rounded-button p-3 flex-row items-center justify-between shadow-soft">
                <View className="flex-row items-center gap-2 flex-1 mr-2">
                  <FileText size={18} color="#D22730" strokeWidth={2} />
                  <Text
                    className="text-light-text font-book text-[13px] flex-1"
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
                  <X size={14} color="#71717A" strokeWidth={2.5} />
                </TouchableOpacity>
              </View>
            )}

            {/* OR/CR Upload */}
            <TouchableOpacity
              className="w-full border-2 border-dashed border-light-border bg-light-surface rounded-card p-5 items-center justify-center flex-row gap-3 active:bg-light-surfaceMuted mt-3 shadow-soft"
              onPress={handlePickOrcrFile}
              activeOpacity={0.7}
            >
              <UploadCloud size={20} color="#334155" strokeWidth={2.2} />
              <Text className="text-light-accent font-heavy text-[14px]">
                Upload OR / CR Document
              </Text>
            </TouchableOpacity>

            {selectedOrcrFile && (
              <View className="w-full mt-2 bg-light-surface border border-light-border rounded-button p-3 flex-row items-center justify-between shadow-soft">
                <View className="flex-row items-center gap-2 flex-1 mr-2">
                  <FileText size={18} color="#D22730" strokeWidth={2} />
                  <Text
                    className="text-light-text font-book text-[13px] flex-1"
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
                  <X size={14} color="#71717A" strokeWidth={2.5} />
                </TouchableOpacity>
              </View>
            )}

            {/* Picture of Motor Upload */}
            <TouchableOpacity
              className="w-full border-2 border-dashed border-light-border bg-light-surface rounded-card p-5 items-center justify-center flex-col gap-1 active:bg-light-surfaceMuted mt-3 shadow-soft"
              onPress={handlePickMotorFile}
              activeOpacity={0.7}
            >
              <View className="flex-row items-center gap-3">
                <UploadCloud size={20} color="#334155" strokeWidth={2.2} />
                <Text className="text-light-accent font-heavy text-[14px]">
                  Upload Picture of Motor
                </Text>
              </View>
              <Text className="text-light-muted font-regular text-[12px] text-center">
                Please send the picture with plate number
              </Text>
            </TouchableOpacity>

            {selectedMotorFile && (
              <View className="w-full mt-2 bg-light-surface border border-light-border rounded-button p-3 flex-row items-center justify-between shadow-soft">
                <View className="flex-row items-center gap-2 flex-1 mr-2">
                  <FileText size={18} color="#D22730" strokeWidth={2} />
                  <Text
                    className="text-light-text font-book text-[13px] flex-1"
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
                  <X size={14} color="#71717A" strokeWidth={2.5} />
                </TouchableOpacity>
              </View>
            )}

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
        <Animated.View
          style={[
            Platform.OS === "ios"
              ? { transform: [{ translateY: slideAnim }] }
              : {},
          ]}
          className="absolute bottom-0 left-0 right-0 bg-light-surface rounded-t-card px-5 pb-8 shadow-card border-t border-light-border z-50"
        >
          <View className="self-center w-9 h-1 rounded-pill bg-light-border mt-3 mb-2" />

          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-light-text text-[15px] font-heavy">
              {pickerLabel}
            </Text>
            <TouchableOpacity
              onPress={closePicker}
              className="px-3 py-1.5 rounded-button bg-light-surfaceMuted active:bg-light-border"
              activeOpacity={0.7}
            >
              <Text className="text-light-accent font-heavy text-xs">
                Cancel
              </Text>
            </TouchableOpacity>
          </View>

          <View className="items-center mb-5 bg-light-background rounded-card overflow-hidden">
            <DateTimePicker
              value={draftTime}
              mode="time"
              is24Hour={false}
              display={Platform.OS === "ios" ? "spinner" : "default"}
              minuteInterval={1}
              onChange={(e, date) => {
                if (Platform.OS === "android") handleAndroidChange(e, date);
                else if (date) setDraftTime(date);
              }}
            />
          </View>

          {Platform.OS === "ios" && (
            <TouchableOpacity
              onPress={confirmPicker}
              className="rounded-button bg-light-accent py-3.5 items-center justify-center active:opacity-90 shadow-soft"
              activeOpacity={0.8}
            >
              <Text className="text-light-textInverse font-heavy text-[15px]">
                Confirm Time Selection
              </Text>
            </TouchableOpacity>
          )}
        </Animated.View>
      )}
    </AuthLayout>
  );
}
