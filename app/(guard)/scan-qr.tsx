import SubScreenLayout from "@/components/layout/SubScreenLayout";
import QrScanErrorCard from "@/components/shared/QrScanErrorCard";
import QrScanResultCard from "@/components/shared/QrScanResultCard";
import { AppButton } from "@/components/ui";
import { Body, Caption, Title } from "@/components/ui/Typography";
// inline tailwind color tokens where needed
import { useAuthStore } from "@/store/useAuthStore";
import { useParkingLogStore } from "@/store/useParkingLogStore";
import type { QrScanResult } from "@/types/qrScan";
import { CameraView, useCameraPermissions } from "expo-camera";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, View } from "react-native";

type ScanPhase = "scanning" | "processing" | "result" | "error";

const PROCESSING_DELAY_MS = 600;

export default function ScanQr() {
  const [permission, requestPermission] = useCameraPermissions();
  const [phase, setPhase] = useState<ScanPhase>("scanning");
  const [scanResult, setScanResult] = useState<QrScanResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { createEntry } = useParkingLogStore();
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

        const payload = {
          qrCodeHash: trimmed,
          userId: user.id,
        };

        const res = await createEntry(payload);

        if (res.isSuccess && res.data) {
          const mapped: QrScanResult = {
            qrCodeHash: trimmed,
            parkeeName: res.data.firstName + " " + res.data.lastName,
            idNumber: res.data.idNumber,
            plateNumber: res.data.plateNumber,
            vehicleBrand: res.data.brand,
            role: res.data.role,
            courseYearSection:
              res.data.course +
              " " +
              res.data.yearLevel +
              "-" +
              res.data.section,
            department: res.data.department,
            entryTime: res.data.entryTime,
            entryDate: res.data.entryDate,
            status: res.data.status,
            entryGracePeriod: (res.data as any).entryGracePeriod,
            estimatedExitTime: (res.data as any).estimatedExitTime ?? null,
            maximumExitTime: (res.data as any).maximumExitTime ?? null,
          };
          setScanResult(mapped);
          setPhase("result");
        } else {
          const message = res.message ?? "Failed to create entry";
          console.log("Entry creation failed:", {
            message,
            errorCode: res.errorCode,
          });
          // If backend signals a conflict (HTTP 409) route to the conflict screen
          if (res.errorCode === 409) {
            const params = new URLSearchParams();
            params.set("message", message);

            router.replace(`/(guard)/scan-conflict?${params.toString()}`);
            return;
          }

          showError(message);
        }
      } catch {
        showError("Could not process this QR code. Please try again.");
      }
    },
    [phase, showError, user, createEntry],
  );

  const granted = Boolean(permission?.granted);
  const isScanning = phase === "scanning";
  const isProcessing = phase === "processing";

  // Full-screen result — rendered outside SubScreenLayout
  if (phase === "result" && scanResult) {
    return <QrScanResultCard result={scanResult} onScanAnother={resetScan} />;
  }

  // Full-screen error — rendered outside SubScreenLayout
  if (phase === "error" && errorMessage) {
    return <QrScanErrorCard message={errorMessage} onRetry={resetScan} />;
  }

  return (
    <SubScreenLayout title="Scan QR Code" onBack={() => router.back()}>
      <Title className="text-lg text-center mt-2">
        {isProcessing ? "Processing…" : "Status: Scanning"}
      </Title>

      <View className="items-center mt-6">
        <View className="w-[290px] h-[290px] rounded-3xl overflow-hidden bg-light-surface border border-light-border">
          {granted && isScanning ? (
            <CameraView
              style={{ flex: 1 }}
              facing="back"
              barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
              onBarcodeScanned={handleBarcodeScanned}
            />
          ) : granted && isProcessing ? (
            <View className="flex-1 items-center justify-center bg-light-surface">
              <ActivityIndicator size="large" color="#FDB813" />
              <Caption className="font-semibold mt-4">
                Verifying QR code…
              </Caption>
            </View>
          ) : (
            <View className="flex-1 items-center justify-center px-6">
              <Body className="font-bold text-center">
                Camera access is required.
              </Body>
              <Caption className="text-center mt-2">
                Allow camera to scan QR codes.
              </Caption>
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
                className="absolute inset-0 rounded-3xl border-2 border-light-accent/25"
              />
              <View
                pointerEvents="none"
                className="absolute left-10 right-10 top-1/2 h-0.5 bg-light-accent/35"
              />
            </>
          ) : null}
        </View>
      </View>

      <Caption className="text-center mt-6">
        {isProcessing
          ? "Please wait while we verify the code."
          : "Align the QR code inside the frame."}
      </Caption>
    </SubScreenLayout>
  );
}
