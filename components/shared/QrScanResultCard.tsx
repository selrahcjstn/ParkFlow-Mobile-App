import { AppButton } from "@/components/ui";
import { Body, Heading, Title } from "@/components/ui/Typography";
import { ParkingLogEntryResponse } from "@/types/parkingLog";
import { formatDateAndTime } from "@/utils/formatDataAndTime";
import { router } from "expo-router";
import {
  BadgeCheck
} from "lucide-react-native";
import { ScrollView, View } from "react-native";
import { SubScreenLayout } from "../layout";

type QrScanResultCardProps = {
  result: ParkingLogEntryResponse;
  onScanAnother: () => void;
};

function SectionLabel({ title }: { title: string }) {
  return (
    <Heading
      className="text-light-muted uppercase tracking-[0.15em] mb-2 px-1"
      style={{ fontSize: 11 }}
    >
      {title}
    </Heading>
  );
}

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
      className={`flex-row justify-between items-center py-3 ${
        !isLast ? "border-b border-light-border" : ""
      }`}
    >
      <Body className="text-light-muted font-book" style={{ fontSize: 13 }}>
        {label}
      </Body>
      <Body
        className="font-heavy text-light-text text-right flex-1 ml-6"
        style={{ fontSize: 13 }}
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
  const handleBackToHome = () => router.replace("../(tabs)/home");

  const ownerName = `${result.firstName} ${result.lastName}`.trim();
  const courseOrDept = result.course
    ? `${result.course} ${result.yearLevel}-${result.section}`
    : (result.department ?? null);

  return (
    <SubScreenLayout title="Scan Result" onBack={handleBackToHome}>
      <ScrollView
        className="flex-1 bg-light-background"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingBottom: 32,
          paddingTop: 24,
        }}
      >
        {/* OWNER HERO */}
        <View className="items-center mb-6">
          <View className="w-16 h-16 rounded-full bg-light-success/15 items-center justify-center mb-3">
            <Title
              className="text-light-success font-black"
              style={{ fontSize: 26 }}
            >
              {result.firstName?.charAt(0).toUpperCase() ?? "?"}
            </Title>
          </View>

          <Title
            className="text-light-text font-black text-center"
            style={{ fontSize: 22, lineHeight: 28 }}
          >
            {ownerName || "Unknown"}
          </Title>

          <View className="flex-row items-center gap-1.5 mt-2">
            <BadgeCheck size={14} color="#10B981" strokeWidth={2} />
            <Body
              className="text-light-success font-heavy uppercase tracking-widest"
              style={{ fontSize: 11 }}
            >
              Entry Recorded
            </Body>
          </View>
        </View>

        {/* PERSON DETAILS */}
        <View className="mb-4">
          <SectionLabel title="Person" />
          <View className="bg-light-surface rounded-2xl px-4 border border-light-border">
            <DetailRow label="Role" value={result.role ?? "N/A"} />
            <DetailRow label="ID Number" value={result.idNumber ?? "N/A"} />
            {courseOrDept && (
              <DetailRow
                label={result.course ? "Course / Section" : "Department"}
                value={courseOrDept}
                isLast
              />
            )}
            {!courseOrDept && (
              <DetailRow label="Department" value="N/A" isLast />
            )}
          </View>
        </View>

        {/* VEHICLE */}
        <View className="mb-4">
          <SectionLabel title="Vehicle" />
          <View className="bg-light-surface rounded-2xl px-4 border border-light-border">
            <DetailRow label="Plate No." value={result.plateNumber ?? "N/A"} />
            <DetailRow label="Brand" value={result.brand ?? "N/A"} isLast />
          </View>
        </View>

        {/* SESSION */}
        <View className="mb-6">
          <SectionLabel title="Session" />
          <View className="bg-light-surface rounded-2xl px-4 border border-light-border">
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
              isLast
            />
          </View>
        </View>

        {/* ACTIONS */}
        <View className="gap-3">
          <AppButton
            label="Scan Another"
            variant="primary"
            size="lg"
            onPress={onScanAnother}
          />
          <AppButton
            label="Back to Home"
            variant="outline"
            size="lg"
            onPress={handleBackToHome}
          />
        </View>
      </ScrollView>
    </SubScreenLayout>
  );
}
