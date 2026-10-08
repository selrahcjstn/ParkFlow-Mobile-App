import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import vm from 'node:vm';
import ts from 'typescript';

const require = createRequire(import.meta.url);
function load(path, mocks = {}) {
  const source = readFileSync(new URL(path, import.meta.url), 'utf8');
  const code = ts.transpileModule(source, { compilerOptions: {
    module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX,
  } }).outputText;
  const exports = {};
  vm.runInNewContext(code, { exports, console: { log() {}, warn() {} }, require(name) {
    if (name in mocks) return mocks[name];
    if (name === 'react/jsx-runtime') return require(name);
    throw new Error('Unexpected import: ' + name);
  } });
  return exports;
}
const validation = load('../utils/registerValidation.ts');
const timeParser = load('../utils/timeParser.ts');
const vehicles = load('../constants/vehicleType.ts');
const roles = { Student: 1, UniversityStaff: 2, NonAcademicPersonnel: 3 };

for (const password of ['Password123', 'password123!', 'PASSWORD123!', 'Passwordabc!', 'Pass1!', ' Password123!', 'Password123! ']) {
  test(`registration rejects weak/invalid password ${JSON.stringify(password)}`, () => {
    assert.ok(validation.getPasswordValidationError(password));
  });
}
test('strong password is accepted and E-Bike is not selectable; Car keeps its persisted value', () => {
  assert.equal(validation.getPasswordValidationError('Password123!'), null);
  assert.deepEqual(Array.from(vehicles.VEHICLE_TYPE_OPTIONS, option => option.value), ['0', '2']);
  assert.equal(vehicles.VehicleType.Car, 2);
});

function registration({ step = 'signup', role = 1, roleFails = false } = {}) {
  const states = [step];
  let cursor = 0;
  let callbackCursor = 0;
  const callbacks = [];
  const calls = [];
  const storage = [];
  const onboarding = {
    role, profile: { firstName: 'Juan', lastName: 'Cruz', middleName: '', phoneNumber: '09171234567' },
    student: { studentNumber: '202600123', course: 'BSIT', section: '1A', yearLevel: 1 },
    personnel: { department: 'Office', idCardNumber: 'EMP-00123' },
    vehicle: { plateNumber: 'ABC1234', brand: 'Honda', vehicleType: 0 },
    setRole() {}, setProfileField() {}, setStudentField() {}, setPersonnelField() {}, setVehicleField() {}, reset() {},
  };
  const saveRole = async () => {
    calls.push('save-role');
    if (roleFails) throw { response: { status: 409, data: { message: 'This ID number is already registered.' } } };
    return { isSuccess: true };
  };
  const animation = { duration() { return this; } };
  const mocks = {
    react: {
      useState(initial) {
        const index = cursor++;
        if (!(index in states)) states[index] = typeof initial === 'function' ? initial() : initial;
        return [states[index], value => { states[index] = typeof value === 'function' ? value(states[index]) : value; }];
      }, useRef: value => ({ current: value }), useEffect() {},
      useCallback(fn, deps) {
        const index = callbackCursor++;
        const previous = callbacks[index];
        if (previous && deps.every((dep, i) => Object.is(dep, previous.deps[i]))) return previous.fn;
        callbacks[index] = { fn, deps };
        return fn;
      },
    },
    'react-native': { View: 'View', Text: 'Text', TouchableOpacity: 'TouchableOpacity', ActivityIndicator: 'ActivityIndicator',
      ScrollView: 'ScrollView', Platform: { OS: 'android' }, Animated: { Value: class {} } },
    'react-native-reanimated': { __esModule: true, default: { View: 'AnimatedView' }, FadeIn: animation, FadeOut: animation,
      Keyframe: class { duration() { return this; } }, Easing: { out: value => value, quad: {} } },
    'expo-router': { useRouter: () => ({ replace: value => calls.push(value) }) },
    'expo-status-bar': { StatusBar: 'StatusBar' },
    'expo-document-picker': {}, '@react-native-community/datetimepicker': { __esModule: true, default: 'DateTimePicker' },
    '../../../assets/images/parkflow.png': 'parkflow-logo',
    'lucide-react-native': {},
    '@/hooks/useAppTheme': { useAppTheme: () => ({ colors: {}, isDark: false }) },
    '@/hooks': { useApiMutation: fn => ({ run: fn, isLoading: false }) },
    '@/components/shared': { AlertModal: 'AlertModal' },
    '@/components/ui': { AppButton: 'AppButton', AppInput: 'AppInput', AppSelect: 'AppSelect' },
    '@/utils/registerValidation': validation, '@/constants/roles': { Roles: roles },
    '@/utils/timeParser': timeParser,
    '@/constants/vehicleType': vehicles, '@/constants/registerRoleOptions': { REGISTER_ROLE_OPTIONS: [] },
    '@/constants/courses': { YEAR_LEVEL_OPTIONS: [], COLLEGE_COURSE_OPTIONS: [], isJuniorHigh: () => false },
    '@/constants/scheduleDays': { SCHEDULE_DAYS: [{ shortLabel: 'Mon', key: 1 }, { shortLabel: 'Tues', key: 2 }] }, '@/utils/fileValidation': {},
    '@/features/auth/store/onboarding.store': { useOnboardingStore: () => onboarding },
    '@/features/auth/store/auth.store': { useAuthStore: () => ({ token: 'saved-token', setToken() {}, loadUser() {}, logout() {} }) },
    '@/features/user/store/vehicle.store': {}, '@/features/user/services/user.service': { userService: {} },
    '@/services/storage': { SecureStore: { setItemAsync: async (...args) => storage.push(args) } },
    '@/features/auth/services/auth.service': { authService: {
      register: async () => { calls.push('register'); return { isSuccess: true, data: 'new-token' }; },
      checkEmailAvailability: async () => { calls.push('check-email'); return { isSuccess: true }; },
      sendEmailOtp: async () => { calls.push('send-otp'); return { isSuccess: true }; },
      login: async () => { throw new Error('Registration must not sign in to check email'); },
    } },
    '@/features/auth/services/onboarding.service': { onboardingService: {
      updateStudent: saveRole, updatePersonnel: saveRole, updateProfile() {}, updateVehicle() {},
    } },
  };
  for (const name of ['@/features/auth/components/AuthHeader', '@/features/auth/components/AuthLayout',
    '@/features/auth/components/FormCard', '@/features/auth/components/EmailVerificationView',
    '@/components/layouts/AppHeader', '@/components/ui/StepIndicator', '@/components/ui/ScheduleDayRow']) {
    mocks[name] = { __esModule: true, default: name.split('/').pop() };
  }
  const page = load('../features/auth/pages/RegisterPage.tsx', mocks).default;
  function render() {
    cursor = 0;
    callbackCursor = 0;
    const nodes = [];
    function visit(node) {
      if (Array.isArray(node)) return node.forEach(visit);
      if (node?.props) { nodes.push(node); visit(node.props.children); }
    }
    visit(page());
    return nodes;
  }
  return { render, calls, storage, states };
}

