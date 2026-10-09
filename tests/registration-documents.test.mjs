import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import vm from 'node:vm';
import ts from 'typescript';

const require = createRequire(import.meta.url);
function load(path, mocks = {}) {
  const source = readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
  const code = ts.transpileModule(source, { compilerOptions: {
    module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX,
  } }).outputText;
  const exports = {};
  vm.runInNewContext(code, { exports, Date, console, require(name) {
    if (name in mocks) return mocks[name];
    if (name === 'react/jsx-runtime') return require(name);
    throw new Error('Unexpected import: ' + name);
  } });
  return exports;
}
const errors = load('utils/registrationError.ts');

test('ID availability reads the authenticated onboarding endpoint before any save and safely encodes the number', async () => {
  const calls = [];
  const response = { isSuccess: true, data: true };
  const service = load('features/auth/services/onboarding.service.ts', {
    '@/utils/registrationError': errors,
    '@/features/user/services/user.service': { userService: {} },
    '@/services/common.service': { apiRequest: async (...args) => { calls.push(args); return response; } },
  }).onboardingService;
  assert.equal(await service.checkIdAvailability('2023106763', 'Student'), response);
  assert.deepEqual(calls[0], ['get', '/onboarding/id-availability?number=2023106763&role=Student']);
  await service.checkIdAvailability('EMP&A#123', 'UniversityStaff');
  assert.deepEqual(calls[1], ['get', '/onboarding/id-availability?number=EMP%26A%23123&role=UniversityStaff']);
});

const files = [
  { uri: 'file:///cor.pdf', name: 'cor.pdf' },
  { uri: 'file:///orcr.pdf', name: 'orcr.pdf' },
  { uri: 'file:///vehicle.jpg', name: 'vehicle.jpg' },
];
function submission({ failedStep, thrown, invalidLink = false, failedFinal = false, local = false } = {}) {
  const calls = [];
  const uploads = ['cor', 'orcr', 'motor'];
  const service = load('features/auth/services/onboarding.service.ts', {
    '@/utils/registrationError': errors,
    '@/features/user/services/user.service': { userService: Object.fromEntries(
      ['uploadCorDocument', 'uploadOrcrDocument', 'uploadMotorPicture'].map((name, i) => [name, async (uri, fileName, id) => {
        calls.push({ step: uploads[i], uri, fileName, id });
        if (failedStep === i) {
          if (thrown) throw thrown;
          return invalidLink ? { isSuccess: true, data: {}, message: 'Uploaded successfully' }
            : { isSuccess: false, message: 'The document is not valid.' };
        }
        const link = local ? `uploads/parkflow/${i === 2 ? 'motor-pictures' : uploads[i]}/12345678-1234-1234-1234-123456789abc.${i === 2 ? 'jpg' : 'pdf'}`
          : `https://example.test/${uploads[i]}.pdf`;
        return { isSuccess: true, data: { secureUrl: link } };
      }]),
    ) },
    '@/services/common.service': { apiRequest: async (method, url, body) => {
      calls.push({ step: 'finalize', method, url, body });
      if (failedFinal) throw { response: { status: 409, data: { message: 'A COR submission for this user and term already exists.' } } };
      return { isSuccess: true, data: 'submission-id' };
    } },
  }).onboardingService;
  return { calls, service };
}

for (const local of [false, true]) test(`all files upload before finalization (${local ? 'server storage' : 'Cloudinary'})`, async () => {
  const flow = submission({ local });
  const result = await flow.service.submitDocuments(...files);
  assert.equal(result.isSuccess, true);
  assert.deepEqual(flow.calls.map(call => call.step), ['cor', 'orcr', 'motor', 'finalize']);
  const final = flow.calls[3];
  assert.equal(final.method, 'patch');
  assert.equal(final.url, '/onboarding/cor');
  assert.ok(final.body.corDocumentUrl);
  assert.ok(final.body.orcrDocumentUrl);
  assert.ok(final.body.motorPictureUrl);
  for (let i = 0; i < 3; i++) assert.equal(flow.calls[i].uri, files[i].uri);
});

