import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import ts from "typescript";

const compiled = ts.transpileModule(
  readFileSync(new URL("../services/apiConfig.ts", import.meta.url), "utf8"),
  { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } },
).outputText;

function configuration(file) {
  const env = {};
  // Only read public API settings; do not load unrelated environment values.
  const content = readFileSync(new URL("../" + file, import.meta.url), "utf8");
  for (const key of ["EXPO_PUBLIC_API_URL", "VITE_API_URL"]) {
    env[key] = content.match(new RegExp("^" + key + "=(.*)$", "m"))?.[1].trim();
  }
  const exports = {};
  vm.runInNewContext(compiled, {
    exports,
    URL,
    process: { env },
    console,
    require(name) {
      assert.equal(name, "expo-constants");
      return { default: { expoConfig: { extra: {} } } };
    },
  });
  return { env, exports };
}

test("local development uses the local API and matching SignalR host", () => {
  const { env, exports } = configuration(".env");
  assert.equal(env.EXPO_PUBLIC_API_URL, env.VITE_API_URL);
  assert.equal(exports.API_URL, "http://192.168.100.13:5044/api");
  assert.equal(exports.SERVER_BASE_URL, "http://192.168.100.13:5044");
});

test("production remains on the deployed API", () => {
  const { exports } = configuration(".env.production");
  assert.equal(exports.API_URL, "http://54.90.173.98:5000/api");
  assert.equal(exports.SERVER_BASE_URL, "http://54.90.173.98:5000");
});