test('signup blocks weak password before email availability or OTP requests', async () => {
  const form = registration();
  for (const [label, value] of [['Email address', 'juan@example.test'], ['Password', 'Password123'], ['Confirm Password', 'Password123']]) {
    form.render().find(n => n.type === 'AppInput' && n.props.label === label).props.onChangeText(value);
  }
  await form.render().find(n => n.type === 'AppButton' && n.props.label === 'Continue').props.onPress();
  assert.equal(form.calls.length, 0);
  assert.match(form.render().find(n => n.type === 'AppInput' && n.props.label === 'Password').props.error, /special/i);
});

for (const role of [1, 2, 3]) test(`duplicate ID for role ${role} stays at role step with inline error`, async () => {
  const form = registration({ step: 'role', role, roleFails: true });
  await form.render().find(n => n.type === 'AppButton' && n.props.label === 'Continue').props.onPress();
  assert.equal(form.states[0], 'role');
  const idInput = form.render().find(n => n.type === 'AppInput' && n.props.label === (role === 1 ? 'Student ID number' : 'Employee ID number'));
  assert.match(idInput.props.error, /already registered/);
});

test('verified registration saves token before profile step and clears passwords', async () => {
  const form = registration({ step: 'otp' });
  form.render();
  form.states[5] = 'juan@example.test';
  form.states[6] = 'Password123!';
  form.states[7] = 'Password123!';
  await form.render().find(n => n.type === 'EmailVerificationView').props.onVerifySuccess();
  assert.deepEqual(form.calls, ['register']);
  assert.equal(form.storage[0][0], 'token');
  assert.equal(form.storage[0][1], 'new-token');
  assert.equal(form.states[0], 'profile');
  assert.equal(form.states[6], '');
  assert.equal(form.states[7], '');
});

test('Vehicle Info places type first and uses vehicle-specific placeholders', () => {
  const form = registration({ step: 'vehicle' });
  const fields = form.render().filter(n => ['AppInput', 'AppSelect'].includes(n.type));
  assert.deepEqual(fields.map(n => n.props.label), ['Vehicle Type', 'Vehicle Plate Number', 'Vehicle brand / model']);
  assert.ok(fields.every(n => n.props.placeholder));
});

test('Android schedule picker does not reopen on unrelated renders and saves the confirmed time', () => {
  const form = registration({ step: 'schedule' });
  form.render().find(n => n.type === 'ScheduleDayRow' && n.props.day === 'Mon').props.onOpenPicker({ field: 'start' });
  const picker = form.render().find(n => n.type === 'DateTimePicker');
  const rerenderedPicker = form.render().find(n => n.type === 'DateTimePicker');
  assert.equal(rerenderedPicker.props.onChange, picker.props.onChange, 'a changed callback reopens the Android dialog at its initial value');
  const selected = new Date();
  selected.setHours(10, 0, 0, 0);
  picker.props.onChange({ type: 'set' }, selected);
  let row = form.render().find(n => n.type === 'ScheduleDayRow' && n.props.day === 'Mon');
  assert.equal(row.props.schedule.start, '10:00 AM');
  row.props.onOpenPicker({ field: 'start' });
  const reopened = form.render().find(n => n.type === 'DateTimePicker');
  assert.equal(reopened.props.value.getHours(), 10);
  reopened.props.onChange({ type: 'dismissed' }, reopened.props.value);
  row = form.render().find(n => n.type === 'ScheduleDayRow' && n.props.day === 'Mon');
  assert.equal(row.props.schedule.start, '10:00 AM', 'cancel must not replace the saved time');
});

test('saved schedule times parse both API and display formats without falling back to 8 AM', () => {
  for (const [value, hours, minutes] of [['10:00', 10, 0], ['17:30:00', 17, 30], ['10:00AM', 10, 0],
    [' 5:30 pm ', 17, 30], ['12:00 AM', 0, 0], ['12:00 PM', 12, 0]]) {
    const date = timeParser.parseTime(value);
    assert.equal(date.getHours(), hours);
    assert.equal(date.getMinutes(), minutes);
  }
  for (const value of ['invalid', '25:00', '10:60', '0:30 AM', '13:00 PM']) assert.equal(timeParser.parseTime(value), null);
});
