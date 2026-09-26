export function toTimeSpan(value?: string): string {
  if (!value) return "";
  const [time, modifier] = value.split(" ");
  if (!time || !modifier) return "";

  let [hours, minutes] = time.split(":");
  let hrs = parseInt(hours, 10);

  if (hrs === 12) {
    hrs = modifier === "AM" ? 0 : 12;
  } else if (modifier === "PM") {
    hrs += 12;
  }

  const hh = hrs.toString().padStart(2, "0");
  const mm = minutes.padStart(2, "0");

  return `${hh}:${mm}:00`;
}
