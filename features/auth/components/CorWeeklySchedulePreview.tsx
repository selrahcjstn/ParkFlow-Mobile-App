import React from 'react';
import { Text, View } from 'react-native';
import type { CorWeekDay } from '../services/verification.service';

const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const formatTime = (value: string | null) => {
  if (!value) return 'Unreadable';
  const [hour, minute] = value.split(':').map(Number);
  return `${hour % 12 || 12}:${String(minute).padStart(2, '0')} ${hour < 12 ? 'AM' : 'PM'}`;
};
export default function CorWeeklySchedulePreview({ week }: { week: CorWeekDay[] }) {
  return <View className="overflow-hidden rounded-xl border border-light-border dark:border-dark-border">
    <View className="flex-row items-center justify-between gap-3 bg-light-background dark:bg-dark-background px-3 py-2">
      <Text accessibilityRole="header" className="text-xs font-bold text-light-muted dark:text-dark-muted">Days</Text>
      <Text accessibilityRole="header" className="text-xs font-bold text-light-muted dark:text-dark-muted">Time</Text>
    </View>
    {[1, 2, 3, 4, 5, 6, 0].map(day => {
      const item = week.find(row => row.dayOfWeek === day);
      const description = item?.hasClasses === false ? 'No Classes' : item?.hasClasses === true
        ? `${formatTime(item.startTime)} - ${formatTime(item.endTime)}` : 'Could not read schedule';
      return <View key={day} accessible accessibilityLabel={`${days[day]}: ${description}`}
        className="flex-row items-center gap-3 border-t border-light-border dark:border-dark-border px-3 py-2">
        {/* Fixed-width column: Android rounds text width down for a shrink-0 label and clips the last letter. */}
        <Text className="w-28 text-sm leading-5 text-light-text dark:text-dark-text font-semibold">{days[day]}</Text>
        <Text className="flex-1 text-right text-sm leading-5 text-light-muted dark:text-dark-muted"
          style={{ fontVariant: ['tabular-nums'] }}>{description}</Text>
      </View>;
    })}
  </View>;
}
