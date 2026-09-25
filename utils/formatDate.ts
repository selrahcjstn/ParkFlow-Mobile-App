const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

export function formatDate(date: string | Date): string {
  if (!date) return "N/A";

  try {
    let d: Date;
    if (typeof date === "string") {
      const clean = date.trim();
      if (/^\d{4}-\d{2}-\d{2}$/.test(clean)) {
        d = new Date(`${clean}T00:00:00Z`);
      } else {
        d = new Date(clean);
      }
    } else {
      d = date;
    }

    if (!(d instanceof Date) || isNaN(d.getTime())) {
      return typeof date === "string" ? date : "Invalid date";
    }

    // Direct, deterministic formatting that never throws in React Native / Hermes
    const month = MONTHS[d.getUTCMonth()];
    const day = String(d.getUTCDate()).padStart(2, "0");
    const year = d.getUTCFullYear();

    return `${month} ${day}, ${year}`;
  } catch {
    return typeof date === "string" ? date : "N/A";
  }
}
