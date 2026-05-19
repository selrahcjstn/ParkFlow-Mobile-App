import { AppButton } from "@/components/ui";
import { Body, Title } from "@/components/ui/Typography";
import type { ParkingLogExitResponse } from "@/types/parkingLog";
import { formatDateAndTime } from "@/utils/formatDataAndTime";
import { router, useLocalSearchParams } from "expo-router";
import { X } from "lucide-react-native";
import { ScrollView, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

function DetailRow({
  label,
  value,
  isHighlight = false,
  valueColorClass = "text-light-text",
}: {
  label: string;
  value: string;
  isHighlight?: boolean;
  valueColorClass?: string;
}) {
  return (
    <View className="flex-row justify-between items-center py-2.5">
      <Body
        className={`text-[13px] leading-[20px] ${
          isHighlight
            ? "font-heavy text-light-text"
            : "font-book text-light-muted"
        }`}
      >
        {label}
      </Body>
      <Body
        className={`flex-1 text-right text-[13px] leading-[20px] ${
          isHighlight ? "font-heavy" : "font-book"
        } ${valueColorClass}`}
      >
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
    <View className="mb-4 bg-light-surface rounded-2xl px-4 py-2">
      <Body className="text-light-text font-heavy pt-2 pb-1 text-[13px]">
        {title}
      </Body>
      <View>{children}</View>
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
  const sessionFee = exitData.penaltyFee;
  const hasPenalty =
    sessionFee !== undefined && sessionFee !== null && Number(sessionFee) > 0;

  return (
    <View className="flex-1 bg-light-background">
      {/* FIXED TOP NAVIGATION - Restored to proper Flexbox layout */}
      <View
        style={{
          paddingTop: Math.max(insets.top, 16),
        }}
        className="bg-light-background px-4 pb-2 flex-row justify-start items-center z-10"
      >
        <TouchableOpacity
          onPress={handleBackToHome}
          className="w-10 h-10 -ml-2 items-center justify-center rounded-full"
        >
          <X size={28} color="#111827" />
        </TouchableOpacity>
      </View>

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingBottom: 24,
          paddingTop: 8,
        }}
      >
        {/* HEADER AREA - Vehicle Hero */}
        <View className="items-center mb-8">
          <Body className="text-light-muted font-book uppercase tracking-[0.15em] mb-1.5 text-[10px]">
            Plate Number
          </Body>
          <Title className="text-light-text font-black text-[28px] leading-[38px] text-center">
            {exitData.plateNumber ?? "N/A"}
          </Title>
          <Body className="text-light-muted font-book mt-1.5 text-[12px]">
            {vehicleBrand} • {vehicleKind}
          </Body>
        </View>

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
          <DetailRow
            label="Chargeable Hours"
            value={formatHours(exitData.overstayTime || 0)}
          />
          <DetailRow
            label={"Charge".toUpperCase()}
            value={formatPenaltyFee(String(sessionFee ?? ""))}
            isHighlight
          />
        </SectionCard>

        {/* STATUS SECTION - Standalone Row */}
        <View className="mb-4 bg-light-surface rounded-2xl px-4 py-1">
          <DetailRow
            label="Status"
            value={hasPenalty ? "Exit with Penalty" : "Exit Confirmed"}
            valueColorClass={
              hasPenalty ? "text-light-warning" : "text-light-success"
            }
            isHighlight
          />
        </View>
      </ScrollView>

      {/* FIXED BOTTOM FOOTER */}
      <View
        className="px-4 pt-2 bg-light-background"
        style={{ paddingBottom: Math.max(insets.bottom, 24) }}
      >
        <Body className="text-light-muted font-book text-center px-4 text-[13px] mb-4 leading-[18px]">
          Please verify the details. The user will receive the payment prompt on
          their screen.
        </Body>

        <AppButton
          label="Okay"
          variant="primary"
          size="lg"
          onPress={handleBackToHome}
        />
      </View>
    </View>
  );
}
