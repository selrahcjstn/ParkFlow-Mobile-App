import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import vm from "node:vm";
import ts from "typescript";
import { loadConfirmation } from "./helpers/action-confirmation.mjs";

const require = createRequire(import.meta.url);
const source = readFileSync(new URL("../app/(guard)/manual-input.tsx", import.meta.url), "utf8");
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
}).outputText;

test("registered manual entry reviews matched driver and plate before writing", async () => {
  const view = screen({ lookupType: "Registered", isRegistered: true, ownerName: "Student One", brand: "Honda", vehicleTypeValue: 0 });
  view.nodes.find(n => n.type === "AppButton" && /^(Review |Record exit)/.test(n.props.label)).props.onPress();
  assert.equal(view.requests.length, 0);
  assert.match(view.dialogs[0].message, /ABC123/); assert.match(view.dialogs[0].message, /Student One/);
  await view.dialogs[0].actions[1].onPress();
  assert.equal(view.requests.length, 1); assert.equal(view.requests[0].acceptUnscheduledFee, undefined);
  assert.equal(view.requests[0].plateNumber, "ABC123"); assert.equal(view.routes.length, 1);
});

test("registered entry Cancel or changing the plate never writes a stale entry", async () => {
  for (const cancel of [true, false]) {
    const view = screen({ lookupType: "Registered", isRegistered: true });
    view.nodes.find(n => n.type === "AppButton" && /^(Review |Record exit)/.test(n.props.label)).props.onPress();
    if (cancel) view.dialogs[0].actions[0].onPress();
    else view.nodes.find(n => n.props.label === "Plate number").props.onChangeText("OTHER123");
    await view.dialogs[0].actions[1].onPress();
    assert.equal(view.requests.length, 0);
  }
});

test("a legacy fee offer never triggers a paid retry", async () => {
  const view = screen({ lookupType: "Registered", isRegistered: true }, false, {
    registeredRequest: () => ({ isSuccess: false, message: "Entry was rejected", data: { feeOptionAvailable: true, entryFee: 20 } }),
  });
  view.nodes.find(n => n.type === "AppButton" && /^(Review |Record exit)/.test(n.props.label)).props.onPress();
  await view.dialogs[0].actions[1].onPress();
  assert.equal(view.requests.length, 1); assert.equal(view.routes.length, 0);
  assert.equal(view.dialogs[1].title, "Entry not recorded");
  assert.equal(view.requests[0].acceptUnscheduledFee, undefined);
});

