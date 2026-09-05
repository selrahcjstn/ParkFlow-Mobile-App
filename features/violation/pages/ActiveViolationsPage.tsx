import { ContentWrapper } from "@/components/layouts";
import { useViolationStore } from "@/features/violation/store/violation.store";
import { ActiveViolationDto, HasViolationNotificationDto } from "@/features/violation/types/violation.types";
import { useAppTheme } from "@/hooks/useAppTheme";
import { useNavigation } from "expo-router";
import { AlertTriangle, CheckCircle2 } from "lucide-react-native";
import React, { useEffect, useRef, useState } from "react";
import {
  FlatList,
  RefreshControl,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import ViolationSummaryPage from "./ViolationSummaryPage";

export default function ActiveViolationsPage() {
  const { colors } = useAppTheme();
  const navigation = useNavigation();
  const lastScrolledRef = useRef(false);
  const {
    activeViolationsList,
    isLoadingActiveViolations,
    loadActiveViolations,
  } = useViolationStore();

  const [selectedViolation, setSelectedViolation] = useState<ActiveViolationDto | null>(null);

  useEffect(() => {
    loadActiveViolations();
  }, []);

  const onRefresh = () => {
    loadActiveViolations(true);
  };

  const handleScroll = (event: any) => {
    const yOffset = event?.nativeEvent?.contentOffset?.y;
    if (yOffset !== undefined && yOffset !== null) {
      const scrolled = yOffset > 0;
      if (lastScrolledRef.current !== scrolled) {
        lastScrolledRef.current = scrolled;
        navigation.setParams({ hasScrolled: scrolled } as any);
      }
    }
  };

  const mapActiveToNotificationDto = (item: ActiveViolationDto): HasViolationNotificationDto => {
    return {
      ReferenceNumber: item.referenceNumber || item.violationId,
      RefNumber: item.referenceNumber || item.violationId,
      IssuedDate: item.issuedAt,
      IssuedTime: item.issuedAt,
      IssuedBy: "SAS Security",
      OverstayHours: 0,
      PlateNumber: item.plateNumber,
      Amount: item.penaltyFee,
      ViolationType: item.violationType,
      IsViolation: !item.isPaid,
    };
  };

  const renderItem = ({ item }: { item: ActiveViolationDto }) => {
    const isUnpaid = !item.isPaid && item.settlementStatus !== "Paid";
    const statusText = item.isPaid ? "Paid" : item.settlementStatus || "Unpaid";
    
    const statusColor = item.isPaid
      ? "text-light-success dark:text-dark-success"
      : isUnpaid
      ? "text-light-danger dark:text-dark-danger"
      : "text-light-warning dark:text-dark-warning";

    const statusBg = item.isPaid
      ? "bg-light-success/10 dark:bg-dark-success/20"
      : isUnpaid
      ? "bg-light-danger/10 dark:bg-dark-danger/20"
      : "bg-light-warning/10 dark:bg-dark-warning/20";

    const formattedDate = item.issuedAt
      ? new Date(item.issuedAt).toLocaleDateString("en-PH", {
          month: "short",
          day: "numeric",
          year: "numeric",
        })
      : "N/A";

    return (
      <TouchableOpacity
        activeOpacity={isUnpaid ? 0.7 : 1}
        disabled={!isUnpaid}
        onPress={() => setSelectedViolation(item)}
        className="bg-light-surface dark:bg-dark-surface p-4 rounded-card mb-3.5 border border-light-border dark:border-dark-border shadow-soft"
      >
        <View className="flex-row justify-between items-start mb-2.5">
          <View className="flex-row items-center gap-2 flex-1 mr-2">
            <View className="w-8 h-8 rounded-full bg-light-danger/10 dark:bg-dark-danger/20 items-center justify-center">
              <AlertTriangle size={16} color={colors.danger} />
            </View>
            <View className="flex-1">
              <Text className="text-light-text dark:text-dark-text font-heavy text-[14px]" numberOfLines={1}>
                {item.violationType || "Parking Violation"}
              </Text>
              <Text className="text-light-muted dark:text-dark-muted font-regular text-[11px] mt-0.5">
                Ref: {item.referenceNumber || item.violationId?.slice(0, 8)}
              </Text>
            </View>
          </View>
          <View className="items-end">
            <Text className="text-light-text dark:text-dark-text font-black text-[15px]">
              ₱{item.penaltyFee.toFixed(2)}
            </Text>
            <View className={`${statusBg} px-2 py-0.5 rounded-pill mt-1.5`}>
              <Text className={`${statusColor} text-[10px] font-heavy`}>
                {statusText.toUpperCase()}
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
        
        {isUnpaid && (
          <View className="mt-3.5 bg-light-danger/5 dark:bg-dark-danger/5 border border-light-danger/20 dark:border-dark-danger/20 rounded-lg py-2 items-center">
            <Text className="text-light-danger dark:text-dark-danger font-heavy text-[11px]">
              Tap to Pay Violation
            </Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <ContentWrapper noPaddingY>
      <FlatList
        data={activeViolationsList}
        keyExtractor={(item) => item.violationId}
        renderItem={renderItem}
        contentContainerStyle={{
          paddingHorizontal: 4,
          paddingTop: 16,
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
            <View className="flex-1 items-center justify-center px-6 py-12">
              <View className="w-20 h-20 rounded-full bg-light-success/10 dark:bg-dark-success/20 items-center justify-center mb-6">
                <CheckCircle2 size={36} color={colors.success} strokeWidth={2.5} />
              </View>
              <Text className="text-light-text dark:text-dark-text font-black text-[18px] text-center mb-2">
                All Cleared!
              </Text>
              <Text className="text-light-muted dark:text-dark-muted font-regular text-[13px] text-center leading-[20px] mb-8">
                You do not have any active violations. Thank you for parking responsibly!
              </Text>
            </View>
          ) : null
        }
      />

      {/* Payment Sheet Modal */}
      {selectedViolation && (
        <ViolationSummaryPage
          visible={!!selectedViolation}
          violation={mapActiveToNotificationDto(selectedViolation)}
          onBack={() => {
            setSelectedViolation(null);
            loadActiveViolations(true);
          }}
        />
      )}
    </ContentWrapper>
  );
}
