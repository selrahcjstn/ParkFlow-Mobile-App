import React, { useCallback, useEffect, useRef, useState } from "react";
import {
    FlatList,
    NativeScrollEvent,
    NativeSyntheticEvent,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

const CARD_W = 62;
const GAP = 10;
const CELL = CARD_W + GAP; // 72px total slot size

const DAYS_BEFORE = 30;
const DAYS_AFTER = 30;
const TOTAL = DAYS_BEFORE + DAYS_AFTER + 1;
const TODAY_IDX = DAYS_BEFORE;

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

interface DateItem {
  id: string;
  day: number;
  month: string;
}

const baseDate = (() => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
})();

function generateDates(): DateItem[] {
  return Array.from({ length: TOTAL }, (_, i) => {
    const d = new Date(baseDate);
    d.setDate(baseDate.getDate() + (i - DAYS_BEFORE));
    return {
      id: d.toISOString(),
      day: d.getDate(),
      month: MONTHS[d.getMonth()],
    };
  });
}

// ==========================================
// 1. HIGH-PERFORMANCE MEMOIZED ITEM COMPONENT
// ==========================================
interface CalendarItemProps {
  item: DateItem;
  isSelected: boolean;
  onPress: () => void;
}

const CalendarItem = React.memo(
  ({ item, isSelected, onPress }: CalendarItemProps) => {
    return (
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={onPress}
        style={{
          width: CELL,
          alignItems: "center",
          justifyContent: "center",
          paddingVertical: 8,
        }}
      >
        <View
          style={{ width: CARD_W }}
          className={`items-center justify-center rounded-2xl ${
            isSelected ? "bg-light-surface h-[86px]" : "bg-[#E8ECF1] h-[76px]"
          }`}
        >
          {/* BulSU red pill indicator */}
          <View
            className={`w-5 h-[3px] rounded-full bg-light-primary mb-[7px] ${
              isSelected ? "opacity-100" : "opacity-0"
            }`}
          />

          {/* Day number */}
          <Text
            className={`font-black leading-none ${
              isSelected
                ? "text-[26px] text-light-text"
                : "text-[20px] text-light-muted"
            }`}
          >
            {item.day}
          </Text>

          {/* Month */}
          <Text
            className={`mt-[5px] text-[10px] tracking-widest uppercase font-medium ${
              isSelected ? "text-light-text" : "text-light-muted"
            }`}
          >
            {item.month}
          </Text>
        </View>
      </TouchableOpacity>
    );
  },
  // Custom optimization check: Only re-render if the selection state changes
  (prevProps, nextProps) => prevProps.isSelected === nextProps.isSelected,
);

// ==========================================
// 2. MAIN CALENDAR CONTAINER
// ==========================================
export default function CalendarStrip() {
  const [dates] = useState<DateItem[]>(generateDates);
  const [selectedIdx, setSelectedIdx] = useState(TODAY_IDX);
  const [containerWidth, setContainerWidth] = useState<number | null>(null);

  const listRef = useRef<FlatList<DateItem>>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const sidePad = containerWidth ? (containerWidth - CELL) / 2 : 0;

  const scrollToIdx = useCallback((idx: number, animated = true) => {
    listRef.current?.scrollToOffset({
      offset: idx * CELL,
      animated,
    });
  }, []);

  useEffect(() => {
    if (containerWidth !== null) {
      const t = setTimeout(() => scrollToIdx(TODAY_IDX, false), 50);
      return () => clearTimeout(t);
    }
  }, [containerWidth, scrollToIdx]);

  const commitFromOffset = useCallback((x: number) => {
    const idx = Math.max(0, Math.min(TOTAL - 1, Math.round(x / CELL)));
    setSelectedIdx(idx);
  }, []);

  const handleScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const x = e.nativeEvent.contentOffset.x;
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => commitFromOffset(x), 32);
    },
    [commitFromOffset],
  );

  const handleScrollEnd = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      if (timerRef.current) clearTimeout(timerRef.current);
      commitFromOffset(e.nativeEvent.contentOffset.x);
    },
    [commitFromOffset],
  );

  const handlePress = useCallback(
    (idx: number) => {
      setSelectedIdx(idx);
      scrollToIdx(idx);
    },
    [scrollToIdx],
  );

  const getItemLayout = useCallback(
    (_: any, index: number) => ({
      length: CELL,
      offset: CELL * index,
      index,
    }),
    [],
  );

  // RenderItem definition is completely clean and dependencies-free
  const renderItem = useCallback(
    ({ item, index }: { item: DateItem; index: number }) => (
      <CalendarItem
        item={item}
        isSelected={index === selectedIdx}
        onPress={() => handlePress(index)}
      />
    ),
    [selectedIdx, handlePress],
  );

  return (
    <View
      className="w-full bg-light-background"
      onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width)}
    >
      {containerWidth !== null && (
        <FlatList
          ref={listRef}
          data={dates}
          horizontal
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          getItemLayout={getItemLayout}
          showsHorizontalScrollIndicator={false}
          snapToInterval={CELL}
          snapToAlignment="start"
          decelerationRate="fast"
          contentContainerStyle={{ paddingHorizontal: sidePad }}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          onScrollEndDrag={handleScrollEnd}
          onMomentumScrollEnd={handleScrollEnd}
          // VIRTUALIZEDLIST OPTIMIZATIONS
          initialNumToRender={10}
          maxToRenderPerBatch={10}
          windowSize={3}
          updateCellsBatchingPeriod={50}
        />
      )}
    </View>
  );
}
