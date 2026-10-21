import React, { useCallback, useRef, useState } from 'react';
import { Platform, Text, TouchableOpacity, View } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import ScheduleDayRow from '@/components/ui/ScheduleDayRow';
import AppButton from '@/components/ui/AppButton';
import { SCHEDULE_DAYS } from '@/constants/scheduleDays';
import { formatTime } from '@/utils/formatTime';
import type { CorWeekDay } from '../services/verification.service';

export default function CorWeeklyScheduleEditor({ week, onChange, disabled }: { week: CorWeekDay[]; onChange: (week: CorWeekDay[]) => void; disabled?: boolean }) {
  const [picker, setPicker] = useState<{ day: number; field: 'startTime' | 'endTime'; value: Date } | null>(null);
  const latest = useRef({ week, onChange }); latest.current = { week, onChange };
  function update(day: number, patch: Partial<CorWeekDay>) { latest.current.onChange(latest.current.week.map(row => row.dayOfWeek === day ? { ...row, ...patch } : row)); }
  function open(day: number, field: 'startTime' | 'endTime') {
    if (disabled) return;
    const parts = week.find(row => row.dayOfWeek === day)?.[field]?.split(':').map(Number);
    setPicker({ day, field, value: new Date(2000, 0, 1, parts?.[0] ?? (field === 'startTime' ? 8 : 17), parts?.[1] ?? 0) });
  }
  const save = useCallback((date: Date) => {
    if (!picker) return;
    update(picker.day, { hasClasses: true, [picker.field]: `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}:00` });
    setPicker(null);
  }, [picker?.day, picker?.field]);
  const handlePicker = useCallback((event: any, date?: Date) => {
    if (event.type === 'dismissed') setPicker(null);
    else if (date && Platform.OS === 'android') save(date);
    else if (date) setPicker(previous => previous ? { ...previous, value: date } : null);
  }, [save]);
  return <View className="gap-3">
    <Text className="text-light-text dark:text-dark-text font-bold">Weekly campus schedule</Text>
    <Text className="text-light-muted dark:text-dark-muted text-sm">Each class day uses its earliest start and latest end, including breaks. Review all seven days and correct any times that were read incorrectly.</Text>
    {SCHEDULE_DAYS.map(day => {
      const row = week.find(w => w.dayOfWeek === day.key);
      return row?.hasClasses ? <ScheduleDayRow key={day.key} day={day.shortLabel}
        schedule={{ start: row.startTime ? formatTime(row.startTime) : undefined, end: row.endTime ? formatTime(row.endTime) : undefined }}
        timeError={!row.startTime || !row.endTime || row.startTime >= row.endTime}
        onClear={() => !disabled && update(day.key, { hasClasses: false, startTime: null, endTime: null })}
        onOpenPicker={({ field }) => open(day.key, field === 'start' ? 'startTime' : 'endTime')} />
        : <View key={day.key} className="flex-row items-center justify-between gap-2 py-3 border-b border-light-border dark:border-dark-border">
          <Text className="text-light-text dark:text-dark-text font-semibold">{day.label}</Text>
          <Text className="flex-1 text-right text-light-muted dark:text-dark-muted">{row?.hasClasses === false ? 'No Classes' : 'Needs correction'}</Text>
          <TouchableOpacity disabled={disabled} accessibilityRole="button" onPress={() => update(day.key, { hasClasses: true })}><Text className="text-light-primary dark:text-dark-primary">Set times</Text></TouchableOpacity>
          {row?.hasClasses == null && <TouchableOpacity disabled={disabled} accessibilityRole="button" onPress={() => update(day.key, { hasClasses: false, startTime: null, endTime: null })}><Text className="text-light-primary dark:text-dark-primary">No Classes</Text></TouchableOpacity>}
        </View>;
    })}
    {picker && <View className="p-3 rounded-card bg-light-background dark:bg-dark-background gap-3">
      <DateTimePicker value={picker.value} mode="time" is24Hour={false} display={Platform.OS === 'ios' ? 'spinner' : 'default'} onChange={handlePicker} />
      {Platform.OS === 'ios' && <AppButton label="Use selected time" onPress={() => save(picker.value)} />}
      <AppButton label="Cancel" variant="outline" onPress={() => setPicker(null)} />
    </View>}
  </View>;
}
