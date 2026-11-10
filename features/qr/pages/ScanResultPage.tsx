import DriverVehiclePreview from '../components/DriverVehiclePreview';
import { ScanResultLayout } from "@/components/layouts";
import { EntryResponse } from "@/features/qr/types/qr-scan.types";
import { formatDateAndTime } from "@/utils/formatDataAndTime";
import { formatPhoneNumber } from "@/utils/formatParkingValues";
import { CheckCircle } from "lucide-react-native";
import { Linking, Text } from "react-native";
import { useAppTheme } from "@/hooks/useAppTheme";

export default function ScanResultPage({
  result,
  onScanAnother,
  onBack,
}: {
  result: EntryResponse;
  onScanAnother?: () => void;
  onBack?: () => void;
}) {
  const handleBackToHome = onBack ?? onScanAnother;

  const ownerName = `${result.firstName} ${result.lastName}`.trim();
  const plateNumber = result.plateNumber ?? "N/A";
  const brand = result.brand ?? "Unknown Brand";
  const vehicleKind = String(result.vehicleType ?? "Vehicle").toLowerCase();

  const formattedPhone = formatPhoneNumber(result.phoneNumber);
  const ownerRows = [
    { label: "Role", value: result.role ?? "N/A" },
    {
      label: "Contact No.",
      value: formattedPhone,
      onPress: formattedPhone !== "N/A"
        ? () => Linking.openURL(`tel:${encodeURIComponent(formattedPhone)}`)
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

  const { colors } = useAppTheme();

  // ── Fintech-style Hero Status ──
  const statusTitle = "Entry Recorded";
  const statusColorClass = "text-light-text dark:text-dark-success";
  const statusIconColor = colors.success;

  // Using nested text to properly bold the Type and Plate Number
  const statusDescription = (
    <Text className="text-light-muted dark:text-dark-muted font-regular text-[13px] leading-[18px] text-center">
      The{" "}
      <Text className="text-light-text dark:text-dark-text font-bold">
        {brand} {vehicleKind}
      </Text>{" "}
      with plate{" "}
      <Text className="text-light-text dark:text-dark-text font-bold">{plateNumber}</Text> is
      cleared to enter the facility.
    </Text>
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
    >
      <DriverVehiclePreview profilePictureUrl={result.profilePictureUrl} vehiclePictureUrl={result.vehiclePictureUrl}
        fullName={[result.firstName, result.lastName].filter(Boolean).join(' ')} plateNumber={result.plateNumber} brand={result.brand} vehicleType={result.vehicleType} />
    </ScanResultLayout>
  );
}
