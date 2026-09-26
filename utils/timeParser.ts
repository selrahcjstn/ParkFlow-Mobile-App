export function toMinutes(value?: string): number | null {
  if (!value) return null;
  const [time, ampm] = value.split(" ");
  if (!time || !ampm) return null;
  let [hours, minutes] = time.split(":").map(Number);
  if (ampm === "PM" && hours !== 12) hours += 12;
  if (ampm === "AM" && hours === 12) hours = 0;
  return hours * 60 + minutes;
}

export function parseTime(value?: string): Date | null {
  if (!value) return null;
  const parts = value.split(" ");
  const time = parts[0];
  const ampm = parts[1];
  if (!time || !ampm) return null;

  const timeParts = time.split(":");
  let hours = Number(timeParts[0]);
  let minutes = Number(timeParts[1]);

  if (isNaN(hours) || isNaN(minutes)) return null;

  if (ampm === "PM" && hours !== 12) hours += 12;
  if (ampm === "AM" && hours === 12) hours = 0;

  const date = new Date();
  date.setHours(hours, minutes, 0, 0);

  if (isNaN(date.getTime())) return null;
  return date;
}
