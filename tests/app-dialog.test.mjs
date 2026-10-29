import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync, readdirSync } from "node:fs";
import { createRequire } from "node:module";
import vm from "node:vm";
import ts from "typescript";

const require = createRequire(import.meta.url);
const tokens = require("../tailwind.config.js").theme.extend.colors;
const tick = () => new Promise(resolve => setImmediate(resolve));
function load(path, overrides = {}, globals = {}) {
  const source = readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
  const code = ts.transpileModule(source, { compilerOptions: {
    module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX,
  } }).outputText;
  const exports = {};
  vm.runInNewContext(code, { exports, console, Error, URLSearchParams, setTimeout, clearTimeout, ...globals, require(name) {
    if (name in overrides) return overrides[name];
    if (name === "react/jsx-runtime" || name === "zustand") return require(name);
    if (name === "react") return { forwardRef: fn => fn, useMemo: fn => fn(), useCallback: fn => fn, useEffect() {} };
    if (name === "react-native") return Object.fromEntries(["View", "Text", "Modal", "Pressable", "ScrollView", "TouchableOpacity", "TextInput", "ActivityIndicator", "KeyboardAvoidingView"].map(name => [name, name]).concat([["Platform", { OS: "android" }], ["Animated", { View: "AnimatedView" }]]));
    if (name === "@/hooks/useAppTheme") return { useAppTheme: () => ({ colors: tokens.light }) };
    if (name === "@/components/shared/AppDialog" || name === "./AppDialog") return { __esModule: true, default: "AppDialog" };
    if (name === "@/components/shared") return { AppBottomSheet: "AppBottomSheet", AlertModal: "AlertModal" };
    if (name === "lucide-react-native") return { CheckCircle: "CheckCircle", XCircle: "XCircle", AlertTriangle: "AlertTriangle", Info: "Info", HelpCircle: "HelpCircle" };
    if (name === "@/constants/vehicleType") return { VEHICLE_TYPE_OPTIONS: [] };
    return { __esModule: true, default: name };
  } });
  return exports;
}
function nodesOf(root) {
  const nodes = [];
  function visit(value) {
    if (Array.isArray(value)) return value.forEach(visit);
    if (value?.props) { nodes.push(value); visit(value.props.children); }
  }
  visit(root);
  return nodes;
}

function dialog(props = {}, dimensions = { width: 390, height: 800, fontScale: 1 }, dark = false) {
  const state = [], refs = [], effects = [], animations = [];
  let si = 0, ri = 0, ei = 0, dirty = false, pending = [];
  const React = {
    useState(initial) {
      const i = si++;
      if (!(i in state)) state[i] = typeof initial === "function" ? initial() : initial;
      return [state[i], next => { const value = typeof next === "function" ? next(state[i]) : next; if (!Object.is(value, state[i])) { state[i] = value; dirty = true; } }];
    },
    useRef(initial) { const i = ri++; return refs[i] ??= { current: initial }; },
    useEffect(fn, deps) {
      const i = ei++, old = effects[i];
      if (!old || deps.some((dep, index) => !Object.is(dep, old.deps[index]))) {
        pending.push(() => { old?.cleanup?.(); effects[i] = { deps, cleanup: fn() }; });
      }
    },
  };
  const native = {
    Modal: "Modal", View: "View", Pressable: "Pressable", Text: "Text", ScrollView: "ScrollView",
    useWindowDimensions: () => dimensions,
    AccessibilityInfo: { isReduceMotionEnabled: async () => false, announceForAccessibility() {} },
    Animated: { View: "AnimatedView", Value: class { interpolate(value) { return value; } stopAnimation() {} },
      timing(_value, config) { return { start(callback) { animations.push({ config, callback }); } }; } },
  };
  const Component = load("components/shared/AppDialog.tsx", {
    react: React, "react-native": native,
    "react-native-safe-area-context": { useSafeAreaInsets: () => ({ top: 24, bottom: 16 }) },
    "@/components/ui/AppButton": { __esModule: true, default: "Button" },
    "@/hooks/useAppTheme": { useAppTheme: () => ({ colors: dark ? tokens.dark : tokens.light }) },
  }).default;
  let current = { visible: true, title: "Title", message: "Message", actions: [{ text: "OK" }], onClose() {}, ...props };
  function render(update = {}) {
    current = { ...current, ...update };
    let root;
    for (let i = 0; i < 20; i++) {
      dirty = false; si = 0; ri = 0; ei = 0; pending = [];
      root = Component(current);
      pending.forEach(fn => fn());
      if (!dirty) return { root, nodes: nodesOf(root), buttons: nodesOf(root).filter(n => n.type === "Button") };
    }
    throw new Error("Unstable render");
  }
  return { render, animations, finishClose: () => animations.findLast(a => a.config.toValue === 0)?.callback?.({ finished: true }) };
}

