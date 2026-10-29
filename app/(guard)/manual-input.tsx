import DocumentPreviewButton from '@/features/auth/components/DocumentPreviewButton';
import RegistrationDocumentField from '@/features/auth/components/RegistrationDocumentField';
import DriverVehiclePreview from '@/features/qr/components/DriverVehiclePreview';
import { pickDriverDocument } from '@/utils/pickDriverDocument';
import type { DocumentPickerAsset } from 'expo-document-picker';
import SubScreenLayout from "@/components/layouts/SubScreenLayout";
import { router } from "expo-router";
import { ScrollView, View, Text, ActivityIndicator, Keyboard, KeyboardAvoidingView, Platform, Switch } from "react-native";
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
import type { VehicleLookupResponse, VisitorEntryRequest } from "@/features/user/types/vehicle.types";
import { AlertModal } from "@/components/shared";
import { VEHICLE_TYPE_OPTIONS, getVehicleTypeLabel } from "@/constants/vehicleType";
import { useParkingSessionStore } from "@/features/session/store/parking-session.store";
import { formatTime } from "@/utils/formatTime";
import { getManualLookupError } from "@/utils/manualLookupError";
import { useActionConfirmation } from "@/hooks/useActionConfirmation";

export default function ManualInput() {
  const confirmAction = useActionConfirmation();
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

  const [driverFiles, setDriverFiles] = useState<{ license: DocumentPickerAsset | null; profilePhoto: DocumentPickerAsset | null; vehiclePhoto: DocumentPickerAsset | null }>({ license: null, profilePhoto: null, vehiclePhoto: null });
  const [licenseVerified, setLicenseVerified] = useState(false);
  const pickVisitorFile = async (kind: keyof typeof driverFiles) => {
    try {
      const file = await pickDriverDocument(kind !== 'license');
      if (file) { setDriverFiles(previous => ({ ...previous, [kind]: file })); setLicenseVerified(false); }
    } catch (e) { setErrors(previous => ({ ...previous, documents: e instanceof Error ? e.message : 'Could not select document.' })); }
  };
  useEffect(() => {
    setDriverFiles({ license: null, profilePhoto: null, vehiclePhoto: null }); setLicenseVerified(false);
    setSelectedVisitor(null); setIdentityPlate('');
  }, [form.plateNumber]);
  const [identityPlate, setIdentityPlate] = useState('');
  const [selectedVisitor, setSelectedVisitor] = useState<VehicleLookupResponse | null>(null);
  const [confirmingIdentity, setConfirmingIdentity] = useState(false);
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
  const visitorReviewOpenRef = useRef(false);
  const isActionLoading = isSubmittingEntry || isSubmittingVisitorEntry || confirmingIdentity;

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
      if (response.data.isVisitor && response.data.identityConfirmed) {
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


  const documentIdentity = isReturningVisitor ? lookupResult : selectedVisitor;
  const confirmVisitorIdentity = async (additionalVehicle: boolean) => {
    if (confirmingIdentity || isActionLoading) return;
    const version = lookupVersionRef.current;
    const plate = additionalVehicle ? identityPlate : form.plateNumber;
    if (plate.trim().length < 2) { setErrors(p => ({ ...p, identity: 'Enter the plate of an existing visitor vehicle.' })); return; }
    setConfirmingIdentity(true);
    try {
      const result = await visitorService.confirmLookupByPlate(plate);
      if (version !== lookupVersionRef.current) return;
      if (!result.isSuccess || !result.data?.isVisitor || !result.data.visitorId || !result.data.identityConfirmed)
        throw new Error(result.message || 'No saved visitor vehicle was found.');
      const saved = result.data;
      const accept = () => {
        if (version !== lookupVersionRef.current) return;
        if (additionalVehicle) {
          setSelectedVisitor({ ...saved, vehiclePictureUrl: null });
          setDriverFiles(previous => ({ ...previous, license: null, profilePhoto: null }));
        }
        else setLookupResult(saved);
        setForm(p => ({ ...p, fullName: saved.fullName || '', phoneNumber: saved.contactNumber || '',
          ...(additionalVehicle ? {} : { brand: saved.brand || '', vehicleType: saved.vehicleTypeValue?.toString() ?? '' }) }));
        setLicenseVerified(false);
        setErrors(p => { const next = { ...p }; delete next.identity; return next; });
      };
      if (additionalVehicle) appDialog.show('Confirm existing visitor',
        `Visitor: ${saved.fullName || 'Visitor'}\nExisting vehicle: ${saved.plateNumber}\nCheck this person's license before associating the new plate ${form.plateNumber}.`,
        [{ text: 'Cancel', style: 'cancel' }, { text: 'Use this visitor', onPress: accept }], { variant: 'confirmation' });
      else accept();
    } catch (e: any) {
      if (version === lookupVersionRef.current) setErrors(p => ({ ...p, identity: e?.response?.data?.message || e?.message || 'Could not retrieve visitor details.' }));
    } finally { setConfirmingIdentity(false); }
  };

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
        appDialog.show("Entry not recorded", response.message || "Failed to record manual entry.", undefined, { variant: "error" });
      }
    } catch (error: any) {
      appDialog.show("Unable to record entry", error?.response?.data?.message || error?.message || "An unexpected error occurred.", undefined, { variant: "error" });
    } finally {
      submittingRef.current = false;
    }
  };

  const reviewRegisteredEntry = () => {
    if (isLookingUp || !isRegisteredVehicle || isCurrentlyInside || isActionLoading || submittingRef.current) return;
    const version = lookupVersionRef.current;
    Keyboard.dismiss();
    confirmAction("Confirm vehicle entry", [
      "Check the matched account and vehicle before recording entry.",
      "",
      `Plate number: ${form.plateNumber.trim().toUpperCase()}`,
      `Name: ${lookupResult?.ownerName || "Registered driver"}`,
      `Vehicle: ${lookupResult?.brand || "Registered vehicle"}`,
      `Vehicle type: ${getVehicleTypeLabel(lookupResult?.vehicleTypeValue ?? 0)}`,
      "",
      "ParkFlow will check account, vehicle and parking eligibility.",
    ].join("\n"), async () => {
      if (version !== lookupVersionRef.current) {
        appDialog.show("Search again", "The plate details have changed. Search the plate again before recording entry.");
        return;
      }
      await handleRegisteredEntry();
    }, { confirmLabel: "Confirm entry" });
  };

  // 2. Process Visitor Entry (First-time or Returning)
  const handleVisitorEntry = () => {
    if (isLookingUp || !hasCheckedPlate || isRegisteredVehicle || isCurrentlyInside || isActionLoading || submittingRef.current || visitorReviewOpenRef.current) return;
    const newErrors: Record<string, string> = {};
    if (isReturningVisitor && !lookupResult?.identityConfirmed) { setErrors({ identity: 'Review the saved visitor details first.' }); return; }

    if (!form.plateNumber.trim()) {
      newErrors.plateNumber = "Plate number is required.";
    }

    const effectiveName = (isReturningVisitor ? lookupResult?.fullName : selectedVisitor?.fullName || form.fullName)?.trim() || "";
    if (!effectiveName) newErrors.fullName = "Visitor name is required.";

    const effectiveBrand = isReturningVisitor
      ? (lookupResult?.brand || "")
      : form.brand.trim();

    if (!effectiveBrand) {
      newErrors.brand = "Vehicle brand/model is required.";
    }

    const effectiveType = isReturningVisitor
      ? (lookupResult?.vehicleTypeValue ?? 0)
      : (form.vehicleType ? parseInt(form.vehicleType, 10) : null);

    if (effectiveType === null) {
      newErrors.vehicleType = "Vehicle type is required.";
    }

    const effectivePhone = form.phoneNumber.trim();
    if (!/^09[0-9]{9}$/.test(effectivePhone)) newErrors.phoneNumber = 'Enter an 11-digit phone number starting with 09.';
    if ((!driverFiles.license && !documentIdentity?.driversLicenseUrl) || (!driverFiles.profilePhoto && !documentIdentity?.profilePictureUrl) || (!driverFiles.vehiclePhoto && !documentIdentity?.vehiclePictureUrl))
      newErrors.documents = 'Upload the driver’s license, face photo and vehicle photo before entry.';
    if (!licenseVerified) newErrors.documents = 'Check the driver’s valid license at the gate and confirm it below.';

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

    const payload: VisitorEntryRequest = {
      plateNumber: form.plateNumber.trim().toUpperCase(),
      fullName: effectiveName,
      contactNumber: effectivePhone,
      ...driverFiles, licenseVerified,
      existingVisitorId: documentIdentity?.visitorId || undefined,
      identityConfirmed: !!documentIdentity?.identityConfirmed,
      vehicleType: effectiveType ?? 0,
      brand: effectiveBrand,
      purpose: "Campus Visit",
      destination: "BulSU Campus",
      guardUserId: user.id,
    };
    const version = lookupVersionRef.current;
    visitorReviewOpenRef.current = true;
    Keyboard.dismiss();
    appDialog.show(
      isReturningVisitor ? "Confirm visitor re-entry" : "Confirm visitor entry",
      [
        "Check these details before recording entry.",
        "",
        `Plate number: ${payload.plateNumber}`,
        `Visitor name: ${payload.fullName}`,
        `Contact number: ${payload.contactNumber || "Not provided"}`,
        `Vehicle type: ${getVehicleTypeLabel(payload.vehicleType)}`,
        `Brand / model: ${payload.brand}`,
        "",
      ].join("\n"),
      [
        { text: "Cancel", style: "cancel", onPress: () => { visitorReviewOpenRef.current = false; } },
        { text: isReturningVisitor ? "Confirm re-entry" : "Confirm entry", onPress: async () => {
          try {
            if (version !== lookupVersionRef.current) {
              appDialog.show("Search again", "The plate details have changed. Search the plate again before recording entry.");
              return;
            }
            await submitConfirmedVisitorEntry(payload);
          } finally {
            visitorReviewOpenRef.current = false;
          }
        } },
      ],
      { variant: "confirmation", icon: <UserCheck size={28} color={colors.primary} />,
        onDismiss: () => { visitorReviewOpenRef.current = false; } },
    );
  };

  async function submitConfirmedVisitorEntry(payload: VisitorEntryRequest) {
    if (submittingRef.current) return;
    try {
      submittingRef.current = true;

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
        appDialog.show("Entry not recorded", response.message || "Failed to record visitor entry.",
          undefined, { variant: "error" });
      }
    } catch (error: any) {
      appDialog.show(error?.response?.status === 409 ? "Already on campus" : "Unable to record entry",
        error?.response?.data?.message || error?.message || "An unexpected error occurred.",
        undefined, { variant: error?.response?.status === 409 ? "warning" : "error" });
    } finally {
      submittingRef.current = false;
    }
  }

  // All manual exits use the same result screen.
  const handleExit = () => {
    if (isActionLoading || isLookingUp) return;
    router.push({ pathname: "/(guard)/manual-exit", params: { plateNumber: form.plateNumber.trim().toUpperCase() } });
  };

  const visitorDocuments = <View className="mt-4 gap-3">
    <DriverVehiclePreview fullName={form.fullName || lookupResult?.fullName} plateNumber={form.plateNumber} brand={form.brand || lookupResult?.brand}
      vehicleType={lookupResult?.vehicleType || getVehicleTypeLabel(form.vehicleType)} profilePictureUrl={driverFiles.profilePhoto?.uri || documentIdentity?.profilePictureUrl}
      vehiclePictureUrl={driverFiles.vehiclePhoto?.uri || documentIdentity?.vehiclePictureUrl} />
    {!!documentIdentity?.driversLicenseUrl && <DocumentPreviewButton label="View saved license" url={documentIdentity.driversLicenseUrl} />}
    <RegistrationDocumentField label="driver’s license" helperText={documentIdentity?.driversLicenseUrl ? 'License on file. Check the current driver’s valid license before re-entry; replace if the driver or license changed.' : 'Valid license - PDF, JPG or PNG, up to 5MB'}
      file={driverFiles.license} onPick={() => pickVisitorFile('license')} onRemove={() => { setDriverFiles(p => ({ ...p, license: null })); setLicenseVerified(false); }} disabled={isActionLoading} />
    <RegistrationDocumentField label="driver photo" helperText="Clear face photo - Image, up to 5MB" file={driverFiles.profilePhoto}
      onPick={() => pickVisitorFile('profilePhoto')} onRemove={() => setDriverFiles(p => ({ ...p, profilePhoto: null }))} disabled={isActionLoading} />
    <RegistrationDocumentField label="vehicle photo" helperText="Show the plate number - Image, up to 5MB" file={driverFiles.vehiclePhoto}
      onPick={() => pickVisitorFile('vehiclePhoto')} onRemove={() => setDriverFiles(p => ({ ...p, vehiclePhoto: null }))} disabled={isActionLoading} />
    <View className="flex-row items-center gap-3">
      <Switch value={licenseVerified} onValueChange={setLicenseVerified} disabled={isActionLoading} accessibilityLabel="I checked the driver’s valid license at the gate" />
      <Text className="flex-1 text-sm text-light-text dark:text-dark-text">I checked the driver’s valid license and matched it to this driver.</Text>
    </View>
    {!!errors.documents && <Text accessibilityRole="alert" className="text-light-danger dark:text-dark-danger">{errors.documents}</Text>}
  </View>;


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
                          : "Saved details found. No need to enter them again. Review them before confirming re-entry."}
                    </Text>
                  </View>
                </View>
                {isReturningVisitor && !lookupResult?.identityConfirmed && <AppButton label="Review saved visitor" uppercase={false}
                  variant="outline" onPress={() => confirmVisitorIdentity(false)} loading={confirmingIdentity} />}
                {!!errors.identity && <Text accessibilityRole="alert" className="text-light-danger dark:text-dark-danger">{errors.identity}</Text>}
                <View className="mt-5 pt-4 gap-4 border-t border-light-border dark:border-dark-border">
                  {isReturningVisitor ? [
                    { label: "Visitor plate number", value: lookupResult?.plateNumber || form.plateNumber.trim().toUpperCase() },
                    { label: "Visitor name", value: lookupResult?.fullName || "Visitor" },
                    ...(isCurrentlyInside ? [{ label: "Contact number", value: lookupResult?.contactNumber || "Not provided" }] : []),
                    { label: "Vehicle type", value: lookupResult?.vehicleType || getVehicleTypeLabel(lookupResult?.vehicleTypeValue) },
                    { label: "Brand / model", value: lookupResult?.brand || "Not provided" },
                  ].map(({ label, value }) => (
                    <AppInput key={label} label={label} value={value} editable={false}
                      accessibilityLabel={`${label}: ${value}`} accessibilityState={{ disabled: true }}
                      className="bg-light-surfaceMuted dark:bg-dark-surfaceMuted" />
                  )) : [
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
                    Entry follows account, document and schedule eligibility checks.
                  </Text>
                )}
                {isRegisteredVehicle && <DriverVehiclePreview fullName={lookupResult?.ownerName} profilePictureUrl={lookupResult?.profilePictureUrl}
                  vehiclePictureUrl={lookupResult?.vehiclePictureUrl} plateNumber={lookupResult?.plateNumber} brand={lookupResult?.brand} vehicleType={lookupResult?.vehicleType} />}
                {!isCurrentlyInside && isReturningVisitor && <>
                  <AppInput label="Contact number" placeholder="09171234567" keyboardType="phone-pad" value={form.phoneNumber} editable={!isActionLoading}
                    onChangeText={phoneNumber => setForm(p => ({ ...p, phoneNumber }))} error={errors.phoneNumber} />
                  {visitorDocuments}
                </>}
                <AppButton
                  label={isCurrentlyInside ? "Record exit" : isReturningVisitor ? "Review re-entry" : "Review entry"}
                  uppercase={false} size="lg" className="mt-5"
                  variant={isCurrentlyInside ? "outline" : "primary"}
                  onPress={isCurrentlyInside
                    ? handleExit
                    : isRegisteredVehicle ? reviewRegisteredEntry : handleVisitorEntry}
                  loading={isActionLoading}
                  disabled={isActionLoading || isLookingUp}
                  accessibilityRole="button"
                  accessibilityLabel={isCurrentlyInside ? "Record exit for this vehicle" : isReturningVisitor ? "Review visitor re-entry details" : "Review vehicle entry details"}
                />
              </View>
            )}

            {isUnknownVehicle && !isLookingUp && (
              <View className="rounded-card border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface p-5">
                <Text className="text-lg font-bold text-light-text dark:text-dark-text">{selectedVisitor ? "Additional visitor vehicle" : "New visitor"}</Text>
                <Text className="mt-1 mb-5 text-sm leading-5 font-regular text-light-muted dark:text-dark-muted" accessibilityLiveRegion="polite">
                  No saved record for this plate. Add visitor details once; they will be available on their next visit.
                </Text>
                <AppInput label="Existing visitor vehicle plate (optional)" value={identityPlate} placeholder="Search an existing vehicle plate"
                  editable={!isActionLoading && !confirmingIdentity} onChangeText={value => { setIdentityPlate(value); setSelectedVisitor(null); setLicenseVerified(false); }} error={errors.identity} />
                <AppButton label="Find existing visitor" variant="outline" uppercase={false} onPress={() => confirmVisitorIdentity(true)} loading={confirmingIdentity} />
                {selectedVisitor && <View className="gap-2 my-3">
                  <Text className="text-light-text dark:text-dark-text">Confirmed visitor: {selectedVisitor.fullName}</Text>
                  <Text className="text-light-muted dark:text-dark-muted">Visitor ID: {selectedVisitor.visitorId}. A new vehicle photo is required.</Text>
                  <AppButton label="Use a new visitor instead" variant="ghost" uppercase={false} onPress={() => { setSelectedVisitor(null); setLicenseVerified(false); }} />
                </View>}
                <AppInput label="Visitor plate number" value={form.plateNumber.trim().toUpperCase()} editable={false}
                  accessibilityLabel={`Visitor plate number: ${form.plateNumber.trim().toUpperCase()}`}
                  accessibilityState={{ disabled: true }} className="bg-light-surfaceMuted dark:bg-dark-surfaceMuted" />
                <AppInput
                  label="Visitor name (optional)" placeholder="e.g. Juan Dela Cruz" autoCapitalize="words"
                  value={selectedVisitor?.fullName || form.fullName} editable={!isActionLoading && !selectedVisitor}
                  onChangeText={(v) => {
                    setForm((prev) => ({ ...prev, fullName: v }));
                    clearFieldError("fullName");
                  }} error={errors.fullName}
                />
                <AppInput
                  label="Contact number" placeholder="e.g. 09171234567" keyboardType="phone-pad"
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
                {visitorDocuments}

                <AppButton
                  label="Review visitor entry" uppercase={false} onPress={handleVisitorEntry}
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
