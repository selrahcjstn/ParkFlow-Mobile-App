import { ScanResultLayout } from "@/components/layouts";
import { useQrStore } from "@/features/qr/store/qr.store";
import { useAuthStore } from "@/features/auth/store/auth.store";
import { router } from "expo-router";
import { AlertCircle } from "lucide-react-native";
import React, { useState } from "react";
import { Text } from "react-native";

export default function ScanConflitPage() {
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
    <Text className="text-light-muted font-regular text-[13px] leading-[18px] text-center">
      The{" "}
      <Text className="text-light-text font-black">
        {brand} {vehicleKind}
      </Text>{" "}
      with plate{" "}
      <Text className="text-light-text font-black">{plateNumber}</Text> is
      requesting to exit the premises.
    </Text>
  );

  const footerMessage = proceedError ? (
    <Text className="text-light-danger font-regular text-center px-4 text-[13px] mb-4 leading-[18px]">
      {proceedError}
    </Text>
  ) : (
    <Text className="text-light-muted font-regular text-center px-4 text-[13px] mb-4 leading-[18px]">
      By pressing the button, the vehicle is marked as exited to parking log.
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
