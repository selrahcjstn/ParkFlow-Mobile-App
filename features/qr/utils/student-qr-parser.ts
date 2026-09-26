export interface ParsedStudentIdQr {
  studentNumber: string;
  fullName: string;
  program: string;
}

function stripLabel(text: string): string {
  if (!text) return "";
  return text
    .replace(
      /^(?:student\s*(?:no\.?|number|id)|id\s*(?:no\.?|number)?|full\s*name|name|program|course|department)\s*[:=-]?\s*/i,
      "",
    )
    .trim();
}

/**
 * Parses school-issued student ID QR code.
 * Supports:
 * - Comma-separated: "2023-12345, Juan Dela Cruz, BS Information Technology"
 * - Newline-separated: "2023-12345\nJuan Dela Cruz\nBS Information Technology"
 * - Labeled: "Student No: 2023-12345\nName: Juan Dela Cruz\nProgram: BS IT"
 * - Pipe/Semicolon: "2023-12345 | Juan Dela Cruz | BS IT"
 * - 2-part: "2023-12345, Juan Dela Cruz"
 * - Single student number: "2023-12345" or "23-12345"
 */
export function parseStudentIdQr(raw: string): ParsedStudentIdQr | null {
  if (!raw || typeof raw !== "string") return null;
  const trimmed = raw.trim();

  // 1. Reservation passes start with RES-
  if (trimmed.toUpperCase().startsWith("RES-")) {
    return null;
  }

  // 2. Standard vehicle QR code hash is a 44-char Base64 SHA256 string (e.g. "aBcDeF...=")
  const isBase64Sha256 = /^[A-Za-z0-9+/]{43}=?$/.test(trimmed);
  if (isBase64Sha256 && !trimmed.includes(",") && !trimmed.includes("\n") && !trimmed.includes("-")) {
    return null;
  }

  // 3. Check for labeled fields across lines
  const lines = trimmed.split(/[\r\n]+/).map((l) => l.trim()).filter(Boolean);
  let labeledStudentNumber = "";
  let labeledName = "";
  let labeledProgram = "";

  for (const line of lines) {
    const studentMatch = line.match(
      /^(?:student\s*(?:no\.?|number|id)|id\s*(?:no\.?|number)?)\s*[:=-]\s*(.+)$/i,
    );
    if (studentMatch) labeledStudentNumber = studentMatch[1].trim();

    const nameMatch = line.match(/^(?:full\s*name|name)\s*[:=-]\s*(.+)$/i);
    if (nameMatch) labeledName = nameMatch[1].trim();

    const progMatch = line.match(
      /^(?:program|course|department)\s*[:=-]\s*(.+)$/i,
    );
    if (progMatch) labeledProgram = progMatch[1].trim();
  }

  if (labeledStudentNumber) {
    return {
      studentNumber: stripLabel(labeledStudentNumber),
      fullName: labeledName || "Student",
      program: labeledProgram || "N/A",
    };
  }

  // 4. Split by common delimiters (comma, newline, semicolon, pipe, tab)
  const delimiterRegex = /[,\r\n;|]+/;
  if (delimiterRegex.test(trimmed)) {
    const parts = trimmed
      .split(delimiterRegex)
      .map((p) => p.trim())
      .filter(Boolean);

    if (parts.length >= 3) {
      return {
        studentNumber: stripLabel(parts[0]),
        fullName: stripLabel(parts[1]) || "Student",
        program: stripLabel(parts.slice(2).join(", ")) || "N/A",
      };
    } else if (parts.length === 2) {
      return {
        studentNumber: stripLabel(parts[0]),
        fullName: stripLabel(parts[1]) || "Student",
        program: "N/A",
      };
    } else if (parts.length === 1) {
      return {
        studentNumber: stripLabel(parts[0]),
        fullName: "Student",
        program: "N/A",
      };
    }
  }

  // 5. Single token check: Does it match a student number format?
  const studentNumPattern = /^\d{2,4}[-\s]?\d{3,7}$/;
  if (studentNumPattern.test(trimmed)) {
    return {
      studentNumber: stripLabel(trimmed),
      fullName: "Student",
      program: "N/A",
    };
  }

  if (/^[a-zA-Z0-9]+-[a-zA-Z0-9]+$/.test(trimmed) && /\d/.test(trimmed) && trimmed.length <= 25) {
    return {
      studentNumber: stripLabel(trimmed),
      fullName: "Student",
      program: "N/A",
    };
  }

  return null;
}