test("success/error/warning/information/confirmation share themed icons and touch targets", () => {
  for (const [variant, icon] of Object.entries({ success: "CheckCircle", error: "XCircle", warning: "AlertTriangle", info: "Info", confirmation: "HelpCircle" })) {
    const view = dialog({ variant }).render();
    assert.ok(view.nodes.some(n => n.type === icon));
    assert.match(view.buttons[0].props.className, /min-h-\[48px\]/);
    assert.equal(view.buttons[0].props.uppercase, false);
    assert.equal(view.nodes.find(n => n.props.accessibilityRole === "header").props.children, "Title");
  }
  const custom = { type: "CustomIcon", props: {} };
  assert.ok(dialog({ icon: custom }).render().nodes.includes(custom));
});

test("destructive confirmations block Back/backdrop but preserve explicit Cancel and Delete", async () => {
  let cancelled = 0, deleted = 0;
  const view = dialog({ actions: [{ text: "Cancel", style: "cancel", onPress: () => cancelled++ }, { text: "Delete", style: "destructive", onPress: () => deleted++ }] });
  const initial = view.render();
  initial.root.props.onRequestClose();
  initial.nodes.find(n => n.type === "Pressable").props.onPress();
  assert.equal(cancelled + deleted, 0);
  assert.equal(initial.buttons[1].props.variant, "danger");
  initial.buttons[0].props.onPress();
  await tick();
  assert.equal(cancelled, 1); assert.equal(deleted, 0);
});

test("dismissible dialogs use the same safe path for Back/backdrop without invoking confirmation", async () => {
  let closed = 0, dismissed = 0, confirmed = 0;
  const view = dialog({ dismissible: true, onClose: () => closed++, onDismiss: () => dismissed++, actions: [{ text: "Confirm", onPress: () => confirmed++ }] });
  view.render().root.props.onRequestClose();
  await tick();
  assert.equal(closed, 1); assert.equal(dismissed, 1); assert.equal(confirmed, 0);
});

test("async actions prevent double taps and dismissal; closing waits until the operation finishes", async () => {
  let resolve, calls = 0, closed = 0;
  const pending = new Promise(done => { resolve = done; });
  const view = dialog({ actions: [{ text: "Confirm", onPress: () => { calls++; return pending; } }], onClose: () => closed++ });
  const button = view.render().buttons[0];
  button.props.onPress(); button.props.onPress();
  let busy = view.render({ visible: false });
  assert.equal(busy.root.props.visible, true);
  assert.equal(busy.buttons[0].props.loading, true);
  busy.root.props.onRequestClose();
  assert.equal(calls, 1); assert.equal(closed, 0);
  resolve(); await tick();
  view.render();
  assert.equal(closed, 1);
  assert.equal(view.animations.at(-1).config.toValue, 0);
  view.finishClose();
  assert.equal(view.render().root.props.visible, false);
});

test("a failed async action stays visible with an error and supports Retry", async () => {
  let calls = 0, closed = 0;
  const view = dialog({ actions: [{ text: "Retry", onPress: async () => { if (++calls === 1) throw new Error("Connection interrupted"); } }], onClose: () => closed++ });
  view.render().buttons[0].props.onPress(); await tick();
  const failed = view.render();
  assert.ok(failed.nodes.some(n => n.props.children === "Connection interrupted"));
  assert.equal(failed.buttons[0].props.disabled, undefined);
  assert.equal(closed, 0);
  failed.buttons[0].props.onPress(); await tick();
  assert.equal(calls, 2); assert.equal(closed, 1);
});

