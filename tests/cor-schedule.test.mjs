import test from 'node:test';
import assert from 'node:assert/strict';
import { loadCor, hooks, nodes, mapping, ready, days } from './helpers/cor-form.mjs';
function form(preview = ready) {
  const runtime = hooks(), calls = [];
  const scan = { preview, busy: false, error: '', processing: false, scan: () => calls.push('scan'), refresh() {}, runAction: fn => fn() };
  const component = loadCor('features/auth/components/CorScheduleStep.tsx', {
    react: runtime.react, 'react-native': { View: 'View', Text: 'Text', ActivityIndicator: 'ActivityIndicator' },
    '@/components/ui/AppButton': { default: 'AppButton' }, '@/hooks/useAppTheme': { useAppTheme: () => ({ colors: {} }) },
    '../hooks/useCorScan': { useCorScan: () => scan }, '../utils/corStudentMapping': mapping,
    './CorWeeklyScheduleEditor': { default: 'CorWeeklyScheduleEditor' },
    '../services/verification.service': { verificationService: { confirmCorSchedule: async (preview, week) => calls.push({ preview, week }) } }
  }).default;
  return { scan, calls, render: () => nodes(runtime.render(() => component({ onConfirmed: url => calls.push(url) }))) };
}
test('COR confirmation sends one daily window, seven days and the original document URL', async () => {
  const view = form(); view.render(); const tree = view.render();
  const editor = tree.find(n => n.type === 'CorWeeklyScheduleEditor');
  assert.equal(editor.props.week.length, 7); assert.equal(editor.props.week[0].startTime, '07:00:00'); assert.equal(editor.props.week[0].endTime, '17:00:00');
  await tree.find(n => n.props.label === 'Confirm schedule and continue').props.onPress();
  assert.equal(view.calls[0].week.length, 7); assert.equal(view.calls[1], ready.documentUrl);
});
test('pending scan is populated when the same record completes', () => {
  const view = form({ ...ready, canConfirm: false, items: [] }); view.render();
  view.scan.preview = ready; view.render();
  assert.equal(view.render().find(n => n.type === 'CorWeeklyScheduleEditor').props.week[0].endTime, '17:00:00');
});
test('unreadable days require explicit correction and rejected COR has no confirmation button', () => {
  const view = form({ ...ready, items: [], issues: ['Some class rows could not be read.'] }); view.render();
  let tree = view.render(); assert.equal(tree.find(n => n.props.label === 'Confirm schedule and continue').props.disabled, true);
  const week = mapping.weeklyPreview(view.scan.preview).map(day => ({ ...day, hasClasses: false }));
  week[0] = { ...week[0], hasClasses: true, startTime: '08:00:00', endTime: '17:00:00' };
  tree.find(n => n.type === 'CorWeeklyScheduleEditor').props.onChange(week);
  assert.equal(view.render().find(n => n.props.label === 'Confirm schedule and continue').props.disabled, false);
  view.scan.preview = { ...view.scan.preview, status: 'Rejected', canConfirm: false };
  assert.equal(view.render().filter(n => n.props.label === 'Confirm schedule and continue').length, 0);
});
test('weekly editor renders one row per day, formatted AM/PM, and explicit unknown states', () => {
  const runtime = hooks(); let changes;
  const editor = loadCor('features/auth/components/CorWeeklyScheduleEditor.tsx', { react: runtime.react,
    'react-native': { Platform: { OS: 'android' }, View: 'View', Text: 'Text', TouchableOpacity: 'TouchableOpacity' },
    '@react-native-community/datetimepicker': { default: 'DateTimePicker' }, '@/components/ui/ScheduleDayRow': { default: 'ScheduleDayRow' },
    '@/components/ui/AppButton': { default: 'AppButton' }, '@/constants/scheduleDays': days,
    '@/utils/formatTime': loadCor('utils/formatTime.ts') }).default;
  const week = mapping.weeklyPreview(ready); let tree = nodes(runtime.render(() => editor({ week, onChange: value => changes = value })));
  const monday = tree.find(n => n.type === 'ScheduleDayRow'); assert.equal(monday.props.schedule.start, '7:00 AM'); assert.equal(monday.props.schedule.end, '5:00 PM');
  assert.equal(tree.filter(n => n.type === 'ScheduleDayRow').length, 1);
  assert.equal(tree.filter(n => n.type === 'Text' && n.props.children === 'No Classes').length, 6);
  monday.props.onClear(); assert.equal(changes[0].hasClasses, false); assert.equal(changes[0].startTime, null);
  tree = nodes(runtime.render(() => editor({ week: mapping.weeklyPreview({ ...ready, items: [], issues: ['bad'] }), onChange() {} })));
  assert.equal(tree.filter(n => n.type === 'Text' && n.props.children === 'Needs correction').length, 7);
});
