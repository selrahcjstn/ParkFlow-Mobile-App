import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import vm from "node:vm";
import ts from "typescript";

const require = createRequire(import.meta.url);
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
  const state = [], refs = [], calls = [], confirmations = [];
  let stateIndex = 0, refIndex = 0;
  const record = async (name, value, response) => { calls.push({ name, value }); return typeof response === "function" ? response() : response; };
  const visitors = {
    lookupByPlate: plate => record("lookup", plate, options.lookup ?? ok({ lookupType: "Visitor", isVisitor: true })),
    exitVisitor: payload => record("visitorExit", payload, options.visitorExit ?? ok(visitorExit)),
  };
  const parking = { createManualExit: payload => record("registeredExit", payload, options.registeredExit) };
  const scan = { processPayment: payload => record("payment", payload, options.payment ?? ok({ settlementStatus: "Settled" })) };
  const exports = {};
  vm.runInNewContext(compiled, { exports, require(name) {
    if (name === "react/jsx-runtime") return require(name);
    if (name === "react") return {
      useState: initial => {
        const index = stateIndex++;
        if (!(index in state)) state[index] = typeof initial === "function" ? initial() : initial;
        return [state[index], next => { state[index] = typeof next === "function" ? next(state[index]) : next; }];
      },
      useRef: initial => { const index = refIndex++; return refs[index] ??= { current: initial }; },
    };
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
  return { render, calls, confirmations, submit: async () => render().find("AppButton").onPress() };
}

test("visitor exit displays the server's charge and reference, never a fake zero or penalty label", async () => {
  const view = screen();
  assert.equal(view.render().find("AppInput").value, " abc123 ");
  await view.submit();
  const result = view.render().root.props;
  assert.equal(result.sessionRows.find(row => row.label === "Charge").value, "₱20.00");
  assert.equal(result.sessionRows.find(row => row.label === "Charge Reference").value, "CHG-VISITOR");
  assert.equal(result.sessionRows.find(row => row.label === "Payment Status").value, "Unpaid");
  assert.equal(result.footerLabel, "Done");
  assert.match(result.footerMessage, /unpaid in Collections/);
  assert.match(result.footerMessage, /Guards do not collect cash/);
  assert.match(result.statusTitle, /Charge Due/);
  assert.ok(!result.sessionRows.some(row => row.label === "Penalty Fee"));
  assert.deepEqual(view.calls.map(c => c.name), ["lookup", "visitorExit"]);
  assert.equal(view.calls[0].value, "ABC123");
});

test("registered paid manual entry uses the registered exit amount, including overstay", async () => {
  const view = screen({ lookup: ok({ lookupType: "Registered", isRegistered: true }),
    registeredExit: ok({ ...visitorExit, firstName: "Student", lastName: "One", penaltyFee: 120, overstayTime: 24, referenceNumber: "VIO-STUDENT" }) });
  await view.submit();
  assert.equal(view.render().root.props.sessionRows.find(row => row.label === "Charge").value, "₱120.00");
  assert.deepEqual(view.calls.map(c => c.name), ["lookup", "registeredExit"]);
});

test("guard finishes the exit without collecting cash or clearing the recorded charge", async () => {
  const view = screen({ visitorExit: ok({ ...visitorExit, chargeAmount: 35 }) });
  await view.submit();
  const result = view.render().root.props;
  assert.equal(result.sessionRows.find(row => row.label === "Charge").value, "₱35.00");
  assert.equal(result.sessionRows.find(row => row.label === "Payment Status").value, "Unpaid");
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
    if (data.settlementStatus === "Settled") {
      assert.equal(view.render().root.props.sessionRows.find(row => row.label === "Charge Paid").value, "₱20.00");
    }
    view.render().root.props.onFooterPress();
    assert.equal(view.calls.filter(c => c.name === "payment").length, 0);
  }
});

test("old visitor API without charge data is not displayed as a free exit", async () => {
  const view = screen({ visitorExit: ok({ fullName: "Juan", plateNumber: "ABC123" }) });
  await view.submit();
  assert.equal(view.render().root.type, "SubScreenLayout");
  assert.match(view.render().find("AlertModal").message, /charge details are unavailable/);
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
  assert.equal(view.calls.filter(c => c.name === "visitorExit").length, 1);
  const done = view.render().root.props.onFooterPress;
  done();
  done();
  assert.equal(view.calls.filter(c => c.name === "payment").length, 0);
  assert.equal(view.confirmations.length, 0);
});
