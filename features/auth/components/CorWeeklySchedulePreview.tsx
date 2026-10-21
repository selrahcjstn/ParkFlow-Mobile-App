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
  return <View className="gap-3">
    {[1, 2, 3, 4, 5, 6, 0].map(day => {
      const item = week.find(row => row.dayOfWeek === day);
      const description = item?.hasClasses === false ? 'No Classes' : item?.hasClasses === true
        ? `${formatTime(item.startTime)} - ${formatTime(item.endTime)}` : 'Could not read schedule';
      return <View key={day} className="rounded-xl border border-light-border dark:border-dark-border p-4 gap-1">
        <Text className="text-light-text dark:text-dark-text font-semibold">{days[day]}</Text>
        <Text className="text-light-muted dark:text-dark-muted">{description}</Text>
      </View>;
    })}
  </View>;
}
