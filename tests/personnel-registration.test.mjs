import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import vm from 'node:vm';
import ts from 'typescript';

const require = createRequire(import.meta.url);
const source = readFileSync(new URL('../features/auth/pages/OnboardingSchedulePage.tsx', import.meta.url), 'utf8');
const code = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
}).outputText;

function render(role) {
  const exports = {};
  vm.runInNewContext(code, { exports, Date, console, require(name) {
    if (name === 'react/jsx-runtime') return require(name);
    if (name === 'react') return {
      useState: initial => [typeof initial === 'function' ? initial() : initial, () => {}],
      useRef: value => ({ current: value }), useCallback: fn => fn, useEffect() {},
    };
    if (name === 'react-native') return { View: 'View', Text: 'Text', TouchableOpacity: 'TouchableOpacity',
      Platform: { OS: 'ios' }, Animated: { Value: class {} } };
    if (name === '@/constants/roles') return { Roles: { Student: 1, UniversityStaff: 2, NonAcademicPersonnel: 3 } };
    if (name === '@/constants/scheduleDays') return { SCHEDULE_DAYS: [{ shortLabel: 'Mon', key: 1 }] };
    if (name === '@/features/auth/store/onboarding.store') return { useOnboardingStore: selector => selector({ role }) };
    if (name === '@/features/auth/store/auth.store') return { useAuthStore: selector => selector({ user: { profileType: role === 1 ? 'student' : 'personnel' } }) };
    if (name === '@/hooks/useAppTheme') return { useAppTheme: () => ({ colors: {}, isDark: false }) };
    if (name === '@/hooks') return { useApiMutation: () => ({ run() {}, isLoading: false }) };
    if (name === 'expo-router') return { useRouter: () => ({}) };
    if (name === '@/components/shared') return { AlertModal: 'AlertModal' };
    if (name === '@/components/ui') return { AppButton: 'AppButton' };
    if (name === '@/features/auth/services/onboarding.service') return { onboardingService: {} };
    if (name === '@/features/user/services/user.service') return { userService: {} };
    if (name === '@/utils/fileValidation') return { validateFileSize: () => ({ isValid: true }) };
    if (name === 'lucide-react-native') return { ChevronLeft: 'ChevronLeft', FileText: 'FileText', UploadCloud: 'UploadCloud', X: 'X' };
    if (name === 'expo-document-picker') return {};
    return { __esModule: true, default: name.includes('ScheduleDayRow') ? 'ScheduleDayRow' : 'Wrapper' };
  } });
  const nodes = [];
  const strings = [];
  function visit(value) {
    if (Array.isArray(value)) return value.forEach(visit);
    if (typeof value === 'string') { strings.push(value); return; }
    if (value?.props) { nodes.push(value); visit(value.props.children); }
  }
  visit(exports.default());
  return { nodes, text: strings.join(' ') };
}

for (const role of [2, 3]) test(`personnel role ${role} skips the schedule and still asks for employee/vehicle documents`, () => {
  const view = render(role);
  assert.equal(view.nodes.filter(n => n.type === 'ScheduleDayRow').length, 0);
  assert.match(view.text, /Upload Employee ID/);
  assert.match(view.text, /No schedule upload is needed/);
  assert.match(view.text, /Upload OR\s*\/\s*CR/);
  const register = readFileSync(new URL('../features/auth/pages/RegisterPage.tsx', import.meta.url), 'utf8');
  assert.match(register, /setStep\(isPersonnel \? "documents" : "schedule"\)/);
  assert.match(register, /setStep\(isPersonnel \? "vehicle" : "schedule"\)/);
  assert.match(register, /!isPersonnel && items.length > 0/);
});

test('student registration keeps its schedule step', () => {
  const view = render(1);
  assert.equal(view.nodes.filter(n => n.type === 'ScheduleDayRow').length, 1);
  assert.match(view.text, /campus schedule/);
  const auth = readFileSync(new URL('../features/auth/store/auth.store.ts', import.meta.url), 'utf8');
  assert.match(auth, /isScheduleDone = activeProfileType === "personnel"/);
});
