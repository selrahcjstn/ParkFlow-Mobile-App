export interface ParsedStudentIdQr {
  studentNumber: string;
  fullName: string;
  program: string;
}

/**
 * Parses school-issued student ID QR code.
 * Expected format: "Student No., Full Name, Program"
 * Example: "2023-12345, Juan Dela Cruz, BS Information Technology"
 */
export function parseStudentIdQr(raw: string): ParsedStudentIdQr | null {
  if (!raw || typeof raw !== "string") return null;
  const trimmed = raw.trim();

  // Reservation passes start with RES-
  if (trimmed.toUpperCase().startsWith("RES-")) {
    return null;
  }

  // Student ID QR requires comma-separated tokens
  if (!trimmed.includes(",")) {
    return null;
  }

  const parts = trimmed.split(",").map((p) => p.trim());
  if (parts.length >= 3 && parts[0].length > 0 && parts[1].length > 0 && parts[2].length > 0) {
    return {
      studentNumber: parts[0],
      fullName: parts[1],
      program: parts.slice(2).join(", "),
    };
  }

  return null;
}
