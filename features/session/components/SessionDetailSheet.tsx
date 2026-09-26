import { AppBottomSheet } from "@/components/shared";
import { GetActiveParkingSessionResponse } from "@/features/session/types/parking-log.types";
import { useAppTheme } from "@/hooks/useAppTheme";
import { formatDate } from "@/utils/formatDate";
import { formatTime } from "@/utils/formatTime";
import { formatPhoneNumber } from "@/utils/formatParkingValues";
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import { AlertTriangle, Timer } from "lucide-react-native";
import React, { forwardRef, useMemo } from "react";
import { Text, View } from "react-native";

interface InfoRowProps {
  label: string;
  value: string;
  valueColor?: string;
  isLast?: boolean;
}

function InfoRow({
  label,
  value,
  valueColor = "text-light-text dark:text-dark-text",
  isLast,
}: InfoRowProps) {
  return (
    <View
      className={`flex-row justify-between items-center py-3.5 ${
        !isLast
          ? "border-b border-light-border/40 dark:border-dark-border"
          : ""
      }`}
    >
      <Text className="text-[13px] font-regular text-light-muted dark:text-dark-muted">
        {label}
      </Text>
      <Text className={`text-[13px] font-bold ${valueColor}`}>{value}</Text>
    </View>
  );
}

interface SessionDetailSheetProps {
  session: GetActiveParkingSessionResponse | null;
  onClose: () => void;
}

const SessionDetailSheet = forwardRef<
  BottomSheetModal,
  SessionDetailSheetProps
