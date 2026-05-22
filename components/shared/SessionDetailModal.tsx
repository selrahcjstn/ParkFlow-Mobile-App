import { Body, Caption, Heading, Title } from "@/components/ui/Typography";
import { GetActiveParkingSessionResponse } from "@/types/parkingLog";
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

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row justify-between items-center py-2.5">
      <Caption className="font-book text-[13px]">{label}</Caption>
      <Body className="text-light-text font-heavy text-[13px]">{value}</Body>
    </View>
  );
}

export default function SessionDetailModal({
  visible,
  onClose,
  session,
}: SessionDetailModalProps) {
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
        <Pressable className="w-full bg-light-surface rounded-3xl overflow-hidden">
          {/* ── Header ── */}
          <View className="px-6 pt-6 pb-4">
            <View className="flex-row items-center justify-between">
              <Heading className="text-light-text font-black text-[17px]">
                Session Details
              </Heading>
              <TouchableOpacity
                onPress={onClose}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                className="w-8 h-8 rounded-full bg-light-background items-center justify-center"
              >
                <X size={16} color="#71717A" strokeWidth={2.5} />
              </TouchableOpacity>
            </View>
          </View>

          {/* ── Plate Number Hero ── */}
          <View className="mx-6 mb-4 bg-light-background rounded-2xl px-5 py-4 items-center">
            <Caption className="font-heavy uppercase tracking-widest text-[10px] mb-1">
              Plate Number
            </Caption>
            <Title className="text-light-text text-[22px]">
              {session.plateNumber || "N/A"}
            </Title>
            {isOverstay ? (
              <View className="mt-2.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 flex-row items-center gap-1.5">
                <AlertTriangle size={12} color="#D97706" strokeWidth={2.5} />
                <Text
                  style={{
                    color: "#D97706",
                    fontSize: 10,
                    fontFamily: "AvenirHeavy",
                    letterSpacing: 0.5,
                  }}
                  className="uppercase"
                >
                  Overstay
                </Text>
              </View>
            ) : (
              <View className="mt-2.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 flex-row items-center gap-1.5">
                <Timer size={12} color="#059669" strokeWidth={2.5} />
                <Text
                  style={{
                    color: "#059669",
                    fontSize: 10,
                    fontFamily: "AvenirHeavy",
                    letterSpacing: 0.5,
                  }}
                  className="uppercase"
                >
                  Ongoing
                </Text>
              </View>
            )}
          </View>

          {/* ── Vehicle Section ── */}
          <View className="px-6 pb-2">
            <View className="flex-row items-center gap-2 mb-1">
              <Body className="text-light-text font-heavy pt-2 pb-1 text-[13px]">
                Vehicle
              </Body>
            </View>
            <InfoRow label="Brand" value={session.brand || "N/A"} />
            <InfoRow label="Type" value={session.vehicleType || "N/A"} />
          </View>

          {/* ── Time Section ── */}
          <View className="px-6 pb-2">
            <View className="flex-row items-center gap-2 mb-1">
              <Body className="text-light-text font-heavy pt-2 pb-1 text-[13px]">
                Session Details
              </Body>
            </View>
            <InfoRow label="Duration" value={duration} />
            <InfoRow label="Entry Date" value={entryDate} />
            <InfoRow label="Must Exit By" value={maxExit} />
          </View>

          {/* ── Parkee Section ── */}
          <View className="px-6 pb-2">
            <View className="flex-row items-center gap-2 mb-1">
              <Body className="text-light-text font-heavy pt-2 pb-1 text-[13px]">
                Owner
              </Body>
            </View>
            <InfoRow label="Name" value={fullName} />
            <InfoRow label="Contact" value={session.phoneNumber || "N/A"} />
          </View>

          {/* ── Close button ── */}
          <View className="px-6 pt-2 pb-6">
            <TouchableOpacity
              onPress={onClose}
              activeOpacity={0.85}
              className="bg-light-primary rounded-2xl py-3.5 items-center"
            >
              <Body className="text-white font-heavy text-[14px]">Close</Body>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
