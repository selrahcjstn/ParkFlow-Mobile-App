import DriverVehiclePreview from '../components/DriverVehiclePreview';
import { ScanResultLayout } from "@/components/layouts";
import type { ExitResponse } from "@/features/qr/types/qr-scan.types";
import { formatDateAndTime } from "@/utils/formatDataAndTime";
import { formatHours } from "@/utils/formatParkingValues";
import { router, useLocalSearchParams } from "expo-router";
import { CheckCircle } from "lucide-react-native";
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
  const handleFooterPress = () => {
    handleBackToHome();
  };

  const ownerRows = [
    { label: "Role", value: exitData.role ?? "N/A" },
    { label: "Amount", value: `₱${Number(exitData.penaltyFee ?? 0).toFixed(2)}` },
    { label: "Payment", value: (exitData.penaltyFee ?? 0) > 0 && exitData.settlementStatus !== 'Settled' ? 'Pending — collect from Collections' : 'No payment due' },
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
    ...((exitData.overstayTime || 0) > 0
      ? [
          {
            label: "Overstay Hours",
            value: formatHours(exitData.overstayTime || 0),
          },
        ]
      : []),
  ];

  const statusTitle = "Exit Confirmed";
  const statusDescription = <Text className="text-light-muted dark:text-dark-muted text-center">
    The {vehicleBrand} {vehicleKind} with plate {plateNumber} is cleared to leave the premises.
  </Text>;
  const statusColorClass = "text-light-text dark:text-dark-success";
  const statusIcon = <CheckCircle size={56} color={colors.success} strokeWidth={2.5} />;

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
