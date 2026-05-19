import { SubScreenLayout } from "@/components/layout";
import { AppButton } from "@/components/ui";
import { Body, Heading, Title } from "@/components/ui/Typography";
import type { ParkingLogExitResponse } from "@/types/parkingLog";
import { formatDateAndTime } from "@/utils/formatDataAndTime";
import { router, useLocalSearchParams } from "expo-router";
import { CheckCircle, LogOut } from "lucide-react-native";
import { ScrollView, View } from "react-native";

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

function formatPenaltyFee(value?: string) {
  if (!value) return "N/A";

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

  const ownerName =
    `${exitData.firstName ?? ""} ${exitData.lastName ?? ""}`.trim();

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
          className="bg-light-surface rounded-[30px] p-6"
          style={{
            shadowColor: "#000",
            shadowOpacity: 0.05,
            shadowRadius: 18,
            shadowOffset: { width: 0, height: 6 },
            elevation: 3,
          }}
        >
          {/* HEADER */}
          <View className="items-center mt-1 mb-6">
            <View className="items-center justify-center w-20 h-20 border-4 border-light-success rounded-full mb-4">
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
              Exit Recorded Successfully
            </Body>
          </View>

          {/* SUMMARY */}
          <View className="bg-light-background rounded-3xl p-4 border border-light-border/60 mb-5">
            <View className="flex-row items-start gap-3">
              <View className="w-9 h-9 rounded-full bg-light-surface border border-light-border/50 items-center justify-center mt-0.5">
                <CheckCircle size={15} color="#10B981" strokeWidth={2} />
              </View>

              <View className="flex-1">
                <Body
                  className="text-light-text font-heavy uppercase tracking-widest mb-1"
                  style={{ fontSize: 10 }}
                >
                  Receipt Summary
                </Body>
                <Body
                  className="text-light-muted font-book"
                  style={{ fontSize: 13, lineHeight: 18 }}
                >
                  The parking session has been force-closed and recorded by the
                  guard.
                </Body>
              </View>
            </View>
          </View>

          {/* OWNER */}
          <View className="mb-5">
            <Heading className="mb-3 text-light-text uppercase tracking-[0.18em] text-[11px]">
              Owner Details
            </Heading>

            <View className="rounded-3xl border border-light-border/60 overflow-hidden bg-white">
              <DetailRow
                label="First Name"
                value={exitData.firstName ?? "N/A"}
              />
              <DetailRow label="Last Name" value={exitData.lastName ?? "N/A"} />
              <DetailRow label="Role" value={exitData.role ?? "N/A"} />
              <DetailRow
                label="ID Number"
                value={exitData.idNumber ?? "N/A"}
                isLast
              />
            </View>
          </View>

          {/* VEHICLE */}
          <View className="mb-5">
            <Heading className="mb-3 text-light-text uppercase tracking-[0.18em] text-[11px]">
              Vehicle Details
            </Heading>

            <View className="rounded-3xl border border-light-border/60 overflow-hidden bg-white">
              <DetailRow
                label="Plate No."
                value={exitData.plateNumber ?? "N/A"}
              />
              <DetailRow label="Brand" value={vehicleBrand} />
              <DetailRow label="Vehicle Type" value={vehicleKind} isLast />
            </View>
          </View>

          {/* SESSION */}
          <View className="mb-5">
            <Heading className="mb-3 text-light-text uppercase tracking-[0.18em] text-[11px]">
              Session Details
            </Heading>

            <View className="rounded-3xl border border-light-border/60 overflow-hidden bg-white">
              <DetailRow
                label="Entry Time"
                value={
                  exitData.entryTime
                    ? formatDateAndTime(exitData.entryTime)
                    : "N/A"
                }
              />

              <DetailRow
                label="Exit Before"
                value={
                  exitData.maximumExitTime
                    ? formatDateAndTime(exitData.maximumExitTime)
                    : "N/A"
                }
              />

              <DetailRow
                label="Penalty Fee"
                value={formatPenaltyFee(String(sessionFee ?? ""))}
              />

              <DetailRow
                label="Overstay Time"
                value={formatHours(exitData.overstayTime)}
              />

              <DetailRow
                label="Total Parking Hours"
                value={formatHours(sessionHours)}
                isLast
              />
            </View>
          </View>

          {/* EXIT TIME */}
          <View className="rounded-3xl border border-light-border/60 overflow-hidden bg-white mb-5">
            <DetailRow
              label="Exit Time"
              value={
                exitData.exitTime ? formatDateAndTime(exitData.exitTime) : "N/A"
              }
              isLast
            />
          </View>

          {/* FOOTER STATUS */}
          <View className="bg-light-background rounded-2xl p-4 border border-light-border/60 flex-row items-start">
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
                The parking session has been recorded with the final exit
                details.
              </Body>

              {ownerName ? (
                <Body
                  className="text-light-muted font-heavy mt-2"
                  style={{ fontSize: 12 }}
                >
                  For {ownerName}
                </Body>
              ) : null}
            </View>
          </View>

          {/* ACTIONS */}
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
