export function formatTime(dateInput: Date | string): string {
  if (!dateInput) return "";

  if (typeof dateInput === "string") {
    const clean = dateInput.trim();
    if (!clean) return "";

    // Handle "HH:mm:ss" or "HH:mm" (e.g. "08:00:00", "17:30")
    if (/^\d{1,2}:\d{2}(:\d{2})?$/.test(clean)) {
      const parts = clean.split(":");
      let hours = parseInt(parts[0], 10);
      const minutes = parts[1];
      const ampm = hours >= 12 ? "PM" : "AM";
      hours = hours % 12 || 12;
      return `${hours}:${minutes} ${ampm}`;
    }

    // Handle "8:00 AM" or "05:00 PM"
    if (/^\d{1,2}:\d{2}\s*(AM|PM|am|pm)$/i.test(clean)) {
      return clean;
    }
  }

  const date = typeof dateInput === "string" ? new Date(dateInput) : dateInput;

  if (!(date instanceof Date) || isNaN(date.getTime())) {
    return typeof dateInput === "string" ? dateInput : "";
  }

  return date.toLocaleTimeString("en-US", {
    timeZone: "UTC",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}
