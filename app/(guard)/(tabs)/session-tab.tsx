import SessionCard from "@/components/shared/SessionCard";
import SessionDetailModal from "@/components/shared/SessionDetailModal";
import VehicleTypeFilterSheet from "@/components/shared/VehicleTypeFilterSheet";
import { Body, Caption, Title } from "@/components/ui/Typography";
import { useParkingLogStore } from "@/store/useParkingLogStore";
import { GetActiveParkingSessionResponse } from "@/types/parkingLog";
import { VEHICLE_TYPE_OPTIONS } from "@/constants/vehicleType";
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import { useFocusEffect } from "expo-router";
import { History, Search, X, Filter } from "lucide-react-native";
import { useCallback, useMemo, useState, useRef, type ElementRef } from "react";
import {
  FlatList,
  TextInput,
  TouchableOpacity,
  View,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function SessionsTab() {
  const { activeSession, getActiveSession } = useParkingLogStore();
  const [selectedSession, setSelectedSession] =
    useState<GetActiveParkingSessionResponse | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const filterSheetRef = useRef<ElementRef<typeof BottomSheetModal>>(null);
  const [query, setQuery] = useState("");
  const [selectedVehicleType, setSelectedVehicleType] = useState<string | null>(null);

  const sessions = useMemo<GetActiveParkingSessionResponse[]>(() => {
    if (!activeSession) return [];
    if (Array.isArray(activeSession)) return activeSession;
    return [activeSession];
  }, [activeSession]);

  const filtered = useMemo(() => {
    let result = sessions;
    
    if (selectedVehicleType !== null) {
      result = result.filter(
        (s) => s.vehicleType?.toString() === selectedVehicleType
      );
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
    <SafeAreaView className="flex-1 bg-light-background" edges={["top"]}>
      <View className="flex-1 px-5 pt-4">
        {/* ── Header ── */}
        <View className="mb-4">
          <Title className="text-light-text text-xl font-black">
            Sessions
          </Title>
          <Caption className="text-light-muted font-book text-[13px] mt-1">
            Active parking sessions
          </Caption>
        </View>

        {/* ── Search Bar ── */}
        <View className="flex-row items-center bg-light-surface rounded-2xl px-4 mb-4">
          <Search size={16} color="#71717A" strokeWidth={2} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search plate, name, brand..."
            placeholderTextColor="#A1A1AA"
            style={{
              flex: 1,
              fontFamily: "AvenirBook",
              fontSize: 14,
              color: "#18181B",
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
              <X size={16} color="#A1A1AA" strokeWidth={2.5} />
            </TouchableOpacity>
          )}
        </View>

        {/* ── Count Badge & Filter ── */}
        <View className="flex-row items-center justify-between mb-4">
          <View className="bg-light-primary/10 px-3 py-1.5 rounded-full">
            <Body className="text-light-primary font-heavy text-[12px]">
              {filtered.length}{" "}
              {filtered.length === 1 ? "session" : "sessions"}
              {query.trim() ? " found" : ""}
            </Body>
          </View>

          <TouchableOpacity
            onPress={() => filterSheetRef.current?.present()}
            className={`flex-row items-center gap-1.5 px-3 py-1.5 rounded-full border ${
              selectedVehicleType !== null
                ? "bg-light-primary border-light-primary"
                : "bg-light-surface border-light-border/30"
            }`}
          >
            <Filter size={14} color={selectedVehicleType !== null ? "#FFFFFF" : "#71717A"} strokeWidth={2} />
            <Body
              className={`font-heavy text-[12px] ${
                selectedVehicleType !== null ? "text-white" : "text-light-text"
              }`}
            >
              {selectedVehicleType === null
                ? "Filter"
                : VEHICLE_TYPE_OPTIONS.find((o) => o.value === selectedVehicleType)?.label || "Filter"}
            </Body>
          </TouchableOpacity>
        </View>

        {/* ── Session List ── */}
        {sessions.length === 0 ? (
          /* Empty — no sessions at all */
          <View className="flex-1 items-center justify-center pb-20">
            <View className="w-16 h-16 rounded-2xl bg-light-surface items-center justify-center mb-4">
              <History size={32} color="#A1A1AA" strokeWidth={1.5} />
            </View>
            <Body className="text-light-text font-heavy text-[15px] mb-1">
              No active sessions
            </Body>
            <Caption className="text-light-muted font-book text-[13px] text-center px-8">
              Parking sessions will appear here when vehicles are currently
              parked.
            </Caption>
          </View>
        ) : showNoResults ? (
          /* Has sessions but query matched nothing */
          <View className="flex-1 items-center justify-center pb-20">
            <View className="w-16 h-16 rounded-2xl bg-light-surface items-center justify-center mb-4">
              <Search size={28} color="#A1A1AA" strokeWidth={1.5} />
            </View>
            <Body className="text-light-text font-heavy text-[15px] mb-1">
              No results
            </Body>
            <Caption className="text-light-muted font-book text-[13px] text-center px-8">
              No sessions match "{query}". Try a plate number, name, or brand.
            </Caption>
          </View>
        ) : (
          <FlatList
            data={filtered}
            keyExtractor={(item, index) => `${item.plateNumber}-${index}`}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 32 }}
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

      {/* ── Detail Modal ── */}
      <SessionDetailModal
        visible={modalVisible}
        onClose={handleCloseModal}
        session={selectedSession}
      />

      {/* ── Filter Sheet ── */}
      <VehicleTypeFilterSheet
        ref={filterSheetRef}
        selectedVehicleType={selectedVehicleType}
        onSelect={(type) => {
          setSelectedVehicleType(type);
          filterSheetRef.current?.dismiss();
        }}
      />
    </SafeAreaView>
  );
}
