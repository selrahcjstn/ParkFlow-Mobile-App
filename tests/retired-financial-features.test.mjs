import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

function load(path, mocks) {
  const code = ts.transpileModule(readFileSync(new URL('../' + path, import.meta.url), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  const exports = {};
  vm.runInNewContext(code, { exports, console: { warn() {}, log() {}, error() {} }, setTimeout, clearTimeout,
    require(name) {
      if (name in mocks) return mocks[name];
      throw Error('Unexpected dependency: ' + name);
    },
  });
  return exports;
}

function create(factory) {
  let state;
  const get = () => state;
  const set = value => { state = { ...state, ...(typeof value === 'function' ? value(state) : value) }; };
  state = factory(set, get);
  return { getState: get };
}

test('history service and store preserve parking records and pagination without financial APIs', async () => {
  const requests = [];
  const items = Array.from({ length: 15 }, (_, i) => ({ plateNumber: `ABC${i}`, entryTime: `2026-10-28T0${i % 10}:00:00Z` }));
  const { historyService } = load('features/history/services/history.service.ts', {
    '@/services/common.service': { apiRequest: async (method, route) => {
      requests.push([method, route]);
      return { isSuccess: true, data: { items, generatedAt: '2026-10-28T12:00:00Z' } };
    } },
  });
  assert.deepEqual(Object.keys(historyService), ['getParkingHistory']);
  const { useHistoryStore } = load('features/history/store/history.store.ts', {
    zustand: { create }, '@/features/history/services/history.service': { historyService },
  });
  await useHistoryStore.getState().getParkingHistory();
  assert.equal(useHistoryStore.getState().parkingHistory.length, 15);
  assert.equal(useHistoryStore.getState().hasMore, true);
  await useHistoryStore.getState().loadMoreParkingHistory();
  assert.equal(useHistoryStore.getState().page, 3);
  assert.equal(useHistoryStore.getState().parkingHistory.length, 15); // duplicate rows remain deduplicated
  assert.deepEqual(requests, [['get', '/parking-history/page/1/15'], ['get', '/parking-history/page/2/15']]);
  assert.equal(typeof useHistoryStore.getState().markLogAsPaid, 'function');
});

function notifications({ offline = false } = {}) {
  const operational = { id: 'exit', type: 'approved', title: 'Parking Exit Successful', body: 'Vehicle exited.', actionRoute: '/(users)/(tabs)/history', isRead: false };
  const retired = [
    { ...operational, id: 'invoice', title: 'Invoice Issued', referenceCode: 'INV-001' },
    { ...operational, id: 'payment', type: 'payment', title: 'Processed' },
    { ...operational, id: 'route', actionRoute: '/(settings)/violations' },
    { ...operational, id: 'old-receipt', body: 'Parking charge: ₱20' },
  ];
  let saved = JSON.stringify([...retired, operational]);
  const { useNotificationStore } = load('features/notification/store/notification.store.ts', {
    zustand: { create }, 'react-native': { Platform: { OS: 'web' } },
    '@/services/storage': { __esModule: true, default: { getItemAsync: async () => saved, setItemAsync: async (_, data) => { saved = data; } } },
    '@/services/signalr': {}, 'expo-constants': { default: {}, ExecutionEnvironment: { StoreClient: 'store' } },
    '@/features/auth/store/auth.store': { useAuthStore: { getState: () => ({ user: { id: 'driver' } }) } },
    '@/features/notification/services/notification.service': { notificationService: {
      getMyNotifications: () => { if (offline) throw Error('Offline'); return Promise.resolve({ isSuccess: true, data: [...retired, operational] }); },
      getUnreadCount: async () => ({ isSuccess: true, data: 1 }),
    } },
  });
  return { store: useNotificationStore, saved: () => JSON.parse(saved) };
}

for (const offline of [false, true]) {
  test(`financial notifications remain in ${offline ? 'cached' : 'server'} results; operational exits remain`, async () => {
    const { store, saved } = notifications({ offline });
    await store.getState().fetchNotifications();
    assert.equal(store.getState().notifications.length, 5);
    assert.equal(saved().length, 5);
    await store.getState().addNotification({ type: 'system', title: 'Payment complete', body: 'Receipt' }, false);
    assert.equal(store.getState().notifications.length, 6);
  });
}

test('parking exit SignalR events retain reservation invalidation and scoped financial event subscriptions', () => {
  const handlers = new Map(), invalidations = [];
  let refreshed = 0;
  class HubConnectionBuilder {
    withUrl() { return this; }
    withAutomaticReconnect() { return this; }
    configureLogging() { return this; }
    build() { return { on: (event, listener) => handlers.set(event, listener) }; }
  }
  const { getConnection } = load('services/signalr.ts', {
    '@microsoft/signalr': { HubConnectionBuilder, LogLevel: { Warning: 1 } },
    './storage': { SecureStore: {} }, './apiConfig': { SERVER_BASE_URL: 'https://example.invalid', getApiConfigurationError: () => null },
    './queryClient': { queryClient: { invalidateQueries: args => invalidations.push(args.queryKey[0]) } },
    '@/features/schedule/store/reservation.store': { useReservationStore: { getState: () => ({ fetchMyReservations: async () => refreshed++ }) } },
  });
  getConnection();
  assert.ok(handlers.has('ExitResponse'));
  assert.ok(handlers.has('PaymentProcessed')); assert.ok(handlers.has('ViolationResponse'));
  handlers.get('ExitResponse')({ plateNumber: 'ABC123' });
  assert.ok(invalidations.includes('reservations'));
  assert.equal(refreshed, 1);
});
