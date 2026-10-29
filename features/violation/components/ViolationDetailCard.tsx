import DetailRow from "@/components/layouts/DetailRow";
import { HasViolationNotificationDto } from "@/features/violation/types/violation.types";
import React from "react";
import { Text, View } from "react-native";

interface ViolationDetailCardProps {
  violation: HasViolationNotificationDto;
  formattedDate: string;
  formattedTime: string;
}

export default function ViolationDetailCard({
  violation,
  formattedDate,
  formattedTime,
}: ViolationDetailCardProps) {
  const isPaid =
    violation.IsPaid === true ||
    violation.SettlementStatus === "Settled" ||
    violation.SettlementStatus === "Paid";
  const isChargeOnly =
    Boolean(violation.ViolationType?.includes("Charge")) ||
    Boolean(violation.ReferenceNumber?.startsWith("CHG-")) ||
    Boolean(violation.RefNumber?.startsWith("CHG-"));
  const isReceipt =
    !violation.IsViolation ||
    violation.ViolationType === "Normal Exit" ||
    violation.ViolationType === "Campus Parking Exit" ||
    violation.ViolationType === "Reservation Parking Exit";
  const statusLabel = isReceipt
    ? "Exit Confirmed"
    : isPaid
    ? "Settled"
    : isChargeOnly
    ? "Unpaid Charge"
    : "Unsettled";

  return (
    <View className="bg-light-surface border border-light-border rounded-3xl overflow-hidden mb-6">
      {/* Header Banner */}
      <View className="px-5 pt-5 pb-5 flex-row justify-between items-center">
        <Text className="font-bold text-light-text text-[18px]">
          {isReceipt
            ? "Parking Receipt"
            : isPaid
            ? "Payment Receipt"
            : isChargeOnly
            ? "Parking Charge"
            : "Violation Citation"}
        </Text>
        <View
          className={`${
            isReceipt || isPaid
              ? "bg-light-success/10"
              : isChargeOnly
              ? "bg-light-primary/10"
              : "bg-light-danger/10"
          } px-3 py-1 rounded-full`}
        >
          <Text
            className={`font-bold ${
              isReceipt || isPaid
                ? "text-light-text"
                : isChargeOnly
                ? "text-light-primary"
                : "text-light-text"
            } text-[12px]`}
          >
            {statusLabel}
          </Text>
        </View>
      </View>

      <View className="px-5 pb-5">
        {/* Centered Plate Number Hero Card */}
        <View className="bg-light-background rounded-2xl px-4 py-4 items-center mb-5">
          <Text className="font-bold text-[11px] text-light-muted uppercase tracking-wider mb-1">
            Plate Number
          </Text>
          <Text className="text-light-text text-[24px] font-bold">
            {violation.PlateNumber}
          </Text>
          {violation.Brand && (
            <Text className="text-light-muted font-bold text-[12px] mt-0.5">
              {violation.Brand}{" "}
              {violation.VehicleType ? `• ${violation.VehicleType}` : ""}
            </Text>
          )}
        </View>

        {/* Detailed Timeline List (Borderless) */}
        <View className="mb-4">
          <Text className="text-light-text font-bold text-[13px] mt-2 mb-2">
            {isReceipt
              ? "Receipt Details"
              : isPaid
              ? "Payment Details"
              : isChargeOnly
              ? "Charge Details"
              : "Citation Details"}
          </Text>

          {violation.DriverName && (
            <View>
              <DetailRow
                label={isReceipt || isChargeOnly ? "Driver" : "Violator"}
                value={violation.DriverName}
              />
            </View>
          )}

          <View>
            <DetailRow
              label={isReceipt || isChargeOnly ? "Activity" : "Violation"}
              value={isReceipt ? "Campus Parking Exit" : violation.ViolationType}
            />
          </View>

          <View>
            <DetailRow
              label={isReceipt ? "Exit Date" : isChargeOnly ? "Date" : "Issued Date"}
              value={formattedDate}
            />
          </View>
          <View>
            <DetailRow
              label={isReceipt ? "Exit Time" : isChargeOnly ? "Time" : "Issued Time"}
              value={formattedTime}
            />
          </View>
          {violation.IssuedBy && (
            <View>
              <DetailRow
                label={isReceipt ? "Gate Officer" : isChargeOnly ? "Processed By" : "Issued By"}
                value={violation.IssuedBy}
              />
            </View>
          )}
          <View>
            <DetailRow
              label="Reference No."
              value={violation.ReferenceNumber || violation.RefNumber}
            />
          </View>
          <View>
            <DetailRow
              label="Settlement Status"
              value={
                isReceipt
                  ? "Exit Recorded"
                  : isPaid
                  ? "Paid & Verified"
                  : "Pending Settlement"
              }
            />
          </View>
        </View>

        {/* Amount Box */}
        <View
          className={`mt-2 ${
            isReceipt || isPaid
              ? "bg-light-success/5 border-light-success/20"
              : "bg-light-primary/5 border-light-primary/20"
          } border rounded-2xl px-4 py-3.5 flex-row items-center justify-between`}
        >
          <Text className="font-bold text-[13px] text-light-muted">
            {isReceipt ? "Parking Fee" : isPaid ? "Settled Amount" : isChargeOnly ? "Charge Due" : "Penalty Fee"}
          </Text>
          <Text
            className={`${
              isReceipt || isPaid ? "text-light-text" : "text-light-primary"
            } text-[24px] font-bold`}
          >
            {isReceipt && violation.Amount === 0 ? "₱0.00" : `₱${violation.Amount.toFixed(2)}`}
          </Text>
        </View>

        {/* Instruction */}
        <Text
          style={{
            lineHeight: 18,
          }}
          className="text-light-muted font-regular text-[13px] mt-4 px-1"
        >
          {isReceipt
            ? "Your vehicle exit has been recorded at the campus gate. Safe travels!"
            : isPaid
            ? isChargeOnly
              ? "This parking charge has been settled and verified in the system."
              : "This citation has been settled and verified in the system."
            : isChargeOnly
            ? "Please settle the parking charge with campus administration to resolve this record."
            : "Please settle the penalty amount with campus administration to resolve this record."}{" "}
          {!isPaid && !isReceipt && violation.OverstayHours > 0 && (
            <Text className="font-bold" style={{ color: "#18181B" }}>
              Limit exceeded by{" "}
              {violation.OverstayHours % 1 === 0
                ? violation.OverstayHours.toString()
                : violation.OverstayHours.toFixed(1)}{" "}
              {violation.OverstayHours === 1 ? "hour" : "hours"}.
            </Text>
          )}
        </Text>
      </View>
    </View>
  );
}
