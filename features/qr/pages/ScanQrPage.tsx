import DriverVehiclePreview from '../components/DriverVehiclePreview';
import { scanService } from '../services/scan.service';
import type { VehicleScanPreview } from '../types/qr-scan.types';
import QrScanErrorCard from "@/app/(guard)/(scan)/scan-error";
import QrScanResultCard from "@/app/(guard)/(scan)/scan-result";
import SubScreenLayout from "@/components/layouts/SubScreenLayout";
import { AppButton } from "@/components/ui";
import { CheckCircle, AlertTriangle, Flashlight, FlashlightOff, Camera, Keyboard } from "lucide-react-native";
import StudentScanResultCard from "@/features/qr/components/StudentScanResultCard";
import { parseStudentIdQr } from "@/features/qr/utils/student-qr-parser";
import { useQrStore } from "@/features/qr/store/qr.store";
import type {
  EntryResponse,
  ReservationScanVerificationResponse,
  StudentScanVerificationResponse,
} from "@/features/qr/types/qr-scan.types";
import { useAuthStore } from "@/features/auth/store/auth.store";
import { useAppTheme } from "@/hooks/useAppTheme";
import { useActionConfirmation } from "@/hooks/useActionConfirmation";
import { themeColors } from "@/constants/colors";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { formatTime } from "@/utils/formatTime";
import { CameraView, useCameraPermissions } from "expo-camera";
import { router, useFocusEffect, useIsFocused } from "expo-router";
import { useCallback, useRef, useState } from "react";
import { ActivityIndicator, BackHandler, Linking, ScrollView, StyleSheet, Text, View } from "react-native";

type ScanPhase = "scanning" | "processing" | "result" | "error";


