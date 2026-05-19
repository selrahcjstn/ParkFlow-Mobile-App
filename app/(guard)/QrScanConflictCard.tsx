import { AppButton } from "@/components/ui";
import { Body, Heading, Title } from "@/components/ui/Typography";
import { useAuthStore } from "@/store/useAuthStore";
import { useParkingLogStore } from "@/store/useParkingLogStore";
import { router, useLocalSearchParams } from "expo-router";
import { AlertTriangle } from "lucide-react-native";
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

export default function QrScanConflictCard({
  message = "This QR code is already linked to an active parking session.",
  qrCodeHash,
  onCancel,
}: QrScanConflictCardProps) {
  const [isProceeding, setIsProceeding] = useState(false);
  const [proceedError, setProceedError] = useState<string | null>(null);
  const { user } = useAuthStore();
  const { registerExit } = useParkingLogStore();
  const params = useLocalSearchParams<{ qrCodeHash?: string }>();
  const effectiveQrCodeHash = qrCodeHash ?? params.qrCodeHash;

  const handleBackToScan = () => {
    if (onCancel) onCancel();
    else router.replace("/(guard)/scan-qr");
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
    } finally {
      setIsProceeding(false);
    }
  };

  return (
    <SubScreenLayout title="Scan Conflict" onBack={handleBackToScan}>
      <ScrollView
        className="flex-1 bg-light-background"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingBottom: 32,
          paddingTop: 24,
        }}
      >
        {/* HERO — centered, avatar-style like entry card */}
        <View className="items-center mb-6">
          <View className="w-16 h-16 rounded-full bg-light-warning/15 items-center justify-center mb-3">
            <AlertTriangle size={28} color="#F59E0B" strokeWidth={2} />
          </View>
          <Title
            className="text-light-text font-black text-center"
            style={{ fontSize: 22, lineHeight: 28 }}
          >
            Vehicle Exiting
          </Title>
          <View className="flex-row items-center gap-1.5 mt-2">
            <Body
              className="text-light-warning font-heavy uppercase tracking-widest"
              style={{ fontSize: 11 }}
            >
              Active Session Detected
            </Body>
          </View>
        </View>

        {/* SITUATION */}
        <View className="mb-4">
          <Heading
            className="text-light-muted uppercase tracking-[0.15em] mb-2 px-1"
            style={{ fontSize: 11 }}
          >
            Situation
          </Heading>
          <View className="bg-light-surface rounded-2xl px-4 border border-light-border">
            <View className="py-3 border-b border-light-border">
              <Body
                className="text-light-muted font-book mb-1"
                style={{ fontSize: 12 }}
              >
                Reason
              </Body>
              <Body
                className="text-light-text font-heavy"
                style={{ fontSize: 13, lineHeight: 18 }}
              >
                {message}
              </Body>
            </View>
            <View className="py-3">
              <Body
                className="text-light-muted font-book mb-1"
                style={{ fontSize: 12 }}
              >
                What happens if you proceed
              </Body>
              <Body
                className="text-light-text font-book"
                style={{ fontSize: 13, lineHeight: 18 }}
              >
                The session will be{" "}
                <Body className="font-heavy text-light-danger">
                  force-closed
                </Body>{" "}
                and the vehicle marked as exited. A full receipt will appear
                after.
              </Body>
            </View>
          </View>
        </View>

        {/* DOMINANT ACTIONS */}
        <View className="mb-4">
          <Heading
            className="text-light-muted uppercase tracking-[0.15em] mb-2 px-1"
            style={{ fontSize: 11 }}
          >
            Guard Action
          </Heading>
          <View className="gap-3">
            <AppButton
              label="Force Exit — Proceed"
              variant="danger"
              size="lg"
              loading={isProceeding}
              onPress={handleProceed}
            />
            {proceedError ? (
              <Body
                className="text-light-danger text-center font-book"
                style={{ fontSize: 13 }}
              >
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
