import SubScreenLayout from "@/components/layouts/SubScreenLayout";
import { router } from "expo-router";
import { ScrollView, View, Text, ActivityIndicator } from "react-native";
import {
  Keyboard,
  CheckCircle,
  Car,
  User,
  ShieldCheck,
  AlertCircle,
  Clock,
  Phone,
  UserCheck,
} from "lucide-react-native";
import { useAppTheme } from "@/hooks/useAppTheme";
import { AppInput, AppSelect, AppButton } from "@/components/ui";
import { useEffect, useRef, useState, useCallback } from "react";
import { useAuthStore } from "@/features/auth/store/auth.store";
import { useApiMutation } from "@/hooks/useApiRequest";
import { parkingLogService } from "@/features/session/services/parking-log.service";
import { visitorService } from "@/features/session/services/visitor.service";
import { vehicleService } from "@/features/user/services/vehicle.service";
import type { VehicleLookupResponse } from "@/features/user/types/vehicle.types";
import { AlertModal } from "@/components/shared";
import { VEHICLE_TYPE_OPTIONS } from "@/constants/vehicleType";
import { useParkingSessionStore } from "@/features/session/store/parking-session.store";
import { formatTime } from "@/utils/formatTime";

export default function ManualInput() {
  const { colors, isDark } = useAppTheme();
  const { user } = useAuthStore();
  const { run: submitEntry, isLoading: isSubmittingEntry } = useApiMutation(parkingLogService.createManualEntry);
  const { run: submitVisitorEntry, isLoading: isSubmittingVisitorEntry } = useApiMutation(visitorService.createVisitorEntry);
  const { run: submitExit, isLoading: isSubmittingExit } = useApiMutation(parkingLogService.createManualExit);
  const { run: submitVisitorExit, isLoading: isSubmittingVisitorExit } = useApiMutation(visitorService.exitVisitor);
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

  const performLookup = useCallback(async (plateToLookup: string) => {
    const cleanPlate = plateToLookup.trim().toUpperCase();
    if (cleanPlate.length < 2) {
      setLookupResult(null);
      setHasCheckedPlate(false);
      setIsLookingUp(false);
      return;
    }

    setIsLookingUp(true);
    try {
      // 1. Try visitor service lookup (which hits /visitors/lookup or /vehicles/lookup)
      let response = await visitorService.lookupByPlate(cleanPlate);

      // Fallback: if visitors lookup failed, try vehicleService lookup
      if (!response?.isSuccess || !response?.data) {
        response = await vehicleService.lookupByPlate(cleanPlate);
      }

      if (response?.isSuccess && response.data) {
        setLookupResult(response.data);
        if (response.data.isVisitor) {
          setForm((prev) => ({
            ...prev,
            fullName: response.data.fullName || prev.fullName,
            phoneNumber: response.data.contactNumber || prev.phoneNumber,
            brand: response.data.brand || prev.brand,
            vehicleType: response.data.vehicleTypeValue !== undefined && response.data.vehicleTypeValue !== null
              ? response.data.vehicleTypeValue.toString()
              : prev.vehicleType,
          }));
        }
      } else {
        setLookupResult({
          lookupType: "Unknown",
          isRegistered: false,
          isVisitor: false,
          isInside: false,
          plateNumber: cleanPlate,
        });
      }
    } catch {
      try {
        const fallback = await vehicleService.lookupByPlate(cleanPlate);
        if (fallback?.isSuccess && fallback.data) {
          setLookupResult(fallback.data);
        } else {
          setLookupResult({
            lookupType: "Unknown",
            isRegistered: false,
            isVisitor: false,
            isInside: false,
            plateNumber: cleanPlate,
          });
        }
      } catch {
        setLookupResult({
          lookupType: "Unknown",
          isRegistered: false,
          isVisitor: false,
          isInside: false,
          plateNumber: cleanPlate,
        });
      }
    } finally {
      setIsLookingUp(false);
      setHasCheckedPlate(true);
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
      if (lookupTimeoutRef.current) {
        clearTimeout(lookupTimeoutRef.current);
      }
    };
  }, [form.plateNumber, performLookup]);

  const isRegisteredVehicle = !!(hasCheckedPlate && lookupResult && (lookupResult.lookupType === "Registered" || lookupResult.isRegistered));
  const isReturningVisitor = !!(hasCheckedPlate && lookupResult && !isRegisteredVehicle && (lookupResult.lookupType === "Visitor" || lookupResult.isVisitor));
  const isUnknownVehicle = !!(hasCheckedPlate && !isRegisteredVehicle && !isReturningVisitor);
  const isCurrentlyInside = !!(hasCheckedPlate && lookupResult?.isInside);

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
  const handleRegisteredEntry = async () => {
    if (!form.plateNumber.trim()) {
      setErrors({ plateNumber: "Plate number is required." });
      return;
    }
    if (!user?.id) {
      setAlert({
        visible: true,
        title: "Session Error",
        message: "Guard user session not found. Please log in again.",
        variant: "error",
      });
      return;
    }

    try {
      const payload = {
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
        setAlert({
          visible: true,
          title: "Entry Failed",
          message: response.message || "Failed to record manual entry.",
          variant: "error",
        });
      }
    } catch (error: any) {
      setAlert({
        visible: true,
        title: "Request Failed",
        message: error?.response?.data?.message || error?.message || "An unexpected error occurred.",
        variant: "error",
      });
    }
  };

  // 2. Process Visitor Entry (First-time or Returning)
  const handleVisitorEntry = async () => {
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
        title: "Session Error",
        message: "Guard user session not found. Please log in again.",
        variant: "error",
      });
      return;
    }

    try {
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
          maximumExitTime: "10:00 PM",
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
          title: "Visitor Entry Failed",
          message: response.message || "Failed to record visitor entry.",
          variant: "error",
        });
      }
    } catch (error: any) {
      setAlert({
        visible: true,
        title: error?.response?.status === 409 ? "Already Inside" : "Request Failed",
        message: error?.response?.data?.message || error?.message || "An unexpected error occurred.",
        variant: error?.response?.status === 409 ? "warning" : "error",
      });
    }
  };

  // 3. Process Exit for Visitor Currently Inside
  const handleVisitorExit = async () => {
    if (!form.plateNumber.trim()) {
      setErrors({ plateNumber: "Plate number is required." });
      return;
    }

    try {
      const response = await submitVisitorExit({
        plateNumber: form.plateNumber.trim().toUpperCase(),
        guardUserId: user?.id || null,
      });

      if (response.isSuccess && response.data) {
        void getParkingSessionStats(true);
        void getActiveSession(true);
        setAlert({
          visible: true,
          title: "Visitor Exit Recorded",
          message: `Visitor ${response.data.fullName} (${response.data.plateNumber}) has exited campus successfully at ${formatTime(response.data.exitTime)}.`,
          variant: "success",
        });
        setForm({
          plateNumber: "",
          fullName: "",
          phoneNumber: "",
          vehicleType: "",
          brand: "",
        });
        setLookupResult(null);
        setHasCheckedPlate(false);
      } else {
        setAlert({
          visible: true,
          title: "Exit Failed",
          message: response.message || "Failed to record visitor exit.",
          variant: "error",
        });
      }
    } catch (error: any) {
      setAlert({
        visible: true,
        title: "Exit Failed",
        message: error?.response?.data?.message || error?.message || "An unexpected error occurred.",
        variant: "error",
      });
    }
  };

  // 4. Process Exit for Registered Vehicle Currently Inside
  const handleRegisteredExit = async () => {
    if (!form.plateNumber.trim()) {
      setErrors({ plateNumber: "Plate number is required." });
      return;
    }

    try {
      const response = await submitExit({
        plateNumber: form.plateNumber.trim().toUpperCase(),
        userId: user?.id || "",
      });

      if (response.isSuccess && response.data) {
        void getParkingSessionStats(true);
        void getActiveSession(true);
        setAlert({
          visible: true,
          title: "Exit Recorded",
          message: `Vehicle ${response.data.plateNumber} (${response.data.firstName} ${response.data.lastName}) has exited campus successfully at ${formatTime(response.data.exitTime)}.`,
          variant: "success",
        });
        setForm({
          plateNumber: "",
          fullName: "",
          phoneNumber: "",
          vehicleType: "",
          brand: "",
        });
        setLookupResult(null);
        setHasCheckedPlate(false);
      } else {
        setAlert({
          visible: true,
          title: "Exit Failed",
          message: response.message || "Failed to record vehicle exit.",
          variant: "error",
        });
      }
    } catch (error: any) {
      setAlert({
        visible: true,
        title: "Exit Failed",
        message: error?.response?.data?.message || error?.message || "An unexpected error occurred.",
        variant: "error",
      });
    }
  };

  const isActionLoading =
    isSubmittingEntry ||
    isSubmittingVisitorEntry ||
    isSubmittingExit ||
    isSubmittingVisitorExit;

  return (
    <SubScreenLayout title="Manual Entry" onBack={() => router.back()}>
      <ScrollView
        className="flex-1 bg-light-background dark:bg-dark-background"
        contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 24 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View className="items-center mb-6">
          <View className="w-16 h-16 rounded-[22px] bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border items-center justify-center shadow-soft mb-4">
            <Keyboard size={32} color={colors.primary} strokeWidth={2} />
          </View>
          <Text className="text-light-text dark:text-dark-text font-bold text-[22px] leading-8 text-center tracking-tight">
            Manual Parking Entry
          </Text>
          <Text className="text-light-muted dark:text-dark-muted font-regular text-[13px] leading-[20px] text-center max-w-[300px] mt-1">
            Search vehicle plate number to process registered vehicles, returning visitors, or new visitor registration.
          </Text>
        </View>

        <View className="gap-3">
          {/* Plate Number Input */}
          <View>
            <AppInput
              label="Plate Number"
              placeholder="e.g. ABC 1234 / NDL 1406"
              value={form.plateNumber}
              onChangeText={(v) => {
                setForm((prev) => ({ ...prev, plateNumber: v }));
                clearFieldError("plateNumber");
              }}
              onSubmitEditing={() => {
                void performLookup(form.plateNumber);
              }}
              autoCapitalize="characters"
              returnKeyType="search"
              error={errors.plateNumber}
            />

            {/* Live Search Status Indicator */}
            {isLookingUp && (
              <View className="flex-row items-center gap-2 mt-1.5 px-1">
                <ActivityIndicator size="small" color={colors.accent} />
                <Text className="text-[12px] text-light-muted dark:text-dark-muted font-medium">
                  Checking vehicle & visitor records...
                </Text>
              </View>
            )}
          </View>

          {/* ========================================================================= */}
          {/* CASE 1: REGISTERED BULSU VEHICLE                                         */}
          {/* ========================================================================= */}
          {isRegisteredVehicle && (
            <View className="bg-light-surface dark:bg-dark-surface border border-emerald-500/30 rounded-[18px] p-4 shadow-sm my-1">
              <View className="flex-row items-center justify-between pb-3 border-b border-light-border dark:border-dark-border">
                <View className="flex-row items-center gap-2">
                  <View className="w-7 h-7 rounded-full bg-emerald-500/15 items-center justify-center">
                    <ShieldCheck size={16} color="#10B981" strokeWidth={2.2} />
                  </View>
                  <Text className="text-emerald-600 dark:text-emerald-400 font-bold text-[14px]">
                    Registered BulSU Vehicle
                  </Text>
                </View>
                <View className="bg-emerald-500/10 px-2.5 py-0.5 rounded-full">
                  <Text className="text-emerald-600 dark:text-emerald-400 text-[11px] font-bold">
                    {lookupResult?.ownerRole || "Student"}
                  </Text>
                </View>
              </View>

              <View className="pt-3 gap-2">
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center gap-2">
                    <User size={15} color={colors.muted} strokeWidth={1.8} />
                    <Text className="text-[13px] text-light-muted dark:text-dark-muted font-medium">
                      Owner Name
                    </Text>
                  </View>
                  <Text className="text-[13px] font-bold text-light-text dark:text-dark-text">
                    {lookupResult?.ownerName || "Registered User"}
                  </Text>
                </View>

                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center gap-2">
                    <Car size={15} color={colors.muted} strokeWidth={1.8} />
                    <Text className="text-[13px] text-light-muted dark:text-dark-muted font-medium">
                      Vehicle & Model
                    </Text>
                  </View>
                  <Text className="text-[13px] font-semibold text-light-text dark:text-dark-text">
                    {lookupResult?.brand || "Vehicle"} • {lookupResult?.vehicleType || "Car"}
                  </Text>
                </View>

                {/* If Currently Inside */}
                {isCurrentlyInside ? (
                  <View className="mt-2 bg-amber-500/10 p-3 rounded-xl gap-2">
                    <View className="flex-row items-center gap-2">
                      <Clock size={15} color="#F59E0B" strokeWidth={2} />
                      <Text className="text-[12px] font-bold text-amber-700 dark:text-amber-300">
                        Currently Parked Inside (Entered: {formatTime(lookupResult?.entryTime || "")})
                      </Text>
                    </View>
                    <AppButton
                      label="Process Exit for Registered Vehicle"
                      variant="outline"
                      onPress={handleRegisteredExit}
                      loading={isActionLoading}
                      disabled={isActionLoading}
                      size="md"
                    />
                  </View>
                ) : (
                  <View className="mt-2">
                    <AppButton
                      label="Confirm & Log Entry"
                      onPress={handleRegisteredEntry}
                      loading={isActionLoading}
                      disabled={isActionLoading}
                      size="lg"
                    />
                  </View>
                )}
              </View>
            </View>
          )}

          {/* ========================================================================= */}
          {/* CASE 2: RETURNING VISITOR                                                */}
          {/* ========================================================================= */}
          {isReturningVisitor && (
            <View className="bg-light-surface dark:bg-dark-surface border border-amber-500/30 rounded-[18px] p-4 shadow-sm my-1">
              <View className="flex-row items-center justify-between pb-3 border-b border-light-border dark:border-dark-border">
                <View className="flex-row items-center gap-2">
                  <View className="w-7 h-7 rounded-full bg-amber-500/15 items-center justify-center">
                    <UserCheck size={16} color="#F59E0B" strokeWidth={2.2} />
                  </View>
                  <Text className="text-amber-700 dark:text-amber-300 font-bold text-[14px]">
                    Returning Visitor
                  </Text>
                </View>
                <View className="bg-amber-500/15 px-2.5 py-0.5 rounded-full">
                  <Text className="text-amber-800 dark:text-amber-200 text-[11px] font-bold">
                    {isCurrentlyInside ? "Currently Inside" : "Saved Visitor"}
                  </Text>
                </View>
              </View>

              <View className="pt-3 gap-2.5">
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center gap-2">
                    <User size={15} color={colors.muted} strokeWidth={1.8} />
                    <Text className="text-[13px] text-light-muted dark:text-dark-muted font-medium">
                      Visitor Name
                    </Text>
                  </View>
                  <Text className="text-[13px] font-bold text-light-text dark:text-dark-text">
                    {lookupResult?.fullName || "Visitor"}
                  </Text>
                </View>

                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center gap-2">
                    <Car size={15} color={colors.muted} strokeWidth={1.8} />
                    <Text className="text-[13px] text-light-muted dark:text-dark-muted font-medium">
                      Vehicle & Model
                    </Text>
                  </View>
                  <Text className="text-[13px] font-semibold text-light-text dark:text-dark-text">
                    {lookupResult?.brand} • {lookupResult?.vehicleType || "Car"}
                  </Text>
                </View>

                {lookupResult?.contactNumber ? (
                  <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center gap-2">
                      <Phone size={15} color={colors.muted} strokeWidth={1.8} />
                      <Text className="text-[13px] text-light-muted dark:text-dark-muted font-medium">
                        Contact Number
                      </Text>
                    </View>
                    <Text className="text-[13px] font-semibold text-light-text dark:text-dark-text">
                      {lookupResult.contactNumber}
                    </Text>
                  </View>
                ) : null}

                {/* IF VISITOR IS CURRENTLY INSIDE -> SHOW EXIT ACTION */}
                {isCurrentlyInside ? (
                  <View className="mt-2 bg-rose-500/10 dark:bg-rose-500/15 border border-rose-500/30 rounded-xl p-3.5 gap-2.5">
                    <View className="flex-row items-center gap-2">
                      <Clock size={16} color="#E11D48" strokeWidth={2} />
                      <Text className="text-[13px] font-bold text-rose-700 dark:text-rose-300">
                        VISITOR CURRENTLY INSIDE
                      </Text>
                    </View>
                    <Text className="text-[12px] text-rose-600 dark:text-rose-200">
                      Entered at {formatTime(lookupResult?.entryTime || "")}
                    </Text>
                    <View className="mt-1">
                      <AppButton
                        label="EXIT VISITOR"
                        variant="primary"
                        onPress={handleVisitorExit}
                        loading={isActionLoading}
                        disabled={isActionLoading}
                        size="md"
                      />
                    </View>
                  </View>
                ) : (
                  /* IF VISITOR IS OUTSIDE -> ONE TAP ENTER VISITOR */
                  <View className="mt-2">
                    <AppButton
                      label="ENTER VISITOR"
                      onPress={handleVisitorEntry}
                      loading={isActionLoading}
                      disabled={isActionLoading}
                      size="lg"
                    />
                  </View>
                )}
              </View>
            </View>
          )}

          {/* ========================================================================= */}
          {/* CASE 3: UNKNOWN / FIRST-TIME VISITOR                                     */}
          {/* ========================================================================= */}
          {isUnknownVehicle && (
            <View className="gap-3 pt-1">
              <View className="bg-sky-500/10 dark:bg-sky-500/15 border border-sky-500/30 rounded-xl p-3 flex-row items-center gap-2">
                <AlertCircle size={18} color="#0284C7" strokeWidth={2} />
                <Text className="text-[12px] font-medium text-sky-800 dark:text-sky-200 flex-1">
                  Unregistered vehicle. Please enter vehicle information to register visitor.
                </Text>
              </View>

              <AppInput
                label="Visitor Name (Optional)"
                placeholder="e.g. Juan Dela Cruz (or leave blank)"
                value={form.fullName}
                onChangeText={(v) => {
                  setForm((prev) => ({ ...prev, fullName: v }));
                  clearFieldError("fullName");
                }}
                error={errors.fullName}
              />

              <AppInput
                label="Contact Number (Optional)"
                placeholder="e.g. 09171234567"
                keyboardType="phone-pad"
                value={form.phoneNumber}
                onChangeText={(v) => {
                  setForm((prev) => ({ ...prev, phoneNumber: v }));
                  clearFieldError("phoneNumber");
                }}
                error={errors.phoneNumber}
              />

              <AppSelect
                label="Vehicle Type"
                placeholder="Select vehicle type"
                options={VEHICLE_TYPE_OPTIONS}
                value={form.vehicleType}
                onChange={(val) => {
                  setForm((prev) => ({ ...prev, vehicleType: val }));
                  clearFieldError("vehicleType");
                }}
                error={errors.vehicleType}
              />

              <AppInput
                label="Brand / Model"
                placeholder="e.g. Toyota Vios, Honda Click"
                value={form.brand}
                onChangeText={(v) => {
                  setForm((prev) => ({ ...prev, brand: v }));
                  clearFieldError("brand");
                }}
                error={errors.brand}
              />

              <View className="mt-3 mb-8">
                <AppButton
                  label="REGISTER & ENTER VISITOR"
                  onPress={handleVisitorEntry}
                  loading={isActionLoading}
                  disabled={isActionLoading || isLookingUp}
                  size="lg"
                />
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      <AlertModal
        visible={alert.visible}
        onClose={() => setAlert((prev) => ({ ...prev, visible: false }))}
        title={alert.title}
        message={alert.message}
        variant={alert.variant}
      />
    </SubScreenLayout>
  );
}
