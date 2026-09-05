import QrScanErrorCard from "@/app/(guard)/(scan)/scan-error";
import QrScanResultCard from "@/app/(guard)/(scan)/scan-result";
import SubScreenLayout from "@/components/layouts/SubScreenLayout";
import { AppButton } from "@/components/ui";
// inline tailwind color tokens where needed
import { useQrStore } from "@/features/qr/store/qr.store";
import type { EntryResponse } from "@/features/qr/types/qr-scan.types";
import { useAuthStore } from "@/features/auth/store/auth.store";
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
  const [reservationResult, setReservationResult] = useState<import("@/features/qr/types/qr-scan.types").ReservationScanVerificationResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { createEntry, verifyReservationScan, setConflictData } = useQrStore();
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

        // 1. If scanned QR starts with "RES-", it is directly a Reservation QR code
        if (trimmed.toUpperCase().startsWith("RES-")) {
          const res = await verifyReservationScan(trimmed);
          if (res.isSuccess && res.data) {
            setReservationResult(res.data);
            setPhase("result");
          } else {
            showError(res.message || "Invalid reservation QR code.");
          }
          return;
        }

        // 2. Otherwise try standard vehicle QR entry
        const payload = {
          qrCodeHash: trimmed,
          userId: user.id,
        };

        const res = await createEntry(payload);

        if (res.isSuccess && res.data) {
          setScanResult(res.data);
          setPhase("result");
        } else {
          // Fallback: check if this vehicle QR code has an active reservation
          const resVerify = await verifyReservationScan(trimmed);
          if (resVerify.isSuccess && resVerify.data) {
            setReservationResult(resVerify.data);
            setPhase("result");
            return;
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
    [phase, showError, user, createEntry, verifyReservationScan, setConflictData],
  );

  const handleConfirmReservationCheckIn = useCallback(async () => {
    if (!reservationResult || !user?.id) return;
    setPhase("processing");
    try {
      const qrCodeToUse = reservationResult.vehicleQrCodeHash || reservationResult.referenceNumber;
      const res = await createEntry({ qrCodeHash: qrCodeToUse, userId: user.id });
      if (res.isSuccess && res.data) {
        setReservationResult(null);
        setScanResult(res.data);
        setPhase("result");
      } else {
        showError(res.message || "Could not log entry for this reservation.");
      }
    } catch {
      showError("Check-in failed. Please try again.");
    }
  }, [reservationResult, user, createEntry, showError]);

  const granted = Boolean(permission?.granted);
  const isScanning = phase === "scanning";
  const isProcessing = phase === "processing";

  // Full-screen reservation result card
  if (phase === "result" && reservationResult) {
    const isSpecial = reservationResult.type === 1 || reservationResult.type === "Special";
    return (
      <SubScreenLayout title="Reservation Verification" onBack={resetScan}>
        <View className="px-5 py-6">
          <View className="bg-light-surface dark:bg-dark-surface p-6 rounded-3xl border border-light-border dark:border-dark-border items-center">
            <View className={`w-16 h-16 rounded-full items-center justify-center mb-4 ${reservationResult.isValid ? "bg-emerald-500/20 border border-emerald-500/40" : "bg-amber-500/20 border border-amber-500/40"}`}>
              <Text className="text-3xl">{reservationResult.isValid ? "✅" : "⚠️"}</Text>
            </View>

            <Text className="font-heavy text-xl text-center text-light-text dark:text-dark-text">
              {reservationResult.isValid ? "Valid Reservation Pass" : "Reservation Notice"}
            </Text>
            <Text className="font-book text-sm text-center mt-1 text-light-muted dark:text-dark-muted">
              {reservationResult.statusMessage}
            </Text>

            {/* Type badge */}
            <View className="mt-4 flex-row items-center gap-2">
              <View className={`px-4 py-1.5 rounded-full ${isSpecial ? "bg-emerald-500/20 border border-emerald-500/40" : "bg-blue-500/20 border border-blue-500/40"}`}>
                <Text className={`font-heavy text-xs uppercase tracking-wider ${isSpecial ? "text-emerald-400" : "text-blue-400"}`}>
                  {isSpecial ? "⭐ Special Pass (₱0 No Fees)" : "🔹 Normal Reservation Pass"}
                </Text>
              </View>
            </View>

            <View className="w-full mt-6 pt-5 border-t border-light-border dark:border-dark-border space-y-3">
              <View className="flex-row justify-between items-center py-1">
                <Text className="text-xs text-light-muted dark:text-dark-muted font-heavy uppercase">Reference #</Text>
                <Text className="text-sm font-heavy text-light-text dark:text-dark-text">{reservationResult.referenceNumber}</Text>
              </View>

              <View className="flex-row justify-between items-center py-1">
                <Text className="text-xs text-light-muted dark:text-dark-muted font-heavy uppercase">Driver Name</Text>
                <Text className="text-sm font-heavy text-light-text dark:text-dark-text">{reservationResult.driverName}</Text>
              </View>

              <View className="flex-row justify-between items-center py-1">
                <Text className="text-xs text-light-muted dark:text-dark-muted font-heavy uppercase">Vehicle</Text>
                <Text className="text-sm font-heavy text-light-text dark:text-dark-text">{reservationResult.brand} ({reservationResult.plateNumber})</Text>
              </View>

              <View className="flex-row justify-between items-center py-1">
                <Text className="text-xs text-light-muted dark:text-dark-muted font-heavy uppercase">Time Window</Text>
                <Text className="text-sm font-heavy text-amber-500">{reservationResult.startTime} – {reservationResult.endTime}</Text>
              </View>

              {reservationResult.reason ? (
                <View className="py-1">
                  <Text className="text-xs text-light-muted dark:text-dark-muted font-heavy uppercase">Reason / Event</Text>
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
      <Text className="font-black text-lg text-center mt-6 text-light-text dark:text-dark-text">
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
              <Text className="font-heavy text-center text-base leading-6 text-light-text dark:text-dark-text">
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

