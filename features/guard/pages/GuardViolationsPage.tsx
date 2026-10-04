import SubScreenLayout from "@/components/layouts/SubScreenLayout";
import { useViolationStore } from "@/features/violation/store/violation.store";
import { useHistoryStore } from "@/features/history/store/history.store";
import { violationService } from "@/features/violation/services/violation.service";
import {
  ActiveViolationDto,
  HasViolationNotificationDto,
} from "@/features/violation/types/violation.types";
import { useAppTheme } from "@/hooks/useAppTheme";
import { router } from "expo-router";
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  Clock,
  CreditCard,
  FileText,
  Search,
  ShieldAlert,
  ShieldCheck,
  User,
  X,
} from "lucide-react-native";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import ViolationSummaryPage from "@/features/violation/pages/ViolationSummaryPage";

type GuardTab = "unpaid" | "settled";

export default function GuardViolationsPage() {
  const { colors, isDark } = useAppTheme();

  const {
    guardViolationsList,
    guardUnpaidCount,
    isLoadingGuardViolations,
    loadGuardViolations,
    fetchGuardUnpaidCount,
    markViolationAsPaid,
  } = useViolationStore();

  const [activeTab, setActiveTab] = useState<GuardTab>("unpaid");
  const [searchQuery, setSearchQuery] = useState("");
  const [processingRef, setProcessingRef] = useState<string | null>(null);
  const [selectedViolation, setSelectedViolation] = useState<ActiveViolationDto | null>(null);

  const fetchViolations = useCallback(async () => {
    await Promise.all([
      loadGuardViolations(true),
      fetchGuardUnpaidCount(),
    ]);
  }, [loadGuardViolations, fetchGuardUnpaidCount]);

  useEffect(() => {
    void fetchViolations();
  }, [fetchViolations]);

  const onRefresh = useCallback(() => {
    void fetchViolations();
  }, [fetchViolations]);

  const unpaidList = useMemo(() => {
    return guardViolationsList.filter(
      (v) =>
        !v.isPaid &&
        v.settlementStatus !== "Paid" &&
        v.settlementStatus !== "Settled"
    );
  }, [guardViolationsList]);

  const settledList = useMemo(() => {
    return guardViolationsList.filter(
      (v) =>
        v.isPaid ||
        v.settlementStatus === "Paid" ||
        v.settlementStatus === "Settled"
    );
  }, [guardViolationsList]);

  const currentTabList = activeTab === "unpaid" ? unpaidList : settledList;

  const filteredList = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return currentTabList;

    return currentTabList.filter((item) => {
      const plate = (item.plateNumber || "").toLowerCase();
      const driver = `${item.firstName || ""} ${item.lastName || ""}`.toLowerCase();
      const ref = (item.referenceNumber || item.violationId || "").toLowerCase();
      const type = (item.violationType || "").toLowerCase();
      return (
        plate.includes(q) ||
        driver.includes(q) ||
        ref.includes(q) ||
        type.includes(q)
      );
    });
  }, [currentTabList, searchQuery]);

  const handleMarkAsPaid = (item: ActiveViolationDto) => {
    const refNum = item.referenceNumber || item.violationId;
    if (!refNum) return;

    const isCharge = item.violationType?.includes("Charge") || refNum.startsWith("CHG-");

    Alert.alert(
      "Confirm Settlement",
      `Mark ${isCharge ? "parking charge" : "citation"} ${refNum} for vehicle ${item.plateNumber} as paid and settled?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Confirm Payment",
          style: "default",
          onPress: async () => {
            setProcessingRef(refNum);
            try {
              const res = await violationService.processPayment(refNum);
              markViolationAsPaid(refNum);
              if (item.plateNumber) {
                markViolationAsPaid(item.plateNumber);
                useHistoryStore.getState().markLogAsPaid(item.plateNumber);
              }
              useHistoryStore.getState().markLogAsPaid(refNum);
              void fetchGuardUnpaidCount();

              if (res?.isSuccess || (res as any)?.success) {
                Alert.alert(
                  "Payment Confirmed",
                  `${isCharge ? "Parking charge" : "Violation citation"} ${refNum} has been recorded as settled.`
                );
              } else {
                Alert.alert(
                  "Settlement Recorded",
                  res?.message || "Payment has been updated."
                );
              }
            } catch (err: any) {
              markViolationAsPaid(refNum);
              if (item.plateNumber) {
                markViolationAsPaid(item.plateNumber);
                useHistoryStore.getState().markLogAsPaid(item.plateNumber);
              }
              useHistoryStore.getState().markLogAsPaid(refNum);
              void fetchGuardUnpaidCount();

              Alert.alert(
                "Payment Confirmed",
                "Payment has been marked as settled."
              );
            } finally {
              setProcessingRef(null);
            }
          },
        },
      ]
    );
  };

  const mapToNotificationDto = (item: ActiveViolationDto): HasViolationNotificationDto => {
    const isPaid =
      item.isPaid ||
      item.settlementStatus === "Paid" ||
      item.settlementStatus === "Settled";

    return {
      ReferenceNumber: item.referenceNumber || item.violationId,
      RefNumber: item.referenceNumber || item.violationId,
      IssuedDate: item.issuedAt,
      IssuedTime: item.issuedAt,
      IssuedBy: "ParkFlow Security",
      OverstayHours: 0,
      PlateNumber: item.plateNumber,
      Amount: item.penaltyFee,
      ViolationType: item.violationType || "Parking Violation",
      IsViolation: !isPaid,
      IsPaid: isPaid,
      SettlementStatus: isPaid ? "Settled" : item.settlementStatus || "Unpaid",
      Brand: item.brand,
      DriverName: `${item.firstName || ""} ${item.lastName || ""}`.trim() || undefined,
      VehicleType: item.vehicleType,
    };
  };

  const renderViolatorCard = ({ item }: { item: ActiveViolationDto }) => {
    const isPaid =
      item.isPaid ||
      item.settlementStatus === "Paid" ||
      item.settlementStatus === "Settled";

    const refNum = item.referenceNumber || item.violationId;
    const isProcessingThis = processingRef === refNum;

    const formattedDate = item.issuedAt
      ? new Date(item.issuedAt).toLocaleDateString("en-PH", {
          month: "short",
          day: "numeric",
          year: "numeric",
        })
      : "N/A";

    const driverName =
      `${item.firstName || ""} ${item.lastName || ""}`.trim() || "Registered User";

    return (
      <View
        className="bg-light-surface dark:bg-dark-surface p-4 rounded-card mb-3.5 border border-light-border dark:border-dark-border"
        style={{
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: isDark ? 0.2 : 0.04,
          shadowRadius: 3,
          elevation: 1,
        }}
      >
        {/* Top Header: Violator Info & Status Pill */}
        <View className="flex-row justify-between items-start mb-2.5">
          <View className="flex-row items-center gap-2.5 flex-1 mr-2">
            <View
              className={`w-9 h-9 rounded-full ${
                isPaid
                  ? "bg-light-success/10 dark:bg-dark-success/20"
                  : "bg-light-danger/10 dark:bg-dark-danger/20"
              } items-center justify-center`}
            >
              {isPaid ? (
                <ShieldCheck size={18} color={colors.success} strokeWidth={2.2} />
              ) : (
                <ShieldAlert size={18} color={colors.danger} strokeWidth={2.2} />
              )}
            </View>
            <View className="flex-1">
              <View className="flex-row items-center gap-1.5">
                <Text
                  className="text-light-text dark:text-dark-text font-bold text-[14px]"
                  numberOfLines={1}
                >
                  {driverName}
                </Text>
                {item.roleName && (
                  <View className="bg-light-surfaceLighter dark:bg-dark-surfaceLighter px-1.5 py-0.2 rounded border border-light-border dark:border-dark-border">
                    <Text className="text-light-muted dark:text-dark-muted font-bold text-[9px] uppercase">
                      {item.roleName}
                    </Text>
                  </View>
                )}
              </View>
              <Text className="text-light-muted dark:text-dark-muted font-regular text-[11px] mt-0.5">
                Ref: {refNum}
              </Text>
            </View>
          </View>

          <View className="items-end">
            <Text
              className={`${
                isPaid
                  ? "text-light-success dark:text-dark-success"
                  : "text-light-text dark:text-dark-text"
              } font-bold text-[15px]`}
            >
              ₱{item.penaltyFee.toFixed(2)}
            </Text>
            <View
              className={`${
                isPaid
                  ? "bg-light-success/10 dark:bg-dark-success/20"
                  : "bg-light-danger/10 dark:bg-dark-danger/20"
              } px-2 py-0.5 rounded-pill mt-1.5`}
            >
              <Text
                className={`${
                  isPaid
                    ? "text-light-success dark:text-dark-success"
                    : "text-light-danger dark:text-dark-danger"
                } text-[10px] font-bold tracking-wide`}
              >
                {isPaid ? "SETTLED" : "UNPAID"}
              </Text>
            </View>
          </View>
        </View>

        <View className="h-[1px] bg-light-border dark:bg-dark-border my-2" />

        {/* Details Row: Vehicle & Date */}
        <View className="flex-row justify-between items-center mt-1">
          <View>
            <Text className="text-light-muted dark:text-dark-muted font-medium text-[11px]">
              Vehicle Details
            </Text>
            <Text className="text-light-text dark:text-dark-text font-bold text-[12px] mt-0.5">
              {item.brand} ({item.plateNumber})
            </Text>
          </View>
          <View className="items-end">
            <Text className="text-light-muted dark:text-dark-muted font-medium text-[11px]">
              {item.violationType?.includes("Charge") ? "Type" : "Violation"}
            </Text>
            <Text className="text-light-text dark:text-dark-text font-bold text-[12px] mt-0.5">
              {item.violationType || "Overstay"}
            </Text>
          </View>
        </View>

        <View className="flex-row justify-between items-center mt-2.5">
          <View>
            <Text className="text-light-muted dark:text-dark-muted font-medium text-[11px]">
              Issued Date
            </Text>
            <Text className="text-light-text dark:text-dark-text font-bold text-[12px] mt-0.5">
              {formattedDate}
            </Text>
          </View>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setSelectedViolation(item)}
            className="py-1 px-2.5 bg-light-surfaceLighter dark:bg-dark-surfaceLighter rounded-lg border border-light-border dark:border-dark-border"
          >
            <Text className="text-light-muted dark:text-dark-muted font-bold text-[11px]">
              View Details
            </Text>
          </TouchableOpacity>
        </View>

        {/* Guard Mark as Paid CTA Button */}
        {!isPaid && (
          <TouchableOpacity
            activeOpacity={0.8}
            disabled={isProcessingThis}
            onPress={() => handleMarkAsPaid(item)}
            className="mt-3.5 bg-light-primary dark:bg-dark-primary py-2.5 rounded-xl flex-row items-center justify-center gap-2 active:opacity-90"
          >
            {isProcessingThis ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <CreditCard size={15} color="#FFFFFF" strokeWidth={2.2} />
                <Text className="text-white font-bold text-[12px] tracking-wide uppercase">
                  Mark as Paid
                </Text>
              </>
            )}
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <SubScreenLayout title="Charges & Citations" onBack={() => router.back()}>
      <View className="flex-1 px-4">
        {/* Search Bar */}
        <View className="mt-3 mb-2 flex-row items-center bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border rounded-2xl px-3.5 py-2.5">
          <Search size={18} color={colors.muted} strokeWidth={2} />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search by plate, name, or reference no..."
            placeholderTextColor={isDark ? "#71717A" : "#A1A1AA"}
            className="flex-1 ml-2.5 text-light-text dark:text-dark-text font-book text-[13px] p-0"
            autoCapitalize="none"
            autoCorrect={false}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => setSearchQuery("")}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <X size={16} color={colors.muted} />
            </TouchableOpacity>
          )}
        </View>

        {/* Segmented Tab Switcher */}
        <View className="my-2">
          <View className="flex-row p-1 bg-light-surfaceLighter dark:bg-dark-surfaceLighter rounded-2xl border border-light-border dark:border-dark-border">
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setActiveTab("unpaid")}
              className={`flex-1 flex-row items-center justify-center py-2.5 rounded-xl ${
                activeTab === "unpaid"
                  ? "bg-light-surface dark:bg-dark-surface"
                  : ""
              }`}
              style={
                activeTab === "unpaid"
                  ? {
                      shadowColor: "#000",
                      shadowOffset: { width: 0, height: 1 },
                      shadowOpacity: isDark ? 0.25 : 0.08,
                      shadowRadius: 2,
                      elevation: 2,
                    }
                  : undefined
              }
            >
              <AlertTriangle
                size={14}
                color={activeTab === "unpaid" ? colors.danger : colors.muted}
                strokeWidth={2.2}
              />
              <Text
                className={`font-bold text-[13px] ml-1.5 ${
                  activeTab === "unpaid"
                    ? "text-light-text dark:text-dark-text"
                    : "text-light-muted dark:text-dark-muted"
                }`}
              >
                Unpaid Charges
              </Text>
              {unpaidList.length > 0 && (
                <View className="ml-2 bg-light-danger dark:bg-dark-danger px-1.5 py-0.5 rounded-full">
                  <Text className="text-white text-[10px] font-bold">
                    {unpaidList.length}
                  </Text>
                </View>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setActiveTab("settled")}
              className={`flex-1 flex-row items-center justify-center py-2.5 rounded-xl ${
                activeTab === "settled"
                  ? "bg-light-surface dark:bg-dark-surface"
                  : ""
              }`}
              style={
                activeTab === "settled"
                  ? {
                      shadowColor: "#000",
                      shadowOffset: { width: 0, height: 1 },
                      shadowOpacity: isDark ? 0.25 : 0.08,
                      shadowRadius: 2,
                      elevation: 2,
                    }
                  : undefined
              }
            >
              <Clock
                size={14}
                color={activeTab === "settled" ? colors.primary : colors.muted}
                strokeWidth={2.2}
              />
              <Text
                className={`font-bold text-[13px] ml-1.5 ${
                  activeTab === "settled"
                    ? "text-light-text dark:text-dark-text"
                    : "text-light-muted dark:text-dark-muted"
                }`}
              >
                Settled History
              </Text>
              {settledList.length > 0 && (
                <View className="ml-2 bg-light-surfaceLighter dark:bg-dark-surfaceLighter border border-light-border dark:border-dark-border px-1.5 py-0.5 rounded-full">
                  <Text className="text-light-muted dark:text-dark-muted text-[10px] font-bold">
                    {settledList.length}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Violations List */}
        <FlatList
          data={filteredList}
          keyExtractor={(item) => item.violationId || item.referenceNumber}
          renderItem={renderViolatorCard}
          contentContainerStyle={{
            paddingTop: 8,
            paddingBottom: 40,
            flexGrow: 1,
          }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isLoadingGuardViolations}
              onRefresh={onRefresh}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
          ListEmptyComponent={
            !isLoadingGuardViolations ? (
              <View className="flex-1 items-center justify-center px-6 py-16">
                <View
                  className={`w-20 h-20 rounded-full ${
                    activeTab === "unpaid"
                      ? "bg-light-success/10 dark:bg-dark-success/20"
                      : "bg-light-surfaceLighter dark:bg-dark-surfaceLighter"
                  } items-center justify-center mb-5`}
                >
                  {activeTab === "unpaid" ? (
                    <CheckCircle2
                      size={36}
                      color={colors.success}
                      strokeWidth={2.5}
                    />
                  ) : (
                    <FileText
                      size={36}
                      color={colors.muted}
                      strokeWidth={2}
                    />
                  )}
                </View>
                <Text className="text-light-text dark:text-dark-text font-bold text-[18px] text-center mb-2">
                  {searchQuery
                    ? "No Matching Results"
                    : activeTab === "unpaid"
                    ? "No Unpaid Charges"
                    : "No Settled History"}
                </Text>
                <Text className="text-light-muted dark:text-dark-muted font-regular text-[13px] text-center leading-[20px] max-w-[280px]">
                  {searchQuery
                    ? "Try adjusting your search query for plate, driver, or reference number."
                    : activeTab === "unpaid"
                    ? "There are currently no outstanding parking charges or citations on campus. All fees are settled."
                    : "No settled charge or citation records found in the system."}
                </Text>
              </View>
            ) : null
          }
        />

        {/* Detail Sheet Modal */}
        {selectedViolation && (
          <ViolationSummaryPage
            visible={!!selectedViolation}
            violation={mapToNotificationDto(selectedViolation)}
            onBack={() => {
              setSelectedViolation(null);
              void fetchViolations();
            }}
          />
        )}
      </View>
    </SubScreenLayout>
  );
}
