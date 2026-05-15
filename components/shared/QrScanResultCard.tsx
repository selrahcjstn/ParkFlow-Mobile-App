import { Body, Caption, Title } from "@/components/ui/Typography";
import { lightColors } from "@/constants/theme";
import type { QrScanResult } from "@/types/qrScan";
import { CheckCircle2, User } from "lucide-react-native";
import { View } from "react-native";

type QrScanResultCardProps = {
  result: QrScanResult;
};

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row justify-between py-2.5 border-b border-light-border">
      <Caption className="font-semibold">{label}</Caption>
      <Body className="font-bold flex-1 text-right ml-4" numberOfLines={1}>
        {value}
      </Body>
    </View>
  );
}

export default function QrScanResultCard({ result }: QrScanResultCardProps) {
  return (
    <View className="bg-light-surface rounded-2xl border border-light-border overflow-hidden">
      <View className="items-center pt-6 pb-4 px-5 bg-light-success/5 border-b border-light-border">
        <View className="w-14 h-14 rounded-full bg-light-success/15 items-center justify-center mb-3">
          <CheckCircle2
            size={28}
            color={lightColors.success}
            strokeWidth={2.5}
          />
        </View>
        <Title className="text-light-success text-base uppercase tracking-wide">
          Entry Recorded
        </Title>
        <Caption className="mt-1 text-center">
          Parking session is now active
        </Caption>
      </View>

      <View className="flex-row items-center gap-3 px-5 py-4 border-b border-light-border">
        <View className="w-11 h-11 rounded-full bg-light-accent/10 items-center justify-center">
          <User size={20} color={lightColors.accent} strokeWidth={1.8} />
        </View>
        <View className="flex-1">
          <Body className="font-extrabold">{result.parkeeName}</Body>
          <Caption className="mt-0.5">{result.role}</Caption>
        </View>
        <View className="bg-light-success/10 border border-light-success/20 px-2.5 py-1 rounded-full">
          <Caption className="text-light-success font-bold uppercase">
            {result.status}
          </Caption>
        </View>
      </View>

      <View className="px-5 pb-2">
        <DetailRow label="ID Number" value={result.idNumber} />
        {result.course ? (
          <DetailRow label="Course" value={result.course} />
        ) : null}
        <DetailRow label="Plate Number" value={result.plateNumber} />
        <DetailRow label="Vehicle" value={result.vehicleBrand} />
        <DetailRow label="Entry Time" value={result.entryTime} />
        <DetailRow label="Entry Date" value={result.entryDate} />
        <DetailRow label="Log ID" value={result.parkingLogId} />
      </View>
    </View>
  );
}