function screen(record = null, searching = false, options = {}) {
  if (record?.isVisitor && !options.unconfirmed) record = { identityConfirmed: true, visitorId: 'visitor', visitorVehicleId: 'visitor-vehicle', ...record };
  const state = [{ plateNumber: "ABC123", fullName: record?.fullName || "", phoneNumber: record?.contactNumber || "", vehicleType: record?.vehicleTypeValue?.toString() || "", brand: record?.brand || "", ...options.form }, { license: { uri: "license.jpg" }, profilePhoto: { uri: "driver.jpg" }, vehiclePhoto: { uri: "vehicle.jpg" } }, true, '', null, false, {},
    { visible: false }, searching, record, Boolean(record)];
  const refs = [], routes = [], dialogs = [], requests = [], passes = [];
  let index = 0, refIndex = 0;
  const react = {
    useState: initial => {
      const i = index++;
      if (!(i in state)) state[i] = initial;
      return [state[i], next => { state[i] = typeof next === "function" ? next(state[i]) : next; }];
    },
    useRef: value => refs[refIndex++] ??= { current: value },
    useCallback: fn => fn, useEffect: () => {},
  };
  const show = (title, message, actions, settings) => dialogs.push({ title, message, actions, settings });
  const confirmation = loadConfirmation(react, show);
  const visitorMutation = async payload => {
    requests.push(payload);
    if (options.visitorRequest) return options.visitorRequest(payload);
    return { isSuccess: true, data: { ...payload, entryFee: 20, entryTime: "2026-10-11T02:00:00Z", vehicleType: "Car" } };
  };
  const exports = {};
  vm.runInNewContext(compiled, { exports, URLSearchParams, setTimeout, clearTimeout, require(name) {
    if (name === "react/jsx-runtime") return require(name);
    if (name === "react") return react;
    if (name === "@/hooks/useActionConfirmation") return confirmation;
    if (name === "react-native") return {
      Switch: "Switch", ScrollView: "ScrollView", View: "View", Text: "Text", ActivityIndicator: "ActivityIndicator",
      KeyboardAvoidingView: "KeyboardAvoidingView", Platform: { OS: "ios" }, Keyboard: { dismiss() {} }, Alert: {},
    };
    if (name === "react-native-safe-area-context") return { useSafeAreaInsets: () => ({ bottom: 34 }) };
    if (name === "lucide-react-native") return { ShieldCheck: "ShieldCheck", Clock: "Clock", UserCheck: "UserCheck" };
    if (name === "expo-router") return { router: { push: route => routes.push(route), replace: route => routes.push(route) } };
    if (name === "@/components/layouts/SubScreenLayout") return { default: "SubScreenLayout" };
    if (name === "@/components/ui") return { AppInput: "AppInput", AppSelect: "AppSelect", AppButton: "AppButton" };
    if (name === "@/components/shared") return { AlertModal: "AlertModal" };
    if (name === "@/services/app-dialog") return { appDialog: { show: (title, message, actions, settings) => dialogs.push({ title, message, actions, settings }) } };
    if (name === "@/hooks/useAppTheme") return { useAppTheme: () => ({ colors: { primary: "theme-primary", accent: "theme-accent" } }) };
    if (name === "@/features/auth/store/auth.store") return { useAuthStore: () => ({ user: { id: "guard" } }) };
    if (name === "@/hooks/useApiRequest") return { useApiMutation: mutation => ({ run: mutation, isLoading: options.loading ?? false }) };
    if (name === "@/features/session/services/parking-log.service") return { parkingLogService: {
      createManualEntry: async payload => { requests.push(payload); return options.registeredRequest?.(payload) ?? { isSuccess: true, data: payload }; },
    } };
    if (name === "@/features/session/services/visitor.service") return { visitorService: { createVisitorEntry: visitorMutation,
      confirmLookupByPlate: async plate => options.confirmedLookup ? { isSuccess: true, data: options.confirmedLookup } : { isSuccess: false, message: 'No saved visitor vehicle was found.' } } };
    if (name === "@/features/session/store/parking-session.store") return { useParkingSessionStore: () => ({
      getParkingSessionStats() {}, getActiveSession() {}, setLastManualPass: pass => passes.push(pass),
    }) };
    if (name === "@/constants/vehicleType") return { VEHICLE_TYPE_OPTIONS: [], getVehicleTypeLabel: type => type === 2 ? "Car" : "Motorcycle" };
    if (name === "@/utils/formatTime") return { formatTime: () => "10:00 AM" };
    if (name === "@/utils/manualLookupError") return { getManualLookupError: () => "Error" };
    if (name === '@/features/auth/components/DocumentPreviewButton') return { __esModule: true, default: 'DocumentPreviewButton' };
    if (name === '@/features/auth/components/RegistrationDocumentField') return { __esModule: true, default: 'RegistrationDocumentField' };
    if (name === '@/features/qr/components/DriverVehiclePreview') return { __esModule: true, default: 'DriverVehiclePreview' };
    if (name === '@/utils/pickDriverDocument') return { pickDriverDocument: async () => null };
    throw new Error("Unexpected import: " + name);
  } });
  function render() {
    index = 0; refIndex = 0;
    const nodes = [];
    function walk(node) {
      if (Array.isArray(node)) return node.forEach(walk);
      if (node && typeof node === "object" && node.props) { nodes.push(node); walk(node.props.children); }
    }
    walk(exports.default());
    return { nodes, text: nodes.filter(n => n.type === "Text").map(n => n.props.children).flat().join(" ") };
  }
  return { ...render(), render, routes, dialogs, requests, passes, state };
}