test("small phones, landscape, large text and tablets constrain and scroll content", () => {
  for (const dimensions of [{ width: 320, height: 480, fontScale: 1 }, { width: 800, height: 360, fontScale: 1.4 }, { width: 1024, height: 768, fontScale: 1 }]) {
    const view = dialog({ message: "Long message ".repeat(200), actions: [{ text: "Cancel", style: "cancel" }, { text: "Confirm" }] }, dimensions, true).render();
    const card = view.nodes.find(n => n.props.accessibilityViewIsModal);
    assert.equal(card.props.style.width, Math.min(dimensions.width - 32, 440));
    assert.ok(card.props.style.maxHeight <= dimensions.height - 40);
    assert.ok(view.nodes.some(n => n.type === "ScrollView"));
    assert.equal(view.buttons[0].props.className.includes("flex-1"), dimensions.width >= 360 && dimensions.fontScale <= 1.2);
  }
  assert.equal(dialog({ visible: false, loading: true }).render().root.props.visible, false);
});

test("notices queue without loss and the next notice waits for closing animation", () => {
  const service = load("services/app-dialog.ts");
  const { appDialog, useDialogStore } = service;
  const firstAction = () => {};
  appDialog.show("First", "Warning", [{ text: "Confirm", onPress: firstAction }, { text: "Cancel", style: "cancel" }]);
  appDialog.show("Second", "Error", undefined, { variant: "error" });
  const hostStore = Object.assign(selector => selector(useDialogStore.getState()), { getState: useDialogStore.getState });
  const Host = load("components/shared/DialogHost.tsx", { "@/services/app-dialog": { useDialogStore: hostStore } }).default;
  const first = Host();
  assert.equal(first.props.title, "First");
  assert.equal(first.props.variant, "confirmation");
  assert.equal(first.props.actions[0].onPress, firstAction);
  assert.equal(first.props.dismissible, false);
  first.props.onClose();
  assert.equal(Host().props.visible, false);
  assert.equal(useDialogStore.getState().queue.length, 2);
  first.props.onClosed();
  assert.equal(Host().props.title, "Second");
  assert.equal(Host().props.actions[0].text, "OK");
});

test("existing AlertModal and confirmation interfaces delegate to one renderer with original callbacks", () => {
  const Alert = load("components/shared/AlertModal.tsx").default;
  const cancel = () => {}, confirm = async () => {};
  const simple = Alert({ visible: true, message: "Error", onClose: cancel });
  assert.equal(simple.type, "AppDialog");
  assert.equal(simple.props.actions[0].onPress, cancel);
  const confirmation = Alert({ visible: true, message: "Confirm", variant: "error", showCancel: true, onClose: cancel, onConfirm: confirm });
  assert.equal(confirmation.props.actions[0].onPress, cancel);
  assert.equal(confirmation.props.actions[1].onPress, confirm);
  assert.equal(confirmation.props.actions[1].closeOnPress, false);
  assert.equal(confirmation.props.dismissible, false);
});

test("verification confirmation retains approval checks, refresh calls and verification navigation", async () => {
  for (const status of [0, 1, 2]) {
    const dialogs = [], routes = [], refreshes = [];
    const hook = load("hooks/useVerificationGuard.ts", {
      "@/services/app-dialog": { appDialog: { show: (...args) => dialogs.push(args) } },
      "@/features/auth/store/auth.store": { useAuthStore: () => ({ user: { corVerificationStatus: status }, loadUser: async () => refreshes.push("user") }) },
      "@/features/user/store/vehicle.store": { useVehicleStore: () => ({ vehicle: { verificationStatus: 2 }, loadVehicle: async () => refreshes.push("vehicle") }) },
      "expo-router": { router: { push: path => routes.push(path) } },
    }).useVerificationGuard();
    let approved = 0;
    assert.equal(hook.checkAccessOrRedirect(() => approved++), status === 2);
    if (status === 2) { assert.equal(approved, 1); assert.equal(dialogs.length, 0); }
    else {
      assert.equal(approved, 0);
      assert.equal(dialogs[0][2][0].style, "cancel");
      await dialogs[0][2][1].onPress();
      if (status === 1) assert.deepEqual(refreshes, ["user", "vehicle"]);
      else assert.deepEqual(routes, ["/(settings)/setup-schedule"]);
    }
  }
});

