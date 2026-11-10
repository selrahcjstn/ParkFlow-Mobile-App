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
    if (name === '../components/CorScheduleStep') return { __esModule: true, default: 'CorScheduleStep' };
    if (name === '../components/CorStudentRegistrationStep') return { __esModule: true, default: 'CorStudentRegistrationStep' };
    if (name === '../services/verification.service') return { verificationService: {} };
    if (name === '@/components/ui/KeyboardAwareScrollView') return { __esModule: true, default: 'KeyboardAwareScrollView', useKeyboardScroll: () => null };
    if (name === 'react/jsx-runtime') return require(name);
    throw new Error('Unexpected import: ' + name);
  } });
  return exports;
}
const validation = load('../utils/registerValidation.ts');
const timeParser = load('../utils/timeParser.ts');
const registrationErrors = load('../utils/registrationError.ts');
const vehicles = load('../constants/vehicleType.ts');
const colors = load('../constants/colors.ts');
const roles = { Student: 1, UniversityStaff: 2, NonAcademicPersonnel: 3 };

for (const password of ['Password123', 'password123!', 'PASSWORD123!', 'Passwordabc!', 'Pass1!', ' Password123!', 'Password123! ']) {
  test(`registration rejects weak/invalid password ${JSON.stringify(password)}`, () => {
    assert.ok(validation.getPasswordValidationError(password));
  });
}
test('strong password is accepted and E-Bike is selectable; Car keeps its persisted value', () => {
  assert.equal(validation.getPasswordValidationError('Password123!'), null);
  assert.deepEqual(Array.from(vehicles.VEHICLE_TYPE_OPTIONS, option => option.value), ['0', '1', '2']);
  assert.equal(vehicles.VehicleType.ElectricBike, 1);
  assert.equal(vehicles.VehicleType.Car, 2);
});