test("returning visitor gets saved details and one record-entry action, not new-visitor fields", () => {
  const view = screen({ lookupType: "Visitor", isVisitor: true, fullName: "Juan", plateNumber: "ABC123" });
  assert.match(view.text, /Returning visitor/);
  assert.match(view.text, /No need to enter them again/);
  const saved = view.nodes.filter(n => n.type === "AppInput" && n.props.editable === false);
  assert.equal(saved.length, 4);
  assert.deepEqual(saved.map(n => n.props.label), ["Visitor plate number", "Visitor name", "Vehicle type", "Brand / model"]);
  assert.equal(saved.find(n => n.props.label === "Visitor name").props.value, "Juan");
  assert.ok(saved.every(n => !n.props.onChangeText && n.props.accessibilityState.disabled));
  assert.equal(view.nodes.filter(n => n.type === "AppSelect").length, 0);
  assert.equal(view.nodes.find(n => n.type === "AppButton" && /^(Review |Record exit)/.test(n.props.label)).props.label, "Review re-entry");
});
test("inside registered vehicle offers exit rather than another entry", () => {
  const view = screen({ lookupType: "Registered", isRegistered: true, isInside: true, entryTime: "now" });
  assert.match(view.text, /Already on campus/);
  assert.equal(view.nodes.find(n => n.type === "AppButton" && /^(Review |Record exit)/.test(n.props.label)).props.label, "Record exit");
});
test("new visitor keeps existing name, contact, type and brand fields", () => {
  const view = screen({ lookupType: "Unknown" });
  assert.match(view.text, /New visitor/);
  assert.deepEqual(view.nodes.filter(n => n.type === "AppInput").map(n => n.props.label),
    ["Plate number", "Existing visitor vehicle plate (optional)", "Visitor plate number", "Visitor name (optional)", "Contact number", "Brand / model"]);
  assert.equal(view.nodes.find(n => n.props.label === "Visitor plate number").props.editable, false);
  assert.equal(view.nodes.find(n => n.type === "AppSelect").props.label, "Vehicle type");
});
test("searching hides stale record actions and respects bottom safe area", () => {
  const view = screen({ lookupType: "Visitor", isVisitor: true }, true);
  assert.match(view.text, /Searching vehicle and visitor records/);
  assert.equal(view.nodes.filter(n => n.type === "AppButton" && /^(Review |Record exit)/.test(n.props.label)).length, 0);
  assert.equal(view.nodes.find(n => n.type === "ScrollView").props.contentContainerStyle.paddingBottom, 54);
});

test("new and returning visitors have no fee notice before recording entry", () => {
  for (const record of [
    { lookupType: "Unknown", entryFee: 20 },
    { lookupType: "Visitor", isVisitor: true, entryFee: 35 },
  ]) {
    const view = screen(record);
    assert.doesNotMatch(view.text, /Visitor parking fee/);
    assert.doesNotMatch(view.text, /Parking charge/);
    assert.doesNotMatch(view.text, /payment receipt/);
  }
  assert.doesNotMatch(screen({ lookupType: "Registered", isRegistered: true }).text, /Visitor parking fee/);
  assert.doesNotMatch(screen({ lookupType: "Visitor", isVisitor: true, isInside: true }).text, /Visitor parking fee/);
});

test("visitor pass no longer forwards fee fields", () => {
  assert.doesNotMatch(source, /entryFee: response.data.entryFee/);
  assert.doesNotMatch(source, /entryFee: 0/);
});

const visitorRecord = { lookupType: "Visitor", isVisitor: true, fullName: "Juan Dela Cruz", contactNumber: "09171234567",
  plateNumber: "ABC123", brand: "Toyota Vios", vehicleType: "Car", vehicleTypeValue: 2, entryFee: 35 };
const newVisitorForm = { plateNumber: " abc123 ", fullName: " Juan Dela Cruz ", phoneNumber: "09171234567", vehicleType: "2", brand: " Toyota Vios " };

