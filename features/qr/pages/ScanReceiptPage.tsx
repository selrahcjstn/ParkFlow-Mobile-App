import { ScanResultLayout } from "@/components/layouts";
import type { ProcessPaymentResponse } from "@/features/qr/types/qr-scan.types";
import { formatDateAndTime } from "@/utils/formatDataAndTime";
import { formatPenaltyFee } from "@/utils/formatParkingValues";
import { router, useLocalSearchParams } from "expo-router";
import { BadgeCheck } from "lucide-react-native";
import React from "react";
import { Text } from "react-native";

export default function ScanReceiptPage() {
  const params = useLocalSearchParams<{
    receiptPayload?: string;
  }>();

  let receiptData: Partial<ProcessPaymentResponse> = {};

  try {
    receiptData = params.receiptPayload
      ? (JSON.parse(
          decodeURIComponent(params.receiptPayload),
        ) as Partial<ProcessPaymentResponse>)
      : {};
  } catch {
    receiptData = {};
  }

  const ownerRows = [
    {
      label: "Name",
      value: `${receiptData.ownerFirstName ?? ""} ${receiptData.ownerLastName ?? ""}`.trim() || "N/A",
    },
    {
      label: "Vehicle",
      value: `${receiptData.vehicleBrand ?? ""} ${receiptData.vehicleType ?? ""}`.trim() || "N/A",
    },
    {
      label: "Plate Number",
      value: receiptData.plateNumber ?? "N/A",
    },
  ];

  const sessionRows = [
    {
      label: "Violation ID",
      value: receiptData.referenceNumber ?? "N/A",
    },
    {
      label: "Violation Type",
      value: receiptData.violationType ?? "Parking Overstay",
    },
    {
      label: "Status",
      value: receiptData.settlementStatus ?? "Paid",
    },
    {
      label: "Paid At",
      value: receiptData.paidAt ? formatDateAndTime(receiptData.paidAt) : "N/A",
    },
    {
      label: "Processed By",
      value: receiptData.guardName ?? "N/A",
    },
    {
      label: "AMOUNT PAID",
      value: formatPenaltyFee(String(receiptData.penaltyFee ?? "")),
      isHighlight: true,
    },
  ];

  const statusTitle = "Payment Settled";
  const statusColorClass = "text-light-success";
  const statusIconColor = "#10B981";

  const statusIcon = (
    <BadgeCheck size={56} color={statusIconColor} strokeWidth={2.2} />
  );

  const statusDescription = (
    <Text className="text-light-muted font-regular text-[13px] leading-[18px] text-center">
      The overstay citation for the{" "}
      <Text className="text-light-text font-black">
        {receiptData.vehicleBrand ?? ""} {receiptData.vehicleType ?? ""}
      </Text>{" "}
      with plate{" "}
      <Text className="text-light-text font-black">{receiptData.plateNumber ?? "N/A"}</Text> has been successfully settled. The vehicle is cleared to exit the premises.
    </Text>
  );

  const handleReturnToScanner = () => {
    router.replace("/(guard)/(scan)/scan-qr" as any);
  };

  return (
    <ScanResultLayout
      ownerRows={ownerRows}
      sessionRows={sessionRows}
      statusTitle={statusTitle}
      statusDescription={statusDescription}
      statusColorClass={statusColorClass}
      statusIcon={statusIcon}
      footerMessage="Verify the driver’s identity and receipt details before allowing exit."
      footerLabel="Return to Scanner"
      backIconType="close"
      sessionTitle="Receipt & Payment Details"
      onBack={handleReturnToScanner}
      onFooterPress={handleReturnToScanner}
    />
  );
}