export default function ScanQrPage() {
  const confirmAction = useActionConfirmation();
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const isFocused = useIsFocused();
  const activeRef = useRef(false);
  const [permission, requestPermission] = useCameraPermissions();
  const [torchEnabled, setTorchEnabled] = useState(false);
  const [phase, setPhase] = useState<ScanPhase>("scanning");
  const [vehiclePreview, setVehiclePreview] = useState<VehicleScanPreview | null>(null);
  const [scanResult, setScanResult] = useState<EntryResponse | null>(null);
  const [reservationResult, setReservationResult] = useState<ReservationScanVerificationResponse | null>(null);
  const [studentResult, setStudentResult] = useState<StudentScanVerificationResponse | null>(null);
  const [isConfirmingVehicle, setIsConfirmingVehicle] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { createEntry, registerExit, verifyReservationScan, verifyStudentScan, setConflictData } = useQrStore();
  const { user } = useAuthStore();
  const processingRef = useRef(false);
  const mutationRef = useRef(false);
  const resetScan = useCallback(() => {
    if (mutationRef.current) return;
    processingRef.current = false;
    setVehiclePreview(null);
    setScanResult(null);
    setReservationResult(null);
    setStudentResult(null);
    setIsConfirmingVehicle(false);
    setErrorMessage(null);
    setPhase("scanning");
  }, []);

  const handleBack = useCallback(() => {
    if (mutationRef.current) return;
    activeRef.current = false;
    processingRef.current = false;
    setTorchEnabled(false);
    // Avoid returning to the tab whose Redirect opens the scanner again.
    router.dismissTo("/(guard)/(tabs)/home");
  }, []);

  useFocusEffect(
    useCallback(() => {
      activeRef.current = true;
      const subscription = BackHandler.addEventListener("hardwareBackPress", () => {
        handleBack();
        return true;
      });
      return () => {
        activeRef.current = false;
        processingRef.current = false;
        subscription.remove();
      };
    }, [handleBack]),
  );

  const showError = useCallback((message: string) => {
    if (!activeRef.current) return;
    setErrorMessage(message);
    setPhase("error");
    processingRef.current = false;
  }, []);

  const handleBarcodeScanned = useCallback(
    async ({ data }: { data: string }) => {
      const trimmed = data?.trim();
      if (!activeRef.current || !trimmed || phase !== "scanning" || processingRef.current) return;

      processingRef.current = true;
      setPhase("processing");
      setErrorMessage(null);

      try {
        if (!user?.id) {
          showError("User session not found.");
          return;
        }

        // 1. If scanned QR matches School Student ID format ("Student No., Full Name, Program")
        const parsedStudent = parseStudentIdQr(trimmed);
        if (parsedStudent) {
          const res = await verifyStudentScan({
            qrContent: trimmed,
            studentNumber: parsedStudent.studentNumber,
            fullName: parsedStudent.fullName,
            program: parsedStudent.program,
          });
          if (!activeRef.current) return;

          if ((res.isSuccess && res.data) || (res.data && res.data.entryStatus !== "NotFound")) {
            setStudentResult(res.data);
            setPhase("result");
            return;
          }
        }

        // 2. If scanned QR starts with "RES-", it is directly a Reservation QR code
        if (trimmed.toUpperCase().startsWith("RES-")) {
          const res = await verifyReservationScan(trimmed);
          if (!activeRef.current) return;
          if (res.isSuccess && res.data) {
            setReservationResult(res.data);
            setPhase("result");
          } else {
            showError(res.message || "Invalid reservation QR code.");
          }
          return;
        }

        const preview = await scanService.preview(trimmed);
        if (!activeRef.current) return;
        if (!preview.isSuccess || !preview.data) { showError(preview.message || 'Parking pass not found.'); return; }
        setVehiclePreview(preview.data); setPhase('result');
      } catch {
        showError("Could not process this QR code. Please try again.");
      }
    },
    [phase, showError, user, createEntry, verifyReservationScan, verifyStudentScan, setConflictData, confirmAction, resetScan],
  );

  const confirmVehiclePreview = async () => {
    if (!vehiclePreview || mutationRef.current || !user?.id) return;
    mutationRef.current = true; setIsConfirmingVehicle(true);
    try {
      const payload = { qrCodeHash: vehiclePreview.qrCodeHash, userId: user.id };
      if (vehiclePreview.isCurrentlyParked) {
        const res = await registerExit(payload);
        if (!activeRef.current) return;
        if (!res.isSuccess || !res.data) { showError(res.message || 'Exit could not be recorded.'); return; }
        const query = new URLSearchParams({ qrCodeHash: payload.qrCodeHash, exitPayload: encodeURIComponent(JSON.stringify(res.data)) });
        router.replace(`/(guard)/(scan)/scan-confirmed?${query}` as any);
      } else {
        const res = await createEntry(payload);
        if (!activeRef.current) return;
        if (!res.isSuccess || !res.data) { showError(res.message || 'Entry could not be recorded.'); return; }
        setVehiclePreview(null); setScanResult(res.data); setPhase('result');
      }
    } catch { showError('Could not record this parking event. Please try again.'); }
    finally { mutationRef.current = false; setIsConfirmingVehicle(false); }
  };

  const handleConfirmStudentVehicleEntry = useCallback(async () => {
    if (!activeRef.current || mutationRef.current || !studentResult?.vehicleQrCodeHash || !user?.id) return;
    mutationRef.current = true;
    setIsConfirmingVehicle(true);
    try {
      const res = await createEntry({
        qrCodeHash: studentResult.vehicleQrCodeHash,
        userId: user.id,
      });
          if (!activeRef.current) return;

      if (res.isSuccess && res.data) {
        setStudentResult(null);
        setScanResult(res.data);
        setPhase("result");
      } else if (res.errorCode === 409) {
        setConflictData({
          qrCodeHash: studentResult.vehicleQrCodeHash,
          message: res.message ?? "Vehicle is currently parked. Proceeding to exit.",
          firstName: res.data?.firstName || studentResult.fullName,
          lastName: res.data?.lastName,
          plateNumber: res.data?.plateNumber || (studentResult.plateNumber ?? undefined),
          brand: res.data?.brand || (studentResult.vehicleBrand ?? undefined),
          vehicleType: res.data?.vehicleType || (studentResult.vehicleType ?? undefined),
        });
        router.replace("/(guard)/(scan)/scan-conflict");
      } else {
        showError(res.message || "Could not log entry for student vehicle.");
      }
    } catch {
      showError("Vehicle entry failed. Please try again.");
    } finally {
      mutationRef.current = false;
      setIsConfirmingVehicle(false);
    }
  }, [studentResult, user, createEntry, setConflictData, showError]);

  const handleConfirmStudentVehicleExit = useCallback(async () => {
    if (!activeRef.current || mutationRef.current || !studentResult?.vehicleQrCodeHash || !user?.id) return;
    mutationRef.current = true;
    setIsConfirmingVehicle(true);
    try {
      const res = await registerExit({
        qrCodeHash: studentResult.vehicleQrCodeHash,
        userId: user.id,
      });
          if (!activeRef.current) return;

      if (res.isSuccess && res.data) {
        setStudentResult(null);
        const confirmedQuery = new URLSearchParams();
        confirmedQuery.set("qrCodeHash", studentResult.vehicleQrCodeHash);
        confirmedQuery.set(
          "exitPayload",
          encodeURIComponent(JSON.stringify(res.data)),
        );
        router.replace(
          `/(guard)/(scan)/scan-confirmed?${confirmedQuery}` as any,
        );
      } else {
        showError(res.message || "Could not log exit for student vehicle.");
      }
    } catch {
      showError("Vehicle exit failed. Please try again.");
    } finally {
      mutationRef.current = false;
      setIsConfirmingVehicle(false);
    }
  }, [studentResult, user, registerExit, showError]);

  const handleConfirmReservationCheckIn = useCallback(async () => {
    if (!activeRef.current || mutationRef.current || !reservationResult || (!reservationResult.isValid && !reservationResult.isCurrentlyParked) || !user?.id) return;
    mutationRef.current = true;
    setPhase("processing");
    try {
      const qrCodeToUse = reservationResult.referenceNumber || reservationResult.vehicleQrCodeHash;
      if (reservationResult.isCurrentlyParked) {
        const exit = await registerExit({ qrCodeHash: qrCodeToUse, userId: user.id });
        if (!activeRef.current) return;
        if (!exit.isSuccess || !exit.data) { showError(exit.message || 'Could not record exit.'); return; }
        const query = new URLSearchParams({ qrCodeHash: qrCodeToUse, exitPayload: encodeURIComponent(JSON.stringify(exit.data)) });
        router.replace(`/(guard)/(scan)/scan-confirmed?${query}` as any); return;
      }
      const res = await createEntry({ qrCodeHash: qrCodeToUse, userId: user.id });
          if (!activeRef.current) return;
      if (res.isSuccess && res.data) {
        setReservationResult(null);
        setScanResult(res.data);
        setPhase("result");
      } else if (res.errorCode === 409) {
        setConflictData({
          qrCodeHash: qrCodeToUse,
          message: res.message ?? "Vehicle is currently parked. Proceeding to exit.",
          firstName: res.data?.firstName || reservationResult.driverName,
          lastName: res.data?.lastName,
          plateNumber: res.data?.plateNumber || reservationResult.plateNumber,
          brand: res.data?.brand || reservationResult.brand,
          vehicleType: res.data?.vehicleType,
        });
        router.replace("/(guard)/(scan)/scan-conflict");
      } else {
        showError(res.message || "Could not log entry for this reservation.");
      }
    } catch {
      showError("Check-in failed. Please try again.");
    } finally {
      mutationRef.current = false;
    }
  }, [reservationResult, user, createEntry, registerExit, showError, setConflictData]);

  const granted = Boolean(permission?.granted);
  const isScanning = phase === "scanning";
  const isProcessing = phase === "processing";

  if (phase === 'result' && vehiclePreview) return <SubScreenLayout title={vehiclePreview.isCurrentlyParked ? 'Verify vehicle exit' : 'Verify vehicle entry'} onBack={handleBack}>
    <ScrollView contentContainerStyle={{ padding: 20, gap: 12 }}>
      <DriverVehiclePreview {...vehiclePreview} />
      <Text className="text-light-text dark:text-dark-text">{vehiclePreview.role} {vehiclePreview.phoneNumber ? `• ${vehiclePreview.phoneNumber}` : ''}</Text>
      {!vehiclePreview.isCurrentlyParked && !!vehiclePreview.entryRestriction && <Text className="text-light-danger dark:text-dark-danger">{vehiclePreview.entryRestriction}</Text>}
      {(vehiclePreview.isCurrentlyParked || vehiclePreview.canEnter) && <AppButton label={vehiclePreview.isCurrentlyParked ? 'Confirm exit' : 'Confirm entry'} uppercase={false}
        onPress={confirmVehiclePreview} loading={isConfirmingVehicle} disabled={isConfirmingVehicle} />}
      <AppButton label="Scan another" uppercase={false} variant="outline" onPress={resetScan} disabled={isConfirmingVehicle} />
    </ScrollView>
  </SubScreenLayout>;

  // Full-screen student verification result card
  if (phase === "result" && studentResult) {
    return (
      <StudentScanResultCard
        result={studentResult}
        onScanAnother={resetScan}
        onBack={handleBack}
        onConfirmVehicleEntry={
          !studentResult.isCurrentlyParked &&
          studentResult.isValid &&
          studentResult.hasRegisteredVehicle &&
          Boolean(studentResult.vehicleQrCodeHash)
            ? handleConfirmStudentVehicleEntry
            : undefined
        }
        onConfirmVehicleExit={
          studentResult.isCurrentlyParked &&
          Boolean(studentResult.vehicleQrCodeHash)
            ? handleConfirmStudentVehicleExit
            : undefined
        }
        isConfirmingVehicle={isConfirmingVehicle}
      />
    );
  }

  // Full-screen reservation result card
  if (phase === "result" && reservationResult) {
    const isSpecial = reservationResult.type === 1 || reservationResult.type === "Special";
    return (
      <SubScreenLayout title="Reservation Verification" onBack={handleBack}>
        <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 24 }}>
          <DriverVehiclePreview fullName={reservationResult.driverName} profilePictureUrl={reservationResult.profilePictureUrl} vehiclePictureUrl={reservationResult.vehiclePictureUrl}
            plateNumber={reservationResult.plateNumber} brand={reservationResult.brand} vehicleType={reservationResult.vehicleType} />
          <View className="bg-light-surface dark:bg-dark-surface p-6 rounded-3xl border border-light-border dark:border-dark-border items-center">
            <View className={`w-16 h-16 rounded-full items-center justify-center mb-4 ${reservationResult.isValid ? "bg-light-success/20 dark:bg-dark-success/20 border border-light-success/40 dark:border-dark-success/40" : "bg-light-warning/20 dark:bg-dark-warning/20 border border-light-warning/40 dark:border-dark-warning/40"}`}>
              {reservationResult.isValid ? (
                <CheckCircle size={32} color={colors.success} strokeWidth={2.3} />
              ) : (
                <AlertTriangle size={32} color={colors.warning} strokeWidth={2.3} />
              )}
            </View>

            <Text className="font-bold text-xl text-center text-light-text dark:text-dark-text">
              {reservationResult.isValid ? "Valid Reservation Pass" : "Reservation Notice"}
            </Text>
            <Text className="font-book text-sm text-center mt-1 text-light-muted dark:text-dark-muted">
              {reservationResult.statusMessage}
            </Text>

            {/* Type badge */}
            <View className="mt-4 flex-row items-center gap-2">
              <View className={`px-4 py-1.5 rounded-full ${isSpecial ? "bg-light-success/20 dark:bg-dark-success/20 border border-light-success/40 dark:border-dark-success/40" : "bg-light-primary/20 dark:bg-dark-primary/20 border border-light-primary/40 dark:border-dark-primary/40"}`}>
                <Text className={`font-bold text-xs uppercase tracking-wider ${isSpecial ? "text-light-text dark:text-dark-success" : "text-light-primary dark:text-dark-primary"}`}>
                  {isSpecial ? "Special Pass" : "Standard Pass"}
                </Text>
              </View>
            </View>

            <View className="w-full mt-6 pt-5 border-t border-light-border dark:border-dark-border space-y-3">
              <View className="flex-row justify-between items-center py-1">
                <Text className="text-xs text-light-muted dark:text-dark-muted font-bold uppercase">Reference #</Text>
                <Text className="text-sm font-bold text-light-text dark:text-dark-text">{reservationResult.referenceNumber}</Text>
              </View>

              <View className="flex-row justify-between items-center py-1">
                <Text className="text-xs text-light-muted dark:text-dark-muted font-bold uppercase">Driver Name</Text>
                <Text className="text-sm font-bold text-light-text dark:text-dark-text">{reservationResult.driverName}</Text>
              </View>

              <View className="flex-row justify-between items-center py-1">
                <Text className="text-xs text-light-muted dark:text-dark-muted font-bold uppercase">Vehicle</Text>
                <Text className="text-sm font-bold text-light-text dark:text-dark-text">{reservationResult.brand} ({reservationResult.plateNumber})</Text>
              </View>

              <View className="flex-row justify-between items-center py-1">
                <Text className="text-xs text-light-muted dark:text-dark-muted font-bold uppercase">Time Window</Text>
                <Text className="text-sm font-bold text-light-text dark:text-dark-warning">{formatTime(reservationResult.startTime)} – {formatTime(reservationResult.endTime)}</Text>
              </View>

              {reservationResult.reason ? (
                <View className="py-1">
                  <Text className="text-xs text-light-muted dark:text-dark-muted font-bold uppercase">Reason / Event</Text>
                  <Text className="text-sm font-book text-light-text dark:text-dark-text mt-0.5">{reservationResult.reason}</Text>
                </View>
              ) : null}
            </View>
          </View>

          <View className="mt-6 gap-3">
            {reservationResult.isValid || reservationResult.isCurrentlyParked ? (
              <AppButton
                label={reservationResult.isCurrentlyParked ? "Confirm exit" : "Confirm entry"} uppercase={false}
                size="lg"
                onPress={handleConfirmReservationCheckIn}
              />
            ) : null}
            <AppButton
              label="Scan Another QR Code"
              variant="outline"
              size="lg"
              onPress={resetScan}
            />
          </View>
        </ScrollView>
      </SubScreenLayout>
    );
  }

  // Full-screen result — rendered outside SubScreenLayout
  if (phase === "result" && scanResult) {
    return (
      <QrScanResultCard
        result={scanResult}
        onScanAnother={resetScan}
        onBack={handleBack}
      />
    );
  }

  // Full-screen error — rendered outside SubScreenLayout
  if (phase === "error" && errorMessage) {
    return (
      <QrScanErrorCard
        message={errorMessage}
        onRetry={resetScan}
        onBack={handleBack}
      />
    );
  }

  return (
    <SubScreenLayout title="Scan QR code" onBack={handleBack}>
      <ScrollView
        className="flex-1 bg-light-background dark:bg-dark-background"
        contentContainerStyle={{ padding: 20, paddingBottom: Math.max(insets.bottom, 20) + 20, flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="w-full max-w-[560px] self-center">
          <Text className="text-2xl font-bold text-light-text dark:text-dark-text">Scan a parking pass</Text>
          <Text className="mt-2 mb-5 text-base font-regular text-light-muted dark:text-dark-muted">
            Hold the QR code inside the frame. Keep the phone steady.
          </Text>
          <View className="w-full max-w-[400px] aspect-square self-center overflow-hidden rounded-card border border-light-border dark:border-dark-border bg-light-surfaceMuted dark:bg-dark-surfaceMuted">
            {granted && isFocused ? (
              <>
                <CameraView
                  style={StyleSheet.absoluteFill}
                  facing="back"
                  enableTorch={torchEnabled && isFocused}
                  barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
                  onBarcodeScanned={isScanning ? handleBarcodeScanned : undefined}
                />
                <View pointerEvents="none" className="absolute inset-10 rounded-card border-2 border-light-textInverse" />
                {isProcessing && (
                  <View className="absolute inset-0 items-center justify-center bg-dark-background/80 p-6">
                    <ActivityIndicator size="large" color={themeColors.light.surface} />
                    <Text className="mt-4 text-base font-bold text-light-textInverse text-center">Checking parking pass…</Text>
                  </View>
                )}
              </>
            ) : (
              <View className="flex-1 items-center justify-center p-6">
                {!permission ? (
                  <ActivityIndicator size="large" color={colors.primary} />
                ) : (
                  <Camera size={40} color={colors.primary} />
                )}
                <Text className="mt-4 text-lg font-bold text-light-text dark:text-dark-text text-center">
                  {!permission ? "Opening camera…" : "Camera access needed"}
                </Text>
                <Text className="mt-2 text-sm font-regular text-light-muted dark:text-dark-muted text-center">
                  Allow camera access to scan passes. You can also enter a plate manually.
                </Text>
                {permission && !granted && (
                  <AppButton
                    label={permission.canAskAgain ? "Allow camera access" : "Open settings"}
                    className="mt-5 w-full"
                    uppercase={false}
                    size="lg"
                    onPress={() => {
                      if (permission.canAskAgain) void requestPermission();
                      else void Linking.openSettings();
                    }}
                  />
                )}
              </View>
            )}
          </View>
          <Text className="mt-4 mb-5 text-sm font-book text-light-muted dark:text-dark-muted text-center">
            Vehicle passes • Student IDs • Reservations
          </Text>
          <View className="gap-3">
            {granted && (
              <AppButton
                label={torchEnabled ? "Turn flashlight off" : "Turn flashlight on"}
                variant="outline"
                uppercase={false}
                size="lg"
                disabled={isProcessing}
                icon={torchEnabled ? <Flashlight size={20} color={colors.primary} /> : <FlashlightOff size={20} color={colors.primary} />}
                onPress={() => setTorchEnabled(prev => !prev)}
              />
            )}
            <AppButton
              label="Enter plate manually"
              variant="outline"
              uppercase={false}
              size="lg"
              disabled={isProcessing}
              icon={<Keyboard size={20} color={colors.primary} />}
              onPress={() => router.replace("/(guard)/manual-input")}
            />
          </View>
        </View>
      </ScrollView>
    </SubScreenLayout>
  );
}

