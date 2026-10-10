import SubScreenLayout from "@/components/layouts/SubScreenLayout";
import { router } from "expo-router";
import { ScrollView, View, Text, ActivityIndicator, KeyboardAvoidingView, Platform } from "react-native";
import { appDialog } from "@/services/app-dialog";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ShieldCheck, Clock, UserCheck } from "lucide-react-native";
import { useAppTheme } from "@/hooks/useAppTheme";
import { AppInput, AppSelect, AppButton } from "@/components/ui";
import { useEffect, useRef, useState, useCallback } from "react";
import { useAuthStore } from "@/features/auth/store/auth.store";
import { useApiMutation } from "@/hooks/useApiRequest";
import { parkingLogService } from "@/features/session/services/parking-log.service";
import { visitorService } from "@/features/session/services/visitor.service";
import type { VehicleLookupResponse } from "@/features/user/types/vehicle.types";
import { AlertModal } from "@/components/shared";
import { VEHICLE_TYPE_OPTIONS } from "@/constants/vehicleType";
import { useParkingSessionStore } from "@/features/session/store/parking-session.store";
import { formatTime } from "@/utils/formatTime";
import { getManualLookupError } from "@/utils/manualLookupError";

export default function ManualInput() {
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const { user } = useAuthStore();
  const { run: submitEntry, isLoading: isSubmittingEntry } = useApiMutation(parkingLogService.createManualEntry);
  const { run: submitVisitorEntry, isLoading: isSubmittingVisitorEntry } = useApiMutation(visitorService.createVisitorEntry);
  const { getParkingSessionStats, getActiveSession, setLastManualPass } = useParkingSessionStore();

  const [form, setForm] = useState({
    plateNumber: "",
    fullName: "",
    phoneNumber: "",
    vehicleType: "",
    brand: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const [alert, setAlert] = useState({
    visible: false,
    title: "",
    message: "",
    variant: "error" as "error" | "warning" | "success" | "info",
  });

  // Vehicle / Visitor lookup state
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [lookupResult, setLookupResult] = useState<VehicleLookupResponse | null>(null);
  const [hasCheckedPlate, setHasCheckedPlate] = useState(false);
  const lookupTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const lookupVersionRef = useRef(0);
  const submittingRef = useRef(false);

  const performLookup = useCallback(async (plateToLookup: string) => {
    const cleanPlate = plateToLookup.trim().toUpperCase();
    const version = ++lookupVersionRef.current;
    if (cleanPlate.length < 2) return;
    setIsLookingUp(true);
    setHasCheckedPlate(false);
    try {
      const response = await visitorService.lookupByPlate(cleanPlate);
      if (version !== lookupVersionRef.current) return;
      if (!response.isSuccess || !response.data) {
        throw new Error(response.message || "Could not check this plate. Please try again.");
      }
      setErrors(prev => { const next = { ...prev }; delete next.plateNumber; return next; });
      setLookupResult(response.data);
      setHasCheckedPlate(true);
      if (response.data.isVisitor) {
        setForm(prev => ({
          ...prev,
          fullName: response.data!.fullName || "",
          phoneNumber: response.data!.contactNumber || "",
          brand: response.data!.brand || "",
          vehicleType: response.data!.vehicleTypeValue?.toString() ?? "",
        }));
      }
    } catch (error: unknown) {
      if (version !== lookupVersionRef.current) return;
      setLookupResult(null);
      setErrors(prev => ({
        ...prev,
        plateNumber: getManualLookupError(error),
      }));
    } finally {
      if (version === lookupVersionRef.current) setIsLookingUp(false);
    }
  }, []);

  // Debounced plate lookup on text change
  useEffect(() => {
    if (lookupTimeoutRef.current) {
      clearTimeout(lookupTimeoutRef.current);
    }

    const cleanPlate = form.plateNumber.trim().toUpperCase();
    if (cleanPlate.length < 2) {
      setLookupResult(null);
      setHasCheckedPlate(false);
      setIsLookingUp(false);
      return;
    }

    setIsLookingUp(true);
    lookupTimeoutRef.current = setTimeout(() => {
      void performLookup(cleanPlate);
    }, 300);

    return () => {
      // This is a request sequence, not a mounted element reference.
      // eslint-disable-next-line react-hooks/exhaustive-deps
      ++lookupVersionRef.current;
      if (lookupTimeoutRef.current) {
        clearTimeout(lookupTimeoutRef.current);
      }
    };
  }, [form.plateNumber, performLookup]);

  const isRegisteredVehicle = !!(hasCheckedPlate && lookupResult && (lookupResult.lookupType === "Registered" || lookupResult.isRegistered));
  const isReturningVisitor = !!(hasCheckedPlate && lookupResult && !isRegisteredVehicle && (lookupResult.lookupType === "Visitor" || lookupResult.isVisitor));
  const isUnknownVehicle = !!(hasCheckedPlate && !isRegisteredVehicle && !isReturningVisitor);
  const isCurrentlyInside = !!(hasCheckedPlate && lookupResult?.isInside);
  const visitorEntryFee = lookupResult?.entryFee ?? 20;

  const clearFieldError = (field: string) => {
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  // 1. Process Registered Vehicle Entry
  const handleRegisteredEntry = async (acceptUnscheduledFee = false) => {
    if (isLookingUp || !isRegisteredVehicle || isActionLoading || submittingRef.current) return;
    if (!form.plateNumber.trim()) {
      setErrors({ plateNumber: "Plate number is required." });
      return;
    }
    if (!user?.id) {
      setAlert({
        visible: true,
        title: "Please sign in again",
        message: "Your session is unavailable. Sign in again to record this visit.",
        variant: "error",
      });
      return;
    }

    try {
      submittingRef.current = true;
      const payload = {
        acceptUnscheduledFee,
        plateNumber: form.plateNumber.trim().toUpperCase(),
        vehicleType: lookupResult?.vehicleTypeValue ?? 0,
        phoneNumber: form.phoneNumber.trim() || "N/A",
        brand: lookupResult?.brand || "Registered Vehicle",
        userId: user.id,
      };

      const response = await submitEntry(payload);
      if (response.isSuccess && response.data) {
        setLastManualPass(response.data);
        void getParkingSessionStats(true);
        void getActiveSession(true);

        const passQuery = new URLSearchParams();
        passQuery.set("passPayload", encodeURIComponent(JSON.stringify(response.data)));
        router.replace(`/(guard)/manual-pass?${passQuery.toString()}` as any);
      } else {
        if (offerFeeEntry(response)) return;
        setAlert({
          visible: true,
          title: "Entry not recorded",
          message: response.message || "Failed to record manual entry.",
          variant: "error",
        });
      }
    } catch (error: any) {
      if (offerFeeEntry(error?.response?.data)) return;
      setAlert({
        visible: true,
        title: "Unable to record entry",
        message: error?.response?.data?.message || error?.message || "An unexpected error occurred.",
        variant: "error",
      });
    } finally {
      submittingRef.current = false;
    }
  };

  const offerFeeEntry = (result: { data?: { feeOptionAvailable?: boolean; entryFee?: number } | null; message?: string } | undefined) => {
    if (!result?.data?.feeOptionAvailable) return false;
    const version = lookupVersionRef.current;
    appDialog.show(
      "Parking charge required",
      result.message || `Continue with a ₱${result.data.entryFee ?? 20} fee, payable on exit?`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Continue with fee", onPress: () => { if (version === lookupVersionRef.current) return handleRegisteredEntry(true); } },
      ],
    );
    return true;
  };

  // 2. Process Visitor Entry (First-time or Returning)
  const handleVisitorEntry = async () => {
    if (isLookingUp || !hasCheckedPlate || isRegisteredVehicle || isActionLoading || submittingRef.current) return;
    const newErrors: Record<string, string> = {};

    if (!form.plateNumber.trim()) {
      newErrors.plateNumber = "Plate number is required.";
    }

    const effectiveName = isReturningVisitor
      ? (form.fullName.trim() || lookupResult?.fullName || "Visitor")
      : (form.fullName.trim() || "Visitor");

    const effectiveBrand = isReturningVisitor
      ? (form.brand.trim() || lookupResult?.brand || "")
      : form.brand.trim();

    if (!effectiveBrand) {
      newErrors.brand = "Vehicle brand/model is required.";
    }

    const effectiveType = isReturningVisitor
      ? (form.vehicleType ? parseInt(form.vehicleType, 10) : (lookupResult?.vehicleTypeValue ?? 0))
      : (form.vehicleType ? parseInt(form.vehicleType, 10) : null);

    if (effectiveType === null) {
      newErrors.vehicleType = "Vehicle type is required.";
    }

    if (form.phoneNumber.trim()) {
      const cleanPhone = form.phoneNumber.trim();
      if (!/^\+?[0-9]{10,14}$/.test(cleanPhone)) {
        newErrors.phoneNumber = "Please enter a valid phone number.";
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    if (!user?.id) {
      setAlert({
        visible: true,
        title: "Please sign in again",
        message: "Your session is unavailable. Sign in again to record this visit.",
        variant: "error",
      });
      return;
    }

    try {
      submittingRef.current = true;
      const payload = {
        plateNumber: form.plateNumber.trim().toUpperCase(),
        fullName: effectiveName,
        contactNumber: form.phoneNumber.trim() || (lookupResult?.contactNumber ?? ""),
        vehicleType: effectiveType ?? 0,
        brand: effectiveBrand,
        purpose: "Campus Visit",
        destination: "BulSU Campus",
        guardUserId: user.id,
      };

      const response = await submitVisitorEntry(payload);
      if (response.isSuccess && response.data) {
        const passData = {
          plateNumber: response.data.plateNumber,
          brand: response.data.brand,
          vehicleType: response.data.vehicleType,
          firstName: response.data.fullName,
          lastName: "(Visitor)",
          role: "Visitor",
          status: "Inside",
          entryTime: response.data.entryTime,
          entryDate: new Date(response.data.entryTime).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
          maximumExitTime: "",
          entryFee: response.data.entryFee ?? visitorEntryFee,
          entryMethod: "Manual Visitor Entry",
          qrCodeHash: response.data.plateNumber,
        };

        setLastManualPass(passData as any);
        void getParkingSessionStats(true);
        void getActiveSession(true);

        const passQuery = new URLSearchParams();
        passQuery.set("passPayload", encodeURIComponent(JSON.stringify(passData)));
        router.replace(`/(guard)/manual-pass?${passQuery.toString()}` as any);
      } else {
        setAlert({
          visible: true,
          title: "Entry not recorded",
          message: response.message || "Failed to record visitor entry.",
          variant: "error",
        });
      }
    } catch (error: any) {
      setAlert({
        visible: true,
        title: error?.response?.status === 409 ? "Already on campus" : "Unable to record entry",
        message: error?.response?.data?.message || error?.message || "An unexpected error occurred.",
        variant: error?.response?.status === 409 ? "warning" : "error",
      });
    } finally {
      submittingRef.current = false;
    }
  };

  // All manual exits use the same result screen; charges remain recorded for settlement.
  const handleExit = () => {
    if (isActionLoading || isLookingUp) return;
    router.push({ pathname: "/(guard)/manual-exit", params: { plateNumber: form.plateNumber.trim().toUpperCase() } });
  };

  const isActionLoading =
    isSubmittingEntry ||
    isSubmittingVisitorEntry;

  const visitorFeeNotice = (
    <View className="mt-4 mb-4 rounded-xl bg-light-surfaceMuted dark:bg-dark-surfaceMuted p-4 gap-1">
      <View className="flex-row items-center justify-between gap-3">
        <Text className="text-sm font-book text-light-text dark:text-dark-text">Visitor parking fee</Text>
        <Text className="text-lg font-bold text-light-text dark:text-dark-text">₱{visitorEntryFee.toFixed(2)}</Text>
      </View>
      <Text className="text-sm font-regular text-light-muted dark:text-dark-muted">Parking fee applies to this visit. This is not a payment receipt.</Text>
    </View>
  );

  return (
    <SubScreenLayout title="Manual Entry" onBack={() => router.back()}>
      <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView
          className="flex-1 bg-light-background dark:bg-dark-background"
          contentContainerStyle={{ padding: 20, paddingBottom: Math.max(insets.bottom, 20) + 20, flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
        >
          <View className="w-full max-w-[560px] self-center">
            <Text className="text-2xl font-bold text-light-text dark:text-dark-text">Enter a plate number</Text>
            <Text className="mt-2 mb-6 text-base font-regular text-light-muted dark:text-dark-muted">
              Find a registered vehicle or a visitor, then record their entry.
            </Text>
            <AppInput
              label="Plate number"
              accessibilityLabel="Plate number"
              placeholder="e.g. ABC 1234"
              value={form.plateNumber}
              editable={!isActionLoading}
              onChangeText={(v) => {
                ++lookupVersionRef.current;
                setHasCheckedPlate(false);
                setLookupResult(null);
                setForm({ plateNumber: v, fullName: "", phoneNumber: "", vehicleType: "", brand: "" });
                clearFieldError("plateNumber");
              }}
              onSubmitEditing={() => {
                if (lookupTimeoutRef.current) clearTimeout(lookupTimeoutRef.current);
                void performLookup(form.plateNumber);
              }}
              autoCapitalize="characters"
              returnKeyType="search"
              error={errors.plateNumber}
            />
            {!isLookingUp && errors.plateNumber && form.plateNumber.trim().length >= 2 && (
              <AppButton label="Search again" variant="outline" uppercase={false} size="lg" className="mb-5"
                disabled={isActionLoading} onPress={() => {
                  clearFieldError("plateNumber");
                  void performLookup(form.plateNumber);
                }}
              />
            )}
            {isLookingUp ? (
              <View className="flex-row items-center gap-3 rounded-card border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface p-4" accessibilityLiveRegion="polite">
                <ActivityIndicator size="small" color={colors.primary} />
                <Text className="flex-1 text-sm font-book text-light-muted dark:text-dark-muted">
                  Searching vehicle and visitor records…
                </Text>
              </View>
            ) : !hasCheckedPlate && !errors.plateNumber ? (
              <Text className="text-sm font-regular text-light-muted dark:text-dark-muted">
                Records are checked as you type. Enter the complete plate number.
              </Text>
            ) : null}

            {(isRegisteredVehicle || isReturningVisitor) && !isLookingUp && (
              <View className="rounded-card border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface p-5">
                <View className="flex-row items-start gap-3">
                  <View className="h-10 w-10 rounded-xl bg-light-surfaceMuted dark:bg-dark-surfaceMuted items-center justify-center">
                    {isRegisteredVehicle
                      ? <ShieldCheck size={22} color={colors.primary} />
                      : <UserCheck size={22} color={colors.primary} />}
                  </View>
                  <View className="flex-1">
                    <Text className="text-lg font-bold text-light-text dark:text-dark-text">
                      {isRegisteredVehicle ? "Registered vehicle" : "Returning visitor"}
                    </Text>
                    <Text className="mt-1 text-sm leading-5 font-regular text-light-muted dark:text-dark-muted" accessibilityLiveRegion="polite">
                      {isCurrentlyInside
                        ? "This vehicle is already on campus. Record its exit below."
                        : isRegisteredVehicle
                          ? "Check the details below before recording entry."
                          : "Saved details found. No need to enter them again."}
                    </Text>
                  </View>
                </View>
                <View className="mt-5 pt-4 gap-4 border-t border-light-border dark:border-dark-border">
                  {[
                    { label: "Plate number", value: lookupResult?.plateNumber || form.plateNumber.trim().toUpperCase() },
                    { label: isRegisteredVehicle ? "Owner" : "Visitor", value: isRegisteredVehicle ? lookupResult?.ownerName || "Registered user" : lookupResult?.fullName || "Visitor" },
                    ...(isRegisteredVehicle ? [{ label: "Account type", value: lookupResult?.ownerRole || "Student" }] : []),
                    { label: "Vehicle", value: [lookupResult?.brand, lookupResult?.vehicleType].filter(Boolean).join(" • ") || "Not provided" },
                    ...(!isRegisteredVehicle && lookupResult?.contactNumber ? [{ label: "Contact number", value: lookupResult.contactNumber }] : []),
                  ].map(({ label, value }) => (
                    <View key={label}>
                      <Text className="text-sm font-regular text-light-muted dark:text-dark-muted">{label}</Text>
                      <Text selectable className="mt-1 text-base font-book text-light-text dark:text-dark-text">{value}</Text>
                    </View>
                  ))}
                </View>
                {isCurrentlyInside && (
                  <View className="mt-5 flex-row items-start gap-3 rounded-xl bg-light-surfaceMuted dark:bg-dark-surfaceMuted p-4">
                    <Clock size={20} color={colors.accent} />
                    <View className="flex-1">
                      <Text className="text-base font-book text-light-text dark:text-dark-text">Already on campus</Text>
                      <Text className="mt-1 text-sm font-regular text-light-muted dark:text-dark-muted">
                        {lookupResult?.entryTime ? `Entered at ${formatTime(lookupResult.entryTime)}` : "An active visit is recorded."}
                      </Text>
                    </View>
                  </View>
                )}
                {!isCurrentlyInside && isRegisteredVehicle && (
                  <Text className="mt-5 text-sm leading-5 font-regular text-light-muted dark:text-dark-muted">
                    Entry follows the account schedule. If a fee is required, you will be asked to confirm it.
                  </Text>
                )}
                {!isCurrentlyInside && isReturningVisitor && visitorFeeNotice}
                <AppButton
                  label={isCurrentlyInside ? "Record exit" : "Record entry"}
                  uppercase={false} size="lg" className="mt-5"
                  variant={isCurrentlyInside ? "outline" : "primary"}
                  onPress={isCurrentlyInside
                    ? handleExit
                    : isRegisteredVehicle ? () => void handleRegisteredEntry() : handleVisitorEntry}
                  loading={isActionLoading}
                  disabled={isActionLoading || isLookingUp}
                  accessibilityRole="button"
                  accessibilityLabel={isCurrentlyInside ? "Record exit for this vehicle" : "Record entry for this vehicle"}
                />
              </View>
            )}

            {isUnknownVehicle && !isLookingUp && (
              <View className="rounded-card border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface p-5">
                <Text className="text-lg font-bold text-light-text dark:text-dark-text">New visitor</Text>
                <Text className="mt-1 mb-5 text-sm leading-5 font-regular text-light-muted dark:text-dark-muted" accessibilityLiveRegion="polite">
                  No saved record for this plate. Add visitor details once; they will be available on their next visit.
                </Text>
                <AppInput
                  label="Visitor name (optional)" placeholder="e.g. Juan Dela Cruz" autoCapitalize="words"
                  value={form.fullName} editable={!isActionLoading}
                  onChangeText={(v) => {
                    setForm((prev) => ({ ...prev, fullName: v }));
                    clearFieldError("fullName");
                  }} error={errors.fullName}
                />
                <AppInput
                  label="Contact number (optional)" placeholder="e.g. 09171234567" keyboardType="phone-pad"
                  value={form.phoneNumber} editable={!isActionLoading}
                  onChangeText={(v) => {
                    setForm((prev) => ({ ...prev, phoneNumber: v }));
                    clearFieldError("phoneNumber");
                  }} error={errors.phoneNumber}
                />
                <AppSelect
                  label="Vehicle type" placeholder="Select vehicle type" options={VEHICLE_TYPE_OPTIONS}
                  value={form.vehicleType} onChange={(val) => {
                    if (isActionLoading) return;
                    setForm((prev) => ({ ...prev, vehicleType: val }));
                    clearFieldError("vehicleType");
                  }} error={errors.vehicleType}
                />
                <AppInput
                  label="Brand / model" placeholder="e.g. Toyota Vios, Honda Click"
                  value={form.brand} editable={!isActionLoading}
                  onChangeText={(v) => {
                    setForm((prev) => ({ ...prev, brand: v }));
                    clearFieldError("brand");
                  }} error={errors.brand}
                />
                {visitorFeeNotice}
                <AppButton
                  label="Save visitor & record entry" uppercase={false} onPress={handleVisitorEntry}
                  loading={isActionLoading} disabled={isActionLoading || isLookingUp}
                  size="lg" accessibilityRole="button"
                />
              </View>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
      <AlertModal
        visible={alert.visible}
        onClose={() => setAlert((prev) => ({ ...prev, visible: false }))}
        title={alert.title} message={alert.message} variant={alert.variant}
      />
    </SubScreenLayout>
  );
}
