import { GetActiveParkingSessionResponse } from "@/features/session/types/parking-log.types";
import { useAppTheme } from "@/hooks/useAppTheme";
import { formatDate } from "@/utils/formatDate";
import { formatTime } from "@/utils/formatTime";
import { AlertTriangle, Timer, X } from "lucide-react-native";
import { useMemo } from "react";
import { Modal, Pressable, Text, TouchableOpacity, View } from "react-native";

interface SessionDetailModalProps {
  visible: boolean;
  onClose: () => void;
  session: GetActiveParkingSessionResponse | null;
}

function InfoRow({
  label,
  value,
  isLast,
}: {
  label: string;
  value: string;
  isLast?: boolean;
}) {
  return (
    <View className="flex-row justify-between items-center py-2.5">
      <Text className="text-light-muted dark:text-dark-muted font-regular text-[13px]">{label}</Text>
      <Text className="text-light-text dark:text-dark-text font-heavy text-[13px]">{value}</Text>
    </View>
  );
}

function SectionTitle({ title }: { title: string }) {
  return (
    <Text className="text-light-muted dark:text-dark-muted font-heavy uppercase tracking-widest text-[11px] mb-2">
      {title}
    </Text>
  );
}

export default function SessionDetailModal({
  visible,
  onClose,
  session,
}: SessionDetailModalProps) {
  const { colors, isDark } = useAppTheme();

  // Check if session has exceeded the maximum exit time
  const isOverstay = useMemo(() => {
    if (!session?.maximumExitTime) return false;
    const maxExitDate = new Date(session.maximumExitTime);
    return new Date() > maxExitDate;
  }, [session?.maximumExitTime]);

  // Format active duration
  const duration = useMemo(() => {
    if (!session) return "—";
    if (session.totalParkingHours) return session.totalParkingHours;
    if (!session.entryTime) return "—";
    const entry = new Date(session.entryTime);
    const diffMs = new Date().getTime() - entry.getTime();
    if (diffMs <= 0) return "0m";
    const totalMins = Math.floor(diffMs / 60000);
    const hrs = Math.floor(totalMins / 60);
    const mins = totalMins % 60;
    return hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`;
  }, [session?.entryTime, session?.totalParkingHours]);

  const hasPenalty = Boolean(
    (session?.amount ?? 0) > 0 || (session?.overstayHours ?? 0) > 0,
  );

  const penaltyAmount =
    session?.amount != null ? `₱${session.amount.toFixed(2)}` : "N/A";
  const overstayHours =
    session?.overstayHours != null
      ? `${session.overstayHours % 1 === 0 ? session.overstayHours.toString() : session.overstayHours.toFixed(1)} ${session.overstayHours === 1 ? "hour" : "hours"}`
      : "N/A";

  if (!session) return null;

  const entryTime = session.entryTime ? formatTime(session.entryTime) : "N/A";
  const entryDate = session.entryTime ? formatDate(session.entryTime) : "N/A";
  const maxExit = session.maximumExitTime
    ? formatTime(session.maximumExitTime)
    : "N/A";
  const fullName =
    `${session.firstName ?? ""} ${session.lastName ?? ""}`.trim() || "N/A";

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <Pressable
        className="flex-1 bg-black/50 items-center justify-center px-6"
        onPress={onClose}
      >
        <Pressable className="w-full bg-light-surface dark:bg-dark-surface rounded-3xl overflow-hidden">
          {/* ── Header ── */}
          <View className="px-6 pt-6 pb-4">
            <View className="flex-row items-center justify-between">
              <Text className="text-light-text dark:text-dark-text font-black text-[17px]">
                Session Details
              </Text>
              <TouchableOpacity
                onPress={onClose}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                className="w-8 h-8 rounded-full bg-light-background dark:bg-dark-background items-center justify-center"
              >
                <X size={16} color={isDark ? "#B5BAC1" : "#71717A"} strokeWidth={2.5} />
              </TouchableOpacity>
            </View>
          </View>

          {/* ── Plate Number Hero ── */}
          <View className="mx-6 mb-4 bg-light-background dark:bg-dark-background rounded-2xl px-5 py-4 items-center">
            <Text className="text-light-muted dark:text-dark-muted font-heavy uppercase tracking-widest text-[10px] mb-1">
              Plate Number
            </Text>
            <Text className="text-light-text dark:text-dark-text font-black text-[22px]">
              {session.plateNumber || "N/A"}
            </Text>
            {isOverstay ? (
              <View className="mt-2.5 px-3 py-1 rounded-full bg-light-surfaceMuted dark:bg-dark-surfaceMuted border border-light-border/40 dark:border-dark-border/40 flex-row items-center gap-1.5">
                <AlertTriangle size={12} color={colors.danger} strokeWidth={2.5} />
                <Text
                  style={{
                    color: colors.danger,
                    fontSize: 10,
                    letterSpacing: 0.5,
                  }}
                  className="font-heavy uppercase"
                >
                  Overstay
                </Text>
              </View>
            ) : (
              <View className="mt-2.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/30 flex-row items-center gap-1.5">
                <Timer size={12} color={colors.success} strokeWidth={2.5} />
                <Text
                  style={{
                    color: colors.success,
                    fontSize: 10,
                    letterSpacing: 0.5,
                  }}
                  className="font-heavy uppercase"
                >
                  Ongoing
                </Text>
              </View>
            )}
          </View>

          {/* ── Vehicle Section ── */}
          <View className="px-6 pb-3">
            <SectionTitle title="Vehicle" />
            <View className="px-1">
              <InfoRow label="Brand" value={session.brand || "N/A"} />
              <InfoRow
                label="Type"
                value={session.vehicleType || "N/A"}
                isLast
              />
            </View>
          </View>

          {/* ── Time Section ── */}
          <View className="px-6 pb-3">
            <SectionTitle title="Session Details" />
            <View className="px-1">
              <InfoRow label="Duration" value={duration} />
              <InfoRow label="Entry Date" value={entryDate} />
              <InfoRow label="Must Exit By" value={maxExit} isLast />
            </View>
          </View>

          {hasPenalty && (
            <View className="px-6 pb-3">
              <SectionTitle title="Violations" />
              <View className="px-1">
                <InfoRow label="Overstay Hours" value={overstayHours} />
                <InfoRow label="Amount" value={penaltyAmount} isLast />
              </View>
            </View>
          )}

          {/* ── Parkee Section ── */}
          <View className="px-6 pb-3">
            <SectionTitle title="Owner" />
            <View className="px-1">
              <InfoRow label="Name" value={fullName} />
              <InfoRow
                label="Contact"
                value={session.phoneNumber || "N/A"}
                isLast
              />
            </View>
          </View>

          {/* ── Close button ── */}
          <View className="px-6 pt-2 pb-6">
            <TouchableOpacity
              onPress={onClose}
              activeOpacity={0.85}
              className="bg-light-primary dark:bg-dark-primary rounded-2xl py-3.5 items-center"
            >
              <Text className="text-white dark:text-zinc-950 font-heavy text-[14px]">Close</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
