import assert from 'node:assert/strict';
import test from 'node:test';
import { loadCor } from './helpers/cor-form.mjs';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import vm from 'node:vm';
import ts from 'typescript';

const require = createRequire(import.meta.url);
const code = ts.transpileModule(readFileSync(new URL('../features/account/components/schedule/ScheduleViewMode.tsx', import.meta.url), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
}).outputText;
const exports = {};
vm.runInNewContext(code, { exports, require(name) {
  if (name === 'react' || name === 'react/jsx-runtime') return require(name);
  if (name === 'react-native') return { Text: 'Text', View: 'View' };
  if (name === 'lucide-react-native') return new Proxy({}, { get: (_, key) => key });
  if (name === '@/features/auth/store/auth.store') return { useAuthStore: select => select({ user: { profileType: 'student' } }) };
  if (name === '@/hooks/useVerificationGuard') return { useVerificationGuard: () => ({ isApproved: true }) };
  if (name === '@/hooks/useAppTheme') return { useAppTheme: () => ({ colors: {}, isDark: false }) };
  if (name === '@/components/ui') return { AppButton: 'AppButton' };
  throw Error('Unexpected dependency: ' + name);
} });

function inspect(node) {
  const nodes = [], text = [];
  function visit(value) {
    if (Array.isArray(value)) return value.forEach(visit);
    if (typeof value === 'string' || typeof value === 'number') { text.push(value); return; }
    if (value?.props) { nodes.push(value); visit(value.props.children); }
  }
  visit(node);
  return { nodes, text: text.join(' ') };
}

for (const enabled of [true, false]) {
  test(`schedule view retains ${enabled ? 'enabled' : 'disabled'} exit grace and ignores legacy early-window values`, () => {
    let edits = 0;
    const view = inspect(exports.default({ mappedSchedules: [], activeCount: 2, onStartEditing: () => edits++,
      gracePeriod: { isGracePeriodEnabled: enabled, exitAfterMin: 7, isEarlyParkingAllowed: true, entryBeforeMin: 120 } }));
    assert.match(view.text, /Exit Grace Period/);
    assert.match(view.text, enabled ? /\+7m/ : /Off/);
    assert.doesNotMatch(view.text, /Early Entry|120m|-15m/);
    view.nodes.find(node => node.type === 'AppButton' && node.props.label === 'Update Schedule').props.onPress();
    assert.equal(edits, 1);
  });
}

for (const [exitBy, now, displayed, remaining] of [
  ['2026-10-28T02:15:00Z', '2026-10-28T01:00:00Z', '10:15 AM', '01:15:00'],
  ['2026-10-28T01:15:00Z', '2026-10-28T00:30:00Z', '9:15 AM', '00:45:00'],
  ['2026-10-28T16:10:00Z', '2026-10-28T15:55:00Z', '12:10 AM', '00:15:00'],
  ['N/A', '2026-10-28T01:00:00Z', 'N/A', '—'],
]) {
  test(`active mobile session preserves the server deadline ${exitBy} and displays Manila time safely`, async () => {
    const previousTimezone = process.env.TZ;
    process.env.TZ = 'Asia/Manila';
    try {
      const response = { isSuccess: true, data: { sessionId: 'session', startedAt: '2026-10-28T00:00:00Z', elapsedMinutes: 60, exitBy } };
      const service = loadCor('features/session/services/parking-log.service.ts', {
        '@/services/common.service': { apiRequest: async (method, route) => {
          assert.equal(method, 'get'); assert.equal(route, '/parking-logs/active/vehicle/vehicle'); return response;
        } },
      }).parkingLogService;
      assert.equal(await service.getActiveVehicleSession('vehicle'), response);
      class FixedDate extends Date { constructor(value) { super(value ?? now); } }
      const Timer = loadCor('features/user/components/ActiveSessionTimer.tsx', {
        react: { useState: initial => [initial, () => {}], useEffect() {} },
        'react-native': { View: 'View', Text: 'Text', TouchableOpacity: 'TouchableOpacity' },
        'lucide-react-native': { Clock: 'Clock', LogOut: 'LogOut' },
        '@/hooks/useAppTheme': { useAppTheme: () => ({ colors: {} }) },
        '@/utils/formatTime': loadCor('utils/formatTime.ts', {}, { Date: FixedDate }),
      }, { Date: FixedDate }).default;
      let exits = 0;
      const view = inspect(Timer({ ...response.data, onExitPress: () => exits++ }));
      assert.ok(view.text.includes(displayed), view.text);
      assert.ok(view.text.includes(remaining), view.text);
      assert.doesNotMatch(view.text, /NaN|Invalid Date/);
      assert.match(view.text, exitBy === 'N/A' ? /No exit deadline/ : /Time Remaining/);
      view.nodes.find(node => node.type === 'TouchableOpacity').props.onPress();
      assert.equal(exits, 1);
    } finally {
      if (previousTimezone === undefined) delete process.env.TZ; else process.env.TZ = previousTimezone;
    }
  });
}
