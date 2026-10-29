import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
function load(path, mocks) {
  const code = ts.transpileModule(readFileSync(new URL('../' + path, import.meta.url), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
  const exports = {}; vm.runInNewContext(code, { exports, require: name => mocks[name], console }); return exports;
}
for (const status of [1, 4, 5, 6]) test(`COR status ${status} remains pending while background verification or review runs`, () => {
  const hook = load('hooks/useVerificationGuard.ts', {
    react: { useMemo: fn => fn(), useCallback: fn => fn },
    '@/features/auth/store/auth.store': { useAuthStore: () => ({ user: { status: 'Active', driversLicenseUrl: 'license.png', profilePictureUrl: 'profile.png', licenseVerificationStatus: 2, corVerificationStatus: status }, loadUser() {} }) },
    '@/features/user/store/vehicle.store': { useVehicleStore: () => ({ vehicle: { verificationStatus: 2 }, loadVehicle() {} }) },
    '@/services/app-dialog': { appDialog: {} }, 'expo-router': { router: {} },
  }).useVerificationGuard();
  assert.equal(hook.state, 'pending'); assert.equal(hook.isApproved, false); assert.match(hook.title, /COR Processing Pending/);
});
for (const user of [{ status: 'PendingVerification', corVerificationStatus: 2 }, { status: 'Active', corVerificationStatus: 2, scheduleVerificationStatus: 1 }]) {
  test(user.scheduleVerificationStatus ? 'confirmed COR does not require separate schedule approval when driver, account and vehicle are approved' : 'an approved COR and vehicle cannot bypass account approval', () => {
    const hook = load('hooks/useVerificationGuard.ts', {
      react: { useMemo: fn => fn(), useCallback: fn => fn },
      '@/features/auth/store/auth.store': { useAuthStore: () => ({ user: { ...user, driversLicenseUrl: 'license.png', profilePictureUrl: 'profile.png', licenseVerificationStatus: 2 }, loadUser() {} }) },
      '@/features/user/store/vehicle.store': { useVehicleStore: () => ({ vehicle: { verificationStatus: 2 }, loadVehicle() {} }) },
      '@/services/app-dialog': { appDialog: {} }, 'expo-router': { router: {} },
    }).useVerificationGuard();
    assert.equal(hook.isApproved, !!user.scheduleVerificationStatus); assert.equal(hook.state, user.scheduleVerificationStatus ? 'approved' : 'pending');
  });
}
test('missing university term stops submission with a useful error', async () => {
  const service = load('features/auth/services/verification.service.ts', { '@/services/axios': { api: { get: async () => ({ academicYear: '', semester: '' }) } } }).verificationService;
  await assert.rejects(service.getAcademicTerm(), /academic term has not been configured/);
});
