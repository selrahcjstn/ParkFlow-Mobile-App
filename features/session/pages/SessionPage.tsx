import { ContentWrapper } from "@/components/layouts";
import { VEHICLE_TYPE_OPTIONS } from "@/constants/vehicleType";
import SessionCard from "@/features/session/components/SessionCard";
import SessionDetailModal from "@/features/session/components/SessionDetailModal";
import { useParkingSessionStore } from "@/features/session/store/parking-session.store";
import { GetActiveParkingSessionResponse } from "@/features/session/types/parking-log.types";
import VehicleTypeFilterSheet from "@/features/user/components/VehicleTypeFilterSheet";
import { useAppTheme } from "@/hooks/useAppTheme";
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useFocusEffect } from "expo-router";
import { Filter, History, Search, X } from "lucide-react-native";
import { useCallback, useMemo, useRef, useState, type ElementRef } from "react";
import {
  FlatList,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function SessionsPage() {
  const { colors, isDark } = useAppTheme();
  let tabBarHeight = 0;
  try {
    tabBarHeight = useBottomTabBarHeight();
  } catch {
    tabBarHeight = 0;
  }

  const { activeSession, getActiveSession } = useParkingSessionStore();
  const [selectedSession, setSelectedSession] =
    useState<GetActiveParkingSessionResponse | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const filterSheetRef = useRef<ElementRef<typeof BottomSheetModal>>(null);
  const [query, setQuery] = useState("");
  const [selectedVehicleType, setSelectedVehicleType] = useState<string | null>(
    null,
  );

  const sessions = useMemo<GetActiveParkingSessionResponse[]>(() => {
    if (!activeSession) return [];
    if (Array.isArray(activeSession)) return activeSession;
    return [activeSession];
  }, [activeSession]);

  const filtered = useMemo(() => {
    let result = sessions;

    if (selectedVehicleType !== null) {
      result = result.filter((s) => {
        if (!s.vehicleType) return false;
        const typeStr = s.vehicleType.toString().trim().toLowerCase();
        if (selectedVehicleType === "0") {
          return typeStr === "0" || typeStr === "motorcycle";
        }
        if (selectedVehicleType === "1") {
          return (
            typeStr === "1" ||
            typeStr === "electric bike" ||
            typeStr === "electricbike"
          );
        }
        if (selectedVehicleType === "2") {
          return typeStr === "2" || typeStr === "car";
        }
        return typeStr === selectedVehicleType.toLowerCase();
      });
    }

    const q = query.trim().toLowerCase();
    if (!q) return result;
    return result.filter(
      (s) =>
        s.plateNumber?.toLowerCase().includes(q) ||
        s.brand?.toLowerCase().includes(q) ||
        s.vehicleType?.toLowerCase().includes(q) ||
        s.firstName?.toLowerCase().includes(q) ||
        s.lastName?.toLowerCase().includes(q),
    );
  }, [sessions, query, selectedVehicleType]);

  useFocusEffect(
    useCallback(() => {
      void getActiveSession();
      return () => {
        filterSheetRef.current?.dismiss();
      };
    }, [getActiveSession]),
  );

  const handleSessionPress = (session: GetActiveParkingSessionResponse) => {
    setSelectedSession(session);
    setModalVisible(true);
  };

  const handleCloseModal = () => {
    setModalVisible(false);
    setSelectedSession(null);
  };

  const showNoResults = query.trim().length > 0 && filtered.length === 0;

  return (
    <ContentWrapper noPaddingY>
      <View className="pt-4" style={{ flex: 1, paddingBottom: tabBarHeight + 24 }}>
        <View className="flex-row items-center bg-light-surface dark:bg-dark-surface rounded-2xl px-4 mb-4">
          <Search size={16} color={isDark ? "#B5BAC1" : "#71717A"} strokeWidth={2} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search plate, name, brand..."
            placeholderTextColor={isDark ? "#71717A" : "#A1A1AA"}
            style={{
              flex: 1,
              fontFamily: "Inter-Regular",
              fontSize: 14,
              color: colors.text,
              paddingVertical: 12,
              paddingHorizontal: 10,
            }}
            returnKeyType="search"
            autoCorrect={false}
            autoCapitalize="characters"
          />
          {query.length > 0 && (
            <TouchableOpacity
              onPress={() => setQuery("")}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <X size={16} color={isDark ? "#71717A" : "#A1A1AA"} strokeWidth={2.5} />
            </TouchableOpacity>
          )}
        </View>

        <View className="flex-row items-center justify-between mb-4">
          {selectedVehicleType === null ? (
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => filterSheetRef.current?.present()}
              className="flex-row items-center gap-1.5 px-3 py-1.5 rounded-full border bg-light-surface dark:bg-dark-surface border-light-border/30 dark:border-dark-border/40"
            >
              <Filter size={14} color={isDark ? "#B5BAC1" : "#71717A"} strokeWidth={2} />
              <Text className="font-heavy text-[12px] text-light-text dark:text-dark-text">
                Filter
              </Text>
            </TouchableOpacity>
          ) : (
            <View className="flex-row items-center bg-light-primary dark:bg-dark-primary border border-light-primary dark:border-dark-primary rounded-full px-3 py-1.5 gap-1.5">
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => filterSheetRef.current?.present()}
                className="flex-row items-center gap-1.5"
              >
                <Filter size={14} color={isDark ? "#09090B" : "#FFFFFF"} strokeWidth={2} />
                <Text className="font-heavy text-[12px] text-white dark:text-zinc-950">
                  {VEHICLE_TYPE_OPTIONS.find(
                    (o) => o.value === selectedVehicleType,
                  )?.label || "Filter"}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setSelectedVehicleType(null)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                className="bg-white/20 dark:bg-black/25 rounded-full p-0.5 items-center justify-center ml-0.5"
              >
                <X size={10} color={isDark ? "#09090B" : "#FFFFFF"} strokeWidth={3} />
              </TouchableOpacity>
            </View>
          )}
          <Text className="text-[14px] font-regular text-light-text dark:text-dark-text">
            {filtered.length} {filtered.length === 1 ? "session" : "sessions"}
            {query.trim() ? " found" : ""}
          </Text>
        </View>

        {sessions.length === 0 ? (
          /* Empty — no sessions at all */
          <View className="flex-1 items-center justify-center pb-20">
            <View className="w-16 h-16 rounded-2xl bg-light-surface dark:bg-dark-surface items-center justify-center mb-4">
              <History size={32} color={isDark ? "#71717A" : "#A1A1AA"} strokeWidth={1.5} />
            </View>
            <Text className="text-light-text dark:text-dark-text font-heavy text-[15px] mb-1">
              No active sessions
            </Text>
            <Text className="text-light-muted dark:text-dark-muted font-light text-[13px] text-center px-8">
              Parking sessions will appear here when vehicles are currently
              parked.
            </Text>
          </View>
        ) : showNoResults ? (
          /* Has sessions but query matched nothing */
          <View className="flex-1 items-center justify-center pb-20">
            <View className="w-16 h-16 rounded-2xl bg-light-surface dark:bg-dark-surface items-center justify-center mb-4">
              <Search size={28} color={isDark ? "#71717A" : "#A1A1AA"} strokeWidth={1.5} />
            </View>
            <Text className="text-light-text dark:text-dark-text font-heavy text-[15px] mb-1">
              No results
            </Text>
            <Text className="text-light-muted dark:text-dark-muted font-light text-[13px] text-center px-8">
              No sessions match &quot;{query}&quot;. Try a plate number, name,
              or brand.
            </Text>
          </View>
        ) : (
          <FlatList
            data={filtered}
            keyExtractor={(item, index) => `${item.plateNumber}-${index}`}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 32 }}
            scrollEventThrottle={16}
            ItemSeparatorComponent={() => <View className="h-2.5" />}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => (
              <SessionCard
                session={item}
                onPress={() => handleSessionPress(item)}
              />
            )}
          />
        )}
      </View>

      <SessionDetailModal
        visible={modalVisible}
        onClose={handleCloseModal}
        session={selectedSession}
      />

      <VehicleTypeFilterSheet
        ref={filterSheetRef}
        selectedVehicleType={selectedVehicleType}
        onSelect={(type) => {
          setSelectedVehicleType(type);
          filterSheetRef.current?.dismiss();
        }}
      />
    </ContentWrapper>
  );
}
