import { DashboardHeader, DashboardLayout } from "@/components/layout";
import { AlertModal } from "@/components/shared";
import QrScanResultCard from "@/components/shared/QrScanResultCard";
import { AppButton } from "@/components/ui";
import { Body, Caption, Title } from "@/components/ui/Typography";
import { lightColors } from "@/constants/theme";
import type { QrScanResult } from "@/types/qrScan";
import { buildStaticQrScanResult } from "@/utils/mockQrScanResult";
import { CameraView, useCameraPermissions } from "expo-camera";
import { router, useFocusEffect } from "expo-router";
import { AlertCircle, ChevronLeft } from "lucide-react-native";
import { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, Pressable, View } from "react-native";

type ScanPhase = "scanning" | "processing" | "result";

const PROCESSING_DELAY_MS = 600;

export default function ScanQr() {
  const [permission, requestPermission] = useCameraPermissions();
  const [phase, setPhase] = useState<ScanPhase>("scanning");
  const [scanResult, setScanResult] = useState<QrScanResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

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
    setModalVisible(false);
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
    setModalVisible(true);
    setPhase("scanning");
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
        await new Promise((resolve) => setTimeout(resolve, PROCESSING_DELAY_MS));

        const result = buildStaticQrScanResult(trimmed);
        setScanResult(result);
        setPhase("result");
      } catch {
        showError("Could not process this QR code. Please try again.");
      }
    },
    [phase, showError],
  );

  const handleScanErrorClose = useCallback(() => {
    setModalVisible(false);
    setErrorMessage(null);
    resetScan();
  }, [resetScan]);

  const granted = Boolean(permission?.granted);
  const isScanning = phase === "scanning";
  const isProcessing = phase === "processing";
  const showResult = phase === "result" && scanResult;

  return (
    <DashboardLayout>
      <DashboardHeader title="Scan QR Code" />
      <View className="flex-1 bg-light-background rounded-t-3xl -mt-1 px-5 pt-4">
        <Pressable
          className="flex-row items-center gap-2"
          onPress={() => router.replace("/(guard)/guard-dashboard")}
        >
          <ChevronLeft
            size={18}
            color={lightColors.accent}
            strokeWidth={2.5}
          />
          <Body className="text-light-accent font-semibold">
            Back to Dashboard
          </Body>
        </Pressable>

        <Title className="text-lg text-center mt-10">
          {showResult
            ? "Scan Complete"
            : isProcessing
              ? "Processing…"
              : "Status: Scanning"}
        </Title>

        {showResult ? (
          <View className="mt-6 gap-4">
            <QrScanResultCard result={scanResult} />
            <AppButton
              label="Scan Another"
              variant="secondary"
              size="lg"
              onPress={resetScan}
            />
            <AppButton
              label="Back to Dashboard"
              variant="outline"
              size="lg"
              onPress={() => router.replace("/(guard)/guard-dashboard")}
            />
          </View>
        ) : (
          <>
            <View className="items-center mt-8">
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
                    <ActivityIndicator
                      size="large"
                      color={lightColors.accent}
                    />
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
          </>
        )}
      </View>

      <AlertModal
        visible={modalVisible}
        onClose={handleScanErrorClose}
        title="Scan Failed"
        message={errorMessage ?? "Something went wrong. Please try again."}
        variant="error"
        icon={
          <AlertCircle size={28} color={lightColors.danger} strokeWidth={2} />
        }
        buttonLabel="Try Again"
      />
    </DashboardLayout>
  );
}
