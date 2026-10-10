import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import vm from 'node:vm';
import ts from 'typescript';

const require = createRequire(import.meta.url);
function component(path, profileType = 'personnel', settings = {}, routes = []) {
  const source = readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
  const code = ts.transpileModule(source, { compilerOptions: {
    module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX,
  } }).outputText;
  const exports = {};
  vm.runInNewContext(code, { exports, Date, console, require(name) {
    if (name === 'react/jsx-runtime') return require(name);
    if (name === 'react') return { useState: init => [typeof init === 'function' ? init() : init, () => {}] };
    if (name === 'react-native') return { View: 'View', Text: 'Text', ScrollView: 'ScrollView', TouchableOpacity: 'TouchableOpacity', Modal: 'Modal', Pressable: 'Pressable', ActivityIndicator: 'ActivityIndicator' };
    if (name === '@/features/auth/store/auth.store') return { useAuthStore: selector => selector ? selector({ user: { profileType } }) : { user: { profileType } } };
    if (name === '@/hooks/useAppTheme') return { useAppTheme: () => ({ colors: {}, isDark: false, theme: 'light' }) };
    if (name === '@/hooks') return { useSystemSettingsQuery: () => ({ isPending: false, isError: false, data: { personnelFreeParkingStart: '07:30', personnelFreeParkingEnd: '22:00', violationRatePerHour: 75 }, ...settings }) };
    if (name === '@/components/ui') return { AppButton: 'AppButton' };
    if (name === '@/components/layouts') return { ContentWrapper: 'ContentWrapper' };
    if (name === '@/constants/scheduleDays') return { SCHEDULE_DAYS: [{ shortLabel: 'Mon', key: 1 }] };
    if (name === '@/utils/fileValidation') return { formatFileSize: () => '' };
    if (name === 'expo-router') return { router: { push: path => routes.push(path) } };
    if (name === 'lucide-react-native') return { Info: 'Info', UploadCloud: 'UploadCloud', FileText: 'FileText', ShieldCheck: 'ShieldCheck', Car: 'Car' };
    return { __esModule: true, default: name, router: {} };
  } });
  return exports;
}
function inspect(node) {
  const nodes = [], words = [];
  function visit(value) {
    if (Array.isArray(value)) return value.forEach(visit);
    if (typeof value === 'string') { words.push(value); return; }
    if (value?.props) { nodes.push(value); visit(value.props.children); }
  }
  visit(node);
  return { nodes, text: words.join(' ') };
}

test('faculty/staff document form has Employee ID but no weekly schedule fields', () => {
  const Form = component('features/account/components/schedule/ScheduleEditMode.tsx').default;
  const view = inspect(Form({ isPersonnel: true, editSchedule: {}, selectedFile: null }));
  assert.match(view.text, /Employee ID/);
  assert.doesNotMatch(view.text, /Weekly Schedule|Upload COR Document|Tap day badge/);
  assert.equal(view.nodes.filter(n => String(n.type).includes('ScheduleDayRow')).length, 0);
});

test('student document form retains weekly schedule and COR entry', () => {
  const Form = component('features/account/components/schedule/ScheduleEditMode.tsx', 'student').default;
  const view = inspect(Form({ isPersonnel: false, editSchedule: {}, selectedFile: null }));
  assert.match(view.text, /Weekly Schedule/);
  assert.match(view.text, /Upload COR Document/);
  assert.equal(view.nodes.filter(n => String(n.type).includes('ScheduleDayRow')).length, 1);
});

test('personnel tab renders read-only university hours instead of the student screen', () => {
  const routes = [];
  const Page = component('features/schedule/pages/UserSchedulePage.tsx', 'personnel', {}, routes).default;
  const view = inspect(Page());
  assert.ok(view.nodes.some(n => String(n.type).includes('PersonnelParkingHours')));
  const verification = view.nodes.find(n => n.props.label === 'Employee ID verification').props;
  const vehicle = view.nodes.find(n => n.props.label === 'Manage vehicle').props;
  assert.equal(verification.variant, 'primary');
  assert.equal(vehicle.variant, 'outline');
  for (const action of [verification, vehicle]) {
    assert.equal(action.size, 'lg');
    assert.equal(action.uppercase, false);
    assert.ok(action.icon);
    action.onPress();
  }
  assert.deepEqual(routes, ['/(settings)/setup-schedule', '/(settings)/vehicle']);
});

test('parking hours reflect configured Super Admin times and hourly rate', () => {
  const Hours = component('features/schedule/components/PersonnelParkingHours.tsx').default;
  const view = inspect(Hours());
  assert.match(view.text, /7:30 AM/); assert.match(view.text, /10:00 PM/);
  assert.match(view.text, /75.00/);
  assert.match(view.text, /including Sunday/);
  assert.match(view.text, /Super Admin/);
  assert.match(view.text, /does not reset/);
});

test('failed settings request is not presented as confirmed university hours', () => {
  const Hours = component('features/schedule/components/PersonnelParkingHours.tsx', 'personnel', { isError: true, data: undefined }).default;
  const view = inspect(Hours());
  assert.match(view.text, /Could not load/);
  assert.doesNotMatch(view.text, /5:00 AM|9:00 PM/);
});

test('account menu no longer asks personnel to set up schedules or COR', () => {
  const Menu = component('features/account/components/AccountMenu.tsx').default;
  const nodes = inspect(Menu({ onLogout() {} })).nodes;
  const labels = nodes.map(n => n.props.label).filter(Boolean);
  assert.ok(labels.includes('Employee ID verification'));
  assert.ok(!labels.includes('Setup Schedule & COR'));
});

test('personnel submit path skips schedules; ID verification is not bypassed by role', () => {
  const setup = readFileSync(new URL('../features/account/pages/ScheduleSetupPage.tsx', import.meta.url), 'utf8');
  assert.match(setup, /!isPersonnel && items.length === 0/);
  assert.match(setup, /isPersonnel \? null : await onboardingService.updateSchedule/);
  const qr = readFileSync(new URL('../features/user/components/QRCodeDisplay.tsx', import.meta.url), 'utf8');
  const verification = qr.split('\n').find(line => line.includes('const isCorVerified ='));
  assert.doesNotMatch(verification, /isPersonnel/);
  assert.match(qr, /Employee ID Verification Pending/);
});
