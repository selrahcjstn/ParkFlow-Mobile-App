import QrScanErrorCard from "@/app/(guard)/(scan)/scan-error";
import QrScanResultCard from "@/app/(guard)/(scan)/scan-result";
import SubScreenLayout from "@/components/layouts/SubScreenLayout";
import { AppButton } from "@/components/ui";
import { CheckCircle, AlertTriangle } from "lucide-react-native";
// inline tailwind color tokens where needed
import StudentScanResultCard from "@/features/qr/components/StudentScanResultCard";
import { parseStudentIdQr } from "@/features/qr/utils/student-qr-parser";
import { useQrStore } from "@/features/qr/store/qr.store";
import type {
  EntryResponse,
  ReservationScanVerificationResponse,
  StudentScanVerificationResponse,
} from "@/features/qr/types/qr-scan.types";
import { useAuthStore } from "@/features/auth/store/auth.store";
import { formatTime } from "@/utils/formatTime";
import { CameraView, useCameraPermissions } from "expo-camera";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";

type ScanPhase = "scanning" | "processing" | "result" | "error";

const PROCESSING_DELAY_MS = 600;

export default function ScanQrPage() {
  const [permission, requestPermission] = useCameraPermissions();
  const [phase, setPhase] = useState<ScanPhase>("scanning");
  const [scanResult, setScanResult] = useState<EntryResponse | null>(null);
  const [reservationResult, setReservationResult] = useState<ReservationScanVerificationResponse | null>(null);
  const [studentResult, setStudentResult] = useState<StudentScanVerificationResponse | null>(null);
  const [isConfirmingVehicle, setIsConfirmingVehicle] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { createEntry, registerExit, verifyReservationScan, verifyStudentScan, setConflictData } = useQrStore();
  const { user } = useAuthStore();
  const processingRef = useRef(false);
  const resetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearResetTimer = useCallback(() => {
    if (resetTimerRef.current) {
      clearTimeout(resetTimerRef.current);
      resetTimerRef.current = null;
    }
  }, []);

  const resetScan = useCallback(() => {
    clearResetTimer();
    processingRef.current = false;
    setScanResult(null);
    setReservationResult(null);
    setStudentResult(null);
    setIsConfirmingVehicle(false);
    setErrorMessage(null);
    setPhase("scanning");
  }, [clearResetTimer]);

  useEffect(() => {
    if (permission && !permission.granted && permission.canAskAgain) {
      requestPermission();
    }
  }, [permission, requestPermission]);

  useFocusEffect(
    useCallback(() => {
      return () => {
        clearResetTimer();
        processingRef.current = false;
      };
    }, [clearResetTimer]),
  );

  const showError = useCallback((message: string) => {
    setErrorMessage(message);
    setPhase("error");
    processingRef.current = false;
  }, []);

  const handleBarcodeScanned = useCallback(
    async ({ data }: { data: string }) => {
      const trimmed = data?.trim();
      if (!trimmed || phase !== "scanning" || processingRef.current) return;

      processingRef.current = true;
      setPhase("processing");
      setErrorMessage(null);

      try {
        await new Promise((resolve) =>
          setTimeout(resolve, PROCESSING_DELAY_MS),
        );

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

          if (res.isSuccess && res.data) {
            setStudentResult(res.data);
            setPhase("result");
          } else if (res.data) {
            setStudentResult(res.data);
            setPhase("result");
          } else {
            showError(res.message || "Could not verify student school ID.");
          }
          return;
        }

        // 2. If scanned QR starts with "RES-", it is directly a Reservation QR code
        if (trimmed.toUpperCase().startsWith("RES-")) {
          const res = await verifyReservationScan(trimmed);
          if (res.isSuccess && res.data) {
            if (!res.data.isValid) {
              setReservationResult(res.data);
              setPhase("result");
              return;
            }

            const qrCodeToUse = trimmed;
            const entryAttempt = await createEntry({ qrCodeHash: qrCodeToUse, userId: user.id });
            if (entryAttempt.isSuccess && entryAttempt.data) {
              setReservationResult(null);
              setScanResult(entryAttempt.data);
              setPhase("result");
              return;
            } else if (entryAttempt.errorCode === 409) {
              setConflictData({
                qrCodeHash: qrCodeToUse,
                message: entryAttempt.message ?? "Vehicle is currently parked. Proceeding to exit.",
                firstName: entryAttempt.data?.firstName || res.data.driverName,
                lastName: entryAttempt.data?.lastName,
                plateNumber: entryAttempt.data?.plateNumber || res.data.plateNumber,
                brand: entryAttempt.data?.brand || res.data.brand,
                vehicleType: entryAttempt.data?.vehicleType,
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

        if (res.isSuccess && res.data) {
          setScanResult(res.data);
          setPhase("result");
        } else {
          // Smart fallback: Check if the scanned QR corresponds to a registered student
          try {
            const studentFallback = await verifyStudentScan({ qrContent: trimmed });
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
            setConflictData({
              qrCodeHash: trimmed,
              message: res.message ?? undefined,
              firstName: res.data?.firstName,
              lastName: res.data?.lastName,
              plateNumber: res.data?.plateNumber,
              brand: res.data?.brand,
              vehicleType: res.data?.vehicleType,
              entryMethod: res.data?.entryMethod,
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
      <SubScreenLayout title="Reservation Verification" onBack={resetScan}>
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
        onBack={resetScan}
      />
    );
  }

  // Full-screen error — rendered outside SubScreenLayout
  if (phase === "error" && errorMessage) {
    return (
      <QrScanErrorCard
        message={errorMessage}
        onRetry={resetScan}
        onBack={() => router.back()}
      />
    );
  }

  return (
    <SubScreenLayout title="Scan QR Code" onBack={() => router.back()}>
      <Text className="font-bold text-lg text-center mt-6 text-light-text dark:text-dark-text">
        {isProcessing ? "Processing…" : "Status: Scanning"}
      </Text>

      <View className="items-center mt-6">
        <View className="w-[290px] h-[290px] rounded-3xl overflow-hidden bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border">
          {granted && isScanning ? (
            <CameraView
              style={{ flex: 1 }}
              facing="back"
              barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
              onBarcodeScanned={handleBarcodeScanned}
            />
          ) : granted && isProcessing ? (
            <View className="flex-1 items-center justify-center bg-light-surface dark:bg-dark-surface">
              <ActivityIndicator size="large" color="#FDB813" />
              <Text className="font-book mt-4 text-base leading-5 text-light-text dark:text-dark-text">
                Verifying QR code…
              </Text>
            </View>
          ) : (
            <View className="flex-1 items-center justify-center px-6">
              <Text className="font-bold text-center text-base leading-6 text-light-text dark:text-dark-text">
                Camera access is required.
              </Text>
              <Text className="text-center mt-2 text-base leading-5 text-light-muted dark:text-dark-muted">
                Allow camera to scan QR codes.
              </Text>
              <AppButton
                label="Allow Camera"
                size="md"
                className="mt-4 w-full"
                onPress={requestPermission}
              />
            </View>
          )}

          {isScanning && granted ? (
            <>
              <View
                pointerEvents="none"
                className="absolute inset-0 rounded-3xl border-2 border-light-accent/25 dark:border-dark-accent/25"
              />
              <View
                pointerEvents="none"
                className="absolute left-10 right-10 top-1/2 h-0.5 bg-light-accent/35 dark:bg-dark-accent/35"
              />
            </>
          ) : null}
        </View>
      </View>

      <Text className="text-center mt-6 text-base leading-5 text-light-muted dark:text-dark-muted">
        {isProcessing
          ? "Please wait while we verify the code."
          : "Align the QR code inside the frame."}
      </Text>
    </SubScreenLayout>
  );
}

