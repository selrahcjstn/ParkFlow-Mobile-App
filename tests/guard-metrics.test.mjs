import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import vm from 'node:vm';
import ts from 'typescript';

const require = createRequire(import.meta.url);
function load(path, mocks) {
  const source = readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
  const compiled = ts.transpileModule(source, { compilerOptions: {
    module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX,
  } }).outputText;
  const exports = {};
  vm.runInNewContext(compiled, { exports, Date, require(name) {
    if (name in mocks) return mocks[name];
    if (name === 'react' || name === 'react/jsx-runtime') return require(name);
    throw new Error('Unexpected import: ' + name);
  } });
  return exports;
}
function store(request) {
  return load('features/session/store/parking-session.store.ts', {
    zustand: { create(initializer) {
      let state;
      const getState = () => state;
      const setState = change => { state = { ...state, ...change }; };
      state = initializer(setState, getState);
      return { getState, setState };
    } },
    '@/features/session/services/parking-log.service': { parkingLogService: { getParkingSessionStats: request } },
  }).useParkingSessionStore;
}
const counts = { activeSessionCount: 12, overstayCount: 3, maximumCapacity: 300, manualSessionCount: 2 };

for (const throws of [false, true]) {
  test(`failed refresh (${throws ? 'network error' : 'unsuccessful response'}) preserves successful counts`, async () => {
    let fail = false;
    const metrics = store(async () => {
      if (fail && throws) throw new Error('Server unavailable');
      return fail ? { isSuccess: false, message: 'Server unavailable' } : { isSuccess: true, data: counts };
    });
    await metrics.getState().getParkingSessionStats(true);
    const timestamp = metrics.getState().statsLastFetched;
    fail = true;
    assert.equal((await metrics.getState().getParkingSessionStats(true)).isSuccess, false);
    assert.equal(metrics.getState().parkingSessionStats, counts);
    assert.equal(metrics.getState().statsLastFetched, timestamp);
    assert.equal(metrics.getState().statsError, 'Server unavailable');
    assert.equal(metrics.getState().statsLoading, false);
    fail = false;
    await metrics.getState().getParkingSessionStats(true);
    assert.equal(metrics.getState().statsError, null);
  });
}

test('first failed load remains unavailable rather than inventing zero counts', async () => {
  const metrics = store(async () => { throw new Error('Offline'); });
  await metrics.getState().getParkingSessionStats(true);
  assert.equal(metrics.getState().parkingSessionStats, null);
  assert.equal(metrics.getState().statsLastFetched, null);
  assert.equal(metrics.getState().statsError, 'Offline');
  const home = readFileSync(new URL('../features/guard/pages/GuardHomePage.tsx', import.meta.url), 'utf8');
  assert.match(home, /overstayCount: parkingSessionStats\?\.overstayCount \?\? null/);
  assert.match(home, /Could not load parking counts/);
  assert.match(home, /Showing the last available counts/);
});

test('real zero counts are successful data', async () => {
  const metrics = store(async () => ({ isSuccess: true, result: { ...counts, overstayCount: 0 } }));
  assert.equal((await metrics.getState().getParkingSessionStats()).isSuccess, true);
  assert.equal(metrics.getState().parkingSessionStats.overstayCount, 0);
  assert.equal(metrics.getState().statsError, null);
});

function textOf(node) {
  if (Array.isArray(node)) return node.map(textOf).join(' ');
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  return node?.props ? textOf(node.props.children) : '';
}
test('metric UI distinguishes unavailable counts from zero and shows the server overstay count', () => {
  const { default: Metrics } = load('features/guard/components/GuardOverviewMetrics.tsx', {
    'react-native': { View: 'View', Text: 'Text' },
    '@/components/ui/MotorcycleIcon': { MotorcycleIcon: 'Icon' },
    '@/components/ui/Skeleton': { GuardOverviewMetricsSkeleton: 'Skeleton' },
    '@/hooks/useAppTheme': { useAppTheme: () => ({ colors: {} }) },
    'lucide-react-native': { ClockAlert: 'Icon', CalendarDays: 'Icon' },
  });
  const data = { totalParked: null, totalSlots: null, reservedTodayCount: null, overstayCount: null };
  const unknown = textOf(Metrics({ data }));
  assert.match(unknown, /—/);
  assert.doesNotMatch(unknown, /null|0/);
  assert.match(textOf(Metrics({ data: { ...data, overstayCount: 0 } })), /0 Overstaying/);
  assert.match(textOf(Metrics({ data: { ...data, overstayCount: 3 } })), /3 Overstaying/);
});
