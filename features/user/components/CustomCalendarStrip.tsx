import React, { useCallback, useEffect, useRef, useState } from "react";
import {
    FlatList,
    NativeScrollEvent,
    NativeSyntheticEvent,
    StyleSheet,
    Text,
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
          {sel && (
            <View style={styles.indicatorWrapper}>
              <View className="w-5 h-[3px] rounded-full bg-light-primary" />
            </View>
          )}
          <View
            style={[styles.textContainer, sel && styles.textContainerSelected]}
          >
            <Text
              className={`font-black leading-none text-center ${
                sel
                  ? "text-[26px] text-light-text"
                  : "text-[20px] text-light-muted"
              }`}
            >
              {item.day}
            </Text>
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
  const [dates] = useState<DateItem[]>(generateDates);
  const [selectedIdx, setSelectedIdx] = useState(TODAY_IDX);
  const [containerWidth, setContainerWidth] = useState<number>(0);

  const listRef = useRef<FlatList<DateItem>>(null);
  const sidePad = containerWidth ? (containerWidth - CELL) / 2 : 0;

  useEffect(() => {
    if (containerWidth > 0) {
      const t = setTimeout(() => {
        listRef.current?.scrollToOffset({
          offset: TODAY_IDX * CELL,
          animated: false,
        });
      }, 50);
      return () => clearTimeout(t);
    }
  }, [containerWidth]);

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
      className="w-full bg-light-background mt-4"
      onLayout={(e) => {
        setContainerWidth(e.nativeEvent.layout.width);
      }}
    >
      {containerWidth > 0 && (
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
      )}
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
    backgroundColor: "#ECECF0",
  },
  cardSelected: {
    height: SELECTED_HEIGHT,
    backgroundColor: "#FFFFFF",
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
