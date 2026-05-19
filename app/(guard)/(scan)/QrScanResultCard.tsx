import { ScanResultLayout } from "@/components/layout";
import { Body } from "@/components/ui/Typography";
import { ParkingLogEntryResponse } from "@/types/parkingLog";
import { formatDateAndTime } from "@/utils/formatDataAndTime";
import { CheckCircle } from "lucide-react-native";
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
  const vehicleKind = String(result.vehicleType ?? "Vehicle").toLowerCase();

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

  // ── Fintech-style Hero Status ──
  const statusTitle = "Entry Recorded";
  const statusColorClass = "text-light-success";
  const statusIconColor = "#10B981";

  // Using nested text to properly bold the Type and Plate Number
  const statusDescription = (
    <Body className="text-light-muted font-book text-[13px] leading-[18px] text-center">
      The{" "}
      <Body className="text-light-text font-black">
        {brand} {vehicleKind}
      </Body>{" "}
      with plate{" "}
      <Body className="text-light-text font-black">{plateNumber}</Body> is
      cleared to enter the facility.
    </Body>
  );

  const statusIcon = (
    <CheckCircle size={56} color={statusIconColor} strokeWidth={2.5} />
  );

  return (
    <ScanResultLayout
      ownerRows={ownerRows}
      sessionRows={sessionRows}
      statusTitle={statusTitle}
      statusDescription={statusDescription}
      statusColorClass={statusColorClass}
      statusIcon={statusIcon}
      // Strict 1-line footer instruction
      footerMessage={
        "Verify the driver’s identity before granting access to the facility."
      }
      onBack={handleBackToHome}
      onFooterPress={handleBackToHome}
    />
  );
}
