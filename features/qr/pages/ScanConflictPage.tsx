import { ScanResultLayout } from "@/components/layouts";
import { useQrStore } from "@/features/qr/store/qr.store";
import { useAuthStore } from "@/features/auth/store/auth.store";
import { router } from "expo-router";
import { AlertCircle } from "lucide-react-native";
import React, { useState } from "react";
import { Text } from "react-native";
import { useAppTheme } from "@/hooks/useAppTheme";

export default function ScanConflitPage() {
  const { colors } = useAppTheme();
  const [isProceeding, setIsProceeding] = useState(false);
  const [proceedError, setProceedError] = useState<string | null>(null);
  const { user } = useAuthStore();
  const { registerExit, conflictData, clearConflictData } =
    useQrStore();

  const qrCodeHash = conflictData?.qrCodeHash;
  const plateNumber = conflictData?.plateNumber ?? "N/A";
  const brand = conflictData?.brand ?? "Unknown";
  const vehicleKind = (conflictData?.vehicleType ?? "Vehicle").toLowerCase();
  const ownerName =
    `${conflictData?.firstName ?? ""} ${conflictData?.lastName ?? ""}`.trim() ||
    "N/A";

  const handleBack = () => {
    clearConflictData();
    router.replace("/(guard)/(scan)/scan-qr" as any);
  };

  const handleProceed = async () => {
    if (!qrCodeHash) {
      setProceedError("Missing QR code reference for exit processing.");
      return;
    }
    if (!user?.id) {
      setProceedError("User session not found.");
      return;
    }

    setIsProceeding(true);
    setProceedError(null);

    try {
      const res = await registerExit({
        qrCodeHash,
        userId: user.id,
      });

      if (!res.isSuccess || !res.data) {
        setProceedError(res.message ?? "Failed to register exit.");
        return;
      }

      clearConflictData();

      const confirmedQuery = new URLSearchParams();
      confirmedQuery.set("qrCodeHash", qrCodeHash);
      confirmedQuery.set(
        "exitPayload",
        encodeURIComponent(JSON.stringify(res.data)),
      );
      router.replace(`/(guard)/(scan)/scan-confirmed?${confirmedQuery}` as any);
    } finally {
      setIsProceeding(false);
    }
  };

  const entryMethodStr = String(conflictData?.entryMethod ?? "").toLowerCase();
  const isManual =
    entryMethodStr === "manual" ||
    entryMethodStr === "1";

  // ── Owner Info ──
  const ownerRows = [
    { label: "Name", value: ownerName },
    {
      label: "Plate Number",
      value: plateNumber,
      isHighlight: true,
    },
    ...(brand !== "Unknown" ? [{ label: "Brand", value: brand }] : []),
    ...(conflictData?.vehicleType
      ? [{ label: "Type", value: isManual ? `${conflictData.vehicleType} (Manual)` : conflictData.vehicleType }]
      : []),
    ...(isManual
      ? [{ label: "Pricing Policy", value: "₱20 Flat Rate (+₱100/day past 12 AM)" }]
      : []),
  ];

  // ── Warning-style header (matching confirmed card design) ──
  const statusTitle = isManual ? "Manual Parking Exit" : "Exiting Vehicle";
  const statusColorClass = "text-light-warning dark:text-dark-warning";
  const statusIcon = (
    <AlertCircle size={56} color={colors.warning} strokeWidth={2.5} />
  );

  const statusDescription = isManual ? (
    <Text className="text-light-muted dark:text-dark-muted font-regular text-[13px] leading-[18px] text-center">
      Manual entry pass validated for{" "}
      <Text className="text-light-text dark:text-dark-text font-bold">
        {brand} {vehicleKind}
      </Text>{" "}
      with plate{" "}
      <Text className="text-light-text dark:text-dark-text font-bold">{plateNumber}</Text>.
      Flat rate (₱20) and any overnight surcharge (₱100/day) will be calculated.
    </Text>
  ) : (
    <Text className="text-light-muted dark:text-dark-muted font-regular text-[13px] leading-[18px] text-center">
      The{" "}
      <Text className="text-light-text dark:text-dark-text font-bold">
        {brand} {vehicleKind}
      </Text>{" "}
      with plate{" "}
      <Text className="text-light-text dark:text-dark-text font-bold">{plateNumber}</Text> is
      requesting to exit the premises.
    </Text>
  );

  const footerMessage = proceedError ? (
    <Text className="text-light-danger dark:text-dark-danger font-regular text-center px-4 text-[13px] mb-4 leading-[18px]">
      {proceedError}
    </Text>
  ) : (
    <Text className="text-light-muted dark:text-dark-muted font-regular text-center px-4 text-[13px] mb-4 leading-[18px]">
      {isManual
        ? "By pressing the button, the manual session will exit and pending charges will be shown."
        : "By pressing the button, the vehicle is marked as exited to parking log."}
    </Text>
  );

  return (
    <ScanResultLayout
      ownerRows={ownerRows}
      sessionRows={[]}
      statusTitle={statusTitle}
      statusDescription={statusDescription}
      statusColorClass={statusColorClass}
      statusIcon={statusIcon}
      footerMessage={footerMessage}
      footerLabel={isManual ? "Process Manual Exit" : "Process Exit"}
      footerButtonVariant="primary"
      footerButtonLoading={isProceeding}
      backIconType="back"
      ownerTitle={isManual ? "Manual Visitor Vehicle" : "Conflicting Vehicle"}
      onBack={handleBack}
      onFooterPress={handleProceed}
    />
  );
}
