import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import vm from 'node:vm';
import ts from 'typescript';

const require = createRequire(import.meta.url);
function load(path, overrides = {}) {
  const source = readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
  const code = ts.transpileModule(source, { compilerOptions: {
    module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX,
  } }).outputText;
  const exports = {};
  vm.runInNewContext(code, { exports, Date, URLSearchParams, console, require(name) {
    if (name in overrides) return overrides[name];
    if (name === 'react/jsx-runtime' || name === 'react') return require(name);
    if (name === 'react-native') return { View: 'View', Text: 'Text' };
    if (name === '@/hooks/useAppTheme') return { useAppTheme: () => ({ colors: {} }) };
    if (name.includes('Skeleton')) return { SessionListItemSkeleton: 'Skeleton' };
    if (name.includes('signalr') || name.includes('react-query') || name === 'expo-router') return {};
    return { __esModule: true, default: 'Button' };
  } });
  return exports;
}
function textOf(node) {
  if (Array.isArray(node)) return node.map(textOf).join(' ');
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  return node?.props ? textOf(node.props.children) : '';
}

test('concluded reflects completed records, not simply elapsed reservation hours', () => {
  const { reservationProgress, default: List } = load('features/guard/components/TodayReservationList.tsx');
  assert.equal(reservationProgress(4), 'Concluded');
  assert.equal(reservationProgress('Completed'), 'Concluded');
  assert.equal(reservationProgress(1), 'Not concluded');
  const output = textOf(List({ items: [
    { id: 'a', userFullName: 'Guard Guest', plateNumber: 'ABC123', startTime: '05:00:00', endTime: '09:00:00', status: 1 },
    { id: 'b', userFullName: 'Completed Guest', startTime: '13:30:00', endTime: '21:00:00', status: 4 },
  ], loading: false, error: false, onRetry() {} }));
  assert.match(output, /ABC123/);
  assert.match(output, /5:00 AM\s+–\s+9:00 AM/);
  assert.match(output, /1:30 PM\s+–\s+9:00 PM/);
  assert.match(output, /Not concluded/);
  assert.match(output, /Concluded/);
});

test('reservation fetch errors are distinguishable from an empty list', () => {
  const { default: List } = load('features/guard/components/TodayReservationList.tsx');
  const props = { items: [], loading: false, onRetry() {} };
  assert.match(textOf(List({ ...props, error: true })), /Could not load/);
  assert.doesNotMatch(textOf(List({ ...props, error: true })), /No reservations/);
  assert.match(textOf(List({ ...props, error: false })), /No reservations to show/);
});

test('campus date rolls over at midnight in the Philippines regardless of device timezone', () => {
  const { getCampusDate } = load('features/guard/hooks/useTodayReservations.ts', {
    '@/features/schedule/services/reservation.service': {},
  });
  assert.equal(getCampusDate(new Date('2026-10-07T15:59:59Z')), '2026-10-07');
  assert.equal(getCampusDate(new Date('2026-10-07T16:00:00Z')), '2026-10-08');
});

test('guard service requests one page and encodes search safely', async () => {
  let request;
  const { ReservationService } = load('features/schedule/services/reservation.service.ts', {
    '@/services/common.service': { apiRequest: async (...args) => { request = args; return { isSuccess: true }; } },
  });
  await ReservationService.getTodayForGuard(2, 'A&B #1');
  assert.equal(request[1], '/parking-reservations/guard/today?page=2&search=A%26B%20%231');
  assert.equal(request[3].handleNetworkErrorLocally, true);
});

test('dashboard stops fetching the active-session list; full-page search resets pagination', () => {
  const home = readFileSync(new URL('../features/guard/pages/GuardHomePage.tsx', import.meta.url), 'utf8');
  assert.doesNotMatch(home, /getActiveSession|ActiveParkingSessionList/);
  assert.match(home, /reservedTodayCount/);
  assert.match(home, /totalCount.*> 5 \? "View all"/);
  const page = readFileSync(new URL('../features/guard/pages/GuardReservationsPage.tsx', import.meta.url), 'utf8');
  assert.match(page, /search: search.trim\(\), page: 1/);
  assert.match(page, /Math.ceil\(count \/ 5\)/);
});

test('capacity notice shows allocated spaces inside total capacity and peak bookings', () => {
  const { default: Notice } = load('features/schedule/components/ReservationAvailabilityNotice.tsx');
  const data = { totalCapacity: 300, reservationCapacity: 90, bookedSlots: 35, availableSlots: 55 };
  const booking = textOf(Notice({ data }));
  assert.match(booking, /90\s+reservation spaces/);
  assert.match(booking, /out of\s+300\s+total spaces/);
  assert.match(booking, /55 spaces available/);
  assert.match(booking, /Pending and approved/);
  const guard = textOf(Notice({ data, daily: true }));
  assert.match(guard, /Peak bookings today/);
  assert.doesNotMatch(guard, /55 spaces available/);
  assert.match(textOf(Notice({ data: { ...data, availableSlots: 0 } })), /Fully booked/);
  const error = textOf(Notice({ data, error: true }));
  assert.match(error, /Could not check/);
  assert.doesNotMatch(error, /spaces available/);
});

test('availability service fetches counts for only the selected date and time range', async () => {
  let request;
  const { ReservationService } = load('features/schedule/services/reservation.service.ts', {
    '@/services/common.service': { apiRequest: async (...args) => { request = args; return { isSuccess: true }; } },
  });
  await ReservationService.getAvailability('2026-10-09', '10:00:00', '15:00:00');
  const query = new URL('http://localhost' + request[1]);
  assert.equal(query.pathname, '/parking-reservations/availability');
  assert.equal(query.searchParams.get('date'), '2026-10-09');
  assert.equal(query.searchParams.get('startTime'), '10:00:00');
  assert.equal(query.searchParams.get('endTime'), '15:00:00');
});

test('booking blocks unknown or full capacity and displays counts after submission', () => {
  const source = readFileSync(new URL('../features/account/pages/SchedulePage.tsx', import.meta.url), 'utf8');
  assert.match(source, /availability.isPending \|\| availability.isError/);
  assert.match(source, /availability.data.availableSlots === 0/);
  assert.match(source, /storeSubmitting \|\| capacityUnavailable/);
  assert.match(source, /res.data\?\.availability/);
  assert.match(source, /Peak bookings for this time range/);
  assert.match(source, /refetchInterval: focused && viewMode === "create"/);
  for (const page of ['GuardHomePage', 'GuardReservationsPage']) {
    const source = readFileSync(new URL(`../features/guard/pages/${page}.tsx`, import.meta.url), 'utf8');
    assert.match(source, /ReservationAvailabilityNotice daily data=\{reservations.data\?\.capacity\}/);
  }
});
