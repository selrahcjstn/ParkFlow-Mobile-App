import { AppButton } from "@/components/ui";
import { Body, Title } from "@/components/ui/Typography";
import { useAuthStore } from "@/store/useAuthStore";
import { useParkingLogStore } from "@/store/useParkingLogStore";
import { router, useLocalSearchParams } from "expo-router";
import { AlertTriangle, LogOut } from "lucide-react-native";
import { useState } from "react";
import { ScrollView, View } from "react-native";
import { SubScreenLayout } from "../../components/layout";

type QrScanConflictCardProps = {
  message?: string;
  qrCodeHash?: string;
  plateNumber?: string;
  entryTime?: string;
  maximumExitTime?: string;
  penaltyFee?: string;
  totalParkingHours?: string;
  firstName?: string;
  lastName?: string;
  parkeeName?: string;
  idNumber?: string;
  role?: string;
  brand?: string;
  vehicleType?: string;
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

function formatFullName(
  firstName?: string,
  lastName?: string,
  fallback?: string,
) {
  const fullName = `${firstName ?? ""} ${lastName ?? ""}`.trim();
  return fullName || fallback || "N/A";
}

// ─── Main Component ──────────────────────────────────────────────────────────
export default function QrScanConflictCard({
  message = "This QR code is already linked to an active parking session.",
  qrCodeHash,
  onCancel,
}: QrScanConflictCardProps) {
  const [isProceeding, setIsProceeding] = useState(false);
  const [proceedError, setProceedError] = useState<string | null>(null);
  const { user } = useAuthStore();
  const { registerExit } = useParkingLogStore();
  const params = useLocalSearchParams<{
    qrCodeHash?: string;
  }>();
  const effectiveQrCodeHash = qrCodeHash ?? params.qrCodeHash;

  const handleBackToScan = () => {
    if (onCancel) {
      onCancel();
    } else {
      router.replace("/(guard)/scan-qr");
    }
  };

  const handleProceed = async () => {
    if (!effectiveQrCodeHash) {
      setProceedError("Missing QR code reference for exit processing.");
      return;
    }

    if (!user?.id) {
      setProceedError("User session not found.");
      return;
    }

    setIsProceeding(true);
    setProceedError(null);

    try {
      const res = await registerExit({
        qrCodeHash: effectiveQrCodeHash,
        userId: user.id,
      });

      if (!res.isSuccess || !res.data) {
        setProceedError(res.message ?? "Failed to register exit.");
        return;
      }

      const confirmedQuery = new URLSearchParams();
      confirmedQuery.set("qrCodeHash", effectiveQrCodeHash);
      confirmedQuery.set(
        "exitPayload",
        encodeURIComponent(JSON.stringify(res.data)),
      );
      router.replace(`/(guard)/QrScanExitConfirmedCard?${confirmedQuery}`);
      return;
    } finally {
      setIsProceeding(false);
    }
  };

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
        <View
          className="bg-light-surface rounded-[30px] p-6"
          style={{
            shadowColor: "#000",
            shadowOpacity: 0.05,
            shadowRadius: 18,
            shadowOffset: { width: 0, height: 6 },
            elevation: 3,
          }}
        >
          <View className="items-center mt-1 mb-6">
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

          <View
            className="rounded-2xl p-4 mb-5 flex-row items-center gap-3"
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
              <AlertTriangle size={18} color="#D97706" strokeWidth={2.5} />
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
                Proceed to force-exit this active session. Full receipt details
                will be shown after confirmation.
              </Body>
            </View>
          </View>

          <View className="rounded-3xl border border-light-border/60 overflow-hidden bg-white mb-5">
            <DetailRow label="Conflict Reason" value={message} />
            <DetailRow
              label="QR Hash"
              value={effectiveQrCodeHash ?? "N/A"}
              isLast
            />
          </View>

          <View className="bg-light-background rounded-3xl p-4 border border-light-border/60 flex-row items-start gap-3">
            <View className="w-9 h-9 rounded-full bg-light-surface border border-light-border/50 items-center justify-center mt-0.5">
              <LogOut size={15} color="#EF4444" strokeWidth={2} />
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
                and the parking session will be submitted to the exit service.
              </Body>
            </View>
          </View>

          {/* Action buttons */}
          <View className="gap-3 mt-8">
            <AppButton
              label="Proceed — Force Exit"
              variant="danger"
              size="lg"
              loading={isProceeding}
              onPress={handleProceed}
            />
            {proceedError ? (
              <Body className="text-light-danger text-center font-book text-sm">
                {proceedError}
              </Body>
            ) : null}
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
