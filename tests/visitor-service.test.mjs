import test from 'node:test';
import assert from 'node:assert/strict';
import { loadCor } from './helpers/cor-form.mjs';
function service() {
  const calls = [];
  const formFields = [];
  const visitorService = loadCor('features/session/services/visitor.service.ts', {
    '@/services/axios': { api: { post: async (route, form) => { calls.push(['upload', route, form]); return { isSuccess: true }; } } },
    '@/features/auth/services/registration.service': { addFile: (form, field, file) => form.append(field, file.uri) },
    '@/services/common.service': { apiRequest: async (...args) => { calls.push(args); return { isSuccess: true }; } },
  }, { FormData: class { append(key, value) { formFields.push([key, value]); } } }).visitorService;
  return { visitorService, calls, formFields };
}
test('plate lookup and confirmed identity retrieval use separate authenticated operations', async () => {
  const view = service();
  await view.visitorService.lookupByPlate(' ab-123 ');
  await view.visitorService.confirmLookupByPlate(' ab-123 ');
  assert.deepEqual(view.calls.map(c => [c[0], c[1]]), [['get', '/visitors/lookup/AB-123'], ['post', '/visitors/lookup/AB-123/confirm']]);
});
test('additional vehicle entry sends explicit visitor confirmation and separate vehicle document', async () => {
  const view = service();
  await view.visitorService.createVisitorEntry({ plateNumber: 'NEW123', existingVisitorId: 'person', identityConfirmed: true, licenseVerified: true, vehicleType: 2, brand: 'Toyota', vehiclePhoto: { uri: 'new-vehicle.jpg' } });
  assert.ok(view.formFields.some(([key, value]) => key === 'existingVisitorId' && value === 'person'));
  assert.ok(view.formFields.some(([key, value]) => key === 'identityConfirmed' && value === 'true'));
  assert.ok(view.formFields.some(([key, value]) => key === 'vehiclePhoto' && value === 'new-vehicle.jpg'));
  assert.equal(view.calls[0][1], '/visitors/entry');
});
test('visitor exit preserves the exact reviewed session and vehicle identifiers', async () => {
  const view = service(); const payload = { plateNumber: 'ABC123', visitorVehicleId: 'vehicle', sessionId: 'session' };
  await view.visitorService.exitVisitor(payload);
  assert.equal(view.calls[0][0], 'patch'); assert.equal(view.calls[0][1], '/visitors/exit');
  assert.equal(view.calls[0][2], payload);
});
