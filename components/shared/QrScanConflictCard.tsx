import { AppButton } from "@/components/ui";
import { Body, Title } from "@/components/ui/Typography";
import { router } from "expo-router";
import {
  AlertTriangle,
  Car,
  CheckCircle,
  Clock,
  LogOut,
  Shield,
  User,
} from "lucide-react-native";
import { useState } from "react";
import { ScrollView, View } from "react-native";
import { SubScreenLayout } from "../layout";

type QrScanConflictCardProps = {
  message?: string;
  plateNumber?: string;
  entryTime?: string;
  parkeeName?: string;
  idNumber?: string;
  role?: string;
  onCancel?: () => void;
};

// ─── Shared detail row ──────────────────────────────────────────────────────
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
      className={`flex-row justify-between items-center py-3.5 ${
        !isLast ? "border-b border-light-border/40" : ""
      }`}
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

// ─── Exit Confirmed Phase ────────────────────────────────────────────────────
function ExitConfirmedView({
  plateNumber,
  parkeeName,
  exitTime,
}: {
  plateNumber?: string;
  parkeeName?: string;
  exitTime: string;
}) {
  const handleBackToHome = () => router.replace("../(tabs)/home");

  return (
    <SubScreenLayout title="Scan Result" onBack={handleBackToHome}>
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingBottom: 40,
          paddingTop: 10,
        }}
      >
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
          {/* Header */}
          <View className="items-center mt-2 mb-7">
            <View
              className="items-center justify-center w-20 h-20 border-4 border-light-success rounded-full mb-4"
              style={{ shadowColor: "transparent", elevation: 0 }}
            >
              <View className="w-16 h-16 rounded-full items-center justify-center bg-light-success">
                <LogOut size={28} color="#FFFFFF" strokeWidth={2} />
              </View>
            </View>

            <Title
              className="text-light-text font-black text-center"
              style={{ fontSize: 24, lineHeight: 28 }}
            >
              Exit Confirmed
            </Title>
            <Body
              className="text-light-success font-heavy uppercase tracking-widest text-center"
              style={{ fontSize: 12 }}
            >
              Vehicle Marked as Exited
            </Body>
          </View>

          {/* Section label */}
          <Body
            className="text-light-muted font-heavy tracking-wider uppercase mb-1"
            style={{ fontSize: 11 }}
          >
            Exit Summary
          </Body>

          <View>
            {parkeeName && (
              <DetailRow label="Name" value={parkeeName} />
            )}
            {plateNumber && (
              <DetailRow label="Plate No." value={plateNumber} />
            )}
            <DetailRow label="Exit Time" value={exitTime} isLast={true} />
          </View>

          {/* Note block */}
          <View className="mt-5 bg-light-background rounded-2xl p-4 border border-light-border/60 flex-row items-start">
            <View className="w-8 h-8 rounded-full bg-light-surface border border-light-border/50 items-center justify-center mr-3 mt-0.5">
              <CheckCircle size={15} color="#10B981" strokeWidth={2} />
            </View>
            <View className="flex-1">
              <Body
                className="text-light-text font-heavy uppercase tracking-widest mb-1"
                style={{ fontSize: 10 }}
              >
                Action Complete
              </Body>
              <Body
                className="text-light-muted font-book"
                style={{ fontSize: 13, lineHeight: 18 }}
              >
                The parking session has been force-closed. The vehicle has been
                successfully marked as exited.
              </Body>
            </View>
          </View>

          {/* Actions */}
          <View className="gap-3 mt-8">
            <AppButton
              label="Scan Another"
              variant="primary"
              size="lg"
              onPress={() => router.replace("/(guard)/scan-qr")}
            />
            <AppButton
              label="Back to Home"
              variant="outline"
              size="lg"
              onPress={handleBackToHome}
            />
          </View>
        </View>
      </ScrollView>
    </SubScreenLayout>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────