function registration({ step = 'signup', role = 1, roleFails = false, roleFailure, roleResponse, availabilityResponse = { isSuccess: true, data: true }, availabilityFailure, studentNumber = '2023106763', documentFailure, pageName = 'RegisterPage' } = {}) {
  const states = [];
  let cursor = 0;
  let callbackCursor = 0;
  const callbacks = [];
  const calls = [];
  const storage = [];
  const onboarding = {
    registration: { step, email: '', password: '', confirmPassword: '', sessionToken: null, licenseFile: { uri: 'file://license.png' }, profilePhotoFile: { uri: 'file://profile.png' } },
    corDraft: { academicYear: '2026-2027' },
    setRegistrationField(field, value) { onboarding.registration[field] = value; },
    role, profile: { firstName: 'Juan', lastName: 'Cruz', middleName: '', phoneNumber: '09171234567' },
    student: { studentNumber, course: 'BSIT', section: '1A', yearLevel: 1 },
    personnel: { department: 'Office', idCardNumber: 'EMP-00123' },
    vehicle: { plateNumber: 'ABC1234', brand: 'Honda', vehicleType: 0 },
    setRole() {}, setProfileField() {}, setStudentField() {}, setPersonnelField() {}, setVehicleField() {}, reset() {},
  };
  const saveRole = async () => {
    calls.push('save-role');
    if (roleFailure) throw roleFailure;
    if (roleFails) throw { response: { status: 409, data: { message: 'This ID number is already registered.' } } };
    return roleResponse ?? { isSuccess: true };
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
    'expo-router': { useFocusEffect() {}, useRouter: () => ({ replace: value => calls.push(value) }) },
    'expo-status-bar': { StatusBar: 'StatusBar' },
    '@/utils/pickDriverDocument': { pickDriverDocument() {} },
    '../components/RegistrationDocumentField': { __esModule: true, default: 'RegistrationDocumentField' },
    '../services/registration.service': { registrationService: { start: async () => { calls.push('start-session'); return { token: 'temporary-token', expiresAt: '2026-10-29' }; } } },
    'jwt-decode': { jwtDecode() {} },
    'expo-document-picker': {}, '@react-native-community/datetimepicker': { __esModule: true, default: 'DateTimePicker' },
    '../../../assets/images/parkflow.png': 'parkflow-logo',
    'lucide-react-native': {},
    '@/hooks/useAppTheme': { useAppTheme: () => ({ colors: {}, isDark: false }) },
    '@/hooks': { useApiMutation: fn => ({ run: fn, isLoading: false }) },
    '@/components/shared': { AlertModal: 'AlertModal' },
    '@/components/ui': { AppButton: 'AppButton', AppInput: 'AppInput', AppSelect: 'AppSelect' },
    '@/utils/registerValidation': validation, '@/constants/roles': { Roles: roles },
    '@/constants/colors': colors,
    '@/utils/timeParser': timeParser,
    '@/utils/registrationError': registrationErrors,
    '@/constants/vehicleType': vehicles, '@/constants/registerRoleOptions': { REGISTER_ROLE_OPTIONS: [] },
    '@/constants/courses': { YEAR_LEVEL_OPTIONS: [], COLLEGE_COURSE_OPTIONS: [], isJuniorHigh: () => false },
    '@/constants/scheduleDays': { SCHEDULE_DAYS: [{ shortLabel: 'Mon', key: 1 }, { shortLabel: 'Tues', key: 2 }] }, '@/utils/fileValidation': { validateFileSize: () => ({ isValid: true }) },
    '@/features/auth/store/onboarding.store': { useOnboardingStore: Object.assign(() => onboarding, { getState: () => onboarding }) },
    '@/features/auth/store/auth.store': { useAuthStore: () => ({ token: 'saved-token', setToken() {}, loadUser() {}, logout() {}, user: { status: 'Active', onboardingStep: 'Done' } }) },
    '@/features/user/store/vehicle.store': {}, '@/features/user/services/user.service': { userService: { submitDriverDocuments: async () => ({ isSuccess: true }) } },
    '@/services/storage': { SecureStore: { setItemAsync: async (...args) => storage.push(args) } },
    '@/features/auth/services/auth.service': { authService: {
      register: async () => { calls.push('register'); return { isSuccess: true, data: 'new-token' }; },
      checkEmailAvailability: async () => { calls.push('check-email'); return { isSuccess: true }; },
      sendEmailOtp: async () => { calls.push('send-otp'); return { isSuccess: true }; },
      login: async () => { throw new Error('Registration must not sign in to check email'); },
    } },
    '@/features/auth/services/onboarding.service': { onboardingService: {
      checkIdAvailability: async (number, apiRole) => {
        calls.push('check-id');
        assert.equal(number, role === 1 ? studentNumber : 'EMP-00123');
        assert.equal(apiRole, role === 1 ? 'Student' : (role === 2 ? 'UniversityStaff' : 'NonAcademicPersonnel'));
        if (availabilityFailure) throw availabilityFailure;
        return availabilityResponse;
      },
      updateStudent: saveRole, updatePersonnel: saveRole, updateProfile() {}, updateVehicle() {},
      submitDocuments: async () => { calls.push('submit-documents'); throw documentFailure; },
    } },
  };
  for (const name of ['@/features/auth/components/AuthHeader', '@/features/auth/components/AuthLayout',
    '@/features/auth/components/FormCard', '@/features/auth/components/EmailVerificationView',
    '@/components/layouts/AppHeader', '@/components/ui/StepIndicator', '@/components/ui/ScheduleDayRow']) {
    mocks[name] = { __esModule: true, default: name.split('/').pop() };
  }
  const page = load(`../features/auth/pages/${pageName}.tsx`, mocks).default;
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
  return { render, calls, storage, states, draft: onboarding.registration };
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
  assert.equal(form.draft.step, 'role');
  const idInput = form.render().find(n => n.type === 'AppInput' && n.props.label === (role === 1 ? 'Student ID number' : 'Employee ID number'));
  assert.match(idInput.props.error, /already registered/);
});

