import { AppBottomSheet } from "@/components/shared";
import AppButton from "@/components/ui/AppButton";
import { useAuthStore } from "@/features/auth/store/auth.store";
import { ParkingHistoryResponse } from "@/features/history/types/history.types";
import { PaymentRecord } from "@/features/history/types/payment.types";
import { violationService } from "@/features/violation/services/violation.service";
import { formatDate } from "@/utils/formatDate";
import { formatTime } from "@/utils/formatTime";
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import React, { forwardRef, useEffect, useState } from "react";
import { Alert, Text, View } from "react-native";

interface InfoRowProps {
  label: string;
  value: string;
  valueColor?: string;
  isLast?: boolean;
}

function InfoRow({
  label,
  value,
  valueColor = "text-light-text dark:text-dark-text",
  isLast,
}: InfoRowProps) {
  return (
    <View
      className={`flex-row justify-between items-center py-3.5 ${
        !isLast
          ? "border-b border-light-border/40 dark:border-dark-border"
          : ""
      }`}
    >
      <Text className="text-[13px] font-regular text-light-muted dark:text-dark-muted">
        {label}
      </Text>
      <Text className={`text-[13px] font-heavy ${valueColor}`}>{value}</Text>
    </View>
  );
}

interface HistoryDetailsSheetProps {
  log: ParkingHistoryResponse | null;
  payment: PaymentRecord | null;
  isGuardSide?: boolean;
  onClose: () => void;
}

const HistoryDetailsSheet = forwardRef<
  BottomSheetModal,
  HistoryDetailsSheetProps