>(function SessionDetailSheet({ session, onClose }, ref) {
  const { colors } = useAppTheme();

  const [cachedSession, setCachedSession] = React.useState<GetActiveParkingSessionResponse | null>(null);

  React.useEffect(() => {
    if (session) {
      setCachedSession(session);
    }
  }, [session]);

  const activeSession = session || cachedSession;

  // Check if session has exceeded the maximum exit time
  const isOverstay = useMemo(() => {
    if (!activeSession) return false;
    const isManual = String(activeSession.entryMethod).toLowerCase() === "manual" || activeSession.entryMethod === 1;
    if (isManual) return false;

    if (!activeSession.maximumExitTime) return false;

    // If limit matches entryTime, no limit is set
    const entryTimeMs = activeSession.entryTime ? new Date(activeSession.entryTime).getTime() : 0;
    const maxExitMs = new Date(activeSession.maximumExitTime).getTime();
    if (Math.abs(maxExitMs - entryTimeMs) <= 1000) return false;

    return new Date() > new Date(activeSession.maximumExitTime);
  }, [activeSession?.maximumExitTime, activeSession?.entryTime, activeSession?.entryMethod]);

  // Format active duration
  const duration = useMemo(() => {
    if (!activeSession) return "—";
    if (activeSession.totalParkingHours) return activeSession.totalParkingHours;
    if (!activeSession.entryTime) return "—";
    const entry = new Date(activeSession.entryTime);
    const diffMs = new Date().getTime() - entry.getTime();
    if (diffMs <= 0) return "0m";
    const totalMins = Math.floor(diffMs / 60000);
    const hrs = Math.floor(totalMins / 60);
    const mins = totalMins % 60;
    return hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`;
  }, [activeSession?.entryTime, activeSession?.totalParkingHours]);

  const hasPenalty = Boolean(
    (activeSession?.amount ?? 0) > 0 || (activeSession?.overstayHours ?? 0) > 0,
  );

  const penaltyAmount =
    activeSession?.amount != null ? `₱${activeSession.amount.toFixed(2)}` : "N/A";
  const overstayHours =
    activeSession?.overstayHours != null
      ? `${activeSession.overstayHours % 1 === 0 ? activeSession.overstayHours.toString() : activeSession.overstayHours.toFixed(1)} ${activeSession.overstayHours === 1 ? "hour" : "hours"}`
      : "N/A";

  const entryTime = activeSession?.entryTime ? formatTime(activeSession.entryTime) : "N/A";
  const entryDate = activeSession?.entryTime ? formatDate(activeSession.entryTime) : "N/A";
  const maxExit = activeSession?.maximumExitTime
    ? formatTime(activeSession.maximumExitTime)
    : "N/A";
  const fullName =
    `${activeSession?.firstName ?? ""} ${activeSession?.lastName ?? ""}`.trim() || "N/A";

  return (
    <AppBottomSheet
      ref={ref}
      title="Session Details"
      subtitle="View details of the active parking session"
      onDismiss={onClose}
      snapPoints={["65%", "85%"]}
    >
      {activeSession && (
        <>
      {/* ── Plate Number Hero ── */}
      <View className="w-full bg-light-surfaceMuted dark:bg-dark-surfaceMuted rounded-card py-5 items-center mb-6 border border-light-border/40 dark:border-dark-border">
        <Text className="font-regular uppercase tracking-wider text-[12px] mb-0.5 text-light-muted dark:text-dark-muted">
          Plate Number
        </Text>
        <Text className="text-[26px] font-black tracking-wider text-light-text dark:text-dark-text">
          {activeSession.plateNumber || "N/A"}
        </Text>
        
        {isOverstay ? (
          <View className="mt-2.5 px-3 py-1 rounded-full bg-red-50 dark:bg-red-500/15 border border-red-200 dark:border-red-500/30 flex-row items-center gap-1.5">
            <AlertTriangle size={12} color={colors.danger} strokeWidth={2.5} />
            <Text
              style={{ color: colors.danger, fontSize: 10, letterSpacing: 0.5 }}
              className="font-bold uppercase"
            >
              Overstay
            </Text>
          </View>
        ) : (
          <View className="mt-2.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-500/15 border border-emerald-200 dark:border-emerald-500/30 flex-row items-center gap-1.5">
            <Timer size={12} color={colors.success} strokeWidth={2.5} />
            <Text
              style={{ color: colors.success, fontSize: 10, letterSpacing: 0.5 }}
              className="font-bold uppercase"
            >
              Ongoing
            </Text>
          </View>
        )}
      </View>

      {/* ── Details Sections ── */}
      <View className="mb-6">
        {/* Vehicle Section */}
        <Text className="text-[14px] font-bold text-light-text dark:text-dark-text mb-2">
          Vehicle Information
        </Text>
        <View className="px-1 mb-5">
          <InfoRow label="Brand" value={activeSession.brand || "N/A"} />
          <InfoRow label="Type" value={activeSession.vehicleType || "N/A"} isLast />
        </View>

        {/* Session Section */}
        <Text className="text-[14px] font-bold text-light-text dark:text-dark-text mb-2">
          Parking Details
        </Text>
        <View className="px-1 mb-5">
          <InfoRow label="Duration" value={duration} />
          <InfoRow label="Entry Date" value={entryDate} />
          <InfoRow label="Entry Time" value={entryTime} />
          <InfoRow label="Must Exit By" value={maxExit} isLast />
        </View>

        {/* Violations Section */}
        {hasPenalty && (
          <>
            <Text className="text-[14px] font-bold text-light-text dark:text-dark-text mb-2">
              Violations
            </Text>
            <View className="px-1 mb-5">
              <InfoRow label="Overstay Hours" value={overstayHours} />
              <InfoRow label="Penalty Amount" value={penaltyAmount} isLast valueColor="text-light-danger dark:text-dark-danger" />
            </View>
          </>
        )}

        {/* Owner Section */}
        <Text className="text-[14px] font-bold text-light-text dark:text-dark-text mb-2">
          Owner
        </Text>
        <View className="px-1">
          <InfoRow label="Name" value={fullName} />
          <InfoRow label="Contact" value={formatPhoneNumber(activeSession.phoneNumber)} isLast />
        </View>
      </View>
      </>
      )}
    </AppBottomSheet>
  );
});

export default SessionDetailSheet;