for (const pageName of ['RegisterPage', 'OnboardingRolePage']) {
  for (const role of [1, 2, 3]) {
    for (const failure of ['http', 'empty-conflict', 'result']) test(`${pageName} blocks duplicate role ${role} on ${failure} with editable inline error`, async () => {
      const form = registration({ step: 'role', role, pageName,
        roleFails: failure === 'http',
        roleFailure: failure === 'empty-conflict' ? { message: 'Request failed with status code 409', response: { status: 409, data: {} } } : undefined,
        roleResponse: failure === 'result' ? { isSuccess: false, errors: { StudentNumber: ['This ID number is already registered.'] } } : undefined,
      });
      await form.render().find(n => n.type === 'AppButton' && n.props.label === 'Continue').props.onPress();
      assert.deepEqual(form.calls, ['check-id', 'save-role']);
      if (pageName === 'RegisterPage') assert.equal(form.draft.step, 'role');
      const idInput = form.render().find(n => n.type === 'AppInput' && n.props.label === (role === 1 ? 'Student ID number' : 'Employee ID number'));
      assert.match(idInput.props.error, /already registered/);
      assert.doesNotMatch(idInput.props.error, /status code|Axios/);
      idInput.props.onChangeText('2023106764');
      assert.equal(form.render().find(n => n.type === 'AppInput' && n.props.label === idInput.props.label).props.error, '');
    });
  }
}

for (const pageName of ['RegisterPage', 'OnboardingRolePage']) {
  for (const role of [1, 2, 3]) {
    for (const availabilityResponse of [
      { isSuccess: false, data: false, message: 'This ID number is already registered.' },
      { isSuccess: true, data: false },
      { isSuccess: true },
      { isSuccess: true, data: 'true' },
    ]) test(`${pageName} role ${role} requires explicit availability before saving (${JSON.stringify(availabilityResponse)})`, async () => {
      const form = registration({ step: 'role', role, pageName, availabilityResponse });
      await form.render().find(n => n.type === 'AppButton' && n.props.label === 'Continue').props.onPress();
      assert.deepEqual(form.calls, ['check-id'], 'must not save the role when availability is false or unconfirmed');
      if (pageName === 'RegisterPage') assert.equal(form.draft.step, 'role');
      const input = form.render().find(n => n.type === 'AppInput' && n.props.label === (role === 1 ? 'Student ID number' : 'Employee ID number'));
      assert.match(input.props.error, /already registered|confirm ID availability/);
    });
    test(`${pageName} role ${role} cannot continue when availability check fails`, async () => {
      const form = registration({ step: 'role', role, pageName, availabilityFailure: { code: 'ERR_NETWORK' } });
      await form.render().find(n => n.type === 'AppButton' && n.props.label === 'Continue').props.onPress();
      assert.deepEqual(form.calls, ['check-id']);
      const input = form.render().find(n => n.type === 'AppInput' && n.props.label === (role === 1 ? 'Student ID number' : 'Employee ID number'));
      assert.match(input.props.error, /Could not reach ParkFlow/);
    });
    test(`${pageName} role ${role} continues only after availability and successful save`, async () => {
      const form = registration({ step: 'role', role, pageName });
      await form.render().find(n => n.type === 'AppButton' && n.props.label === 'Continue').props.onPress();
      if (pageName === 'RegisterPage') {
        assert.deepEqual(form.calls, ['check-id', 'save-role']);
        assert.equal(form.draft.step, 'vehicle');
      } else assert.deepEqual(form.calls, ['check-id', 'save-role', '/(auth)/onboarding-vehicle']);
    });
  }
  for (const studentNumber of ['202310676', '20231067630', '2023A06763']) test(`${pageName} rejects invalid ten-digit Student ID ${studentNumber} before checking`, async () => {
    const form = registration({ step: 'role', pageName, studentNumber });
    await form.render().find(n => n.type === 'AppButton' && n.props.label === 'Continue').props.onPress();
    assert.deepEqual(form.calls, []);
    assert.match(form.render().find(n => n.type === 'AppInput' && n.props.label === 'Student ID number').props.error, /exactly 10 digits/);
  });
}

