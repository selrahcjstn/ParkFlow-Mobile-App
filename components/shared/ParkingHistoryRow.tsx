import { Body, Caption } from "@/components/ui/Typography";
// inline success/accent colors
import { LogIn, LogOut } from "lucide-react-native";
import { View } from "react-native";

export interface ParkingHistoryEntry {
  id: string;
  plateNumber: string;
  brand: string;
  vehicleType?: string;
  entryTime: string;
  entryDate: string;
  action: "ENTRY" | "EXIT";
}

interface ParkingHistoryRowProps {
  entry: ParkingHistoryEntry;
  isLast: boolean;
}

export default function ParkingHistoryRow({
  entry,
  isLast,
}: ParkingHistoryRowProps) {
  const isEntry = entry.action === "ENTRY";

  return (
    <View
      className={` py-4 flex-row items-center justify-between  ${
        !isLast ? "border-b border-light-border" : ""
      }`}
    >
      <View className="flex-row items-center flex-1">
        <View
          className={`w-11 h-11 rounded-2xl items-center justify-center mr-3 ${
            isEntry ? "bg-light-success/10" : "bg-light-accent/15"
          }`}
        >
          {isEntry ? (
            <LogIn size={20} color="#10B981" strokeWidth={2} />
          ) : (
            <LogOut size={20} color="#FDB813" strokeWidth={2} />
          )}
        </View>

        <View className="flex-1">
          <Body
            className="text-light-text font-black"
            style={{ fontSize: 14 }}
            numberOfLines={1}
          >
            {entry.brand}
          </Body>

          <View className="flex-row items-center flex-wrap mt-0.5">
            <Caption
              className="text-light-muted font-book"
              style={{ fontSize: 11 }}
              numberOfLines={1}
            >
              {entry.plateNumber}
            </Caption>

            {entry.vehicleType ? (
              <>
                <View className="w-1 h-1 rounded-full bg-light-muted mx-2" />

                <Caption
                  className="text-light-muted font-book uppercase"
                  style={{ fontSize: 11 }}
                >
                  {entry.vehicleType}
                </Caption>
              </>
            ) : null}
          </View>
        </View>
      </View>

      <View className="items-end ml-3">
        <Body className="text-light-text font-heavy" style={{ fontSize: 13 }}>
          {entry.entryTime}
        </Body>

        <Caption
          className="text-light-muted font-book mt-0.5"
          style={{ fontSize: 10 }}
        >
          {entry.entryDate}
        </Caption>
      </View>
    </View>
  );
}
