import { ParkingHistoryResponse } from "@/features/history/types/history.types";
import { formatDate } from "@/utils/formatDate";
import { formatTime } from "@/utils/formatTime";
import { X } from "lucide-react-native";
import React from "react";
import { Modal, Pressable, Text, TouchableOpacity, View } from "react-native";

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
      <Text className="font-light text-[13px] text-light-muted">{label}</Text>
      <Text className="font-book text-[13px] text-light-text">{value}</Text>
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
            <Text className="font-heavy text-[18px] text-light-text">Parking Session</Text>
            <TouchableOpacity
              onPress={onClose}
              className="w-8 h-8 rounded-full bg-light-background items-center justify-center"
            >
              <X size={16} className="text-light-muted" strokeWidth={2.5} />
            </TouchableOpacity>
          </View>

          <View className="w-full bg-light-surfaceSoft rounded-2xl py-5 items-center mb-6">
            <Text className="font-light uppercase tracking-widest text-[10px] mb-1 text-light-muted">
              Plate Number
            </Text>
            <Text className="font-black text-[26px] tracking-wide text-center text-light-text">
              {plateNumber}
            </Text>
          </View>

          <View className="mb-6">
            <Text className="font-heavy text-[14px] mb-1 text-light-text">Session Details</Text>
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
                value={
                  log.parkingDuration != null
                    ? `${log.parkingDuration.toFixed(1)} ${log.parkingDuration === 1 ? "hour" : "hours"}`
                    : "Active"
                }
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
            <Text className="font-book text-white text-[14px] leading-5">Close</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

