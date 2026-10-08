export function toMinutes(value?: string): number | null {
  const match = value?.trim().match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)?$/i);
  if (!match) return null;
  let hours = Number(match[1]);
  const minutes = Number(match[2]);
  const seconds = Number(match[3] || 0);
  const ampm = match[4]?.toUpperCase();
  if (minutes > 59 || seconds > 59 || (ampm ? hours < 1 || hours > 12 : hours > 23)) return null;
  if (ampm === "PM" && hours !== 12) hours += 12;
  if (ampm === "AM" && hours === 12) hours = 0;
  return hours * 60 + minutes;
}

export function parseTime(value?: string): Date | null {
  const minutes = toMinutes(value);
  if (minutes === null) return null;
  const date = new Date();
  date.setHours(Math.floor(minutes / 60), minutes % 60, 0, 0);
  return date;
}