for (const failedStep of [0, 1, 2]) {
  test(`upload failure at step ${failedStep} stops without finalizing registration`, async () => {
    const flow = submission({ failedStep });
    await assert.rejects(flow.service.submitDocuments(...files), /document is not valid/);
    assert.equal(flow.calls.length, failedStep + 1);
    assert.ok(flow.calls.every(call => call.step !== 'finalize'));
  });
  test(`timeout at upload step ${failedStep} explains which file failed`, async () => {
    const flow = submission({ failedStep, thrown: { code: 'ECONNABORTED' } });
    await assert.rejects(flow.service.submitDocuments(...files), new RegExp(`^Error: ${['COR / Employee ID', 'OR/CR document', 'Vehicle picture'][failedStep]}: The request took too long`));
    assert.equal(flow.calls.length, failedStep + 1);
  });
}
test('missing upload URL is not mistaken for a successful submission or stringified object', async () => {
  const flow = submission({ failedStep: 0, invalidLink: true });
  await assert.rejects(flow.service.submitDocuments(...files), /uploaded file link was missing/);
  assert.equal(flow.calls.length, 1);
});
test('finalization conflict preserves the backend explanation', async () => {
  const flow = submission({ failedFinal: true });
  await assert.rejects(flow.service.submitDocuments(...files), error => {
    assert.match(errors.getRegistrationErrorMessage(error), /COR submission.*already exists/);
    return true;
  });
  assert.equal(flow.calls.length, 4);
});
test('error messages distinguish validation, expired login, timeout, and server failure', () => {
  assert.match(errors.getRegistrationErrorMessage({ response: { status: 409, data: { message: 'Student ID is already registered.' } } }), /Student ID.*already registered/);
  assert.match(errors.getRegistrationErrorMessage({ response: { status: 400, data: { errors: { File: ['File cannot be empty.', 'Only PDF files are allowed.'] } } } }), /File cannot be empty.*Only PDF/);
  assert.match(errors.getRegistrationErrorMessage({ response: { status: 401 } }), /sign-in has expired/);
  assert.match(errors.getRegistrationErrorMessage({ code: 'ETIMEDOUT' }), /took too long/);
  assert.doesNotMatch(errors.getRegistrationErrorMessage({ response: { status: 500, data: { message: 'NpgsqlException: secret database detail' } } }), /Npgsql|secret/);
});

test('the resumed verification page also stops loading and displays the submission error', async () => {
  let cursor = 0;
  const states = [];
  const animation = { Value: class {} };
  const mocks = {
    react: {
      useState(initial) {
        const i = cursor++;
        if (!(i in states)) states[i] = typeof initial === 'function' ? initial() : initial;
        return [states[i], value => { states[i] = typeof value === 'function' ? value(states[i]) : value; }];
      },
      useRef: value => ({ current: value }), useCallback: fn => fn, useEffect() {},
    },
    'react-native': { View: 'View', Text: 'Text', TouchableOpacity: 'TouchableOpacity', Animated: animation, Platform: { OS: 'android' } },
    'lucide-react-native': {}, 'expo-document-picker': {},
    'expo-router': { useRouter: () => ({ replace() { assert.fail('Failed submission must not navigate'); } }) },
    '@/hooks/useAppTheme': { useAppTheme: () => ({ colors: {} }) },
    '@/hooks': { useApiMutation: () => ({}) },
    '@/constants/roles': { Roles: { Student: 1, UniversityStaff: 2, NonAcademicPersonnel: 3 } },
    '@/constants/scheduleDays': { SCHEDULE_DAYS: [] },
    '@/features/auth/store/onboarding.store': { useOnboardingStore: selector => selector({ role: 2 }) },
    '@/features/auth/store/auth.store': { useAuthStore: selector => selector({ user: { profileType: 'personnel' } }) },
    '@/features/auth/services/onboarding.service': { onboardingService: { submitDocuments: async () => {
      throw { response: { status: 400, data: { message: 'Employee ID document is invalid.' } } };
    } } },
    '@/utils/fileValidation': { validateFileSize: () => ({ isValid: true }) },
    '@/utils/timeParser': {}, '@/utils/registrationError': errors,
    '@/components/shared': { AlertModal: 'AlertModal' }, '@/components/ui': { AppButton: 'AppButton' },
    '@/features/auth/components/AuthLayout': { default: 'AuthLayout' },
    '@/components/ui/ScheduleDayRow': { default: 'ScheduleDayRow' },
    '@react-native-community/datetimepicker': { default: 'DateTimePicker' },
  };
  const Page = load('features/auth/pages/OnboardingSchedulePage.tsx', mocks).default;
  function render() {
    cursor = 0;
    const nodes = [];
    function visit(node) {
      if (Array.isArray(node)) return node.forEach(visit);
      if (node?.props) { nodes.push(node); visit(node.props.children); }
    }
    visit(Page());
    return nodes;
  }
  render();
  for (let i = 0; i < 3; i++) states[i + 3] = files[i];
  await render().find(n => n.type === 'AppButton' && n.props.label === 'Complete Verification').props.onPress();
  const nodes = render();
  assert.equal(nodes.find(n => n.type === 'AppButton' && n.props.label === 'Complete Verification').props.loading, false);
  assert.equal(nodes.find(n => n.type === 'AlertModal').props.message, 'Employee ID document is invalid.');
  assert.equal(nodes.find(n => n.type === 'Text' && n.props.accessibilityRole === 'alert').props.children, 'Employee ID document is invalid.');
  assert.equal(states[3], files[0]);
});
