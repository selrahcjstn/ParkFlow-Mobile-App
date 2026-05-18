import QrScanConflictCard from "@/components/shared/QrScanConflictCard";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback } from "react";

export default function ScanConflictPage() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const handleResolve = useCallback(() => {
    // placeholder: navigate to resolve screen or re-scan
    router.replace("/(guard)/scan-qr");
  }, [router]);

  return (
    <QrScanConflictCard
      message={(params as any).message}
      plateNumber={(params as any).plate}
      entryTime={(params as any).entryTime}
      onResolve={handleResolve}
    />
  );
}