test("add/edit vehicle upload validation still rejects large files and accepts valid files", async () => {
  for (const file of ["AddVehicleSheet", "EditVehicleSheet"]) {
    for (const valid of [false, true]) {
      const dialogs = [], saved = [];
      const Sheet = load(`features/account/components/vehicle/${file}.tsx`, {
        "@/services/app-dialog": { appDialog: { show: (...args) => dialogs.push(args) } },
        "expo-document-picker": { getDocumentAsync: async () => ({ assets: [{ name: "file.pdf", size: valid ? 100 : 6000000 }] }) },
        "@/utils/fileValidation": { validateFileSize: () => ({ isValid: valid, message: "Maximum 5MB" }) },
      })[file];
      const nodes = nodesOf(Sheet({ visible: true, form: { vehicleType: "0" }, slideAnim: 0,
        setOrcrFile: asset => saved.push(asset), setMotorFile: asset => saved.push(asset) }));
      const pickers = nodes.filter(n => n.type === "TouchableOpacity" && ["handlePickOrcr", "handlePickMotor"].includes(n.props.onPress?.name));
      assert.equal(pickers.length, 2);
      for (const picker of pickers) await picker.props.onPress();
      assert.equal(saved.length, valid ? 2 : 0);
      assert.equal(dialogs.length, valid ? 0 : 2);
      if (!valid) assert.equal(dialogs[0][3].variant, "error");
    }
  }
});

