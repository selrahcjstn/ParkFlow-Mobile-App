import ScanResultLayout from "@/components/layout/ScanResultLayout";
import { ParkingLogEntryResponse } from "@/types/parkingLog";
import { formatDateAndTime } from "@/utils/formatDataAndTime";
import { Linking } from "react-native";

export default function QrScanResultCard({
  result,
  onScanAnother,
  onBack,
}: {
  result: ParkingLogEntryResponse;
  onScanAnother?: () => void;
  onBack?: () => void;
}) {
  const handleBackToHome = onBack ?? onScanAnother;

  const ownerName = `${result.firstName} ${result.lastName}`.trim();
  const plateNumber = result.plateNumber ?? "N/A";
  const brand = result.brand ?? "Unknown Brand";
  const vehicleType = result.vehicleType ?? "Unknown Type";

  const ownerRows = [
    { label: "Name", value: ownerName || "Unknown" },
    { label: "Role", value: result.role ?? "N/A" },
    {
      label: "Contact No.",
      value: result.phoneNumber ?? "N/A",
      onPress: result.phoneNumber
        ? () => Linking.openURL(`tel:${encodeURIComponent(result.phoneNumber)}`)
        : undefined,
    },
  ];

  const sessionRows = [
    { label: "Entry Time", value: formatDateAndTime(result.entryTime) },
    {
      label: "Must Exit Before",
      value: result.maximumExitTime
        ? formatDateAndTime(result.maximumExitTime)
        : "No limit set",
    },
  ];

  const statusRow = {
    label: "Status",
    value: "Entry Recorded",
    isHighlight: true,
    valueColorClass: "text-light-success",
  };

  return (
    <ScanResultLayout
      plateNumber={plateNumber}
      subText={`${brand} • ${vehicleType}`}
      ownerRows={ownerRows}
      sessionRows={sessionRows}
      statusRow={statusRow}
      footerMessage={
        "Please verify the owner's identity and vehicle details before granting access."
      }
      onBack={handleBackToHome}
      onFooterPress={handleBackToHome}
    />
  );
}