for (const returning of [false, true]) {
  test(`${returning ? "returning" : "new"} visitor requires detail confirmation before any API write`, async () => {
    const view = screen(returning ? visitorRecord : { lookupType: "Unknown", entryFee: 20 }, false, { form: newVisitorForm });
    assert.equal(view.requests.length, 0); // Searching/rendering never creates a visitor or entry.
    const button = view.nodes.find(n => n.type === "AppButton" && /^(Review |Record exit)/.test(n.props.label));
    button.props.onPress(); button.props.onPress();
    assert.equal(view.dialogs.length, 1);
    assert.equal(view.requests.length, 0);
    const review = view.dialogs[0];
    assert.equal(review.title, returning ? "Confirm visitor re-entry" : "Confirm visitor entry");
    for (const detail of ["ABC123", "Juan Dela Cruz", "09171234567", "Car", "Toyota Vios"])
      assert.ok(review.message.includes(detail), detail);
    assert.doesNotMatch(review.message, /Parking charge/);
    assert.equal(review.settings.variant, "confirmation");
    assert.equal(review.settings.icon.props.color, "theme-primary");
    assert.equal(review.actions[0].style, "cancel");
    assert.equal(review.actions[1].text, returning ? "Confirm re-entry" : "Confirm entry");

    await review.actions[1].onPress();
    assert.equal(view.requests.length, 1);
    assert.deepEqual(JSON.parse(JSON.stringify(view.requests[0])), {
      plateNumber: "ABC123", fullName: "Juan Dela Cruz", contactNumber: "09171234567", vehicleType: 2,
      brand: "Toyota Vios", purpose: "Campus Visit", destination: "BulSU Campus", guardUserId: "guard",
      license: { uri: "license.jpg" }, profilePhoto: { uri: "driver.jpg" }, vehiclePhoto: { uri: "vehicle.jpg" }, licenseVerified: true, identityConfirmed: returning,
      ...(returning ? { existingVisitorId: "visitor" } : {}),
    });
    assert.equal(view.passes[0].entryFee, undefined);
    assert.match(view.routes[0], /^\/\(guard\)\/manual-pass\?/);
  });
}

test("Cancel or hardware/backdrop dismissal preserves visitor details and never records entry", () => {
  for (const dismiss of [review => review.actions[0].onPress(), review => review.settings.onDismiss()]) {
    const view = screen({ lookupType: "Unknown" }, false, { form: newVisitorForm });
    view.nodes.find(n => n.type === "AppButton" && /^(Review |Record exit)/.test(n.props.label)).props.onPress();
    dismiss(view.dialogs[0]);
    assert.equal(view.requests.length, 0);
    assert.equal(view.state[0].fullName, newVisitorForm.fullName);
    view.render().nodes.find(n => n.type === "AppButton" && /^(Review |Record exit)/.test(n.props.label)).props.onPress();
    assert.equal(view.dialogs.length, 2);
  }
});

test("returning visitor review uses saved read-only details, not stale form values", () => {
  const view = screen(visitorRecord, false, { form: { ...newVisitorForm, fullName: "Wrong", brand: "Wrong", phoneNumber: visitorRecord.contactNumber, vehicleType: "0" } });
  view.nodes.find(n => n.type === "AppButton" && /^(Review |Record exit)/.test(n.props.label)).props.onPress();
  assert.equal(view.dialogs.length, 1);
  assert.match(view.dialogs[0].message, /Juan Dela Cruz/);
  assert.match(view.dialogs[0].message, /Toyota Vios/);
  assert.match(view.dialogs[0].message, /Vehicle type: Car/);
  assert.doesNotMatch(view.dialogs[0].message, /Wrong|invalid/);
});

test("invalid new visitor fields remain validated before opening confirmation", () => {
  const view = screen({ lookupType: "Unknown" }, false, { form: { phoneNumber: "invalid" } });
  view.nodes.find(n => n.type === "AppButton" && /^(Review |Record exit)/.test(n.props.label)).props.onPress();
  assert.equal(view.dialogs.length, 0);
  assert.equal(view.requests.length, 0);
  for (const field of ["brand", "vehicleType", "phoneNumber"]) assert.ok(view.state[6][field]);
});

test("changing the plate invalidates an older visitor confirmation", async () => {
  const view = screen(visitorRecord);
  view.nodes.find(n => n.type === "AppButton" && /^(Review |Record exit)/.test(n.props.label)).props.onPress();
  view.nodes.find(n => n.props.label === "Plate number").props.onChangeText("OTHER123");
  await view.dialogs[0].actions[1].onPress();
  assert.equal(view.requests.length, 0);
  assert.equal(view.dialogs[1].title, "Search again");
});

test("confirmed visitor entry retains the in-flight duplicate-submission guard", async () => {
  let finish;
  const view = screen(visitorRecord, false, { visitorRequest: () => new Promise(resolve => { finish = resolve; }) });
  view.nodes.find(n => n.type === "AppButton" && /^(Review |Record exit)/.test(n.props.label)).props.onPress();
  const confirm = view.dialogs[0].actions[1].onPress;
  const pending = confirm();
  await confirm();
  assert.equal(view.requests.length, 1);
  finish({ isSuccess: false, message: "Please retry" });
  await pending;
  assert.equal(view.dialogs[1].title, "Entry not recorded");
  assert.equal(view.dialogs[1].settings.variant, "error");
  assert.equal(view.routes.length, 0);
});

