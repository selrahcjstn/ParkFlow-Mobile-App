import React, { useCallback, useEffect, useRef, useState } from "react";
import {
    FlatList,
    NativeScrollEvent,
    NativeSyntheticEvent,
    StyleSheet,
    Text,
    useWindowDimensions,
    View,
} from "react-native";

const CARD_W = 62;
const GAP = 10;
const CELL = CARD_W + GAP;

const SLOT_HEIGHT = 102;
const UNSELECTED_HEIGHT = 76;
const SELECTED_HEIGHT = 86;

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

interface DateCardProps {
  item: DateItem;
  sel: boolean;
}

const DateCard = React.memo(
  ({ item, sel }: DateCardProps) => {
    return (
      <View style={styles.cellSlot}>
        <View
          style={[
            styles.cardBase,
            sel ? styles.cardSelected : styles.cardUnselected,
          ]}
        >
          {/* Red pill indicator pinned to your preferred top depth */}
          {sel && (
            <View style={styles.indicatorWrapper}>
              <View className="w-5 h-[3px] rounded-full bg-light-primary" />
            </View>
          )}

          {/* FIX: Text elements grouped in a container with a calculated 
            top padding offset when selected to achieve perfect centering
          */}
          <View
            style={[styles.textContainer, sel && styles.textContainerSelected]}
          >
            {/* Day number */}
            <Text
              className={`font-black leading-none text-center ${
                sel
                  ? "text-[26px] text-light-text"
                  : "text-[20px] text-light-muted"
              }`}
            >
              {item.day}
            </Text>

            {/* Month */}
            <Text
              className={`mt-[5px] text-[10px] tracking-widest uppercase font-medium text-center ${
                sel ? "text-light-text" : "text-light-muted"
              }`}
            >
              {item.month}
            </Text>
          </View>
        </View>
      </View>
    );
  },
  (prevProps, nextProps) => prevProps.sel === nextProps.sel,
);

export default function CalendarStrip() {
  const { width: SCREEN_WIDTH } = useWindowDimensions();
  const [dates] = useState<DateItem[]>(generateDates);
  const [selectedIdx, setSelectedIdx] = useState(TODAY_IDX);

  const listRef = useRef<FlatList<DateItem>>(null);

  const sidePad = (SCREEN_WIDTH - CELL) / 2;

  useEffect(() => {
    const t = setTimeout(() => {
      listRef.current?.scrollToOffset({
        offset: TODAY_IDX * CELL,
        animated: false,
      });
    }, 150);
    return () => clearTimeout(t);
  }, []);

  const handleScrollSettle = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const offsetX = e.nativeEvent.contentOffset.x;
      const computedIndex = Math.max(
        0,
        Math.min(TOTAL - 1, Math.round(offsetX / CELL)),
      );

      setSelectedIdx(computedIndex);
    },
    [],
  );

  const getItemLayout = useCallback(
    (_: any, index: number) => ({
      length: CELL,
      offset: CELL * index,
      index,
    }),
    [],
  );

  const renderItem = useCallback(
    ({ item, index }: { item: DateItem; index: number }) => (
      <DateCard item={item} sel={index === selectedIdx} />
    ),
    [selectedIdx],
  );

  return (
    <View
      style={{ width: SCREEN_WIDTH }}
      className="-mx-4 bg-light-background mt-4"
    >
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
        contentContainerStyle={{
          paddingHorizontal: sidePad,
          alignItems: "center",
        }}
        onScrollEndDrag={handleScrollSettle}
        onMomentumScrollEnd={handleScrollSettle}
        initialNumToRender={10}
        maxToRenderPerBatch={10}
        windowSize={3}
        removeClippedSubviews={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  cellSlot: {
    width: CELL,
    height: SLOT_HEIGHT,
    alignItems: "center",
    justifyContent: "center",
  },
  cardBase: {
    width: CARD_W,
    borderRadius: 16,
    position: "relative",
  },
  cardUnselected: {
    height: UNSELECTED_HEIGHT,
    backgroundColor: "#E8ECF1",
  },
  cardSelected: {
    height: SELECTED_HEIGHT,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "rgba(15, 23, 42, 0.05)",
  },
  indicatorWrapper: {
    position: "absolute",
    top: 12,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  textContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  textContainerSelected: {
    paddingTop: 8,
  },
});