test("application code cannot regress to native Alert/confirm popups or duplicate confirmation renderers", () => {
  for (const root of ["app", "components", "features", "hooks", "services", "providers", "utils"]) {
    for (const file of readdirSync(new URL(`../${root}/`, import.meta.url), { recursive: true })) {
      if (!/\.[jt]sx?$/.test(file)) continue;
      const text = readFileSync(new URL(`../${root}/${file.replaceAll("\\", "/")}`, import.meta.url), "utf8");
      assert.doesNotMatch(text, /\bAlert\s*\.\s*alert\s*\(|\b(?:window\.|globalThis\.)?(?:alert|confirm)\s*\(/, `${root}/${file}`);
    }
  }
  for (const path of ["components/shared/AlertModal.tsx"]) {
    assert.doesNotMatch(readFileSync(new URL(`../${path}`, import.meta.url), "utf8"), /<Modal|<Pressable/);
  }
});

// Execute the actual screen callbacks without mounting unrelated screens or calling a live API.
function callback(path, name, bindings, callArgument = false) {
  const text = readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
  const source = ts.createSourceFile(path, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  let expression;
  function visit(node) {
    if (!callArgument && ts.isVariableDeclaration(node) && node.name.getText(source) === name) expression = node.initializer.getText(source);
    if (!callArgument && ts.isFunctionDeclaration(node) && node.name?.text === name) expression = node.getText(source);
    if (callArgument && ts.isCallExpression(node) && node.expression.getText(source) === name) expression = node.arguments[0].getText(source);
    ts.forEachChild(node, visit);
  }
  visit(source);
  assert.ok(expression, `Missing callback ${name}`);
  const code = ts.transpileModule(`exports.callback = ${expression};`, { compilerOptions: { target: ts.ScriptTarget.ES2022 } }).outputText;
  const exports = {};
  vm.runInNewContext(code, { exports, console, ...bindings });
  return exports.callback;
}

test("reservation submit and cancellation retain payloads, state transitions and server errors", async () => {
  for (const success of [false, true]) {
    const calls = [], state = [], notices = [];
    const common = { storeSubmitting: false, capacityUnavailable: false, selectedDay: 15, months: ["October"], currentMonthIndex: 0,
      getActiveReservation: () => null, getISOForDay: () => "2026-10-15", getExistingReservationForDate: () => null,
      startTime: "10:00 AM", endTime: "3:00 PM", parse12hTo24hTime: text => text === "10:00 AM" ? "10:00:00" : "15:00:00",
      reason: " Academic consultation ", selectedVehicleId: "vehicle", vehicle: null,
      createReservation: async data => { calls.push(data); return { success, message: "Server refused request", data: { availability: { bookedSlots: 2, reservationCapacity: 90, availableSlots: 88 } } }; },
      setShowReviewModal: value => state.push(["review", value]), setDateError: error => state.push(["error", error]),
      showAlert: (...args) => notices.push(args), setViewMode: value => state.push(["view", value]), setStatusFilter: value => state.push(["filter", value]),
      availability: { refetch: async () => state.push(["refresh"]) } };
    await callback("features/account/pages/SchedulePage.tsx", "handleConfirmSubmit", common)();
    assert.equal(JSON.stringify(calls[0]), JSON.stringify({ reservationDate: "2026-10-15", startTime: "10:00:00", endTime: "15:00:00", reason: "Academic consultation", vehicleId: "vehicle" }));
    assert.ok(state.some(([name, value]) => name === "review" && value === false));
    if (success) { assert.equal(notices[0][2], "success"); assert.ok(state.some(([name, value]) => name === "view" && value === "list")); }
    else assert.ok(state.some(([name, value]) => name === "error" && value === "Server refused request"));

    const cancelled = [], cancellations = [];
    await callback("features/account/pages/SchedulePage.tsx", "handleConfirmCancel", {
      cancellingId: "reservation", activeReservation: null, getActiveReservation: () => null, setShowCancelModal: value => cancelled.push(value),
      cancelReservation: async id => { cancellations.push(id); return { success, message: "Cannot cancel" }; },
      showAlert: (...args) => notices.push(args), setCancellingId() {},
    })();
    assert.deepEqual(cancellations, ["reservation"]);
    assert.equal(cancelled[0], false);
    if (!success) assert.equal(notices.at(-1)[0], "Cancellation Failed");
  }
});


test("startup and About update confirmations keep Later and deferred Restart actions", async () => {
  for (const [path, name] of [["app/_layout.tsx", "checkUpdatesOnStartup"], ["features/account/pages/AboutPage.tsx", "handleCheckUpdates"]]) {
    const notices = [], calls = [], timers = [];
    const Updates = { isEnabled: true, checkForUpdateAsync: async () => { calls.push("check"); return { isAvailable: true }; },
      fetchUpdateAsync: async () => { calls.push("fetch"); return { isNew: true }; }, reloadAsync: async () => calls.push("reload") };
    const check = callback(path, name, {
      Updates, isMounted: true, isChecking: false, isDownloadingUpdate: false, setIsChecking() {}, setToast() {},
      appDialog: { show: (...args) => notices.push(args) }, setTimeout: (fn, ms) => timers.push({ fn, ms }),
    });
    await check();
    assert.deepEqual(calls, ["check", "fetch"]);
    assert.equal(notices[0][2][0].style, "cancel");
    assert.equal(notices[0][2][0].onPress, undefined);
    notices[0][2][1].onPress();
    assert.equal(timers[0].ms, 300);
    await timers[0].fn();
    assert.equal(calls.at(-1), "reload");
  }
});

test("semester notice and suspension preserve their original navigation/logout actions", async () => {
  const notices = [], actions = [];
  const bindings = { appDialog: { show: (...args) => notices.push(args) },
    router: { push: route => actions.push(route), replace: route => actions.push(route) },
    useAuthStore: { getState: () => ({ logout: async () => actions.push("logout") }) } };
  callback("features/user/pages/UserHomePage.tsx", "registerSemesterResetListener", bindings, true)({ Message: "Semester changed" });
  assert.equal(notices[0][1], "Semester changed");
  notices[0][2][0].onPress();
  assert.equal(actions[0], "/(users)/cor-upload");
  await callback("features/user/pages/UserHomePage.tsx", "registerAccountSuspendedListener", bindings, true)({ message: "Suspended" });
  assert.equal(actions[1], "logout");
  assert.equal(notices[1][3].variant, "error");
  notices[1][2][0].onPress();
  assert.equal(actions[2], "/(auth)/login");
});
