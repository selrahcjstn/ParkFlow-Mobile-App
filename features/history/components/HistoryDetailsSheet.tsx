import { ParkingHistoryResponse } from "@/features/history/types/history.types";
import { PaymentRecord } from "@/features/history/types/payment.types";
import { formatDate } from "@/utils/formatDate";
import { formatTime } from "@/utils/formatTime";
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetScrollView,
} from "@gorhom/bottom-sheet";
import { X } from "lucide-react-native";
import React, { forwardRef, useMemo } from "react";
import { Text, TouchableOpacity, View } from "react-native";

interface InfoRowProps {
  label: string;
  value: string;
  valueColor?: string;
  isLast?: boolean;
}

function InfoRow({
  label,
  value,
  valueColor = "text-light-text",
  isLast,
}: InfoRowProps) {
  return (
    <View
      className={`flex-row justify-between items-center py-3.5 ${
        !isLast ? "border-b border-light-border/40" : ""
      }`}
    >
      <Text className="text-[13px] font-regular text-light-muted">{label}</Text>
      <Text className={`text-[13px] font-bold ${valueColor}`}>{value}</Text>
    </View>
  );
}

interface HistoryDetailsSheetProps {
  log: ParkingHistoryResponse | null;
  payment: PaymentRecord | null;
  isGuardSide?: boolean;
  onClose: () => void;
}

const HistoryDetailsSheet = forwardRef<
  BottomSheetModal,
  HistoryDetailsSheetProps
>(function HistoryDetailsSheet(
  { log, payment, isGuardSide = false, onClose },
  ref,
) {
  const snapPoints = useMemo(() => ["55%", "80%"], []);

  const isParking = Boolean(log);
  const isPayment = Boolean(payment);

  // Parking Details Parsing
  const entryTime = log?.entryTime ? formatTime(log.entryTime) : "N/A";
  const entryDate = log?.entryTime ? formatDate(log.entryTime) : "N/A";
  const exitTime = log?.exitTime ? formatTime(log.exitTime) : "—";
  const exitDate = log?.exitTime ? formatDate(log.exitTime) : "";
  const plateNumber = log?.plateNumber || "N/A";
  const fullName =
    `${log?.firstName ?? ""} ${log?.lastName ?? ""}`.trim() || "N/A";

  // Payment Details Parsing
  const payDate = payment?.date ? formatDate(payment.date) : "N/A";
  const payTime = payment?.date ? formatTime(payment.date) : "N/A";

  const statusColor =
    payment?.status === "Paid"
      ? "text-light-success"
      : payment?.status === "Pending"
        ? "text-light-warning"
        : "text-light-muted";

  const statusBg =
    payment?.status === "Paid"
      ? "bg-light-success/10"
      : payment?.status === "Pending"
        ? "bg-light-warning/10"
        : "bg-light-surfaceSoft";

  // Self-dismissal handler
  const handleClosePress = () => {
    if (ref && "current" in ref && ref.current) {
      ref.current.dismiss();
    }
  };

  return (
    <BottomSheetModal
      ref={ref}
      index={0}
      snapPoints={snapPoints}
      enablePanDownToClose
      onDismiss={onClose}
      handleIndicatorStyle={{ backgroundColor: "#D4D4D8", width: 36 }}
      backgroundStyle={{
        backgroundColor: "#FFFFFF",
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
      }}
      backdropComponent={(props) => (
        <BottomSheetBackdrop
          {...props}
          appearsOnIndex={0}
          disappearsOnIndex={-1}
        />
      )}
    >
      <BottomSheetScrollView
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingBottom: 40,
          paddingTop: 8,
        }}
      >
        {/* Header */}
        <View className="flex-row items-center justify-between mb-6">
          <Text className="font-bold text-[18px] text-light-text">
            {isParking ? "Parking Session" : "Payment Breakdown"}
          </Text>
          <TouchableOpacity
            onPress={handleClosePress}
            activeOpacity={0.7}
            className="w-8 h-8 rounded-2xl bg-zinc-100 items-center justify-center"
          >
            <X size={16} className="text-light-muted" strokeWidth={2.5} />
          </TouchableOpacity>
        </View>

        {/* Centered Large Card */}
        {isParking && log && (
          <View className="w-full bg-light-surfaceSoft rounded-card py-5 items-center mb-6 border border-light-border/40">
            <Text className="font-regular uppercase tracking-widest text-[10px] mb-1 text-light-muted">
              Plate Number
            </Text>
            <Text className="text-[26px] font-black tracking-wider text-light-text">
              {plateNumber}
            </Text>
          </View>
        )}

        {isPayment && payment && (
          <View className="w-full bg-light-surfaceSoft rounded-card py-5 items-center mb-6 border border-light-border/40">
            <Text className="font-regular uppercase tracking-widest text-[10px] mb-1 text-light-muted">
              Total Amount
            </Text>
            <Text className="text-[32px] font-black tracking-tight text-light-text">
              ₱{payment.amount.toFixed(2)}
            </Text>
            <View className={`${statusBg} mt-2.5 px-2 py-0.5 rounded-pill`}>
              <Text className={`font-bold text-[8px] ${statusColor}`}>
                {(payment.status === "Paid"
                  ? "Settled"
                  : payment.status
                ).toLowerCase()}
              </Text>
            </View>
          </View>
        )}

        {/* Details Breakdown */}
        <View className="mb-6">
          <Text className="text-[14px] font-bold text-light-text mb-1">
            Details
          </Text>
          <View className="px-1">
            {isParking && log && (
              <>
                {isGuardSide && <InfoRow label="Name" value={fullName} />}
                {isGuardSide && (
                  <InfoRow label="Role" value={log.roleName || "N/A"} />
                )}
                <InfoRow label="Vehicle" value={`${log.brand} (${log.type})`} />
                <InfoRow label="Entry" value={`${entryTime} · ${entryDate}`} />
                <InfoRow
                  label="Exit"
                  value={`${exitTime} ${exitDate ? `· ${exitDate}` : ""}`}
                />
                <InfoRow
                  label="Duration"
                  value={`${log.parkingDuration.toFixed(1)} ${
                    log.parkingDuration === 1 ? "hour" : "hours"
                  }`}
                />
                <InfoRow
                  label="Violation"
                  value={log.hasViolation ? "Yes" : "No"}
                  valueColor={
                    log.hasViolation ? "text-light-danger" : "text-light-text"
                  }
                  isLast
                />
              </>
            )}

            {isPayment && payment && (
              <>
                <InfoRow label="Plate Number" value={payment.plateNumber} />
                <InfoRow label="Account Name" value={payment.name} />
                <InfoRow label="Billing Date" value={payDate} />
                <InfoRow label="Timestamp" value={payTime} isLast />
              </>
            )}
          </View>
        </View>
      </BottomSheetScrollView>
    </BottomSheetModal>
  );
});

export default HistoryDetailsSheet;
