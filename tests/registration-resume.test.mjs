import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

function execute(path, mocks) {
  const source = readFileSync(new URL(path, import.meta.url), 'utf8');
  const compiled = ts.transpileModule(source, { compilerOptions: {
    module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022,
  } }).outputText;
  const exports = {};
  vm.runInNewContext(compiled, { exports, console: { log() {}, warn() {} }, require(name) {
    if (name in mocks) return mocks[name];
    throw new Error('Unexpected import: ' + name);
  } });
  return exports;
}
const zustand = { create(initializer) {
  let state;
  const get = () => state;
  const set = change => { state = { ...state, ...(typeof change === 'function' ? change(state) : change) }; };
  state = initializer(set, get);
  return { getState: get, setState: set };
} };
const authTypes = execute('../features/auth/types/auth.types.ts', {});

function auth({ profileError, vehicleLoaded = true, scheduleError, profileSuccess = true, status = 'Pending', onboardingStep = 3, corStatus = 0, profileOverrides = {} } = {}) {
  let deleted = false;
  const profile = { firstName: 'Juan', lastName: 'Cruz', phoneNumber: '09171234567', role: 'Student',
    studentNumber: '202600123', course: 'BSIT', section: '1A', yearLevel: 1, status, onboardingStep, corVerificationStatus: corStatus, ...profileOverrides };
  const noop = () => {};
  const exports = execute('../features/auth/store/auth.store.ts', {
    zustand,
    'jwt-decode': { jwtDecode: () => ({ user_id: 'user-1', email: 'juan@example.test', profile_type: 'student' }) },
    '@/features/auth/types/auth.types': authTypes,
    '@/features/user/services/user.service': { userService: { getProfile: async () => {
      if (profileError) throw profileError;
      return { isSuccess: profileSuccess, data: profileSuccess ? profile : null };
    } } },
    '@/services/storage': { SecureStore: { getItemAsync: async () => 'saved-token', deleteItemAsync: async () => { deleted = true; } } },
    '@/services/signalr': { connection: { restart: noop } },
    '@/constants/roles': { Roles: { Student: 1, UniversityStaff: 2, NonAcademicPersonnel: 3 } },
    '@/features/auth/store/onboarding.store': { useOnboardingStore: { getState: () => ({
      setProfileField: noop, setStudentField: noop, setPersonnelField: noop, setVehicleField: noop, setRole: noop,
    }) } },
    '@/features/user/store/vehicle.store': { useVehicleStore: { getState: () => ({
      loadVehicle: async () => vehicleLoaded, vehicle: { plateNumber: 'ABC1234', brand: 'Honda', vehicleType: 0 },
    }) } },
    '@/features/schedule/services/schedule.service': { ScheduleService: { getSchedules: async () => {
      if (scheduleError) throw scheduleError;
      return { isSuccess: true, data: [] };
    } } },
  });
  return { store: exports.useAuthStore, get deleted() { return deleted; } };
}

for (const failure of [new Error('Network Error'), { response: { status: 500, data: { message: 'Profile server unavailable' } } }]) {
  test(`profile failure ${failure.message || failure.response.status} does not restart registration`, async () => {
    const state = auth({ profileError: failure });
    const result = await state.store.getState().loadUser();
    assert.equal(result.success, false);
    assert.equal(result.currentOnboardingStep, undefined);
    assert.equal(state.store.getState().token, 'saved-token');
    assert.equal(state.deleted, false);
  });
}
test('only a real missing profile returns to profile; expired authentication does not', async () => {
  const missing = auth({ profileError: { response: { status: 404 } } });
  assert.equal((await missing.store.getState().loadUser()).currentOnboardingStep, 'profile');
  const expired = auth({ profileError: { response: { status: 401 } } });
  assert.equal((await expired.store.getState().loadUser()).currentOnboardingStep, undefined);
  assert.equal(expired.store.getState().token, null);
  assert.equal(expired.deleted, true);
});
test('failed profile response without data is not treated as an empty registration', async () => {
  const result = await auth({ profileSuccess: false }).store.getState().loadUser();
  assert.equal(result.currentOnboardingStep, undefined);
});
test('failed vehicle or schedule checks never rewind to an onboarding step', async () => {
  for (const options of [{ vehicleLoaded: false }, { scheduleError: new Error('Network Error') }]) {
    const state = auth(options);
    const result = await state.store.getState().loadUser();
    assert.equal(result.success, false);
    assert.equal(result.currentOnboardingStep, undefined);
    assert.equal(state.store.getState().token, 'saved-token');
  }
});
test('pending registration resumes documents after a saved schedule instead of skipping them', async () => {
  const result = await auth({ onboardingStep: 4 }).store.getState().loadUser();
  assert.equal(result.currentOnboardingStep, 'documents');
});

for (const role of ['Student', 'UniversityStaff', 'NonAcademicPersonnel']) {
  test(`submitted ${role} registration proceeds to the app while waiting for approval`, async () => {
    const state = auth({ onboardingStep: 4, corStatus: 1, profileOverrides: role === 'Student' ? { role } : {
      role, studentNumber: undefined, course: undefined, section: undefined, yearLevel: undefined,
      employeeIdNumber: 'EMP-123', department: 'Office',
    } });
    const result = await state.store.getState().loadUser();
    assert.equal(result.success, true);
    assert.equal(result.currentOnboardingStep, undefined);
    assert.equal(state.store.getState().user.corVerificationStatus, 1);
    assert.equal(state.store.getState().user.profileType, role === 'Student' ? 'student' : 'personnel');
    assert.equal(state.deleted, false);
  });
}
test('vehicle request failure preserves the last successfully loaded records', async () => {
  let fail = false;
  const vehicle = { id: 'v-1', plateNumber: 'ABC1234', isPrimary: true };
  const store = execute('../features/user/store/vehicle.store.ts', {
    zustand,
    '@/services/queryClient': { queryClient: { setQueryData() {}, invalidateQueries() {} } },
    '@/features/user/services/vehicle.service': { vehicleService: { getVehicles: async () => {
      if (fail) throw new Error('Server restarting');
      return { isSuccess: true, data: [vehicle] };
    } } },
  }).useVehicleStore;
  assert.equal(await store.getState().loadVehicle(), true);
  fail = true;
  assert.equal(await store.getState().loadVehicle(), false);
  assert.equal(store.getState().vehicle, vehicle);
  assert.equal(store.getState().vehicles.length, 1);
});
