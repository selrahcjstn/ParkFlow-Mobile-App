export function formatDate(date: string | Date) {
  if (!date) return "N/A";

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

  return d.toLocaleDateString("en-US", {
    timeZone: "UTC",
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
}
