import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import vm from "node:vm";
import ts from "typescript";
import { AxiosError, CanceledError } from "axios";

const require = createRequire(import.meta.url);
const source = readFileSync(new URL("../services/axios.ts", import.meta.url), "utf8");
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;

// Execute the real interceptors with native storage/navigation replaced.
// No requests are sent to a server: each test supplies an Axios adapter.
function setup({ storageFails = false } = {}) {
  const reports = [];
  const redirects = [];
  let clears = 0;
  let logouts = 0;
  const exports = {};
  vm.runInNewContext(compiled, {
    exports,
    console: { warn() {}, error() {} },
    require(name) {
      if (name === "axios") return require("axios");
      if (name === "./storage") return { SecureStore: {
        getItemAsync: async () => {
          if (storageFails) throw new Error("Storage unavailable");
          return null;
        },
      } };
      if (name === "./apiConfig") return {
        API_URL: "https://example.invalid/api",
        getApiConfigurationError: () => null,
      };
      if (name === "./networkError") return {
        reportNetworkError: error => reports.push(error),
        clearNetworkError: () => clears++,
      };
      if (name === "@/features/auth/store/auth.store") return {
        useAuthStore: { getState: () => ({ logout: async () => logouts++ }) },
      };
      if (name === "expo-router") return { router: { replace: path => redirects.push(path) } };
      throw new Error("Unexpected import: " + name);
    },
    FormData,
  });
  return { api: exports.api, reports, redirects, get clears() { return clears; }, get logouts() { return logouts; } };
}

const networkFailure = async config => {
  throw new AxiosError("Network Error", "ERR_NETWORK", config, {});
};
const httpFailure = status => async config => {
  throw new AxiosError("Request failed", "ERR_BAD_REQUEST", config, {}, {
    data: { message: "Request failed" }, status, statusText: "Failed", headers: {}, config,
  });
};

test("manual entry network failure stays local and rejects for the form to handle", async () => {
  const state = setup();
  await assert.rejects(state.api.get("/visitors/lookup/ABC123", {
    handleNetworkErrorLocally: true, adapter: async config => {
      assert.equal(config.timeout, 15000);
      return networkFailure(config);
    },
  }));
  assert.equal(state.reports.length, 0);
});

test("other genuine transport failures still report a connection problem", async () => {
  const state = setup();
  await assert.rejects(state.api.get("/parking-logs/session-count", { adapter: networkFailure }));
  assert.equal(state.reports.length, 1);
  assert.equal(state.reports[0].kind, "network");
});

test("missing visitor endpoint is not classified as lost internet", async () => {
  const state = setup();
  await assert.rejects(state.api.get("/visitors/lookup/ABC123", { adapter: httpFailure(404) }));
  assert.equal(state.reports.length, 0);
});

test("cancellation and storage errors are not classified as lost internet", async () => {
  const cancelled = setup();
  await assert.rejects(cancelled.api.get("/visitors/lookup/ABC123", {
    adapter: async () => { throw new CanceledError(); },
  }));
  assert.equal(cancelled.reports.length, 0);
  const storage = setup({ storageFails: true });
  await assert.rejects(storage.api.get("/visitors/lookup/ABC123"));
  assert.equal(storage.reports.length, 0);
});

test("successful responses clear a stale global connection warning", async () => {
  const state = setup();
  const result = await state.api.get("/visitors/lookup/ABC123", {
    adapter: async config => ({ data: { isSuccess: true }, status: 200, statusText: "OK", headers: {}, config }),
  });
  assert.equal(result.isSuccess, true);
  assert.equal(state.clears, 1);
  assert.equal(state.api.defaults.timeout, 0); // Other workflows retain their original timeout.
});

test("expired sessions reject instead of leaving manual input loading forever", { timeout: 1000 }, async () => {
  const state = setup();
  await assert.rejects(state.api.get("/visitors/lookup/ABC123", { adapter: httpFailure(401) }));
  assert.equal(state.logouts, 1);
  assert.deepEqual(state.redirects, ["/(auth)/login"]);
  assert.equal(state.reports.length, 0);
});
