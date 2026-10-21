import DriverVehiclePreview from '../components/DriverVehiclePreview';
import { ScanResultLayout } from "@/components/layouts";
import type { ExitResponse } from "@/features/qr/types/qr-scan.types";
import { formatDateAndTime } from "@/utils/formatDataAndTime";
import { formatHours, formatPenaltyFee } from "@/utils/formatParkingValues";
import { router, useLocalSearchParams } from "expo-router";
import { AlertOctagon, CheckCircle } from "lucide-react-native";
import { Text } from "react-native";
import { useAppTheme } from "@/hooks/useAppTheme";

export default function ScanConfirmedPage({
  onBack,
}: { onBack?: () => void } = {}) {
  const { colors } = useAppTheme();
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
  const referenceNumber = exitData.referenceNumber ?? exitData.ReferenceNumber;
  const hasPenalty =
    sessionFee !== undefined &&
    sessionFee !== null &&
    Number(sessionFee) > 0 &&
    Boolean(referenceNumber);

  const isChargeOnly =
    Boolean(referenceNumber?.startsWith("CHG-")) ||
    ((exitData.overstayTime || 0) === 0 && Number(sessionFee) <= 20);

  const handleFooterPress = () => {
    handleBackToHome();
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
            label: isChargeOnly ? "Reference No." : "Violation ID",
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
    ...((exitData.overstayTime || 0) > 0
      ? [
          {
            label: "Chargeable Hours",
            value: formatHours(exitData.overstayTime || 0),
          },
        ]
      : []),
    {
      label: isChargeOnly ? "PARKING CHARGE" : "CHARGE DUE",
      value: formatPenaltyFee(String(sessionFee ?? "")),
      isHighlight: true,
    },
  ];

  // ── Short, punchy dynamic text ──
  const statusTitle = hasPenalty
    ? isChargeOnly
      ? `Parking Charge Due`
      : `Exit Confirmed (Charge Due)`
    : `Exit Confirmed`;

  // Incorporating Brand, Type, and Plate securely in bold 1-line sentences
  const statusDescription = hasPenalty ? (
    <Text className="text-light-muted dark:text-dark-muted font-regular text-[13px] leading-[18px] text-center">
      The{" "}
      <Text className="text-light-text dark:text-dark-text font-bold">
        {vehicleBrand} {vehicleKind}
      </Text>{" "}
      with plate{" "}
      <Text className="text-light-text dark:text-dark-text font-bold">{plateNumber}</Text>{" "}
      {isChargeOnly
        ? "has an outstanding parking charge on record."
        : "has an outstanding citation on record."}
    </Text>
  ) : (
    <Text className="text-light-muted dark:text-dark-muted font-regular text-[13px] leading-[18px] text-center">
      The{" "}
      <Text className="text-light-text dark:text-dark-text font-bold">
        {vehicleBrand} {vehicleKind}
      </Text>{" "}
      with plate{" "}
      <Text className="text-light-text dark:text-dark-text font-bold">{plateNumber}</Text> is
      cleared to leave the premises.
    </Text>
  );

  const statusColorClass = hasPenalty
    ? isChargeOnly
      ? "text-light-primary dark:text-dark-primary"
      : "text-light-text dark:text-dark-warning"
    : "text-light-text dark:text-dark-success";
  const statusIconColor = hasPenalty
    ? isChargeOnly
      ? colors.primary
      : colors.warning
    : colors.success;

  const statusIcon = hasPenalty ? (
    <AlertOctagon size={56} color={statusIconColor} strokeWidth={2.5} />
  ) : (
    <CheckCircle size={56} color={statusIconColor} strokeWidth={2.5} />
  );

  const footerLabel = "Okay";

  return (
    <ScanResultLayout
      ownerRows={ownerRows}
      sessionRows={sessionRows}
      statusTitle={statusTitle}
      statusDescription={statusDescription}
      statusColorClass={statusColorClass}
      statusIcon={statusIcon}
      footerMessage="Verify the driver’s identity before allowing the vehicle to exit."
      footerLabel={footerLabel}
      footerButtonLoading={false}
      footerButtonVariant="primary"
      onBack={handleBackToHome}
      onFooterPress={handleFooterPress}
    >
      <DriverVehiclePreview profilePictureUrl={exitData.profilePictureUrl} vehiclePictureUrl={exitData.vehiclePictureUrl}
        fullName={[exitData.firstName, exitData.lastName].filter(Boolean).join(' ')} plateNumber={exitData.plateNumber} brand={exitData.brand} vehicleType={exitData.vehicleType} />
    </ScanResultLayout>
  );
}
