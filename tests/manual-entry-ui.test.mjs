import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import vm from "node:vm";
import ts from "typescript";

const require = createRequire(import.meta.url);
const source = readFileSync(new URL("../app/(guard)/manual-input.tsx", import.meta.url), "utf8");
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
}).outputText;

function screen(record = null, searching = false) {
  const state = [{ plateNumber: "ABC123", fullName: "", phoneNumber: "", vehicleType: "", brand: "" }, {},
    { visible: false }, searching, record, Boolean(record)];
  let index = 0;
  const exports = {};
  vm.runInNewContext(compiled, { exports, URLSearchParams, setTimeout, clearTimeout, require(name) {
    if (name === "react/jsx-runtime") return require(name);
    if (name === "react") return {
      useState: () => [state[index++], () => {}], useRef: value => ({ current: value }),
      useCallback: fn => fn, useEffect: () => {},
    };
    if (name === "react-native") return {
      ScrollView: "ScrollView", View: "View", Text: "Text", ActivityIndicator: "ActivityIndicator",
      KeyboardAvoidingView: "KeyboardAvoidingView", Platform: { OS: "ios" }, Alert: {},
    };
    if (name === "react-native-safe-area-context") return { useSafeAreaInsets: () => ({ bottom: 34 }) };
    if (name === "lucide-react-native") return { ShieldCheck: "ShieldCheck", Clock: "Clock", UserCheck: "UserCheck" };
    if (name === "expo-router") return { router: {} };
    if (name === "@/components/layouts/SubScreenLayout") return { default: "SubScreenLayout" };
    if (name === "@/components/ui") return { AppInput: "AppInput", AppSelect: "AppSelect", AppButton: "AppButton" };
    if (name === "@/components/shared") return { AlertModal: "AlertModal" };
    if (name === "@/hooks/useAppTheme") return { useAppTheme: () => ({ colors: { primary: "theme-primary", accent: "theme-accent" } }) };
    if (name === "@/features/auth/store/auth.store") return { useAuthStore: () => ({ user: { id: "guard" } }) };
    if (name === "@/hooks/useApiRequest") return { useApiMutation: () => ({ run: () => {}, isLoading: false }) };
    if (name === "@/features/session/services/parking-log.service") return { parkingLogService: {} };
    if (name === "@/features/session/services/visitor.service") return { visitorService: {} };
    if (name === "@/features/session/store/parking-session.store") return { useParkingSessionStore: () => ({}) };
    if (name === "@/constants/vehicleType") return { VEHICLE_TYPE_OPTIONS: [] };
    if (name === "@/utils/formatTime") return { formatTime: () => "10:00 AM" };
    if (name === "@/utils/manualLookupError") return { getManualLookupError: () => "Error" };
    throw new Error("Unexpected import: " + name);
  } });
  const nodes = [];
  function walk(node) {
    if (Array.isArray(node)) return node.forEach(walk);
    if (node && typeof node === "object" && node.props) { nodes.push(node); walk(node.props.children); }
  }
  walk(exports.default());
  return { nodes, text: nodes.filter(n => n.type === "Text").map(n => n.props.children).flat().join(" ") };
}

test("returning visitor gets saved details and one record-entry action, not new-visitor fields", () => {
  const view = screen({ lookupType: "Visitor", isVisitor: true, fullName: "Juan", plateNumber: "ABC123" });
  assert.match(view.text, /Returning visitor/);
  assert.match(view.text, /No need to enter them again/);
  assert.match(view.text, /Juan/);
  assert.equal(view.nodes.filter(n => n.type === "AppInput").length, 1);
  assert.equal(view.nodes.find(n => n.type === "AppButton").props.label, "Record entry");
});
test("inside registered vehicle offers exit rather than another entry", () => {
  const view = screen({ lookupType: "Registered", isRegistered: true, isInside: true, entryTime: "now" });
  assert.match(view.text, /Already on campus/);
  assert.equal(view.nodes.find(n => n.type === "AppButton").props.label, "Record exit");
});
test("new visitor keeps existing name, contact, type and brand fields", () => {
  const view = screen({ lookupType: "Unknown" });
  assert.match(view.text, /New visitor/);
  assert.deepEqual(view.nodes.filter(n => n.type === "AppInput").map(n => n.props.label),
    ["Plate number", "Visitor name (optional)", "Contact number (optional)", "Brand / model"]);
  assert.equal(view.nodes.find(n => n.type === "AppSelect").props.label, "Vehicle type");
});
test("searching hides stale record actions and respects bottom safe area", () => {
  const view = screen({ lookupType: "Visitor", isVisitor: true }, true);
  assert.match(view.text, /Searching vehicle and visitor records/);
  assert.equal(view.nodes.filter(n => n.type === "AppButton").length, 0);
  assert.equal(view.nodes.find(n => n.type === "ScrollView").props.contentContainerStyle.paddingBottom, 54);
});