test("API conflict remains an understandable warning after confirming visitor entry", async () => {
  const view = screen(visitorRecord, false, { visitorRequest: async () => {
    throw { response: { status: 409, data: { message: "Visitor is already inside campus." } } };
  } });
  view.nodes.find(n => n.type === "AppButton" && /^(Review |Record exit)/.test(n.props.label)).props.onPress();
  await view.dialogs[0].actions[1].onPress();
  assert.equal(view.dialogs[1].title, "Already on campus");
  assert.equal(view.dialogs[1].message, "Visitor is already inside campus.");
  assert.equal(view.dialogs[1].settings.variant, "warning");
  assert.equal(view.routes.length, 0);
});

test("inside vehicle and visitor shortcuts open the shared exit screen", () => {
  for (const record of [{ lookupType: "Registered", isRegistered: true, isInside: true },
    { lookupType: "Visitor", isVisitor: true, isInside: true }]) {
    const view = screen(record);
    view.nodes.find(n => n.type === "AppButton" && /^(Review |Record exit)/.test(n.props.label)).props.onPress();
    assert.equal(view.routes[0].pathname, "/(guard)/manual-exit");
    assert.equal(view.routes[0].params.plateNumber, "ABC123");
  }
});


test('saved identity stays hidden until the guard reviews the plate match', async () => {
  const saved = { ...visitorRecord, identityConfirmed: true, visitorId: 'visitor-1', visitorVehicleId: 'vehicle-1' };
  const view = screen({ lookupType: 'Visitor', isVisitor: true, visitorId: 'visitor-1', plateNumber: 'ABC123' }, false, { unconfirmed: true, confirmedLookup: saved });
  assert.equal(view.nodes.find(n => n.props.label === 'Visitor name').props.value, 'Visitor');
  await view.nodes.find(n => n.props.label === 'Review saved visitor').props.onPress();
  assert.equal(view.render().nodes.find(n => n.props.label === 'Visitor name').props.value, saved.fullName);
  assert.equal(view.requests.length, 0);
});

test('a new vehicle requires explicit visitor selection and retains its own plate and photo', async () => {
  const saved = { ...visitorRecord, identityConfirmed: true, visitorId: 'visitor-1', visitorVehicleId: 'old-vehicle', driversLicenseUrl: 'saved-license.pdf', profilePictureUrl: 'saved-profile.jpg', vehiclePictureUrl: 'old-vehicle.jpg' };
  const view = screen({ lookupType: 'Unknown' }, false, { form: { ...newVisitorForm, plateNumber: 'NEW456' }, confirmedLookup: saved });
  view.nodes.find(n => n.props.label === 'Existing visitor vehicle plate (optional)').props.onChangeText('ABC123');
  await view.render().nodes.find(n => n.props.label === 'Find existing visitor').props.onPress();
  assert.equal(view.state[4], null); assert.equal(view.requests.length, 0);
  view.dialogs[0].actions[1].onPress();
  assert.equal(view.state[4].visitorId, 'visitor-1');
  assert.equal(view.state[4].vehiclePictureUrl, null);
  assert.equal(view.state[1].license, null); assert.equal(view.state[1].profilePhoto, null);
  view.render().nodes.find(n => n.type === 'Switch').props.onValueChange(true);
  view.render().nodes.find(n => n.props.label === 'Review visitor entry').props.onPress();
  await view.dialogs[1].actions[1].onPress();
  assert.equal(view.requests[0].existingVisitorId, 'visitor-1');
  assert.equal(view.requests[0].identityConfirmed, true);
  assert.equal(view.requests[0].plateNumber, 'NEW456');
  assert.equal(view.requests[0].vehiclePhoto.uri, 'vehicle.jpg');
});

test('an invalid existing plate does not associate a visitor or record an entry', async () => {
  const view = screen({ lookupType: 'Unknown' }, false, { form: newVisitorForm });
  view.nodes.find(n => n.props.label === 'Existing visitor vehicle plate (optional)').props.onChangeText('X');
  await view.render().nodes.find(n => n.props.label === 'Find existing visitor').props.onPress();
  assert.match(view.state[6].identity, /existing visitor vehicle/);
  assert.equal(view.state[4], null); assert.equal(view.requests.length, 0);
});
