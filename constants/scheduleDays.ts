export const SCHEDULE_DAYS = [
  { key: 1, label: "Monday", shortLabel: "Mon" },
  { key: 2, label: "Tuesday", shortLabel: "Tues" },
  { key: 3, label: "Wednesday", shortLabel: "Wed" },
  { key: 4, label: "Thursday", shortLabel: "Thurs" },
  { key: 5, label: "Friday", shortLabel: "Fri" },
  { key: 6, label: "Saturday", shortLabel: "Sat" },
  { key: 0, label: "Sunday", shortLabel: "Sun" },
] as const;

export type ScheduleDayKey = (typeof SCHEDULE_DAYS)[number]["key"];
export type ScheduleDayShortLabel =
  (typeof SCHEDULE_DAYS)[number]["shortLabel"];

export const getDayLabel = (key: ScheduleDayKey) =>
  SCHEDULE_DAYS.find((d) => d.key === key)?.label || "";
