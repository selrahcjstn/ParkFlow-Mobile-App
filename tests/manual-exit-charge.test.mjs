import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import vm from "node:vm";
import ts from "typescript";
import { loadConfirmation } from "./helpers/action-confirmation.mjs";

const require = createRequire(import.meta.url);

test('fee-free exit events do not create a client-side charge or reload historical balances', () => {
  let exitListener;
  let state;
  const create = factory => {
    state = factory(next => { state = { ...state, ...next }; }, () => state);
    return { getState: () => state };
  };
  const storeCode = ts.transpileModule(readFileSync(new URL('../features/violation/store/violation.store.ts', import.meta.url), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const mocks = {
    zustand: { create },
    '@/services/signalr': {
      connection: { state: 'Connected' },
      registerExitResponseListener: listener => { exitListener = listener; return () => {}; },
      registerViolationListener: () => () => {}, registerPaymentProcessedListener: () => () => {},
    },
    '@microsoft/signalr': { HubConnectionState: { Connected: 'Connected', Disconnected: 'Disconnected' } },
    '@/features/user/store/vehicle.store': { useVehicleStore: { getState() { throw Error('Unexpected vehicle lookup'); } } },
    '@/features/history/store/history.store': {},
    '@/features/violation/services/violation.service': {},
    '@react-native-async-storage/async-storage': {},
  };
  const exports = {};
  vm.runInNewContext(storeCode, { exports, require: name => mocks[name], console });
  const unsubscribe = exports.useViolationStore.getState().initSignalRListener();
  exitListener({ settlementStatus: 'NotRequired', penaltyFee: 0 });
  exitListener({ SettlementStatus: 'NotRequired', PenaltyFee: 0 });
  assert.equal(state.activeViolation, null); assert.equal(state.violationCount, 0);
  unsubscribe();
});
const compiled = ts.transpileModule(readFileSync(new URL("../app/(guard)/manual-exit.tsx", import.meta.url), "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
}).outputText;
const ok = data => ({ isSuccess: true, data });
const visitorExit = {
  fullName: "Juan", plateNumber: "ABC123", brand: "Toyota", vehicleType: "Car",
  entryTime: "2026-10-10T00:00:00Z", exitTime: "2026-10-10T01:00:00Z",
  chargeAmount: 20, referenceNumber: "CHG-VISITOR", settlementStatus: "Pending",
};

function screen(options = {}) {
  const state = [], refs = [], calls = [], confirmations = [], dialogs = [];
  let stateIndex = 0, refIndex = 0;
  const record = async (name, value, response) => { calls.push({ name, value }); return typeof response === "function" ? response() : response; };
  const visitors = {
    lookupByPlate: plate => record("lookup", plate, options.lookup ?? ok({ lookupType: "Visitor", isVisitor: true })),
    exitVisitor: payload => record("visitorExit", payload, options.visitorExit ?? ok(visitorExit)),
  };
  const parking = { createManualExit: payload => record("registeredExit", payload, options.registeredExit) };
  const scan = { processPayment: payload => record("payment", payload, options.payment ?? ok({ settlementStatus: "Settled" })) };
  const exports = {};
  const react = {
    useState: initial => {
      const index = stateIndex++;
      if (!(index in state)) state[index] = typeof initial === "function" ? initial() : initial;
      return [state[index], next => { state[index] = typeof next === "function" ? next(state[index]) : next; }];
    },
    useRef: initial => { const index = refIndex++; return refs[index] ??= { current: initial }; },
    useCallback: callback => callback,
  };
  const show = (title, message, actions, settings) => dialogs.push({ title, message, actions, settings });
  const confirmation = loadConfirmation(react, show);
  vm.runInNewContext(compiled, { exports, require(name) {
    if (name === "react/jsx-runtime") return require(name);
    if (name === "react") return react;
    if (name === "@/hooks/useActionConfirmation") return confirmation;
    if (name === "@/services/app-dialog") return { appDialog: { show } };
    if (name === "react-native") return {
      ScrollView: "ScrollView", View: "View", Text: "Text", Alert: { alert: (...args) => confirmations.push(args) },
    };
    if (name === "expo-router") return { router: {}, useLocalSearchParams: () => ({ plateNumber: " abc123 " }) };
    if (name === "lucide-react-native") return { CheckCircle: "CheckCircle", LogOut: "LogOut", AlertOctagon: "AlertOctagon" };
    if (name === "@/components/layouts/SubScreenLayout") return { __esModule: true, default: "SubScreenLayout" };
    if (name === "@/components/layouts") return { ScanResultLayout: "ScanResultLayout" };
    if (name === "@/components/ui") return { AppInput: "AppInput", AppButton: "AppButton" };
    if (name === "@/components/shared") return { AlertModal: "AlertModal" };
    if (name === "@/hooks/useAppTheme") return { useAppTheme: () => ({ colors: {} }) };
    if (name === "@/features/auth/store/auth.store") return { useAuthStore: () => ({ user: { id: "guard" } }) };
    if (name === "@/hooks/useApiRequest") return { useApiMutation: run => ({ run, isLoading: false }) };
    if (name === "@/features/session/services/parking-log.service") return { parkingLogService: parking };
    if (name === "@/features/session/services/visitor.service") return { visitorService: visitors };
    if (name === "@/features/qr/services/scan.service") return { scanService: scan };
    if (name === "@/features/session/store/parking-session.store") return { useParkingSessionStore: () => ({ getParkingSessionStats: () => {}, getActiveSession: () => {} }) };
    if (name === "@/utils/formatDataAndTime") return { formatDateAndTime: value => value };
    if (name === "@/utils/formatParkingValues") return { formatHours: value => `${value}h`, formatPenaltyFee: value => `₱${Number(value).toFixed(2)}` };
    throw new Error("Unexpected import: " + name);
  } });
  function render() {
    stateIndex = 0; refIndex = 0;
    const root = exports.default(), nodes = [];
    function walk(node) {
      if (Array.isArray(node)) return node.forEach(walk);
      if (node && typeof node === "object" && node.props) { nodes.push(node); walk(node.props.children); }
    }
    walk(root);
    return { root, nodes, find: type => nodes.find(n => n.type === type)?.props };
  }
  const review = async () => render().find("AppButton").onPress();
  return { render, calls, confirmations, dialogs, review, submit: async () => {
    await review();
    await dialogs.at(-1)?.actions?.[1]?.onPress();
  } };
}

test("visitor exit confirms operational timestamps without charge or settlement rows", async () => {
  const view = screen();
  assert.equal(view.render().find("AppInput").value, " abc123 ");
  await view.submit();
  const result = view.render().root.props;
  assert.equal(result.footerLabel, "Done");
  assert.match(result.footerMessage, /recorded successfully/);
  assert.doesNotMatch(result.footerMessage, /charge|payment|Collections/i);
  assert.equal(result.statusTitle, "Exit Recorded");
  assert.ok(!result.sessionRows.some(row => row.label === "Penalty Fee"));
  assert.deepEqual(view.calls.map(c => c.name), ["lookup", "visitorExit"]);
  assert.equal(view.calls[0].value, "ABC123");
});

test("registered manual exit retains overstay tracking without a charge", async () => {
  const view = screen({ lookup: ok({ lookupType: "Registered", isRegistered: true }),
    registeredExit: ok({ ...visitorExit, firstName: "Student", lastName: "One", penaltyFee: 120, overstayTime: 24, referenceNumber: "VIO-STUDENT" }) });
  await view.submit();
  assert.ok(!view.render().root.props.sessionRows.some(row => /charge|payment|fee/i.test(row.label)));
  assert.deepEqual(view.calls.map(c => c.name), ["lookup", "registeredExit"]);
});

test("guard finishes an exit without submitting a payment", async () => {
  const view = screen({ visitorExit: ok({ ...visitorExit, chargeAmount: 35 }) });
  await view.submit();
  const result = view.render().root.props;
  assert.equal(result.footerLabel, "Done");
  view.render().root.props.onFooterPress();
  assert.equal(view.calls.filter(c => c.name === "payment").length, 0);
  assert.equal(view.confirmations.length, 0);
  assert.equal(view.render().root.type, "SubScreenLayout");
  assert.equal(view.render().find("AppInput").value, "");
});

test("Process Exit uses the existing primary theme rather than the danger color", () => {
  const button = screen().render().find("AppButton");
  assert.equal(button.label, "Process Exit");
  assert.equal(button.variant, "primary");
  assert.equal(button.uppercase, false);
});

test("already settled and free exits do not offer a second collection", async () => {
  for (const data of [{ ...visitorExit, settlementStatus: "Settled" }, { ...visitorExit, chargeAmount: 0 }]) {
    const view = screen({ visitorExit: ok(data) });
    await view.submit();
    assert.equal(view.render().root.props.footerLabel, "Done");
    assert.doesNotMatch(view.render().root.props.statusTitle, /Charge Due/);
    view.render().root.props.onFooterPress();
    assert.equal(view.calls.filter(c => c.name === "payment").length, 0);
  }
});

test("visitor exit does not require charge data", async () => {
  const view = screen({ visitorExit: ok({ fullName: "Juan", plateNumber: "ABC123" }) });
  await view.submit();
  assert.equal(view.render().root.type, "ScanResultLayout");
  assert.equal(view.calls.filter(c => c.name === "payment").length, 0);
});

test("a lookup or registered exit error never falls through to a visitor exit", async () => {
  const lookupFailed = screen({ lookup: { isSuccess: false, message: "Could not reach ParkFlow" } });
  await lookupFailed.submit();
  assert.deepEqual(lookupFailed.calls.map(c => c.name), ["lookup"]);
  const registeredFailed = screen({ lookup: ok({ isRegistered: true }), registeredExit: { isSuccess: false, message: "No active session" } });
  await registeredFailed.submit();
  assert.deepEqual(registeredFailed.calls.map(c => c.name), ["lookup", "registeredExit"]);
});

test("double taps do not submit two exits; finishing never submits a payment", async () => {
  const view = screen();
  const onPress = view.render().find("AppButton").onPress;
  await Promise.all([onPress(), onPress()]);
  assert.equal(view.dialogs.length, 1);
  const confirm = view.dialogs[0].actions[1].onPress;
  await Promise.all([confirm(), confirm()]);
  assert.equal(view.calls.filter(c => c.name === "visitorExit").length, 1);
  const done = view.render().root.props.onFooterPress;
  done();
  done();
  assert.equal(view.calls.filter(c => c.name === "payment").length, 0);
  assert.equal(view.confirmations.length, 0);
});

test("exit lookup is read-only until the matched plate and driver are confirmed", async () => {
  const view = screen({ lookup: ok({ lookupType: "Visitor", fullName: "Juan", brand: "Toyota", entryTime: "Yesterday" }) });
  await view.review();
  assert.deepEqual(view.calls.map(call => call.name), ["lookup"]);
  assert.match(view.dialogs[0].message, /ABC123/); assert.match(view.dialogs[0].message, /Juan/);
  assert.match(view.dialogs[0].message, /Confirm the vehicle and driver/);
  view.dialogs[0].actions[0].onPress();
  await view.dialogs[0].actions[1].onPress();
  assert.deepEqual(view.calls.map(call => call.name), ["lookup"]);
  assert.equal(view.render().find("AppInput").value, " abc123 ");
});

test("changing a plate invalidates a pending manual-exit confirmation", async () => {
  const view = screen();
  await view.review();
  view.render().find("AppInput").onChangeText("OTHER123");
  await view.dialogs[0].actions[1].onPress();
  assert.deepEqual(view.calls.map(call => call.name), ["lookup"]);
  assert.equal(view.dialogs.at(-1).title, "Search again");
});
