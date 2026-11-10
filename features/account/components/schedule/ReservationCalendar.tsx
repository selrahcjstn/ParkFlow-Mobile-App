import React, { useMemo } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { useAppTheme } from "@/hooks/useAppTheme";

export type CalendarMark = "approved" | "pending" | null;

interface ReservationCalendarProps {
  year: number;
  monthIndex: number;
  selectedDay: number;
  todayISO: string;
  onSelectDay: (day: number) => void;
  getMark: (dateISO: string) => CalendarMark;
}

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const pad = (n: number) => n.toString().padStart(2, "0");

/**
 * Flat month grid. Every state (selected / today / unavailable) is a fixed
 * background + text pair chosen from the theme, so a date can never end up
 * with the same color as its surface.
 */
export default function ReservationCalendar({
  year,
  monthIndex,
  selectedDay,
  todayISO,
  onSelectDay,
  getMark,
}: ReservationCalendarProps) {
  const { colors, isDark } = useAppTheme();

  const weeks = useMemo(() => {
    const lead = (new Date(year, monthIndex, 1).getDay() + 6) % 7; // Monday first
    const count = new Date(year, monthIndex + 1, 0).getDate();
    const cells: Array<number | null> = [
      ...Array.from({ length: lead }, () => null),
      ...Array.from({ length: count }, (_, i) => i + 1),
    ];
    while (cells.length % 7 !== 0) cells.push(null);
    return Array.from({ length: cells.length / 7 }, (_, i) => cells.slice(i * 7, i * 7 + 7));
  }, [year, monthIndex]);

  const onPrimary = isDark ? colors.background : "#FFFFFF";

  return (
    <View>
      <View style={{ flexDirection: "row", marginBottom: 4 }}>
        {WEEKDAYS.map((d) => (
          <View key={d} style={{ flex: 1, alignItems: "center", paddingVertical: 4 }}>
            <Text style={{ fontSize: 10, fontWeight: "700", color: colors.muted, textTransform: "uppercase" }}>
              {d}
            </Text>
          </View>
        ))}
      </View>

      {weeks.map((week, wi) => (
        <View key={wi} style={{ flexDirection: "row" }}>
          {week.map((day, di) => {
            if (day === null) return <View key={di} style={{ flex: 1, height: 42 }} />;

            const iso = `${year}-${pad(monthIndex + 1)}-${pad(day)}`;
            const selected = day === selectedDay;
            const today = iso === todayISO;
            const unavailable = iso <= todayISO;
            const mark = getMark(iso);

            const fill = selected ? colors.primary : "transparent";
            const textColor = selected
              ? onPrimary
              : unavailable
              ? colors.muted
              : colors.text;
            const dotColor = selected
              ? onPrimary
              : mark === "approved"
              ? colors.success
              : colors.warning;

            return (
              <View key={di} style={{ flex: 1, height: 42, padding: 2 }}>
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => onSelectDay(day)}
                  accessibilityRole="button"
                  accessibilityState={{ selected, disabled: false }}
                  accessibilityLabel={`${day}${unavailable ? ", unavailable" : ""}${mark ? `, ${mark} reservation` : ""}`}
                  style={{
                    flex: 1,
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: 6,
                    backgroundColor: fill,
                    borderWidth: today && !selected ? 1 : 0,
                    borderColor: colors.primary,
                    opacity: unavailable && !selected ? 0.55 : 1,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: selected || today ? "700" : "500",
                      color: today && !selected ? colors.primary : textColor,
                    }}
                  >
                    {day}
                  </Text>
                  {mark ? (
                    <View
                      style={{
                        position: "absolute",
                        bottom: 4,
                        width: 4,
                        height: 4,
                        borderRadius: 2,
                        backgroundColor: dotColor,
                      }}
                    />
                  ) : null}
                </TouchableOpacity>
              </View>
            );
          })}
        </View>
      ))}
    </View>
  );
}
