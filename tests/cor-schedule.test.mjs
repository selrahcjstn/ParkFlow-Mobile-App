import test from 'node:test';
import assert from 'node:assert/strict';
import { loadCor, hooks, nodes, mapping, ready, days } from './helpers/cor-form.mjs';
function form(preview = ready) {
  const runtime = hooks(), calls = [];
  const scan = { preview, busy: false, error: '', processing: false, upload: () => calls.push('upload'), fetchInformation: () => calls.push('fetch'), refresh() {}, validateCurrentTerm: async () => {}, runAction: fn => fn() };
  const component = loadCor('features/auth/components/CorScheduleStep.tsx', {
    react: runtime.react, 'react-native': { View: 'View', Text: 'Text', ActivityIndicator: 'ActivityIndicator' },
    '@/components/ui/AppButton': { default: 'AppButton' }, '@/hooks/useAppTheme': { useAppTheme: () => ({ colors: {} }) },
    '../hooks/useCorScan': { useCorScan: () => scan }, '../utils/corStudentMapping': mapping,
    './CorUploadStep': { default: 'CorUploadStep' }, './CorWeeklySchedulePreview': { default: 'CorWeeklySchedulePreview' },
    '../services/verification.service': { verificationService: { confirmCorSchedule: async (preview, week) => calls.push({ preview, week }) } }
  }).default;
  return { scan, calls, render: () => nodes(runtime.render(() => component({ onConfirmed: url => calls.push(url) }))) };
}
test('COR confirmation displays one read-only daily window for seven days and confirms the server preview', async () => {
  const view = form(); view.render(); const tree = view.render();
  const preview = tree.find(n => n.type === 'CorWeeklySchedulePreview');
  assert.equal(preview.props.week.length, 7); assert.equal(preview.props.week[0].startTime, '07:00:00'); assert.equal(preview.props.week[0].endTime, '17:00:00');
  await tree.find(n => n.props.label === 'Confirm schedule and continue').props.onPress();
  assert.equal(view.calls[0].week, undefined); assert.equal(preview.props.onChange, undefined); assert.equal(view.calls[1], ready.documentUrl);
});
test('pending scan is populated when the same record completes', () => {
  const view = form({ ...ready, canConfirm: false, items: [] }); view.render();
  view.scan.preview = ready; view.render();
  assert.equal(view.render().find(n => n.type === 'CorWeeklySchedulePreview').props.week[0].endTime, '17:00:00');
});
test('unreadable schedules cannot be manually corrected and rejected COR has no confirmation button', () => {
  const view = form({ ...ready, canConfirmSchedule: false, items: [], issues: ['Some class rows could not be read.'] }); view.render();
  let tree = view.render(); assert.equal(tree.find(n => n.props.label === 'Confirm schedule and continue').props.disabled, true);
  assert.equal(tree.find(n => n.type === 'CorWeeklySchedulePreview').props.onChange, undefined);
  assert.equal(view.render().find(n => n.props.label === 'Confirm schedule and continue').props.disabled, true);
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
