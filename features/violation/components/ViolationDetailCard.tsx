import DetailRow from "@/components/layouts/DetailRow";
import { Body, Caption, Title } from "@/components/ui/Typography";
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
        <Text
          style={{
            fontFamily: "AvenirBlack",
            fontSize: 18,
            color: "#18181B",
          }}
        >
          Violation Notice
        </Text>
        <View className="bg-light-danger/10 px-3 py-1 rounded-full">
          <Text
            style={{
              fontFamily: "AvenirHeavy",
              fontSize: 12,
              color: "#EF4444",
            }}
          >
            Unsettled
          </Text>
        </View>
      </View>

      <View className="px-5 pb-5">
        {/* Centered Plate Number Hero Card */}
        <View className="bg-light-background rounded-2xl px-4 py-4 items-center mb-5">
          <Caption className="font-heavy text-[11px] text-light-muted uppercase tracking-wider mb-1">
            Plate Number
          </Caption>
          <Title className="text-light-text text-[24px] font-black">
            {violation.PlateNumber}
          </Title>
        </View>

        {/* Detailed Timeline List (Borderless) */}
        <View className="mb-4">
          <Body className="text-light-text font-heavy text-[13px] mt-2 mb-2">
            Violation Details
          </Body>

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
          <Caption className="font-heavy text-[13px] text-light-muted">
            Fine Amount
          </Caption>
          <Title className="text-light-primary text-[24px]">
            ₱{violation.Amount.toFixed(2)}
          </Title>
        </View>

        {/* Disclaimer / Instruction */}
        <Text
          style={{
            fontFamily: "AvenirBook",
            fontSize: 13,
            color: "#71717A",
            lineHeight: 18,
          }}
          className="mt-4 px-1"
        >
          Please settle the penalty amount to resolve this record.{" "}
          {violation.OverstayHours > 0 && (
            <Text style={{ fontFamily: "AvenirHeavy", color: "#18181B" }}>
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
