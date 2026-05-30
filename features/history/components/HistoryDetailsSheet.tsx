import { AppBottomSheet } from "@/components/shared";
import { ParkingHistoryResponse } from "@/features/history/types/history.types";
import { PaymentRecord } from "@/features/history/types/payment.types";
import { formatDate } from "@/utils/formatDate";
import { formatTime } from "@/utils/formatTime";
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import React, { forwardRef } from "react";
import { Text, View } from "react-native";

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
  const isParking = Boolean(log);
  const isPayment = Boolean(payment);

  const entryTime = log?.entryTime ? formatTime(log.entryTime) : "N/A";
  const entryDate = log?.entryTime ? formatDate(log.entryTime) : "N/A";
  const exitTime = log?.exitTime ? formatTime(log.exitTime) : "—";
  const exitDate = log?.exitTime ? formatDate(log.exitTime) : "";
  const plateNumber = log?.plateNumber || "N/A";
  const fullName =
    `${log?.firstName ?? ""} ${log?.lastName ?? ""}`.trim() || "N/A";
  const durationText =
    log?.exitTime && log.parkingDuration != null
      ? `${log.parkingDuration.toFixed(1)} ${log.parkingDuration === 1 ? "hour" : "hours"}`
      : "Active";

  const payDate = payment?.date ? formatDate(payment.date) : "N/A";
  const payTime = payment?.date ? formatTime(payment.date) : "N/A";

  const statusColor =
    payment?.status === "Paid"
      ? "text-light-success dark:text-dark-success"
      : payment?.status === "Pending"
        ? "text-light-warning dark:text-dark-warning"
        : "text-light-muted dark:text-dark-muted";

  const statusBg =
    payment?.status === "Paid"
      ? "bg-light-success/10 dark:bg-dark-success/10"
      : payment?.status === "Pending"
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
      {isParking && log && (
        <View className="w-full bg-light-surfaceMuted dark:bg-dark-surfaceMuted rounded-card py-5 items-center mb-6 border border-light-border/40 dark:border-dark-border">
          <Text className="font-regular uppercase tracking-wider text-[12px] mb-0.5 text-light-muted dark:text-dark-muted">
            Plate Number
          </Text>
          <Text className="text-[26px] font-black tracking-wider text-light-text dark:text-dark-text">
            {plateNumber}
          </Text>
        </View>
      )}

      {isPayment && payment && (
        <View className="w-full bg-light-surfaceMuted dark:bg-dark-surfaceMuted rounded-card py-5 items-center mb-6 border border-light-border/40 dark:border-dark-border">
          <Text className="font-regular uppercase tracking-wider text-[12px] mb-0.5 text-light-muted dark:text-dark-muted">
            Total Amount
          </Text>
          <Text className="text-[32px] font-black tracking-tight text-light-text dark:text-dark-text">
            ₱{payment.amount.toFixed(2)}
          </Text>
          <View className={`${statusBg} mt-2.5 px-2.5 py-0.5 rounded-pill`}>
            <Text
              className={`font-heavy text-[9px] uppercase tracking-wider ${statusColor}`}
            >
              {payment.status === "Paid" ? "Settled" : payment.status}
            </Text>
          </View>
        </View>
      )}

      <View className="mb-6">
        <Text className="text-[14px] font-heavy text-light-text dark:text-dark-text mb-1">
          Details
        </Text>
        <View className="px-1">
          {isParking && log && (
            <>
              {isGuardSide && <InfoRow label="Name" value={fullName} />}
              {isGuardSide && (
                <InfoRow label="Role" value={log.roleName || "N/A"} />
              )}
              <InfoRow label="Vehicle" value={`${log.brand} (${log.type})`} />
              <InfoRow label="Entry" value={`${entryTime} · ${entryDate}`} />
              <InfoRow
                label="Exit"
                value={`${exitTime} ${exitDate ? `· ${exitDate}` : ""}`}
              />
              <InfoRow label="Duration" value={durationText} />
              <InfoRow
                label="Violation"
                value={log.hasViolation ? "Yes" : "No"}
                valueColor={
                  log.hasViolation
                    ? "text-light-danger dark:text-dark-danger"
                    : "text-light-text dark:text-dark-text"
                }
                isLast
              />
            </>
          )}

          {isPayment && payment && (
            <>
              <InfoRow label="Plate Number" value={payment.plateNumber} />
              {payment.brand ? (
                <InfoRow label="Vehicle" value={`${payment.brand} ${payment.vehicleType ? `(${payment.vehicleType})` : ""}`} />
              ) : null}
              {payment.violationType ? (
                <InfoRow label="Violation Type" value={payment.violationType} />
              ) : null}
              {payment.referenceNumber ? (
                <InfoRow label="Reference No." value={payment.referenceNumber} />
              ) : null}
              <InfoRow label="Account Name" value={payment.name} />
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
