import { ScanResultLayout } from "@/components/layout";
import type { ParkingLogExitResponse } from "@/types/parkingLog";
import { formatDateAndTime } from "@/utils/formatDataAndTime";
import { formatHours, formatPenaltyFee } from "@/utils/formatParkingValues";
import { router, useLocalSearchParams } from "expo-router";

export default function QrScanExitConfirmedCard({
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

  const vehicleBrand = exitData.brand ?? "N/A";
  const vehicleKind = exitData.vehicleType ?? "N/A";
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

  const statusRow = {
    label: "Status",
    value: hasPenalty ? "Exit with Penalty" : "Exit Confirmed",
    isHighlight: true,
    valueColor: "#34D399",
  };

  return (
    <ScanResultLayout
      plateNumber={exitData.plateNumber ?? "N/A"}
      subText={`${vehicleBrand} • ${vehicleKind}`}
      ownerRows={ownerRows}
      sessionRows={sessionRows}
      statusRow={statusRow}
      footerMessage={
        "Please verify the details. The user will receive the payment prompt on their screen."
      }
      onBack={handleBackToHome}
      onFooterPress={handleBackToHome}
    />
  );
}
