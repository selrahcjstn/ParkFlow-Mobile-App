import QrScanErrorCard from "@/app/(guard)/(scan)/scan-error";
import QrScanResultCard from "@/app/(guard)/(scan)/scan-result";
import SubScreenLayout from "@/components/layouts/SubScreenLayout";
import { AppButton } from "@/components/ui";
import { CheckCircle, AlertTriangle, Flashlight, FlashlightOff, Camera, Keyboard } from "lucide-react-native";
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
import { ActivityIndicator, Animated, StyleSheet, Text, TouchableOpacity, View } from "react-native";

type ScanPhase = "scanning" | "processing" | "result" | "error";

const PROCESSING_DELAY_MS = 600;

export default function ScanQrPage() {
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
  const resetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scanLineAnim = useRef(new Animated.Value(0)).current;

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
    if (!permission) {
      void requestPermission();
    } else if (!permission.granted && permission.canAskAgain) {
      void requestPermission();
    }
  }, [permission, requestPermission]);

  useEffect(() => {
    if (permission?.granted && phase === "scanning") {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(scanLineAnim, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(scanLineAnim, {
            toValue: 0,
            duration: 2000,
            useNativeDriver: true,
          }),
        ])
      );
      loop.start();
      return () => loop.stop();
    }
  }, [permission?.granted, phase, scanLineAnim]);

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
        if (parsedStudent && (parsedStudent.fullName !== "Student" || trimmed.includes(",") || trimmed.includes("\n"))) {
          const res = await verifyStudentScan({
            qrContent: trimmed,
            studentNumber: parsedStudent.studentNumber,
            fullName: parsedStudent.fullName,
            program: parsedStudent.program,
          });

          if ((res.isSuccess && res.data) || (res.data && res.data.entryStatus !== "NotFound")) {
            setStudentResult(res.data);
            setPhase("result");
            return;
          }
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

  const laserTranslateY = scanLineAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 240],
  });

  return (
    <SubScreenLayout title="Scan Pass / QR" onBack={() => router.back()}>
      <View style={styles.scannerRoot}>
        {granted ? (
          <View style={StyleSheet.absoluteFill}>
            <CameraView
              style={StyleSheet.absoluteFill}
              facing="back"
              enableTorch={torchEnabled}
              barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
              onBarcodeScanned={isScanning && !processingRef.current ? handleBarcodeScanned : undefined}
            />

            {/* Dark Mask & Viewfinder Overlay */}
            <View style={styles.maskContainer} pointerEvents="box-none">
              {/* Top Status Badge */}
              <View style={styles.topStatusContainer}>
                <View style={[styles.statusBadge, isProcessing && styles.statusBadgeProcessing]}>
                  {isProcessing ? (
                    <ActivityIndicator size="small" color="#FDB813" style={{ marginRight: 6 }} />
                  ) : (
                    <View style={styles.liveDot} />
                  )}
                  <Text style={styles.statusBadgeText}>
                    {isProcessing ? "Verifying QR Pass..." : "Ready to Scan"}
                  </Text>
                </View>
              </View>

              {/* Viewfinder Frame Target */}
              <View style={styles.viewfinderTarget}>
                {/* 4 Corner Reticles */}
                <View style={[styles.cornerBracket, styles.cornerTL]} />
                <View style={[styles.cornerBracket, styles.cornerTR]} />
                <View style={[styles.cornerBracket, styles.cornerBL]} />
                <View style={[styles.cornerBracket, styles.cornerBR]} />

                {/* Animated Scan Laser Line */}
                {isScanning && (
                  <Animated.View
                    style={[
                      styles.scanLaser,
                      {
                        transform: [{ translateY: laserTranslateY }],
                      },
                    ]}
                  />
                )}

                {/* Processing Overlay inside Viewfinder */}
                {isProcessing && (
                  <View style={styles.processingInsideViewfinder}>
                    <ActivityIndicator size="large" color="#FDB813" />
                    <Text style={styles.processingText}>Validating pass with server…</Text>
                  </View>
                )}
              </View>

              {/* Instructions */}
              <View style={styles.hintContainer}>
                <Text style={styles.hintTitle}>Align QR Code within the frame</Text>
                <Text style={styles.hintSubtitle}>Supports Vehicle Pass, Student ID & Reservations</Text>
              </View>

              {/* Bottom Actions Row */}
              <View style={styles.bottomControlsRow}>
                <TouchableOpacity
                  activeOpacity={0.8}
                  style={[styles.controlButton, torchEnabled && styles.controlButtonActive]}
                  onPress={() => setTorchEnabled((prev) => !prev)}
                >
                  {torchEnabled ? (
                    <Flashlight size={18} color="#FFFFFF" strokeWidth={2.2} />
                  ) : (
                    <FlashlightOff size={18} color="#D4D4D8" strokeWidth={2.2} />
                  )}
                  <Text style={[styles.controlButtonText, torchEnabled && styles.controlButtonTextActive]}>
                    {torchEnabled ? "Flash ON" : "Flash OFF"}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.8}
                  style={styles.controlButton}
                  onPress={() => router.push("/(guard)/manual-input")}
                >
                  <Keyboard size={18} color="#FFFFFF" strokeWidth={2.2} />
                  <Text style={styles.controlButtonText}>Manual Input</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ) : !permission ? (
          <View style={styles.centeredStateCard}>
            <ActivityIndicator size="large" color="#7B1113" />
            <Text style={styles.stateTitle}>Initializing Camera…</Text>
            <Text style={styles.stateSubtitle}>Connecting to camera hardware</Text>
          </View>
        ) : (
          <View style={styles.centeredStateCard}>
            <View style={styles.cameraIconCircle}>
              <Camera size={36} color="#7B1113" strokeWidth={2} />
            </View>
            <Text style={styles.stateTitle}>Camera Access Required</Text>
            <Text style={styles.stateSubtitle}>
              ParkFlow needs camera permission to scan parking QR passes and student ID cards at the gate.
            </Text>
            <AppButton
              label="Allow Camera Access"
              size="lg"
              className="mt-6 w-full"
              onPress={() => void requestPermission()}
            />
            <TouchableOpacity
              activeOpacity={0.8}
              style={styles.manualEntryLink}
              onPress={() => router.push("/(guard)/manual-input")}
            >
              <Text style={styles.manualEntryLinkText}>Or Enter Plate Number Manually</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </SubScreenLayout>
  );
}

