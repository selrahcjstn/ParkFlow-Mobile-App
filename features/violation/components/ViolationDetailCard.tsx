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
  const statusLabel = isPaid ? "Settled" : "Unsettled";

  return (
    <View className="bg-light-surface border border-light-border rounded-3xl overflow-hidden mb-6">
      {/* Violation Notice Header Banner */}
      <View className="px-5 pt-5 pb-5 flex-row justify-between items-center">
        <Text className="font-bold text-light-text text-[18px]">
          Violation Citation
        </Text>
        <View
          className={`${
            isPaid ? "bg-light-success/10" : "bg-light-danger/10"
          } px-3 py-1 rounded-full`}
        >
          <Text
            className={`font-bold ${
              isPaid ? "text-light-success" : "text-light-danger"
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
            Citation Details
          </Text>

          {violation.DriverName && (
            <View>
              <DetailRow label="Violator" value={violation.DriverName} />
            </View>
          )}

          <View>
            <DetailRow label="Violation" value={violation.ViolationType} />
          </View>

          <View>
            <DetailRow label="Issued Date" value={formattedDate} />
          </View>
          <View>
            <DetailRow label="Issued Time" value={formattedTime} />
          </View>
          {violation.IssuedBy && (
            <View>
              <DetailRow label="Issued By" value={violation.IssuedBy} />
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
              value={isPaid ? "Paid & Verified" : "Pending Settlement"}
            />
          </View>
        </View>

        {/* Fine Amount Box */}
        <View
          className={`mt-2 ${
            isPaid
              ? "bg-light-success/5 border-light-success/20"
              : "bg-light-primary/5 border-light-primary/20"
          } border rounded-2xl px-4 py-3.5 flex-row items-center justify-between`}
        >
          <Text className="font-bold text-[13px] text-light-muted">
            {isPaid ? "Settled Amount" : "Penalty Fee"}
          </Text>
          <Text
            className={`${
              isPaid ? "text-light-success" : "text-light-primary"
            } text-[24px] font-bold`}
          >
            ₱{violation.Amount.toFixed(2)}
          </Text>
        </View>

        {/* Instruction */}
        <Text
          style={{
            lineHeight: 18,
          }}
          className="text-light-muted font-regular text-[13px] mt-4 px-1"
        >
          {isPaid
            ? "This citation has been settled with security personnel and verified in the system."
            : "Please settle the penalty amount directly with security personnel to resolve this record."}{" "}
          {!isPaid && violation.OverstayHours > 0 && (
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
