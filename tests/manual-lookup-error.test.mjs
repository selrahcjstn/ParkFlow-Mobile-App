import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import vm from "node:vm";
import ts from "typescript";
import { AxiosError } from "axios";

const exports = {};
const source = readFileSync(new URL("../utils/manualLookupError.ts", import.meta.url), "utf8");
vm.runInNewContext(ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText, { exports, require: createRequire(import.meta.url), Error });
const { getManualLookupError } = exports;
const httpError = (status, data) => new AxiosError("Request failed", "ERR_BAD_RESPONSE", {}, {}, {
  status, data, headers: {}, config: {}, statusText: "Failed",
});

test("database/server failure is not called a connection failure or shown as a raw stack trace", () => {
  assert.equal(getManualLookupError(httpError(500, 'Npgsql.PostgresException: relation "Visitors" does not exist')),
    "ParkFlow could not check this plate. Please try again or contact an administrator.");
});
test("actual transport failure still shows connection guidance", () => {
  assert.match(getManualLookupError(new AxiosError("Network Error", "ERR_NETWORK", {}, {})), /Could not reach ParkFlow/);
});
test("expired authentication and missing endpoint have distinct messages", () => {
  assert.match(getManualLookupError(httpError(401)), /sign in again/);
  assert.match(getManualLookupError(httpError(404)), /not available on this server/);
});
test("application and validation messages are preserved", () => {
  assert.equal(getManualLookupError(new Error("Plate number is required.")), "Plate number is required.");
  assert.equal(getManualLookupError(httpError(400, { message: "Plate number is required." })), "Plate number is required.");
});
