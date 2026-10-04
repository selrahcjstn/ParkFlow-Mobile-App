import { ContentWrapper } from "@/components/layouts";
import { useViolationStore } from "@/features/violation/store/violation.store";
import {
  ActiveViolationDto,
  HasViolationNotificationDto,
} from "@/features/violation/types/violation.types";
import { useAppTheme } from "@/hooks/useAppTheme";
import { useNavigation } from "expo-router";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  FileText,
  ShieldCheck,
} from "lucide-react-native";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  FlatList,
  RefreshControl,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import ViolationSummaryPage from "./ViolationSummaryPage";

type ViolationTab = "unpaid" | "history";

export default function ActiveViolationsPage() {
  const { colors, isDark } = useAppTheme();
  const navigation = useNavigation();
  const lastScrolledRef = useRef(false);

  const {
    activeViolationsList,
    isLoadingActiveViolations,
    loadActiveViolations,
  } = useViolationStore();

  const [activeTab, setActiveTab] = useState<ViolationTab>("unpaid");
  const [selectedViolation, setSelectedViolation] = useState<ActiveViolationDto | null>(null);

  useEffect(() => {
    void loadActiveViolations(true);
  }, []);

  const onRefresh = () => {
    void loadActiveViolations(true);
  };

  const handleScroll = (event: any) => {
    const yOffset = event?.nativeEvent?.contentOffset?.y;
    if (yOffset !== undefined && yOffset !== null) {
      const scrolled = yOffset > 0;
      if (lastScrolledRef.current !== scrolled) {
        lastScrolledRef.current = scrolled;
        try {
          navigation?.setParams?.({ hasScrolled: scrolled } as any);
        } catch {
          // Ignore navigation param errors
        }
      }
    }
  };

  const unpaidList = useMemo(() => {
    return activeViolationsList.filter(
      (item) =>
        !item.isPaid &&
        item.settlementStatus !== "Paid" &&
        item.settlementStatus !== "Settled"
    );
  }, [activeViolationsList]);

  const historyList = useMemo(() => {
    return activeViolationsList.filter(
      (item) =>
        item.isPaid ||
        item.settlementStatus === "Paid" ||
        item.settlementStatus === "Settled"
    );
  }, [activeViolationsList]);

  const displayedList = activeTab === "unpaid" ? unpaidList : historyList;

  const mapActiveToNotificationDto = (
    item: ActiveViolationDto
  ): HasViolationNotificationDto => {
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
      VehicleType: item.vehicleType,
    };
  };

  const renderItem = ({ item }: { item: ActiveViolationDto }) => {
    const isPaid =
      item.isPaid ||
      item.settlementStatus === "Paid" ||
      item.settlementStatus === "Settled";

    const formattedDate = item.issuedAt
      ? new Date(item.issuedAt).toLocaleDateString("en-PH", {
          month: "short",
          day: "numeric",
          year: "numeric",
        })
      : "N/A";

    return (
      <TouchableOpacity
        activeOpacity={0.75}
        onPress={() => setSelectedViolation(item)}
        className="bg-light-surface dark:bg-dark-surface p-4 rounded-card mb-3.5 border border-light-border dark:border-dark-border"
        style={{
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: isDark ? 0.2 : 0.04,
          shadowRadius: 3,
          elevation: 1,
        }}
      >
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
                <AlertTriangle size={18} color={colors.danger} strokeWidth={2.2} />
              )}
            </View>
            <View className="flex-1">
              <Text
                className="text-light-text dark:text-dark-text font-bold text-[14px]"
                numberOfLines={1}
              >
                {item.violationType || "Parking Citation"}
              </Text>
              <Text className="text-light-muted dark:text-dark-muted font-regular text-[11px] mt-0.5">
                Ref: {item.referenceNumber || item.violationId?.slice(0, 8)}
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
              Issued Date
            </Text>
            <Text className="text-light-text dark:text-dark-text font-bold text-[12px] mt-0.5">
              {formattedDate}
            </Text>
          </View>
        </View>

        <View
          className={`mt-3.5 ${
            isPaid
              ? "bg-light-surfaceLighter dark:bg-dark-surfaceLighter border border-light-border dark:border-dark-border"
              : item.violationType?.includes("Charge")
              ? "bg-light-primary/5 dark:bg-dark-primary/10 border border-light-primary/20 dark:border-dark-primary/30"
              : "bg-light-danger/5 dark:bg-dark-danger/10 border border-light-danger/20 dark:border-dark-danger/30"
          } rounded-lg py-2 items-center`}
        >
          <Text
            className={`${
              isPaid
                ? "text-light-muted dark:text-dark-muted"
                : item.violationType?.includes("Charge")
                ? "text-light-primary dark:text-dark-primary"
                : "text-light-danger dark:text-dark-danger"
            } font-bold text-[11px]`}
          >
            {isPaid
              ? "View Receipt Details"
              : item.violationType?.includes("Charge")
              ? "View & Settle Charge"
              : "View Citation Details"}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <ContentWrapper noPaddingY>
      {/* Segmented Control Tabs */}
      <View className="pt-3 pb-2 px-1">
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
            onPress={() => setActiveTab("history")}
            className={`flex-1 flex-row items-center justify-center py-2.5 rounded-xl ${
              activeTab === "history"
                ? "bg-light-surface dark:bg-dark-surface"
                : ""
            }`}
            style={
              activeTab === "history"
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
              color={activeTab === "history" ? colors.primary : colors.muted}
              strokeWidth={2.2}
            />
            <Text
              className={`font-bold text-[13px] ml-1.5 ${
                activeTab === "history"
                  ? "text-light-text dark:text-dark-text"
                  : "text-light-muted dark:text-dark-muted"
              }`}
            >
              History
            </Text>
            {historyList.length > 0 && (
              <View className="ml-2 bg-light-surfaceLighter dark:bg-dark-surfaceLighter border border-light-border dark:border-dark-border px-1.5 py-0.5 rounded-full">
                <Text className="text-light-muted dark:text-dark-muted text-[10px] font-bold">
                  {historyList.length}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={displayedList}
        keyExtractor={(item) => item.violationId || item.referenceNumber}
        renderItem={renderItem}
        contentContainerStyle={{
          paddingHorizontal: 4,
          paddingTop: 12,
          paddingBottom: 40,
          flexGrow: 1,
        }}
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl
            refreshing={isLoadingActiveViolations}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        ListEmptyComponent={
          !isLoadingActiveViolations ? (
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
                {activeTab === "unpaid"
                  ? "No Unpaid Charges"
                  : "No History"}
              </Text>
              <Text className="text-light-muted dark:text-dark-muted font-regular text-[13px] text-center leading-[20px] max-w-[280px]">
                {activeTab === "unpaid"
                  ? "All parking charges and violation citations have been settled. Your parking account is in good standing."
                  : "You do not have any past charge or violation records on file."}
              </Text>
            </View>
          ) : null
        }
      />

      {/* Citation Detail / Payment Sheet Modal */}
      {selectedViolation && (
        <ViolationSummaryPage
          visible={!!selectedViolation}
          violation={mapActiveToNotificationDto(selectedViolation)}
          onBack={() => {
            setSelectedViolation(null);
            void loadActiveViolations(true);
          }}
        />
      )}
    </ContentWrapper>
  );
}
