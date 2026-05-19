import ScanResultLayout from "@/components/layout/ScanResultLayout";
import type { ParkingLogExitResponse } from "@/types/parkingLog";
import { formatDateAndTime } from "@/utils/formatDataAndTime";
import { useLocalSearchParams } from "expo-router";

function formatPenaltyFee(value?: string) {
  if (!value) return "₱0.00";
  const parsed = Number(value);
  if (Number.isNaN(parsed)) return value;
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    maximumFractionDigits: 2,
  }).format(parsed);
}

function formatHours(value?: string | number) {
  if (value === undefined || value === null || value === "") return "N/A";
  const parsed = typeof value === "number" ? value : Number(value);
  if (Number.isNaN(parsed)) return String(value);
  return `${parsed.toFixed(2)} hrs`;
}

export default function QrScanExitConfirmedCard({
  onBack,
}: { onBack?: () => void } = {}) {
  const handleBackToHome = onBack ?? (() => {});

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
    valueColorClass: hasPenalty ? "text-light-warning" : "text-light-success",
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
