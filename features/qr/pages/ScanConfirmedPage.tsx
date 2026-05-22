import { Body } from "@/components/ui/Typography";
import { ScanResultLayout } from "@/layouts";
import type { ParkingLogExitResponse } from "@/types/parkingLog";
import { formatDateAndTime } from "@/utils/formatDataAndTime";
import { formatHours, formatPenaltyFee } from "@/utils/formatParkingValues";
import { router, useLocalSearchParams } from "expo-router";
import { AlertCircle, CheckCircle } from "lucide-react-native";

export default function ScanConfirmedPage({
  onBack,
}: { onBack?: () => void } = {}) {
  const handleBackToHome = onBack ?? (() => router.back());

  const params = useLocalSearchParams<{
    qrCodeHash?: string;
    exitPayload?: string;
  }>();

  let exitData: Partial<ParkingLogExitResponse> = {};

  try {
    exitData = params.exitPayload
      ? (JSON.parse(
          decodeURIComponent(params.exitPayload),
        ) as Partial<ParkingLogExitResponse>)
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
    <Body className="text-light-muted font-book text-[13px] leading-[18px] text-center">
      The{" "}
      <Body className="text-light-text font-black">
        {vehicleBrand} {vehicleKind}
      </Body>{" "}
      with plate{" "}
      <Body className="text-light-text font-black">{plateNumber}</Body> must
      settle charges to proceed.
    </Body>
  ) : (
    <Body className="text-light-muted font-book text-[13px] leading-[18px] text-center">
      The{" "}
      <Body className="text-light-text font-black">
        {vehicleBrand} {vehicleKind}
      </Body>{" "}
      with plate{" "}
      <Body className="text-light-text font-black">{plateNumber}</Body> is
      cleared to leave the premises.
    </Body>
  );

  const statusColorClass = hasPenalty
    ? "text-light-warning"
    : "text-light-success";
  const statusIconColor = hasPenalty ? "#F59E0B" : "#10B981";

  const statusIcon = hasPenalty ? (
    <AlertCircle size={56} color={statusIconColor} strokeWidth={2.5} />
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
        "Verify the driver’s identity before allowing the vehicle to exit."
      }
      footerLabel={footerLabel}
      onBack={handleBackToHome}
      onFooterPress={handleBackToHome}
    />
  );
}
