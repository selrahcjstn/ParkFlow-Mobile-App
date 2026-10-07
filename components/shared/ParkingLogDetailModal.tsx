import { useAuthStore } from "@/features/auth/store/auth.store";
import { ParkingHistoryResponse } from "@/features/history/types/history.types";
import { formatDate } from "@/utils/formatDate";
import { formatTime } from "@/utils/formatTime";
import { X } from "lucide-react-native";
import React from "react";
import { Image, Modal, Pressable, Text, TouchableOpacity, View } from "react-native";

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
      className={`flex-row justify-between items-center py-3.5 ${!isLast ? "border-b border-light-border dark:border-dark-border" : ""}`}
    >
      <Text className="font-light text-[13px] text-light-muted dark:text-dark-muted">{label}</Text>
      <Text className="font-book text-[13px] text-light-text dark:text-dark-text">{value}</Text>
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
  const { user } = useAuthStore();
  const isGuardUser = isGuardSide || user?.profileType === "guard";

  if (!log) return null;

  const isPaid = log.isPaid ?? false;

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
        <Pressable className="w-full bg-light-surface dark:bg-dark-surface rounded-3xl overflow-hidden p-6 border border-light-border dark:border-dark-border">
          <View className="flex-row items-center justify-between mb-6">
            <Text className="font-bold text-[18px] text-light-text dark:text-dark-text">Parking Session</Text>
            <TouchableOpacity
              onPress={onClose}
              className="w-8 h-8 rounded-full bg-light-surfaceLighter dark:bg-dark-surfaceLighter items-center justify-center"
            >
              <X size={16} className="text-light-muted dark:text-dark-muted" strokeWidth={2.5} />
            </TouchableOpacity>
          </View>

          {(log as any).motorPictureUrl ? (
            <View className="relative w-full h-44 rounded-2xl overflow-hidden mb-6 border border-light-border/40 dark:border-dark-border">
              <Image
                source={{ uri: (log as any).motorPictureUrl }}
                style={{ width: "100%", height: "100%" }}
                resizeMode="cover"
              />
              <View className="absolute inset-0 bg-black/20 justify-between p-3">
                <View className="flex-row justify-between items-center">
                  <View className="bg-black/60 px-3 py-1 rounded-full border border-white/20">
                    <Text className="text-white font-bold text-[10px] uppercase">
                      {log.brand} {(log as any).color ? `· ${(log as any).color}` : ""}
                    </Text>
                  </View>
                  <Text className="text-white font-bold text-[11px] bg-black/60 px-2.5 py-0.5 rounded-md uppercase">
                    {log.type}
                  </Text>
                </View>
                <View className="bg-white/95 dark:bg-black/90 px-4 py-1 rounded-2xl self-center border border-white/30 shadow-lg">
                  <Text className="text-center font-bold tracking-widest text-[18px] text-light-text dark:text-dark-text">
                    {plateNumber}
                  </Text>
                </View>
              </View>
            </View>
          ) : (
            <View className="w-full bg-light-surfaceMuted dark:bg-dark-surfaceMuted rounded-2xl py-5 items-center mb-6">
              <Text className="font-light uppercase tracking-widest text-[10px] mb-1 text-light-muted dark:text-dark-muted">
                Plate Number
              </Text>
              <Text className="font-bold text-[26px] tracking-wide text-center text-light-text dark:text-dark-text">
                {plateNumber}
              </Text>
            </View>
          )}

          <View className="mb-6">
            <Text className="font-bold text-[14px] mb-1 text-light-text dark:text-dark-text">Session Details</Text>
            <View className="px-1">
              {isGuardSide && <InfoRow label="Name" value={fullName} />}
              {isGuardSide && <InfoRow label="Role" value={log.roleName || "N/A"} />}
              <InfoRow label="Vehicle" value={`${log.brand} (${log.type})`} />
              {(log as any).color ? <InfoRow label="Color" value={(log as any).color} /> : null}
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
              />
              <InfoRow
                label="Overstay Hours"
                value={
                  log.overstayHours && log.overstayHours > 0
                    ? `${log.overstayHours.toFixed(1)} ${log.overstayHours === 1 ? "hour" : "hours"}`
                    : "0 hours"
                }
              />
              <InfoRow
                label="Violation Fee"
                value={`₱${(log.violationFee ?? (log.hasViolation ? 100 : 0)).toFixed(2)}`}
              />
              {log.hasViolation && (
                <View className="flex-row justify-between items-center py-3.5 border-b border-light-border dark:border-dark-border">
                  <Text className="font-light text-[13px] text-light-muted dark:text-dark-muted">
                    Payment Status
                  </Text>
                  <View
                    className={`px-3 py-1 rounded-full ${
                      isPaid
                        ? "bg-emerald-500/10 border border-emerald-500/30"
                        : "bg-red-500/10 border border-red-500/30"
                    }`}
                  >
                    <Text
                      className={`font-bold text-[11px] uppercase tracking-wider ${
                        isPaid
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-red-600 dark:text-red-400"
                      }`}
                    >
                      {isPaid ? "PAID" : "UNPAID"}
                    </Text>
                  </View>
                </View>
              )}
            </View>
          </View>


          <TouchableOpacity
            onPress={onClose}
            activeOpacity={0.85}
            className="bg-light-surfaceMuted dark:bg-dark-surfaceMuted rounded-2xl py-3.5 items-center w-full border border-light-border dark:border-dark-border"
          >
            <Text className="font-bold text-light-text dark:text-dark-text text-[14px] leading-5">Close</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
