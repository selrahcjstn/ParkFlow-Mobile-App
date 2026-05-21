import { ScanResultLayout } from "@/components/layout";
import { Body } from "@/components/ui/Typography";
import { useAuthStore } from "@/store/useAuthStore";
import { useParkingLogStore } from "@/store/useParkingLogStore";
import { router } from "expo-router";
import { AlertCircle } from "lucide-react-native";
import React, { useState } from "react";

export default function QrScanConflictCard() {
  const [isProceeding, setIsProceeding] = useState(false);
  const [proceedError, setProceedError] = useState<string | null>(null);
  const { user } = useAuthStore();
  const { registerExit, conflictData, clearConflictData } =
    useParkingLogStore();

  const qrCodeHash = conflictData?.qrCodeHash;
  const plateNumber = conflictData?.plateNumber ?? "N/A";
  const brand = conflictData?.brand ?? "Unknown";
  const vehicleKind = (conflictData?.vehicleType ?? "Vehicle").toLowerCase();
  const ownerName =
    `${conflictData?.firstName ?? ""} ${conflictData?.lastName ?? ""}`.trim() ||
    "N/A";

  const handleBack = () => {
    clearConflictData();
    router.replace("/(guard)/(scan)/scan-qr");
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
      router.replace(
        `/(guard)/(scan)/QrScanExitConfirmedCard?${confirmedQuery}`,
      );
    } finally {
      setIsProceeding(false);
    }
  };

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
      ? [{ label: "Type", value: conflictData.vehicleType }]
      : []),
  ];

  // ── Warning-style header (matching confirmed card design) ──
  const statusTitle = "Exiting Vehicle";
  const statusColorClass = "text-light-warning";
  const statusIcon = (
    <AlertCircle size={56} color="#F59E0B" strokeWidth={2.5} />
  );

  const statusDescription = (
    <Body className="text-light-muted font-book text-[13px] leading-[18px] text-center">
      The{" "}
      <Body className="text-light-text font-black">
        {brand} {vehicleKind}
      </Body>{" "}
      with plate{" "}
      <Body className="text-light-text font-black">{plateNumber}</Body> is
      requesting to exit the premises.
    </Body>
  );

  const footerMessage = proceedError ? (
    <Body className="text-light-danger font-book text-center px-4 text-[13px] mb-4 leading-[18px]">
      {proceedError}
    </Body>
  ) : (
    <Body className="text-light-muted font-book text-center px-4 text-[13px] mb-4 leading-[18px]">
      By pressing the button, the vehicle is marked as exited to parking log.
    </Body>
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
      footerLabel="Process Exit"
      footerButtonVariant="primary"
      footerButtonLoading={isProceeding}
      backIconType="back"
      ownerTitle="Conflicting Vehicle"
      onBack={handleBack}
      onFooterPress={handleProceed}
    />
  );
}
