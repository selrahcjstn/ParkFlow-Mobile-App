import { AppButton } from "@/components/ui";
import { Body, Title } from "@/components/ui/Typography";
import { ParkingLogEntryResponse } from "@/types/parkingLog";
import { formatDate } from "@/utils/formatDate";
import { formatTime } from "@/utils/formatTime";
import { router } from "expo-router";
import { Check } from "lucide-react-native";
import { ScrollView, View } from "react-native";
import { SubScreenLayout } from "../layout";

type QrScanResultCardProps = {
  result: ParkingLogEntryResponse;
  onScanAnother: () => void;
};

function DetailRow({
  label,
  value,
  isLast = false,
}: {
  label: string;
  value: string;
  isLast?: boolean;
}) {
  return (
    <View
      className={`flex-row justify-between items-center py-3.5 ${!isLast ? "border-b border-light-border/40" : ""}`}
    >
      <Body
        className="text-light-muted font-book mr-4"
        style={{ fontSize: 13 }}
      >
        {label}
      </Body>
      <Body
        className="flex-1 font-heavy text-light-text text-right"
        style={{ fontSize: 14 }}
      >
        {value}
      </Body>
    </View>
  );
}

export default function QrScanResultCard({
  result,
  onScanAnother,
}: QrScanResultCardProps) {
  const handleBackToHome = () => {
    router.replace("../(tabs)/home");
  };

  return (
    <SubScreenLayout title="Scan Details" onBack={handleBackToHome}>
      {/* ── Main Content Scroll ── */}
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingBottom: 40,
          paddingTop: 10,
        }}
      >
        {/* ── The Receipt Card ── */}
        <View
          className="bg-light-surface rounded-3xl p-6"
          style={{
            shadowColor: "#000",
            shadowOpacity: 0.05,
            shadowRadius: 15,
            shadowOffset: { width: 0, height: 4 },
            elevation: 2,
          }}
        >
          {/* 1. Success Header (Ultra-minimal: just the checkmark and confirmation) */}
          <View className="items-center mt-2 mb-7">
            {/* Sharp non-blurry green border effect */}
            <View
              className="items-center justify-center w-20 h-20 border-4 border-light-success rounded-full mb-4"
              style={{ shadowColor: "transparent", elevation: 0 }}
            >
              <View className="w-16 h-16 rounded-full items-center justify-center bg-light-success">
                <Check size={28} color="#FFFFFF" strokeWidth={1.8} />
              </View>
            </View>

            {/* Main Status Title */}
            <Title
              className="text-light-text font-black text-center"
              style={{ fontSize: 24, lineHeight: 28 }}
            >
              Entry Recorded
            </Title>
            <Body
              className="text-light-success font-heavy uppercase tracking-widest text-center"
              style={{ fontSize: 12 }}
            >
              Scan Successful
            </Body>
          </View>

          {/* 2. Details Section Header */}
          <Body
            className="text-light-muted font-heavy tracking-wider uppercase mb-1"
            style={{ fontSize: 11 }}
          >
            Details
          </Body>

          {/* 3. Clean Data Rows (Name moved here) */}
          <View>
            <DetailRow label="Name" value={`${result.firstName} ${result.lastName}`} />

            <DetailRow label="Role" value={result.role} />

            <DetailRow label="ID Number" value={result.idNumber} />

            {(result.course || result.department) && (
              <DetailRow
                label={
                  result.course ? "Course/Section" : "Department"
                }
                value={result.course ? `${result.course} ${result.yearLevel}-${result.section}` : result.department ?? ""}
              />
            )}

            <DetailRow label="Plate No." value={result.plateNumber} />

            <DetailRow label="Vehicle" value={result.brand} />

            <DetailRow
              label="Entry Time"
              value={formatTime(new Date(result.entryTime))}
            />

            <DetailRow
              label="Entry Date"
              value={formatDate(new Date(result.entryDate))}
            />

            {result.endTime && (
              <DetailRow
                label="Exit Time"
                value={formatTime(new Date(result.endTime))}
              />
            )}

            {result.maximumExitTime && (
              <DetailRow
                label="Maximum Exit"
                value={`${formatTime(new Date(result.maximumExitTime))} · ${formatDate(new Date(result.maximumExitTime))}`}
                isLast={true}
              />
            )}
          </View>

          {/* 4. Bottom Action Button */}
          <View className="mt-8">
            <AppButton
              label="Scan Another"
              variant="primary"
              size="lg"
              onPress={onScanAnother}
            />
          </View>
        </View>
      </ScrollView>
    </SubScreenLayout>
  );
}
