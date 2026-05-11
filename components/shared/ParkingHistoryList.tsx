import { Text, View } from "react-native";

/** Status badge variants aligned with the design-system colours */
type ParkingStatus = "Active" | "Completed" | "Overtime";

interface ParkingHistoryEntry {
  /** Unique key for list rendering */
  id: string;
  /** Entry timestamp text */
  entryTime: string;
  /** Entry date text */
  entryDate: string;
  /** Exit timestamp text (empty if still active) */
  exitTime?: string;
  /** Exit date text */
  exitDate?: string;
  /** Duration string (e.g. "22 mins") */
  duration?: string;
  /** Fee string (e.g. "Free ✓") */
  fee?: string;
  /** Current status */
  status: ParkingStatus;
}

interface ParkingHistoryListProps {
  /** Array of parking history entries to render */
  entries: ParkingHistoryEntry[];
}

/* Map status → background + text colour classes */
const statusStyles: Record<ParkingStatus, { bg: string; text: string }> = {
  Active: { bg: "bg-light-success/15", text: "text-light-success" },
  Completed: { bg: "bg-light-accent/10", text: "text-light-accent" },
  Overtime: { bg: "bg-light-warning/15", text: "text-light-warning" },
};

/* Thin left-border indicator colour per status */
const indicatorColor: Record<ParkingStatus, string> = {
  Active: "bg-light-success",
  Completed: "bg-light-accent",
  Overtime: "bg-light-warning",
};

/**
 * Renders a table-like list of parking history entries.
 * Each entry shows entry/exit times, duration, fee, and a status badge.
 */
export default function ParkingHistoryList({
  entries,
}: ParkingHistoryListProps) {
  return (
    <View className="mx-5 mt-5 mb-8">
      {/* Section title */}
      <Text className="text-light-text text-lg font-extrabold mb-3">
        Parking History
      </Text>

      {/* Table header */}
      <View className="flex-row bg-light-primary/10 rounded-t-xl px-3 py-2.5">
        <Text className="flex-[2] text-light-secondary text-[11px] font-bold">
          Details
        </Text>
        <Text className="flex-1 text-light-secondary text-[11px] font-bold text-right">
          Parking Status
        </Text>
      </View>

      {/* Entries */}
      {entries.map((entry) => {
        const badge = statusStyles[entry.status];
        const indicator = indicatorColor[entry.status];

        return (
          <View
            key={entry.id}
            className="flex-row items-start bg-light-surface border-b border-light-border px-3 py-3"
          >
            {/* Left colour indicator */}
            <View className={`w-1 self-stretch rounded-full ${indicator} mr-3`} />

            {/* Details column */}
            <View className="flex-[2] gap-1">
              <DetailRow label="Entry Time" value={`${entry.entryDate}   ${entry.entryTime}`} />
              {entry.exitTime ? (
                <DetailRow label="Exit Time" value={`${entry.exitDate ?? ""}   ${entry.exitTime}`} />
              ) : (
                <DetailRow label="Exit Time" value="—" />
              )}
              {entry.duration !== undefined && (
                <DetailRow label="Duration" value={entry.duration} />
              )}
              {entry.fee !== undefined && (
                <DetailRow label="Fee" value={entry.fee} />
              )}
            </View>

            {/* Status badge */}
            <View className="flex-1 items-end justify-center">
              <View className={`${badge.bg} rounded-lg px-3 py-1`}>
                <Text className={`${badge.text} text-xs font-bold`}>
                  {entry.status}
                </Text>
              </View>
            </View>
          </View>
        );
      })}

      {/* Empty state */}
      {entries.length === 0 && (
        <View className="items-center py-8">
          <Text className="text-light-muted text-sm">No history yet</Text>
        </View>
      )}
    </View>
  );
}

/* ── tiny helper ────────────────────────────────────── */
function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row items-center">
      <Text className="text-light-muted text-[11px] font-semibold w-20">
        {label}
      </Text>
      <Text className="text-light-text text-[11px] font-medium flex-1">
        {value}
      </Text>
    </View>
  );
}
