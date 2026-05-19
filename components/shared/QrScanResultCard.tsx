import { AppButton } from "@/components/ui";
import { Body, Title } from "@/components/ui/Typography";
import { ParkingLogEntryResponse } from "@/types/parkingLog";
import { formatDateAndTime } from "@/utils/formatDataAndTime";
import { router } from "expo-router";
import { X } from "lucide-react-native";
import { ScrollView, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type QrScanResultCardProps = {
  result: ParkingLogEntryResponse;
  onScanAnother: () => void;
};

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

export default function QrScanResultCard({ result }: QrScanResultCardProps) {
  const insets = useSafeAreaInsets();
  const handleBackToHome = () => router.replace("../(tabs)/home");

  const ownerName = `${result.firstName} ${result.lastName}`.trim();
  const plateNumber = result.plateNumber ?? "N/A";
  const brand = result.brand ?? "Unknown Brand";
  const vehicleType = result.vehicleType ?? "Unknown Type";

  return (
    <View className="flex-1 bg-light-background">
      {/* FIXED TOP NAVIGATION - Matched perfectly to Exit design layout */}
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
        {/* HEADER AREA - Vehicle Hero matching typography parameters */}
        <View className="items-center mb-8 ">
          <Body className="text-light-muted font-book uppercase tracking-[0.15em] mb-1.5 text-[10px]">
            Plate Number
          </Body>
          <Title className="text-light-text font-black text-[28px] leading-[36px] text-center">
            {plateNumber}
          </Title>
          <Body className="text-light-muted font-book mt-1.5 text-[12px]">
            {brand} • {vehicleType}
          </Body>
        </View>

        {/* OWNER SECTION */}
        <SectionCard title="Owner">
          <DetailRow label="Name" value={ownerName || "Unknown"} />
          <DetailRow label="Role" value={result.role ?? "N/A"} />
          <DetailRow label="Contact No." value={result.phoneNumber ?? "N/A"} />
        </SectionCard>

        {/* SESSION SECTION */}
        <SectionCard title="Session">
          <DetailRow
            label="Entry Time"
            value={formatDateAndTime(result.entryTime)}
          />
          <DetailRow
            label="Must Exit Before"
            value={
              result.maximumExitTime
                ? formatDateAndTime(result.maximumExitTime)
                : "No limit set"
            }
          />
        </SectionCard>

        {/* STATUS SECTION - Standalone row block alignment layout */}
        <View className="mb-4 bg-light-surface rounded-2xl px-4 py-1">
          <DetailRow
            label="Status"
            value="Entry Recorded"
            valueColorClass="text-light-success"
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
          Please verify the owner's identity and vehicle details before granting
          access.
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
