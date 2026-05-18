export function formatTime(dateInput: Date | string): string {
  if (!dateInput) return "Invalid time";

  let timeString = typeof dateInput === "string" ? dateInput : null;

  // If it's an ISO date string, extract the time portion to ignore timezone shifts
  if (timeString && timeString.includes("T")) {
    // Extract time part, then remove Z or timezone offsets
    // e.g., "2026-05-18T22:00:00.000Z" -> "22:00:00.000Z" -> "22:00:00.000"
    let timePart = timeString.split("T")[1];
    timePart = timePart.split("Z")[0].split("+")[0].split("-")[0];
    timeString = timePart;
  }

  // Check if it's a time-only string like "22:00" or "22:00:00"
  if (timeString && /^\d{1,2}:\d{2}(:\d{2}(\.\d+)?)?$/.test(timeString)) {
    const parts = timeString.split(":");
    let hours = parseInt(parts[0], 10);
    const minutes = parseInt(parts[1], 10);
    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12 || 12;
    const mins = minutes.toString().padStart(2, "0");
    return `${hours}:${mins} ${ampm}`;
  }

  // Fallback for full ISO dates
  const date = typeof dateInput === "string" ? new Date(dateInput) : dateInput;

  if (!(date instanceof Date) || isNaN(date.getTime())) {
    return typeof dateInput === "string" ? dateInput : "Invalid time";
  }

  let hours = date.getHours();
  const minutes = date.getMinutes();
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12 || 12;
  const mins = minutes.toString().padStart(2, "0");
  return `${hours}:${mins} ${ampm}`;
}