for (const failure of [
  { code: 'ECONNABORTED', message: 'timeout of 90000ms exceeded' },
  { response: { status: 409, data: { message: 'A COR submission for this user and term already exists.' } } },
  { response: { status: 400, data: { errors: { CorDocumentUrl: ['COR document URL must be a valid uploaded file link.'] } } } },
]) test(`document failure ${failure.code || failure.response.status} clears loading and appears inline and in the alert`, async () => {
  const form = registration({ step: 'documents', documentFailure: failure });
  form.render();
  for (const field of ['corFile', 'orcrFile', 'motorFile']) form.draft[field] = { uri: 'file:///document.pdf', name: 'document.pdf' };
  form.draft.preparedCorUrl = 'uploads/parkflow/cor/scanned.pdf';
  await form.render().find(n => n.type === 'AppButton' && n.props.label === 'Complete Registration').props.onPress();
  const view = form.render();
  const button = view.find(n => n.type === 'AppButton' && n.props.label === 'Complete Registration');
  assert.equal(button.props.loading, false);
  assert.equal(button.props.disabled, false);
  assert.equal(form.draft.step, 'documents');
  assert.deepEqual(form.calls, ['submit-documents']);
  const alert = view.find(n => n.type === 'AlertModal');
  assert.equal(alert.props.visible, true);
  const inline = view.find(n => n.type === 'Text' && n.props.accessibilityRole === 'alert');
  assert.equal(inline.props.children, alert.props.message);
  assert.ok(inline.props.children.length);
  assert.doesNotMatch(inline.props.children, /timeout of|AxiosError/);
});

test('verified email starts only a temporary registration session and keeps password in memory until final submission', async () => {
  const form = registration({ step: 'otp' });
  form.render();
  form.draft.email = 'juan@example.test';
  form.draft.password = 'Password123!';
  form.draft.confirmPassword = 'Password123!';
  await form.render().find(n => n.type === 'EmailVerificationView').props.onVerifySuccess('123456', 'email-receipt');
  assert.deepEqual(form.calls, ['start-session']);
  assert.deepEqual(form.storage, []);
  assert.equal(form.draft.sessionToken, 'temporary-token');
  assert.equal(form.draft.step, 'profile');
  assert.equal(form.draft.password, 'Password123!');
  assert.equal(form.draft.confirmPassword, '');
});

test('Vehicle Info places type first and uses vehicle-specific placeholders', () => {
  const form = registration({ step: 'vehicle' });
  const fields = form.render().filter(n => ['AppInput', 'AppSelect'].includes(n.type));
  assert.deepEqual(fields.map(n => n.props.label), ['Vehicle Type', 'Vehicle Plate Number', 'Vehicle brand / model']);
  assert.ok(fields.every(n => n.props.placeholder));
});

test('registration confirms the document schedule and proceeds without manual time fields', () => {
  const form = registration({ step: 'schedule' });
  const nodes = form.render();
  assert.equal(nodes.filter(n => n.type === 'ScheduleDayRow' || n.type === 'DateTimePicker').length, 0);
  nodes.find(n => n.type === 'CorScheduleStep').props.onConfirmed('uploads/parkflow/cor/scanned.pdf');
  assert.equal(form.draft.step, 'documents');
  assert.equal(form.draft.preparedCorUrl, 'uploads/parkflow/cor/scanned.pdf');
  assert.equal(form.render().filter(n => n.type === 'CorScheduleStep').length, 0);
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
