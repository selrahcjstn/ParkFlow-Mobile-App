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
import { themeColors } from "@/constants/colors";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { formatTime } from "@/utils/formatTime";
import { CameraView, useCameraPermissions } from "expo-camera";
import { router, useFocusEffect, useIsFocused } from "expo-router";
import { useCallback, useRef, useState } from "react";
import { ActivityIndicator, BackHandler, Linking, ScrollView, StyleSheet, Text, View } from "react-native";

type ScanPhase = "scanning" | "processing" | "result" | "error";


export default function ScanQrPage() {
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const isFocused = useIsFocused();
  const activeRef = useRef(false);
  const [permission, requestPermission] = useCameraPermissions();
  const [torchEnabled, setTorchEnabled] = useState(false);
  const [phase, setPhase] = useState<ScanPhase>("scanning");
  const [scanResult, setScanResult] = useState<EntryResponse | null>(null);
  const [reservationResult, setReservationResult] = useState<ReservationScanVerificationResponse | null>(null);
  const [studentResult, setStudentResult] = useState<StudentScanVerificationResponse | null>(null);
  const [isConfirmingVehicle, setIsConfirmingVehicle] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { createEntry, registerExit, verifyReservationScan, verifyStudentScan, setConflictData } = useQrStore();
  const { user } = useAuthStore();
  const processingRef = useRef(false);
  const resetScan = useCallback(() => {
    processingRef.current = false;
    setScanResult(null);
    setReservationResult(null);
    setStudentResult(null);
    setIsConfirmingVehicle(false);
    setErrorMessage(null);
    setPhase("scanning");
  }, []);

  const handleBack = useCallback(() => {
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
        if (parsedStudent && (parsedStudent.fullName !== "Student" || trimmed.includes(",") || trimmed.includes("\n"))) {
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
            if (!res.data.isValid) {
              setReservationResult(res.data);
              setPhase("result");
              return;
            }

            const qrCodeToUse = trimmed;
            const entryAttempt = await createEntry({ qrCodeHash: qrCodeToUse, userId: user.id });
          if (!activeRef.current) return;
            if (entryAttempt.isSuccess && entryAttempt.data) {
              setReservationResult(null);
              setScanResult(entryAttempt.data);
              setPhase("result");
              return;
            } else if (entryAttempt.errorCode === 409) {
              const conflictInfo = (entryAttempt.data as any)?.data ?? entryAttempt.data;
              setConflictData({
                qrCodeHash: qrCodeToUse,
                message: entryAttempt.message ?? "Vehicle is currently parked. Proceeding to exit.",
                firstName: conflictInfo?.firstName || res.data.driverName,
                lastName: conflictInfo?.lastName,
                plateNumber: conflictInfo?.plateNumber || res.data.plateNumber,
                brand: conflictInfo?.brand || res.data.brand,
                vehicleType: conflictInfo?.vehicleType,
                entryMethod: conflictInfo?.entryMethod,
              });
              router.replace("/(guard)/(scan)/scan-conflict");
              return;
            }
            setReservationResult(res.data);
            setPhase("result");
          } else {
            showError(res.message || "Invalid reservation QR code.");
          }
          return;
        }

        // 3. Otherwise try standard vehicle QR entry
        const payload = {
          qrCodeHash: trimmed,
          userId: user.id,
        };

        const res = await createEntry(payload);
          if (!activeRef.current) return;

        if (res.isSuccess && res.data) {
          setScanResult(res.data);
          setPhase("result");
        } else {
          // Smart fallback: Check if the scanned QR corresponds to a registered student
          try {
            const studentFallback = await verifyStudentScan({ qrContent: trimmed });
          if (!activeRef.current) return;
            if (
              studentFallback.isSuccess &&
              studentFallback.data &&
              studentFallback.data.entryStatus !== "NotFound"
            ) {
              setStudentResult(studentFallback.data);
              setPhase("result");
              return;
            }
          } catch {
            // Ignore fallback error and proceed to original message
          }

          const message = res.message ?? "Failed to create entry";
          if (res.errorCode === 409) {
            const conflictInfo = (res.data as any)?.data ?? res.data;
            setConflictData({
              qrCodeHash: trimmed,
              message: res.message ?? "Vehicle is currently parked. Proceeding to exit.",
              firstName: conflictInfo?.firstName,
              lastName: conflictInfo?.lastName,
              plateNumber: conflictInfo?.plateNumber,
              brand: conflictInfo?.brand,
              vehicleType: conflictInfo?.vehicleType,
              entryMethod: conflictInfo?.entryMethod,
            });

            router.replace("/(guard)/(scan)/scan-conflict");
            return;
          }

          showError(message);
        }
      } catch {
        showError("Could not process this QR code. Please try again.");
      }
    },
    [phase, showError, user, createEntry, verifyReservationScan, verifyStudentScan, setConflictData],
  );

  const handleConfirmStudentVehicleEntry = useCallback(async () => {
    if (!studentResult?.vehicleQrCodeHash || !user?.id) return;
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
      setIsConfirmingVehicle(false);
    }
  }, [studentResult, user, createEntry, setConflictData, showError]);

  const handleConfirmStudentVehicleExit = useCallback(async () => {
    if (!studentResult?.vehicleQrCodeHash || !user?.id) return;
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
      setIsConfirmingVehicle(false);
    }
  }, [studentResult, user, registerExit, showError]);

  const handleConfirmReservationCheckIn = useCallback(async () => {
    if (!reservationResult || !reservationResult.isValid || !user?.id) return;
    setPhase("processing");
    try {
      const qrCodeToUse = reservationResult.referenceNumber || reservationResult.vehicleQrCodeHash;
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
    }
  }, [reservationResult, user, createEntry, showError, setConflictData]);

  const granted = Boolean(permission?.granted);
  const isScanning = phase === "scanning";
  const isProcessing = phase === "processing";

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
        <View className="px-5 py-6">
          <View className="bg-light-surface dark:bg-dark-surface p-6 rounded-3xl border border-light-border dark:border-dark-border items-center">
            <View className={`w-16 h-16 rounded-full items-center justify-center mb-4 ${reservationResult.isValid ? "bg-emerald-500/20 border border-emerald-500/40" : "bg-amber-500/20 border border-amber-500/40"}`}>
              {reservationResult.isValid ? (
                <CheckCircle size={32} color="#10B981" strokeWidth={2.3} />
              ) : (
                <AlertTriangle size={32} color="#F59E0B" strokeWidth={2.3} />
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
              <View className={`px-4 py-1.5 rounded-full ${isSpecial ? "bg-emerald-500/20 border border-emerald-500/40" : "bg-blue-500/20 border border-blue-500/40"}`}>
                <Text className={`font-bold text-xs uppercase tracking-wider ${isSpecial ? "text-emerald-400" : "text-blue-400"}`}>
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
                <Text className="text-sm font-bold text-amber-500">{formatTime(reservationResult.startTime)} – {formatTime(reservationResult.endTime)}</Text>
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
            {reservationResult.isValid ? (
              <AppButton
                label="Confirm Check-In Entry"
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
        </View>
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

