import { Body, Title } from "@/components/ui/Typography";
import type { ParkingLogExitResponse } from "@/types/parkingLog";
import { formatDateAndTime } from "@/utils/formatDataAndTime";
import { router, useLocalSearchParams } from "expo-router";
import { AlertCircle, CheckCircle, X } from "lucide-react-native";
import { ScrollView, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row justify-between items-center py-3">
      <Body className="text-light-muted font-book text-[13px]">{label}</Body>
      <Body className="flex-1 font-heavy text-light-text text-right text-[13px]">
        {value}
      </Body>
    </View>
  );
}

function SectionCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View className="mb-4">
      <Body className="text-light-text font-heavy mb-2 px-2 text-[13px]">
        {title}
      </Body>
      <View className="bg-light-surface rounded-2xl px-4 py-1">{children}</View>
    </View>
  );
}

function formatPenaltyFee(value?: string) {
  if (!value) return "₱0.00";
  const parsed = Number(value);
  if (Number.isNaN(parsed)) return value;
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    maximumFractionDigits: 2,
  }).format(parsed);
}

function formatHours(value?: string | number) {
  if (value === undefined || value === null || value === "") return "N/A";
  const parsed = typeof value === "number" ? value : Number(value);
  if (Number.isNaN(parsed)) return String(value);
  return `${parsed.toFixed(2)} hrs`;
}

export default function QrScanExitConfirmedCard() {
  const insets = useSafeAreaInsets();
  const handleBackToHome = () => router.replace("../(tabs)/home");

  const params = useLocalSearchParams<{
    qrCodeHash?: string;
    exitPayload?: string;
  }>();

  let exitData: Partial<ParkingLogExitResponse> = {};

  try {
    exitData = params.exitPayload
      ? (JSON.parse(
          decodeURIComponent(params.exitPayload),
        ) as Partial<ParkingLogExitResponse>)
      : {};
  } catch {
    exitData = {};
  }

  const vehicleBrand = exitData.brand ?? "N/A";
  const vehicleKind = exitData.vehicleType ?? "N/A";
  const sessionHours = exitData.totalParkingHours;
  const sessionFee = exitData.penaltyFee;
  const hasPenalty =
    sessionFee !== undefined && sessionFee !== null && Number(sessionFee) > 0;

  return (
    <View className="flex-1 bg-light-background">
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingBottom: 32,
          // Adds the device's notch/status bar height dynamically, plus 16px of breathing room
          paddingTop: Math.max(insets.top, 16),
        }}
      >
        {/* X Button - Still inside ScrollView so it scrolls away */}
        <View className="flex-row justify-start mb-4">
          <TouchableOpacity
            onPress={handleBackToHome}
            className="p-2 -ml-2 rounded-full"
          >
            <X size={28} color="#111827" />
          </TouchableOpacity>
        </View>

        {/* HEADER AREA */}
        <View className="items-center mb-8">
          {/* 1. Status Indicator */}
          <View className="flex-row items-center gap-2 mb-6">
            {hasPenalty ? (
              <AlertCircle size={24} color="#EF4444" strokeWidth={2.5} />
            ) : (
              <CheckCircle size={24} color="#10B981" strokeWidth={2.5} />
            )}
            <Title
              className={`font-heavy text-[18px] ${
                hasPenalty ? "text-light-danger" : "text-light-success"
              }`}
            >
              {hasPenalty ? "Exit with Penalty" : "Exit Confirmed"}
            </Title>
          </View>

          {/* 2. Total Display */}
          <Body className="text-light-muted font-book uppercase tracking-[0.15em] mb-1 text-[10px]">
            {hasPenalty ? "Penalty Fee" : "Total Charge"}
          </Body>
          <Title className="text-light-text font-black text-[40px] leading-[48px]">
            {formatPenaltyFee(String(sessionFee ?? ""))}
          </Title>

          {/* 3. Overstay */}
          <Body className="text-light-muted font-book mt-1 text-[12px]">
            {formatHours(exitData.overstayTime || 0)} overstay
          </Body>
        </View>

        {/* VEHICLE SECTION */}
        <SectionCard title="Vehicle">
          <DetailRow
            label="Plate Number"
            value={exitData.plateNumber ?? "N/A"}
          />
          <DetailRow label="Brand" value={vehicleBrand} />
          <DetailRow label="Type" value={vehicleKind} />
        </SectionCard>

        {/* OWNER SECTION */}
        <SectionCard title="Owner">
          <DetailRow
            label="Name"
            value={
              `${exitData.firstName ?? ""} ${exitData.lastName ?? ""}`.trim() ||
              "N/A"
            }
          />
          <DetailRow label="Role" value={exitData.role ?? "N/A"} />
          <DetailRow label="ID Number" value={exitData.idNumber ?? "N/A"} />
        </SectionCard>

        {/* SESSION SECTION */}
        <SectionCard title="Session">
          <DetailRow
            label="Entry Time"
            value={
              exitData.entryTime ? formatDateAndTime(exitData.entryTime) : "N/A"
            }
          />
          <DetailRow
            label="Exit Time"
            value={
              exitData.exitTime ? formatDateAndTime(exitData.exitTime) : "N/A"
            }
          />
          <DetailRow label="Duration" value={formatHours(sessionHours)} />
        </SectionCard>
      </ScrollView>
    </View>
  );
}
