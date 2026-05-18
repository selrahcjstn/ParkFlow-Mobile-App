import QrScanConflictCard from "@/components/shared/QrScanConflictCard";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback } from "react";

export default function ScanConflictPage() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    message?: string;
    plate?: string;
    entryTime?: string;
    name?: string;
    idNumber?: string;
    role?: string;
  }>();

  const handleCancel = useCallback(() => {
    router.replace("/(guard)/scan-qr");
  }, [router]);

  return (
    <QrScanConflictCard
      message={params.message}
      plateNumber={params.plate}
      entryTime={params.entryTime}
      parkeeName={params.name}
      idNumber={params.idNumber}
      role={params.role}
      onCancel={handleCancel}
    />
  );
}
