import { Body, Caption, Heading, Title } from "@/components/ui/Typography";
import { GetActiveParkingSessionResponse } from "@/types/parkingLog";
import { formatDate } from "@/utils/formatDate";
import { formatTime } from "@/utils/formatTime";
import { Clock, Phone, Truck, X } from "lucide-react-native";
import { Modal, Pressable, TouchableOpacity, View } from "react-native";

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
  if (!session) return null;

  const entryTime = session.entryTime ? formatTime(session.entryTime) : "N/A";
  const entryDate = session.entryTime ? formatDate(session.entryTime) : "N/A";
  const maxExit = session.maximumExitTime
    ? formatTime(session.maximumExitTime)
    : "N/A";
  const fullName = `${session.firstName ?? ""} ${session.lastName ?? ""}`.trim() || "N/A";

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
            <View className="mt-2 bg-light-success/15 px-3 py-1 rounded-full">
              <Caption className="text-light-success font-heavy text-[11px]">
                Ongoing
              </Caption>
            </View>
          </View>

          {/* ── Vehicle Section ── */}
          <View className="px-6 pb-2">
            <View className="flex-row items-center gap-2 mb-1">
              <Truck size={14} color="#71717A" strokeWidth={2} />
              <Caption className="font-heavy uppercase tracking-widest text-[10px]">
                Vehicle
              </Caption>
            </View>
            <InfoRow label="Brand" value={session.brand || "N/A"} />
            <InfoRow label="Type" value={session.vehicleType || "N/A"} />
          </View>

          {/* ── Time Section ── */}
          <View className="px-6 pb-2">
            <View className="flex-row items-center gap-2 mb-1">
              <Clock size={14} color="#71717A" strokeWidth={2} />
              <Caption className="font-heavy uppercase tracking-widest text-[10px]">
                Timing
              </Caption>
            </View>
            <InfoRow label="Entry Time" value={entryTime} />
            <InfoRow label="Entry Date" value={entryDate} />
            <InfoRow label="Must Exit By" value={maxExit} />
            <InfoRow
              label="Duration"
              value={session.totalParkingHours || "N/A"}
            />
          </View>

          {/* ── Parkee Section ── */}
          <View className="px-6 pb-2">
            <View className="flex-row items-center gap-2 mb-1">
              <Phone size={14} color="#71717A" strokeWidth={2} />
              <Caption className="font-heavy uppercase tracking-widest text-[10px]">
                Parkee
              </Caption>
            </View>
            <InfoRow label="Name" value={fullName} />
            <InfoRow
              label="Contact"
              value={session.phoneNumber || "N/A"}
            />
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
