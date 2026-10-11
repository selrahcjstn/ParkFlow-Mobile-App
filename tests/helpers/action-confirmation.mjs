import { readFileSync } from "node:fs";
import vm from "node:vm";
import ts from "typescript";

const code = ts.transpileModule(readFileSync(new URL("../../hooks/useActionConfirmation.ts", import.meta.url), "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;

export function loadConfirmation(react, show, onFocus) {
  const exports = {};
  vm.runInNewContext(code, { exports, require(name) {
    if (name === "react") return react;
    if (name === "@/services/app-dialog") return { appDialog: { show } };
    if (name === "expo-router") return { useFocusEffect: onFocus ?? (effect => {
      const mounted = react.useRef(false);
      if (!mounted.current) { mounted.current = true; effect(); }
    }) };
    throw new Error(`Unexpected confirmation import: ${name}`);
  } });
  return exports;
}
