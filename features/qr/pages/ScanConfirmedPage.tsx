import { ScanResultLayout } from "@/components/layouts";
import type { ExitResponse } from "@/features/qr/types/qr-scan.types";
import { formatDateAndTime } from "@/utils/formatDataAndTime";
import { formatHours, formatPenaltyFee } from "@/utils/formatParkingValues";
import { router, useLocalSearchParams } from "expo-router";
import { AlertOctagon, CheckCircle } from "lucide-react-native";
import { Text } from "react-native";
import { useState } from "react";
import { useApiMutation } from "@/hooks";
import { scanService } from "@/features/qr/services/scan.service";

export default function ScanConfirmedPage({
  onBack,
}: { onBack?: () => void } = {}) {
  const handleBackToHome = onBack ?? (() => router.back());

  const params = useLocalSearchParams<{
    qrCodeHash?: string;
    exitPayload?: string;
  }>();

  let exitData: Partial<ExitResponse> = {};

  try {
    exitData = params.exitPayload
      ? (JSON.parse(
          decodeURIComponent(params.exitPayload),
        ) as Partial<ExitResponse>)
      : {};
  } catch {
    exitData = {};
  }

  const plateNumber = exitData.plateNumber ?? "N/A";
  const vehicleBrand = exitData.brand ?? "N/A";
  const vehicleKind = (exitData.vehicleType ?? "Vehicle").toLowerCase();
  const sessionFee = exitData.penaltyFee;
  const hasPenalty =
    sessionFee !== undefined && sessionFee !== null && Number(sessionFee) > 0;

  const { run: processPayment, isLoading: isProcessingPayment } = useApiMutation(
    scanService.processPayment,
  );
  const [errorText, setErrorText] = useState<string | null>(null);

  const referenceNumber = exitData.referenceNumber ?? exitData.ReferenceNumber;

  const handleFooterPress = async () => {
    if (!hasPenalty) {
      handleBackToHome();
      return;
    }
    if (!referenceNumber) {
      setErrorText("Violation reference number is missing.");
      return;
    }
    try {
      setErrorText(null);
      const res = await processPayment({ referenceNumber });
      if (res?.isSuccess && res?.data) {
        const receiptQuery = new URLSearchParams();
        receiptQuery.set("receiptPayload", encodeURIComponent(JSON.stringify(res.data)));
        router.replace(`/(guard)/(scan)/scan-receipt?${receiptQuery}` as any);
      } else {
        setErrorText(res?.message || "Failed to verify and process payment.");
      }
    } catch (err: any) {
      setErrorText(err?.message || "An unexpected error occurred while processing payment.");
    }
  };

  const ownerRows = [
    {
      label: "Name",
      value:
        `${exitData.firstName ?? ""} ${exitData.lastName ?? ""}`.trim() ||
        "N/A",
    },
    { label: "Role", value: exitData.role ?? "N/A" },
  ];

  const sessionRows = [
    ...(hasPenalty && referenceNumber
      ? [
          {
            label: "Violation ID",
            value: referenceNumber,
          },
        ]
      : []),
    {
      label: "Entry Time",
      value: exitData.entryTime ? formatDateAndTime(exitData.entryTime) : "N/A",
    },
    {
      label: "Exit Time",
      value: exitData.exitTime ? formatDateAndTime(exitData.exitTime) : "N/A",
    },
    {
      label: "Chargeable Hours",
      value: formatHours(exitData.overstayTime || 0),
    },
    {
      label: "CHARGE",
      value: formatPenaltyFee(String(sessionFee ?? "")),
      isHighlight: true,
    },
  ];

  // ── Short, punchy dynamic text ──
  const statusTitle = hasPenalty ? `Payment Required` : `Exit Confirmed`;

  // Incorporating Brand, Type, and Plate securely in bold 1-line sentences
  const statusDescription = hasPenalty ? (
    <Text className="text-light-muted dark:text-dark-muted font-regular text-[13px] leading-[18px] text-center">
      The{" "}
      <Text className="text-light-text dark:text-dark-text font-black">
        {vehicleBrand} {vehicleKind}
      </Text>{" "}
      with plate{" "}
      <Text className="text-light-text dark:text-dark-text font-black">{plateNumber}</Text> must
      settle charges to proceed.
    </Text>
  ) : (
    <Text className="text-light-muted dark:text-dark-muted font-regular text-[13px] leading-[18px] text-center">
      The{" "}
      <Text className="text-light-text dark:text-dark-text font-black">
        {vehicleBrand} {vehicleKind}
      </Text>{" "}
      with plate{" "}
      <Text className="text-light-text dark:text-dark-text font-black">{plateNumber}</Text> is
      cleared to leave the premises.
    </Text>
  );

  const statusColorClass = hasPenalty
    ? "text-light-danger"
    : "text-light-success";
  const statusIconColor = hasPenalty ? "#D22730" : "#10B981";

  const statusIcon = hasPenalty ? (
    <AlertOctagon size={56} color={statusIconColor} strokeWidth={2.5} />
  ) : (
    <CheckCircle size={56} color={statusIconColor} strokeWidth={2.5} />
  );

  // Dynamically change the primary button text based on penalty status
  const footerLabel = hasPenalty ? "Verify Payment" : "Okay";

  return (
    <ScanResultLayout
      ownerRows={ownerRows}
      sessionRows={sessionRows}
      statusTitle={statusTitle}
      statusDescription={statusDescription}
      statusColorClass={statusColorClass}
      statusIcon={statusIcon}
      footerMessage={
        errorText ? (
          <Text className="text-light-danger font-regular text-center px-4 text-[13px] mb-4 leading-[18px]">
            {errorText}
          </Text>
        ) : (
          "Verify the driver’s identity before allowing the vehicle to exit."
        )
      }
      footerLabel={footerLabel}
      footerButtonLoading={isProcessingPayment}
      footerButtonVariant={hasPenalty ? "danger" : "primary"}
      onBack={handleBackToHome}
      onFooterPress={handleFooterPress}
    />
  );
}
