import type { QrScanResult } from "@/types/qrScan";

function formatEntryTime(date: Date): string {
  let hours = date.getHours();
  const minutes = date.getMinutes();
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12 || 12;
  const mins = minutes.toString().padStart(2, "0");
  return `${hours}:${mins} ${ampm}`;
}

function formatEntryDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

/** Static parkee payload shown after a successful scan (API wiring comes later). */
export function buildStaticQrScanResult(qrCodeHash: string): QrScanResult {
  const now = new Date();

  return {
    qrCodeHash,
    parkeeName: "Juan Dela Cruz",
    idNumber: "2021-00456",
    plateNumber: "ABC 1234",
    vehicleBrand: "Honda Click",
    role: "Student",
    course: "BSCS",
    entryTime: formatEntryTime(now),
    entryDate: formatEntryDate(now),
    parkingLogId: "mock-log-001",
    status: "Active",
  };
}
