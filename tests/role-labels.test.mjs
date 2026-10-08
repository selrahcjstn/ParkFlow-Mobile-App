import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

function load(path, mocks = {}) {
  const source = readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
  const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
  const exports = {};
  vm.runInNewContext(code, { exports, require(name) {
    if (name in mocks) return mocks[name];
    throw new Error('Unexpected import: ' + name);
  } });
  return exports;
}

test('registration shows Student, Faculty, University Staff without changing persisted IDs', () => {
  const { Roles } = load('constants/roles.ts');
  const { REGISTER_ROLE_OPTIONS } = load('constants/registerRoleOptions.ts', { './roles': { Roles } });
  assert.deepEqual(Array.from(REGISTER_ROLE_OPTIONS, role => role.label), ['Student', 'Faculty', 'University Staff']);
  assert.deepEqual(Array.from(REGISTER_ROLE_OPTIONS, role => role.value), ['1', '2', '3']);
});

test('profile distinguishes the canonical staff label from the legacy Faculty role code', () => {
  const source = readFileSync(new URL('../features/account/pages/ProfilePage.tsx', import.meta.url), 'utf8');
  const body = source.match(/const formatRole = \(role\?: string\) => \{([\s\S]*?)\n  \};/)[1];
  const formatRole = new Function('user', 'profileData', 'role', body);
  assert.equal(formatRole({ role: 'UniversityStaff' }, null), 'Faculty');
  assert.equal(formatRole({ role: 'University Staff' }, null), 'University Staff');
  assert.equal(formatRole({ role: 'NonAcademicPersonnel' }, null), 'University Staff');
  assert.equal(formatRole({ role: 'Student' }, null), 'Student');
});