export default function QrScanConflictCard({
  message = "This QR code is already linked to an active parking session.",
  plateNumber,
  entryTime,
  parkeeName,
  idNumber,
  role,
  onCancel,
}: QrScanConflictCardProps) {
  const [exitConfirmed, setExitConfirmed] = useState(false);
  const [exitTime, setExitTime] = useState("");

  const handleBackToScan = () => {
    if (onCancel) {
      onCancel();
    } else {
      router.replace("/(guard)/scan-qr");
    }
  };

  const handleProceed = () => {
    // Mark as exited locally (no backend)
    const now = new Date();
    const formatted = now.toLocaleTimeString("en-PH", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
    setExitTime(formatted);
    setExitConfirmed(true);
  };

  // ── Exit-confirmed phase ──
  if (exitConfirmed) {
    return (
      <ExitConfirmedView
        plateNumber={plateNumber}
        parkeeName={parkeeName}
        exitTime={exitTime}
      />
    );
  }

  // ── Warning phase ──
  return (
    <SubScreenLayout title="Scan Conflict" onBack={handleBackToScan}>
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingBottom: 40,
          paddingTop: 10,
        }}
      >
        {/* ── Warning Banner ── */}
        <View
          className="rounded-2xl p-4 mb-4 flex-row items-center gap-3"
          style={{
            backgroundColor: "#FEF3C7",
            borderWidth: 1,
            borderColor: "#F59E0B40",
          }}
        >
          <View
            className="w-9 h-9 rounded-full items-center justify-center"
            style={{ backgroundColor: "#F59E0B20" }}
          >
            <Shield size={18} color="#D97706" strokeWidth={2.5} />
          </View>
          <View className="flex-1">
            <Body
              className="font-heavy uppercase tracking-widest"
              style={{ fontSize: 10, color: "#92400E" }}
            >
              Guard Action Required
            </Body>
            <Body
              className="font-book"
              style={{ fontSize: 13, color: "#78350F", lineHeight: 18 }}
            >
              Review before proceeding — this action cannot be undone.
            </Body>
          </View>
        </View>

        {/* ── Main Conflict Card ── */}
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
          {/* Header */}
          <View className="items-center mt-2 mb-7">
            <View
              className="items-center justify-center w-20 h-20 border-4 border-light-accent rounded-full mb-4"
              style={{ shadowColor: "transparent", elevation: 0 }}
            >
              <View className="w-16 h-16 rounded-full items-center justify-center bg-light-accent">
                <AlertTriangle size={28} color="#FFFFFF" strokeWidth={2.5} />
              </View>
            </View>

            <Title
              className="text-light-text font-black text-center"
              style={{ fontSize: 24, lineHeight: 28 }}
            >
              Already Parked
            </Title>
            <Body
              className="font-heavy uppercase tracking-widest text-center"
              style={{ fontSize: 12, color: "#D97706" }}
            >
              Active Session Detected
            </Body>
          </View>

          {/* Conflict reason */}
          <Body
            className="text-light-muted font-heavy tracking-wider uppercase mb-1"
            style={{ fontSize: 11 }}
          >
            Details
          </Body>

          <View className="mb-5">
            <DetailRow label="Reason" value={message} />
            {parkeeName && <DetailRow label="Name" value={parkeeName} />}
            {role && <DetailRow label="Role" value={role} />}
            {idNumber && <DetailRow label="ID Number" value={idNumber} />}
            {plateNumber && <DetailRow label="Plate No." value={plateNumber} />}
            {entryTime && (
              <DetailRow label="Entry Time" value={entryTime} isLast={true} />
            )}
          </View>

          {/* Proceed consequence note */}
          <View className="bg-light-background rounded-2xl p-4 border border-light-border/60 flex-row items-start">
            <View className="w-8 h-8 rounded-full bg-light-surface border border-light-border/50 items-center justify-center mr-3 mt-0.5">
              <LogOut size={14} color="#EF4444" strokeWidth={2} />
            </View>
            <View className="flex-1">
              <Body
                className="font-heavy uppercase tracking-widest mb-1"
                style={{ fontSize: 10, color: "#991B1B" }}
              >
                If You Proceed
              </Body>
              <Body
                className="text-light-muted font-book"
                style={{ fontSize: 13, lineHeight: 18 }}
              >
                The vehicle will be{" "}
                <Body className="font-heavy text-light-danger">
                  marked as exited
                </Body>{" "}
                and the user's active session will be force-closed.
              </Body>
            </View>
          </View>

          {/* Action buttons */}
          <View className="gap-3 mt-8">
            <AppButton
              label="Proceed — Force Exit"
              variant="danger"
              size="lg"
              onPress={handleProceed}
            />
            <AppButton
              label="Cancel"
              variant="outline"
              size="lg"
              onPress={handleBackToScan}
            />
          </View>
        </View>
      </ScrollView>
    </SubScreenLayout>
  );
}
