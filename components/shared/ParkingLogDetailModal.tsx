import { Caption, Heading, Label, Title } from "@/components/ui/Typography";
import { ParkingHistoryResponse } from "@/features/history/types/history.types";
import { formatDate } from "@/utils/formatDate";
import { formatTime } from "@/utils/formatTime";
import { X } from "lucide-react-native";
import React from "react";
import { Modal, Pressable, TouchableOpacity, View } from "react-native";

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
    <View
      className={`flex-row justify-between items-center py-3.5 ${!isLast ? "border-b border-light-border" : ""}`}
    >
      <Caption className="text-[13px]">{label}</Caption>
      <Label className="text-[13px]">{value}</Label>
    </View>
  );
}

interface ParkingLogDetailModalProps {
  visible: boolean;
  onClose: () => void;
  log: ParkingHistoryResponse | null;
  isGuardSide?: boolean;
}

export function ParkingLogDetailModal({
  visible,
  onClose,
  log,
  isGuardSide = false,
}: ParkingLogDetailModalProps) {
  if (!log) return null;


  const entryTime = log.entryTime ? formatTime(log.entryTime) : "N/A";
  const entryDate = log.entryTime ? formatDate(log.entryTime) : "N/A";
  const exitTime = log.exitTime ? formatTime(log.exitTime) : "—";
  const exitDate = log.exitTime ? formatDate(log.exitTime) : "";
  const plateNumber = log.plateNumber || "N/A";
  const fullName =
    `${log.firstName ?? ""} ${log.lastName ?? ""}`.trim() || "N/A";

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <Pressable
        className="flex-1 bg-black/60 items-center justify-center px-5"
        onPress={onClose}
      >
        <Pressable className="w-full bg-light-surface rounded-3xl overflow-hidden p-6">
          <View className="flex-row items-center justify-between mb-6">
            <Heading className="text-[18px]">Parking Session</Heading>
            <TouchableOpacity
              onPress={onClose}
              className="w-8 h-8 rounded-full bg-light-background items-center justify-center"
            >
              <X size={16} className="text-light-muted" strokeWidth={2.5} />
            </TouchableOpacity>
          </View>

          <View className="w-full bg-light-surfaceSoft rounded-2xl py-5 items-center mb-6">
            <Caption className="uppercase tracking-widest text-[10px] mb-1">
              Plate Number
            </Caption>
            <Title className="text-[26px] tracking-wide text-center">
              {plateNumber}
            </Title>
          </View>

          <View className="mb-6">
            <Heading className="text-[14px] mb-1">Session Details</Heading>
            <View className="px-1">
              {isGuardSide && <InfoRow label="Name" value={fullName} />}
              {isGuardSide && <InfoRow label="Role" value={log.roleName || "N/A"} />}
              <InfoRow label="Vehicle" value={`${log.brand} (${log.type})`} />
              <InfoRow label="Entry" value={`${entryTime} · ${entryDate}`} />
              <InfoRow
                label="Exit"
                value={`${exitTime} ${exitDate ? `· ${exitDate}` : ""}`}
              />
              <InfoRow
                label="Duration"
                value={`${log.parkingDuration.toFixed(1)} ${log.parkingDuration === 1 ? "hour" : "hours"}`}
              />
              <InfoRow
                label="Violation"
                value={log.hasViolation ? "Yes" : "No"}
                isLast
              />
            </View>
          </View>

          <TouchableOpacity
            onPress={onClose}
            activeOpacity={0.85}
            className="bg-light-primary rounded-2xl py-3.5 items-center w-full"
          >
            <Label className="text-white text-[14px]">Close</Label>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
