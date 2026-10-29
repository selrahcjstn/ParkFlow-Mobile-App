import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { loadCor, hooks, nodes, mapping, ready, courses } from './helpers/cor-form.mjs';

function studentForm(preview = ready, user = null) {
  const runtime = hooks(), calls = [];
  const store = { profile: { firstName: '', lastName: '', middleName: '', phoneNumber: '09171234567' },
    registration: { sessionToken: null }, student: { studentNumber: '', course: '', yearLevel: 0, section: '' }, corDraft: null,
    setProfileField(field, value) { this.profile = { ...this.profile, [field]: value }; },
    setStudentField(field, value) { this.student = { ...this.student, [field]: value }; },
    setCorDraft(draft) { this.corDraft = draft; } };
  // Zustand actions have stable closures rather than depending on this.
  for (const name of ['setProfileField', 'setStudentField', 'setCorDraft']) store[name] = store[name].bind(store);
  const scan = { preview, busy: false, error: '', processing: false, scan() {}, refresh() {}, validateCurrentTerm: async () => {}, runAction: async action => {
    try { await action(); } catch (error) { scan.error = error.message; }
  } };
  const stateHook = () => store; stateHook.getState = () => store;
  const component = loadCor('features/auth/components/CorStudentRegistrationStep.tsx', {
    react: runtime.react, 'react-native': { View: 'View', Text: 'Text', ActivityIndicator: 'ActivityIndicator' },
    '@/components/ui': { AppButton: 'AppButton', AppInput: 'AppInput', AppSelect: 'AppSelect' }, '@/constants/courses': courses,
    '@/utils/registerValidation': loadCor('utils/registerValidation.ts'), '@/hooks/useAppTheme': { useAppTheme: () => ({ colors: {} }) },
    '../store/auth.store': { useAuthStore: { getState: () => ({ user }) } }, '../store/onboarding.store': { useOnboardingStore: stateHook },
    '../hooks/useCorScan': { useCorScan: () => scan }, '../utils/corStudentMapping': mapping,
    '../services/verification.service': { verificationService: { confirmStudentCor: async payload => calls.push(payload) } },
    './CorUploadStep': { default: 'CorUploadStep' }, './CorWeeklySchedulePreview': { default: 'CorWeeklySchedulePreview' }
  }).default;
  return { store, calls, scan, render: () => nodes(runtime.render(() => component({ onConfirmed: url => calls.push(url) }))) };
}
test('student review allows personal corrections while protecting the extracted term, year and weekly schedule', async () => {
  const view = studentForm(); view.render(); let tree = view.render();
  assert.equal(view.store.profile.firstName, 'Juan'); assert.equal(view.store.profile.lastName, 'Example');
  assert.equal(view.store.profile.middleName, 'R.'); assert.equal(view.store.student.course, 'BS Information Technology (BSIT)');
  assert.equal(view.store.corDraft.college, 'CICT'); assert.equal(view.store.corDraft.week.length, 7);
  tree.find(n => n.props.label === 'First Name').props.onChangeText('Juan Miguel');
  assert.equal(tree.find(n => n.props.label === 'Semester').props.editable, false);
  assert.equal(view.render().find(n => n.type === 'CorWeeklySchedulePreview').props.onChange, undefined);
  tree = view.render(); await tree.find(n => n.props.label === 'Confirm').props.onPress();
  assert.equal(view.calls[0].information.firstName, 'Juan Miguel'); assert.equal(view.calls[0].information.semester, '1st Semester');
  assert.equal(view.calls[0].week, undefined); assert.equal(view.calls[0].recordId, ready.recordId);
  assert.equal(view.calls[1], ready.documentUrl); assert.equal(view.store.corDraft.informationConfirmed, true);
});
test('corrections survive refreshed revisions and replacement documents are populated afresh', () => {
  const view = studentForm(); view.render(); view.store.setProfileField('firstName', 'Edited');
  view.scan.preview = { ...ready, recordId: 'new-revision', version: 4 }; view.render();
  assert.equal(view.store.profile.firstName, 'Edited');
  view.scan.preview = { ...ready, recordId: 'replacement', documentUrl: 'uploads/parkflow/cor/second.pdf' }; view.render();
  assert.equal(view.store.profile.firstName, 'Juan'); assert.equal(view.store.corDraft.informationConfirmed, false);
});
test('missing or ambiguous student fields remain empty for manual completion', async () => {
  const view = studentForm({ ...ready, studentInformation: { fullName: 'Ambiguous Name' } }); view.render(); const tree = view.render();
  assert.equal(view.store.profile.firstName, ''); assert.equal(view.store.student.studentNumber, ''); assert.equal(view.store.student.yearLevel, 0);
  await tree.find(n => n.props.label === 'Confirm').props.onPress();
  assert.equal(view.calls.length, 0); assert.match(view.scan.error, /name/);
});
test('saved student middle name is preserved on resume, including an intentionally empty one', () => {
  const view = studentForm(ready, { studentNumber: '2023000001', middleName: '' }); view.render();
  assert.equal(view.store.profile.middleName, '');
});
test('unrecognized course or semester is not invented and known courses map uniquely', () => {
  assert.equal(mapping.mapCorCourse('BSIT'), 'BS Information Technology (BSIT)');
  assert.equal(mapping.mapCorCourse('Bachelor of Science in Information Technology'), 'BS Information Technology (BSIT)');
  assert.equal(mapping.mapCorCourse('Unknown program'), ''); assert.equal(mapping.mapCorYear(null), 0);
  assert.equal(mapping.mapCorSemester('First Semester'), '1st Semester'); assert.equal(mapping.mapCorSemester('Unknown'), '');
});
test('Student COR review precedes vehicle; Personnel retains its role details and employee ID flow', () => {
  const source = readFileSync(new URL('../features/auth/pages/RegisterPage.tsx', import.meta.url), 'utf8');
  assert.match(source, /smartStudent \? <CorStudentRegistrationStep/);
  assert.match(source, /CorStudentRegistrationStep onConfirmed=[\s\S]*?setStep\('vehicle'\)/);
  assert.match(source, /role === Roles\.UniversityStaff \|\| role === Roles\.NonAcademicPersonnel/);
  assert.match(source, /updatePersonnel\(/); assert.match(source, /isPersonnel \? "Employee ID" : corDraft\?\.academicYear/);
});

function scanner(overrides = {}, student = true, uploadPreview) {
  const runtime = hooks(), calls = []; let picked = { uri: 'file://cor.pdf', name: 'cor.pdf' };
  const services = { getCurrentAcademicTerm: async () => ({ academicYear: '2026-2027', semester: '1st Semester' }), fetchCorInformation: async preview => { calls.push('fetch'); return ready; }, getStudentCorPreview: async () => ready,
    getCorSchedule: async () => ready, ...overrides };
  const useCorScan = loadCor('features/auth/hooks/useCorScan.ts', { react: runtime.react,
    'expo-document-picker': { getDocumentAsync: async () => ({ canceled: false, assets: [picked] }) },
    '@/features/user/services/user.service': { userService: { uploadCorDocument: async () => { calls.push('upload'); return { isSuccess: true, data: { secureUrl: ready.documentUrl, corPreview: uploadPreview } }; } } },
    '@/utils/fileValidation': { validateFileSize: () => ({ isValid: true }) },
    '@/utils/registrationError': { getRegistrationErrorMessage: error => error.message || 'Error' },
    '../services/verification.service': { verificationService: services },
    '../services/registration.service': { registrationService: {} },
    '../store/onboarding.store': { useOnboardingStore: Object.assign(selector => selector({ registration: { sessionToken: null } }), { getState: () => ({ registration: { sessionToken: null } }) }) },
    '../utils/corAcademicTerm': loadCor('features/auth/utils/corAcademicTerm.ts', { './corStudentMapping': mapping })
  }).useCorScan;
  return { calls, runtime, services, render: () => runtime.render(() => useCorScan(student)) };
}
test('Student scan does not depend on configured policy term and prevents simultaneous duplicate actions', async () => {
  const view = scanner(); const scan = view.render(); await scan.upload();
  assert.deepEqual(view.calls, ['upload']);
  let release, count = 0;
  const action = scan.runAction(async () => { count++; await new Promise(resolve => release = resolve); });
  await scan.runAction(async () => count++); assert.equal(count, 1); release(); await action;
  assert.equal(view.render().busy, false); view.runtime.dispose();
});
test('scan fetch errors stay visible and refresh retries without losing the existing document', async () => {
  let fail = true; const view = scanner({ getStudentCorPreview: async () => { if (fail) throw new Error('Scan service unavailable'); return ready; } });
  view.render(); await new Promise(resolve => setImmediate(resolve));
  assert.match(view.render().error, /unavailable/); fail = false; view.render().refresh(); view.render();
  await new Promise(resolve => setImmediate(resolve)); assert.equal(view.render().preview.documentUrl, ready.documentUrl); view.runtime.dispose();
});
test('late scan response cannot overwrite a newly uploaded document', async () => {
  let respond; const view = scanner({ getStudentCorPreview: () => new Promise(resolve => respond = resolve) });
  const scan = view.render(); await scan.upload(); respond({ ...ready, documentUrl: 'old.pdf' });
  await new Promise(resolve => setImmediate(resolve)); assert.equal(view.render().preview, null); view.runtime.dispose();
});

test('upload displays its preview without automatically extracting information; explicit fetch and refresh remain available', async () => {
  let fetches = 0;
  const view = scanner({ getStudentCorPreview: async () => { fetches++; return null; } }, true, ready);
  const scan = view.render(); await new Promise(resolve => setImmediate(resolve));
  assert.equal(fetches, 1); await scan.upload();
  assert.equal(view.render().preview.documentUrl, ready.documentUrl); assert.equal(view.render().processing, false);
  await new Promise(resolve => setImmediate(resolve)); assert.equal(fetches, 2);
  assert.deepEqual(view.calls, ['upload']);
  await view.render().fetchInformation(); assert.deepEqual(view.calls, ['upload', 'fetch']);
  view.render(); await new Promise(resolve => setImmediate(resolve));
  view.render().refresh(); view.render(); await new Promise(resolve => setImmediate(resolve)); assert.equal(fetches, 4);
  view.runtime.dispose();
});

test('a stale refresh for another document cannot replace the current upload preview', async () => {
  const view = scanner({ getStudentCorPreview: async () => ({ ...ready, documentUrl: 'different.pdf' }) }, true, ready);
  await view.render().upload(); view.render(); await new Promise(resolve => setImmediate(resolve));
  assert.equal(view.render().preview.documentUrl, ready.documentUrl); view.runtime.dispose();
});

for (const term of [{ academicYear: '2025-2026', semester: '1st Semester' }, { academicYear: '2026-2027', semester: '2nd Semester' }]) {
  test(`COR confirmation rejects a mismatched configured term ${JSON.stringify(term)}`, async () => {
    const view = scanner({ getCurrentAcademicTerm: async () => term });
    view.render(); await new Promise(resolve => setImmediate(resolve));
    await assert.rejects(view.render().validateCurrentTerm(), /mismatch/);
    assert.equal(view.render().preview.status, 'Rejected');
    assert.equal(view.render().preview.canConfirm, false);
    assert.equal(view.render().preview.canConfirmSchedule, false);
    view.runtime.dispose();
  });
}
