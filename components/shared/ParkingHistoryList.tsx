import { Body, Caption, Title } from "@/components/ui/Typography";
import { View } from "react-native";

type ParkingStatus = "Active" | "Completed" | "Overtime";

interface ParkingHistoryEntry {
  id: string;
  entryTime: string;
  entryDate: string;
  exitTime?: string;
  exitDate?: string;
  duration?: string;
  fee?: string;
  status: ParkingStatus;
}

interface ParkingHistoryListProps {
  entries: ParkingHistoryEntry[];
}

const statusStyles: Record<ParkingStatus, { bg: string; text: string }> = {
  Active: { bg: "bg-light-success/15", text: "text-light-success" },
  Completed: { bg: "bg-light-accent/10", text: "text-light-accent" },
  Overtime: { bg: "bg-light-warning/15", text: "text-light-warning" },
};

const indicatorColor: Record<ParkingStatus, string> = {
  Active: "bg-light-success",
  Completed: "bg-light-accent",
  Overtime: "bg-light-warning",
};

export default function ParkingHistoryList({
  entries,
}: ParkingHistoryListProps) {
  return (
    <View className="mx-5 mt-5 mb-8">
      <Title className="text-lg mb-3">Parking History</Title>

      <View className="flex-row bg-light-primary/10 rounded-t-xl px-3 py-2.5">
        <Caption className="flex-[2] text-light-secondary font-bold">
          Details
        </Caption>
        <Caption className="flex-1 text-light-secondary font-bold text-right">
          Parking Status
        </Caption>
      </View>

      {entries.map((entry) => {
        const badge = statusStyles[entry.status];
        const indicator = indicatorColor[entry.status];

        return (
          <View
            key={entry.id}
            className="flex-row items-start bg-light-surface border-b border-light-border px-3 py-3"
          >
            <View
              className={`w-1 self-stretch rounded-full ${indicator} mr-3`}
            />

            <View className="flex-[2] gap-1">
              <DetailRow
                label="Entry Time"
                value={`${entry.entryDate}   ${entry.entryTime}`}
              />
              {entry.exitTime ? (
                <DetailRow
                  label="Exit Time"
                  value={`${entry.exitDate ?? ""}   ${entry.exitTime}`}
                />
              ) : (
                <DetailRow label="Exit Time" value="—" />
              )}
              {entry.duration !== undefined ? (
                <DetailRow label="Duration" value={entry.duration} />
              ) : null}
              {entry.fee !== undefined ? (
                <DetailRow label="Fee" value={entry.fee} />
              ) : null}
            </View>

            <View className="flex-1 items-end justify-center">
              <View className={`${badge.bg} rounded-lg px-3 py-1`}>
                <Caption className={`${badge.text} font-bold`}>
                  {entry.status}
                </Caption>
              </View>
            </View>
          </View>
        );
      })}

      {entries.length === 0 ? (
        <View className="items-center py-8 bg-light-surface border-b border-light-border">
          <Caption>No history yet</Caption>
        </View>
      ) : null}
    </View>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row items-center">
      <Caption className="font-semibold w-24">{label}</Caption>
      <Body className="font-medium flex-1">{value}</Body>
    </View>
  );
}