const styles = StyleSheet.create({
  scannerRoot: {
    flex: 1,
    backgroundColor: "#0B0C10",
    position: "relative",
  },
  maskContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 20,
    paddingHorizontal: 20,
    backgroundColor: "rgba(0,0,0,0.3)",
  },
  topStatusContainer: {
    alignItems: "center",
    marginTop: 8,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(18, 18, 24, 0.88)",
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
  },
  statusBadgeProcessing: {
    borderColor: "rgba(253, 184, 19, 0.5)",
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#10B981",
    marginRight: 8,
  },
  statusBadgeText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  viewfinderTarget: {
    width: 270,
    height: 270,
    borderRadius: 28,
    position: "relative",
    overflow: "hidden",
    backgroundColor: "transparent",
  },
  cornerBracket: {
    position: "absolute",
    width: 32,
    height: 32,
    borderColor: "#FDB813",
  },
  cornerTL: {
    top: 0,
    left: 0,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderTopLeftRadius: 18,
  },
  cornerTR: {
    top: 0,
    right: 0,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderTopRightRadius: 18,
  },
  cornerBL: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderBottomLeftRadius: 18,
  },
  cornerBR: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomRightRadius: 18,
  },
  scanLaser: {
    position: "absolute",
    left: 12,
    right: 12,
    height: 3,
    backgroundColor: "#FDB813",
    borderRadius: 2,
    shadowColor: "#FDB813",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 8,
    elevation: 6,
  },
  processingInsideViewfinder: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.72)",
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  processingText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "600",
    marginTop: 12,
    textAlign: "center",
  },
  hintContainer: {
    alignItems: "center",
    marginVertical: 8,
  },
  hintTitle: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
    textAlign: "center",
  },
  hintSubtitle: {
    color: "#A1A1AA",
    fontSize: 12,
    fontWeight: "500",
    marginTop: 4,
    textAlign: "center",
  },
  bottomControlsRow: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
    maxWidth: 320,
    justifyContent: "center",
    marginBottom: 8,
  },
  controlButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "rgba(255, 255, 255, 0.14)",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.18)",
  },
  controlButtonActive: {
    backgroundColor: "#7B1113",
    borderColor: "#FDB813",
  },
  controlButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "600",
  },
  controlButtonTextActive: {
    color: "#FFFFFF",
  },
  centeredStateCard: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 28,
    backgroundColor: "#18181B",
  },
  cameraIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "rgba(123, 17, 19, 0.15)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "rgba(123, 17, 19, 0.3)",
  },
  stateTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 8,
  },
  stateSubtitle: {
    color: "#A1A1AA",
    fontSize: 13,
    lineHeight: 18,
    textAlign: "center",
    maxWidth: 280,
  },
  manualEntryLink: {
    marginTop: 18,
    paddingVertical: 8,
  },
  manualEntryLinkText: {
    color: "#FDB813",
    fontSize: 13,
    fontWeight: "700",
  },
});

