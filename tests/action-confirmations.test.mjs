import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import ts from "typescript";
import { loadConfirmation } from "./helpers/action-confirmation.mjs";

function review() {
  const refs = [], dialogs = [];
  let index = 0, focusEffect;
  const react = { useRef: initial => refs[index++] ??= { current: initial }, useCallback: fn => fn };
  const hook = loadConfirmation(react, (...args) => dialogs.push(args), effect => { focusEffect = effect; });
  const confirmAction = hook.useActionConfirmation();
  let blur = focusEffect();
  return { confirmAction, dialogs, blur: () => blur(), focus: () => { blur = focusEffect(); } };
}

function callback(path, name, bindings) {
  const source = ts.createSourceFile(path, readFileSync(new URL(`../${path}`, import.meta.url), "utf8"), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  let expression;
  function visit(node) {
    if (ts.isVariableDeclaration(node) && node.name.getText(source) === name) expression = node.initializer.getText(source);
    ts.forEachChild(node, visit);
  }
  visit(source);
  assert.ok(expression, `Missing ${name}`);
  const exports = {};
  const code = ts.transpileModule(`exports.callback = ${expression}`, { compilerOptions: { target: ts.ScriptTarget.ES2022 } }).outputText;
  vm.runInNewContext(code, { exports, console, Error, ...bindings });
  return exports.callback;
}

test("confirmation Cancel and Android/backdrop dismissal never run the action", async () => {
  for (const dismiss of [dialog => dialog[2][0].onPress(), dialog => dialog[3].onDismiss()]) {
    const view = review(); let calls = 0, resets = 0;
    view.confirmAction("Review", "Details", async () => ++calls, { onDismiss: () => ++resets });
    assert.equal(view.dialogs[0][3].cancelable, true);
    dismiss(view.dialogs[0]);
    await view.dialogs[0][2][1].onPress();
    assert.equal(calls, 0);
    assert.equal(resets, 1);
    view.confirmAction("Again", "", () => ++calls);
    assert.equal(view.dialogs.length, 2);
  }
});

test("confirmation prevents duplicate opens, in-flight submissions and repeated completed actions", async () => {
  const view = review(); let calls = 0, finish;
  const action = () => { ++calls; return new Promise(resolve => { finish = resolve; }); };
  view.confirmAction("Review", "", action);
  view.confirmAction("Duplicate", "", action);
  assert.equal(view.dialogs.length, 1);
  const confirm = view.dialogs[0][2][1].onPress;
  const pending = confirm();
  await confirm();
  assert.equal(calls, 1);
  finish(); await pending; await confirm();
  assert.equal(calls, 1);
});

test("leaving and returning to the screen invalidates an old confirmation", async () => {
  const view = review(); let calls = 0;
  view.confirmAction("Review", "", () => ++calls);
  view.blur(); view.focus();
  await view.dialogs[0][2][1].onPress();
  assert.equal(calls, 0);
  view.blur(); view.confirmAction("Inactive", "", () => ++calls);
  assert.equal(view.dialogs.length, 1);
});

test("a rejected operation allows a deliberate retry in the same shared dialog", async () => {
  const view = review(); let calls = 0;
  view.confirmAction("Review", "", async () => { if (++calls === 1) throw new Error("Try again"); });
  const confirm = view.dialogs[0][2][1].onPress;
  await assert.rejects(confirm, /Try again/);
  await confirm();
  assert.equal(calls, 2);
});

function vehicles() {
  const view = review(), calls = [], errors = [];
  const record = { id: "vehicle-1", plateNumber: "ABC123", brand: "Toyota", status: "Outside", vehicleType: 2 };
  const store = { vehicles: [record] };
  const bindings = {
    confirmAction: view.confirmAction, selectedVehicle: record, editingVehicle: record,
    hasOngoingSession: false, closeMenu: () => { bindings.selectedVehicle = null; },
    vehicleService: Object.fromEntries(["deleteVehicle", "setPrimaryVehicle", "updateVehicle", "createVehicle"].map(name => [name, async (...args) => { calls.push([name, ...args]); return { isSuccess: true, data: "vehicle-new" }; }])),
    queryClient: { invalidateQueries: () => {} }, loadVehicle: async () => {},
    useVehicleStore: { getState: () => store }, appDialog: { show: (...args) => errors.push(args) },
    setAlertVariant() {}, setAlertTitle() {}, setAlertMessage() {}, setAlertVisible() {},
    form: { plateNumber: " def456 ", brand: " Honda ", vehicleType: "0" },
    editForm: { plateNumber: " def456 ", brand: " Honda ", vehicleType: "0" },
    orcrFile: { uri: "file://orcr", name: "orcr.pdf" }, motorFile: { uri: "file://photo", name: "photo.jpg" },
    editOrcrFile: null, editMotorFile: null, validateFileSize: () => ({ isValid: true }),
    setEditFormError: error => errors.push(error), setFormError: error => errors.push(error),
    setIsSavingEdit() {}, setIsSubmitting() {}, closeEditSheet() {}, closeAddSheet() {}, setOrcrFile() {}, setMotorFile() {},
    getVehicleTypeLabel: () => "Motorcycle", user: { id: "owner" }, vehicles: [record],
    userService: Object.fromEntries(["uploadOrcrDocument", "uploadMotorPicture"].map(name => [name, async (...args) => { calls.push([name, ...args]); return { isSuccess: true, data: { secureUrl: `https://files/${name}` } }; }])),
  };
  return { ...view, bindings, calls, errors, store };
}

for (const [handler, operation] of [["handleRemoveVehicle", "deleteVehicle"], ["handleMakePrimary", "setPrimaryVehicle"]]) {
  test(`${operation} reviews the selected record and survives action-sheet dismissal`, async () => {
    const view = vehicles();
    await callback("features/account/pages/VehiclePage.tsx", handler, view.bindings)();
    assert.equal(view.calls.length, 0);
    assert.match(view.dialogs[0][1], /ABC123.*\nVehicle: Toyota/);
    if (operation === "deleteVehicle") {
      assert.equal(view.dialogs[0][2][1].style, "destructive");
      assert.equal(view.dialogs[0][3].cancelable, false);
    }
    await view.dialogs[0][2][1].onPress();
    assert.equal(JSON.stringify(view.calls), JSON.stringify([[operation, "vehicle-1"]]));
  });
  test(`${operation} Cancel leaves the account untouched; a newly active session still blocks it`, async () => {
    const cancelled = vehicles();
    await callback("features/account/pages/VehiclePage.tsx", handler, cancelled.bindings)();
    cancelled.dialogs[0][2][0].onPress();
    assert.equal(cancelled.calls.length, 0);
    const parked = vehicles();
    await callback("features/account/pages/VehiclePage.tsx", handler, parked.bindings)();
    parked.store.vehicles[0].status = "Parked";
    await assert.rejects(parked.dialogs[0][2][1].onPress, /ongoing parking session/);
    assert.equal(parked.calls.length, 0);
  });
}

test("vehicle edit and registration defer uploads and preserve reviewed payloads", async () => {
  for (const handler of ["handleSaveEdit", "handleAddVehicle"]) {
    const view = vehicles();
    await callback("features/account/pages/VehiclePage.tsx", handler, view.bindings)();
    assert.equal(view.calls.length, 0);
    assert.match(view.dialogs[0][1], /DEF456/);
    assert.match(view.dialogs[0][1], /administrator review/);
    await view.dialogs[0][2][1].onPress();
    const call = view.calls.find(([name]) => name === (handler === "handleSaveEdit" ? "updateVehicle" : "createVehicle"));
    const payload = call.at(-1);
    assert.equal(payload.plateNumber, "DEF456");
    assert.equal(payload.brand, "Honda");
    assert.equal(payload.vehicleType, 0);
    if (handler === "handleSaveEdit") assert.equal(call[1], "vehicle-1");
    else { assert.equal(payload.ownerId, "owner"); assert.equal(view.calls.length, 3); }
  }
});

test("vehicle validation still prevents review and all API/upload calls", async () => {
  for (const handler of ["handleSaveEdit", "handleAddVehicle"]) {
    const view = vehicles();
    view.bindings.form.plateNumber = ""; view.bindings.editForm.plateNumber = "";
    await callback("features/account/pages/VehiclePage.tsx", handler, view.bindings)();
    assert.equal(view.dialogs.length, 0); assert.equal(view.calls.length, 0);
    assert.equal(view.errors[0], "Plate number is required.");
  }
});

test("changing primary email reviews the exact target and updates only after confirmation", async () => {
  const view = review(), calls = [];
  const bindings = { confirmAction: view.confirmAction, primaryLoading: false, emailVal: "new@example.test", setPrimaryLoading() {},
    userService: { updatePrimaryEmail: async email => { calls.push(email); return { isSuccess: true }; } },
    useAuthStore: { getState: () => ({ setEmail: email => calls.push(email), loadUser() {} }) },
    queryClient: { invalidateQueries: async () => {} }, appDialog: { show() {} }, loadCredentials() {},
  };
  await callback("features/account/pages/EmailDetailsPage.tsx", "handleSetPrimary", bindings)();
  assert.equal(calls.length, 0); assert.match(view.dialogs[0][1], /new@example.test/);
  await view.dialogs[0][2][1].onPress();
  assert.deepEqual(calls, ["new@example.test", "new@example.test"]);
});

for (const personnel of [false, true]) test(`${personnel ? "Employee ID" : "COR/schedule"} review precedes upload and preserves role-specific submission`, async () => {
  const view = review(), calls = [], notices = [];
  const bindings = { confirmAction: view.confirmAction, hasOngoingSession: false, isPersonnel: personnel,
    verificationService: { getAcademicTerm: async () => "2026-2027" },
    selectedFile: { uri: "file://document", name: personnel ? "employee.pdf" : "cor.pdf" },
    editSchedule: { Mon: { start: "10:00 AM", end: "3:00 PM" } }, SCHEDULE_DAYS: [{ key: 1, shortLabel: "Mon" }],
    parseTimeString: time => new Date(`2026-10-12T${time === "10:00 AM" ? "10:00" : "15:00"}:00`),
    validateFileSize: () => ({ isValid: true }), formatTime: value => value,
    useVehicleStore: { getState: () => ({ vehicles: [] }) }, setIsUploading() {}, setIsEditing() {},
    userService: { uploadCorDocument: async (...args) => { calls.push(["upload", ...args]); return { isSuccess: true, data: { secureUrl: "https://files/document.pdf" } }; } },
    onboardingService: Object.fromEntries(["updateCor", "updateSchedule"].map(name => [name, async payload => { calls.push([name, payload]); return { isSuccess: true }; }])),
    queryClient: { invalidateQueries: async () => {} }, fetchSchedules: async () => {}, loadUser: async () => {},
    appDialog: { show: (...args) => notices.push(args) }, showAlert: (...args) => notices.push(args),
  };
  await callback("features/account/pages/ScheduleSetupPage.tsx", "handleSubmit", bindings)();
  assert.equal(calls.length, 0); assert.match(view.dialogs[0][1], /administrator review/);
  if (!personnel) assert.match(view.dialogs[0][1], /Mon: 10:00:00 – 15:00:00/);
  await view.dialogs[0][2][1].onPress();
  assert.deepEqual(calls.map(call => call[0]), personnel ? ["upload", "updateCor"] : ["upload", "updateCor", "updateSchedule"]);
  assert.equal(calls[1][1].academicTerm, personnel ? "Employee ID" : "2026-2027");
  assert.equal(notices.at(-1)[3].variant, "success");
});

function scanner() {
  const view = review(), calls = [], changes = [];
  const reservation = { isValid: true, referenceNumber: "RES-123", vehicleQrCodeHash: "vehicle-qr", driverName: "Juan", plateNumber: "ABC123" };
  const bindings = { confirmAction: view.confirmAction, phase: "scanning", activeRef: { current: true }, processingRef: { current: false }, mutationRef: { current: false },
    useCallback: fn => fn, setPhase: value => changes.push(["phase", value]), setErrorMessage() {}, user: { id: "guard" },
    parseStudentIdQr: () => null,
    verifyReservationScan: async () => { calls.push(["verifyReservation"]); return { isSuccess: true, data: reservation }; },
    createEntry: async payload => { calls.push(["entry", payload]); return { isSuccess: true, data: { plateNumber: "ABC123" } }; },
    verifyStudentScan: async () => ({ isSuccess: false }), setStudentResult() {},
    setReservationResult: result => changes.push(["reservation", result]), setScanResult: result => changes.push(["result", result]),
    setConflictData: data => changes.push(["conflict", data]), router: { replace: route => changes.push(["route", route]) },
    showError: message => changes.push(["error", message]), resetScan: () => changes.push(["reset"]), reservationResult: reservation,
  };
  return { ...view, calls, changes, bindings };
}

test("ordinary vehicle QR never records entry before explicit confirmation; Cancel resets scanning", async () => {
  const view = scanner();
  const scan = callback("features/qr/pages/ScanQrPage.tsx", "handleBarcodeScanned", view.bindings);
  await scan({ data: " vehicle-qr " });
  assert.equal(view.calls.length, 0); assert.equal(view.dialogs.length, 1);
  view.dialogs[0][2][0].onPress();
  assert.equal(view.calls.length, 0); assert.deepEqual(view.changes.at(-1), ["reset"]);
});

test("ordinary QR confirmation preserves hash, guard and result navigation", async () => {
  const view = scanner();
  await callback("features/qr/pages/ScanQrPage.tsx", "handleBarcodeScanned", view.bindings)({ data: " vehicle-qr " });
  await view.dialogs[0][2][1].onPress();
  assert.equal(JSON.stringify(view.calls), JSON.stringify([["entry", { qrCodeHash: "vehicle-qr", userId: "guard" }]]));
  assert.equal(view.changes.at(-1)[1], "result");
});

test("valid reservation QR shows its review screen, and only Confirm Check-In records entry", async () => {
  const view = scanner();
  await callback("features/qr/pages/ScanQrPage.tsx", "handleBarcodeScanned", view.bindings)({ data: "RES-123" });
  assert.deepEqual(view.calls.map(call => call[0]), ["verifyReservation"]);
  assert.equal(view.changes.find(([name]) => name === "reservation")[1].plateNumber, "ABC123");
  await callback("features/qr/pages/ScanQrPage.tsx", "handleConfirmReservationCheckIn", view.bindings)();
  assert.equal(view.calls[1][1].qrCodeHash, "RES-123");
});

test("existing student-ID review remains read-only and does not acquire an extra popup", async () => {
  const view = scanner();
  view.bindings.parseStudentIdQr = () => ({ fullName: "Juan", studentNumber: "2023106763", program: "BSIT" });
  view.bindings.verifyStudentScan = async () => { view.calls.push(["verifyStudent"]); return { isSuccess: true, data: { entryStatus: "Valid", isValid: true } }; };
  await callback("features/qr/pages/ScanQrPage.tsx", "handleBarcodeScanned", view.bindings)({ data: "2023106763,Juan,BSIT" });
  assert.deepEqual(view.calls.map(call => call[0]), ["verifyStudent"]); assert.equal(view.dialogs.length, 0);
});