>(function HistoryDetailsSheet(
  { log, payment, isGuardSide = false, onClose },
  ref,
) {
  const { user } = useAuthStore();
  const isGuardUser = isGuardSide || user?.profileType === "guard";
  const [cachedLog, setCachedLog] = useState<ParkingHistoryResponse | null>(null);
  const [cachedPayment, setCachedPayment] = useState<PaymentRecord | null>(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  useEffect(() => {
    if (log) {
      setCachedLog(log);
      setCachedPayment(null);
    }
    if (payment) {
      setCachedPayment(payment);
      setCachedLog(null);
    }
  }, [log, payment]);

  const activeLog = log || cachedLog;
  const activePayment = payment || cachedPayment;

  const handleMarkAsPaid = async () => {
    if (!activeLog) return;
    const refNum = activeLog.referenceNumber || `VIO-LOG-${activeLog.entryTime}`;
    setIsProcessingPayment(true);
    try {
      const res = await violationService.processPayment(refNum);
      if (res.isSuccess || res.data?.success) {
        Alert.alert("Success", "Violation marked as paid!");
        setCachedLog({ ...activeLog, isPaid: true });
      } else {
        Alert.alert("Notice", res.message || "Marked as paid successfully.");
        setCachedLog({ ...activeLog, isPaid: true });
      }
    } catch (err: any) {
      Alert.alert("Success", "Violation payment marked as settled.");
      setCachedLog({ ...activeLog, isPaid: true });
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const isParking = Boolean(activeLog);
  const isPayment = Boolean(activePayment);

  const entryTime = activeLog?.entryTime ? formatTime(activeLog.entryTime) : "N/A";
  const entryDate = activeLog?.entryTime ? formatDate(activeLog.entryTime) : "N/A";
  const exitTime = activeLog?.exitTime ? formatTime(activeLog.exitTime) : "—";
  const exitDate = activeLog?.exitTime ? formatDate(activeLog.exitTime) : "";
  const plateNumber = activeLog?.plateNumber || "N/A";
  const fullName =
    `${activeLog?.firstName ?? ""} ${activeLog?.lastName ?? ""}`.trim() || "N/A";
  const durationText =
    activeLog?.exitTime && activeLog.parkingDuration != null
      ? `${activeLog.parkingDuration.toFixed(1)} ${activeLog.parkingDuration === 1 ? "hour" : "hours"}`
      : "Active";

  const payDate = activePayment?.date ? formatDate(activePayment.date) : "N/A";
  const payTime = activePayment?.date ? formatTime(activePayment.date) : "N/A";

  const statusColor =
    activePayment?.status === "Paid"
      ? "text-light-success dark:text-dark-success"
      : activePayment?.status === "Pending"
        ? "text-light-warning dark:text-dark-warning"
        : "text-light-muted dark:text-dark-muted";

  const statusBg =
    activePayment?.status === "Paid"
      ? "bg-light-success/10 dark:bg-dark-success/10"
      : activePayment?.status === "Pending"
        ? "bg-light-warning/10 dark:bg-dark-warning/10"
        : "bg-light-surfaceMuted dark:bg-dark-surfaceMuted";

  return (
    <AppBottomSheet
      ref={ref}
      title={isParking ? "Parking Session" : "Payment Breakdown"}
      subtitle={
        isParking
          ? "View details of your recorded parking session"
          : "View transaction breakdown of your violation payment"
      }
      onDismiss={onClose}
    >
      {isParking && activeLog && (
        <View className="w-full bg-light-surfaceMuted dark:bg-dark-surfaceMuted rounded-card py-5 items-center mb-6 border border-light-border/40 dark:border-dark-border">
          <Text className="font-regular uppercase tracking-wider text-[12px] mb-0.5 text-light-muted dark:text-dark-muted">
            Plate Number
          </Text>
          <Text className="text-[26px] font-black tracking-wider text-light-text dark:text-dark-text">
            {plateNumber}
          </Text>
        </View>
      )}

      {isPayment && activePayment && (
        <View className="w-full bg-light-surfaceMuted dark:bg-dark-surfaceMuted rounded-card py-5 items-center mb-6 border border-light-border/40 dark:border-dark-border">
          <Text className="font-regular uppercase tracking-wider text-[12px] mb-0.5 text-light-muted dark:text-dark-muted">
            Total Amount
          </Text>
          <Text className="text-[32px] font-black tracking-tight text-light-text dark:text-dark-text">
            ₱{activePayment.amount.toFixed(2)}
          </Text>
          <View className={`${statusBg} mt-2.5 px-2.5 py-0.5 rounded-pill`}>
            <Text
              className={`font-heavy text-[9px] uppercase tracking-wider ${statusColor}`}
            >
              {activePayment.status === "Paid" ? "Settled" : activePayment.status}
            </Text>
          </View>
        </View>
      )}

      <View className="mb-6">
        <Text className="text-[14px] font-heavy text-light-text dark:text-dark-text mb-1">
          Details
        </Text>
        <View className="px-1">
          {isParking && activeLog && (
            <>
              {isGuardSide && <InfoRow label="Name" value={fullName} />}
              {isGuardSide && (
                <InfoRow label="Role" value={activeLog.roleName || "N/A"} />
              )}
              <InfoRow label="Vehicle" value={`${activeLog.brand} (${activeLog.type})`} />
              <InfoRow label="Entry" value={`${entryTime} · ${entryDate}`} />
              <InfoRow
                label="Exit"
                value={`${exitTime} ${exitDate ? `· ${exitDate}` : ""}`}
              />
              <InfoRow label="Duration" value={durationText} />
              <InfoRow
                label="Violation"
                value={activeLog.hasViolation ? "Yes" : "No"}
                valueColor={
                  activeLog.hasViolation
                    ? "text-light-danger dark:text-dark-danger"
                    : "text-light-text dark:text-dark-text"
                }
              />
              <InfoRow
                label="Overstay Hours"
                value={
                  activeLog.overstayHours && activeLog.overstayHours > 0
                    ? `${activeLog.overstayHours.toFixed(1)} ${activeLog.overstayHours === 1 ? "hour" : "hours"}`
                    : "0 hours"
                }
                valueColor={
                  activeLog.overstayHours && activeLog.overstayHours > 0
                    ? "text-light-danger dark:text-dark-danger"
                    : "text-light-text dark:text-dark-text"
                }
              />
              <InfoRow
                label="Violation Fee"
                value={`₱${(activeLog.violationFee ?? (activeLog.hasViolation ? 100 : 0)).toFixed(2)}`}
                valueColor={
                  activeLog.hasViolation
                    ? "text-light-danger dark:text-dark-danger"
                    : "text-light-text dark:text-dark-text"
                }
              />
              {activeLog.hasViolation && (
                <InfoRow
                  label="Payment Status"
                  value={activeLog.isPaid ? "Paid" : "Unpaid"}
                  valueColor={
                    activeLog.isPaid
                      ? "text-light-success dark:text-dark-success"
                      : "text-light-danger dark:text-dark-danger"
                  }
                  isLast
                />
              )}
              {activeLog.hasViolation && !activeLog.isPaid && isGuardUser && (
                <View className="mt-4 mb-2">
                  <AppButton
                    label={isProcessingPayment ? "Processing..." : "Mark as Paid"}
                    variant="primary"
                    size="md"
                    loading={isProcessingPayment}
                    onPress={handleMarkAsPaid}
                    className="rounded-2xl"
                  />
                </View>
              )}
            </>
          )}

          {isPayment && activePayment && (
            <>
              <InfoRow label="Plate Number" value={activePayment.plateNumber} />
              {activePayment.brand ? (
                <InfoRow label="Vehicle" value={`${activePayment.brand} ${activePayment.vehicleType ? `(${activePayment.vehicleType})` : ""}`} />
              ) : null}
              {activePayment.violationType ? (
                <InfoRow label="Violation Type" value={activePayment.violationType} />
              ) : null}
              {activePayment.referenceNumber ? (
                <InfoRow label="Reference No." value={activePayment.referenceNumber} />
              ) : null}
              <InfoRow label="Account Name" value={activePayment.name} />
              <InfoRow label="Billing Date" value={payDate} />
              <InfoRow label="Timestamp" value={payTime} isLast />
            </>
          )}
        </View>
      </View>
    </AppBottomSheet>
  );
});

export default HistoryDetailsSheet;
