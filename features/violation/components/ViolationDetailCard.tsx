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
  return (
    <View className="bg-light-surface rounded-3xl overflow-hidden mb-6">
      {/* Violation Notice CTA Banner at the top (no background color, larger font size) */}
      <View className="px-5 pt-5 pb-5 flex-row justify-between items-center">
        <Text className="font-black text-light-text text-[18px]">
          Violation Notice
        </Text>
        <View className="bg-light-danger/10 px-3 py-1 rounded-full">
          <Text className="font-bold text-light-danger text-[12px]">
            Unsettled
          </Text>
        </View>
      </View>

      <View className="px-5 pb-5">
        {/* Centered Plate Number Hero Card */}
        <View className="bg-light-background rounded-2xl px-4 py-4 items-center mb-5">
          <Text className="font-bold text-[11px] text-light-muted uppercase tracking-wider mb-1">
            Plate Number
          </Text>
          <Text className="text-light-text text-[24px] font-black">
            {violation.PlateNumber}
          </Text>
        </View>

        {/* Detailed Timeline List (Borderless) */}
        <View className="mb-4">
          <Text className="text-light-text font-bold text-[13px] mt-2 mb-2">
            Violation Details
          </Text>

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
        </View>

        {/* Elegant Fine Amount Box with Border */}
        <View className="mt-2 bg-light-primary/5 border border-light-primary/20 rounded-2xl px-4 py-3.5 flex-row items-center justify-between">
          <Text className="font-bold text-[13px] text-light-muted">
            Fine Amount
          </Text>
          <Text className="text-light-primary text-[24px] font-black">
            ₱{violation.Amount.toFixed(2)}
          </Text>
        </View>

        {/* Disclaimer / Instruction */}
        <Text
          style={{
            lineHeight: 18,
          }}
          className="text-light-muted font-regular text-[13px] mt-4 px-1"
        >
          Please settle the penalty amount to resolve this record.{" "}
          {violation.OverstayHours > 0 && (
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
