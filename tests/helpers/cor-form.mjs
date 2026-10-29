import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import vm from 'node:vm';
import ts from 'typescript';
const require = createRequire(import.meta.url);
export function loadCor(path, mocks = {}, globals = {}) {
  const code = ts.transpileModule(readFileSync(new URL('../../' + path, import.meta.url), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX }
  }).outputText;
  const exports = {};
  vm.runInNewContext(code, { exports, console, setTimeout, clearTimeout, ...globals, require(name) {
    if (name in mocks) return mocks[name]?.default ? { __esModule: true, ...mocks[name] } : mocks[name];
    if (name === 'react/jsx-runtime') return require(name);
    throw new Error('Unexpected COR test import: ' + name);
  } });
  return exports;
}
export function hooks() {
  const slots = []; let index = 0; const effects = [];
  return { react: {
    useState(initial) { const slot = index++; slots[slot] ||= { value: typeof initial === 'function' ? initial() : initial };
      return [slots[slot].value, change => { slots[slot].value = typeof change === 'function' ? change(slots[slot].value) : change; }]; },
    useRef(initial) { const slot = index++; return slots[slot] ||= { current: initial }; },
    useCallback(fn) { index++; return fn; },
    useEffect(fn, deps) { const slot = index++; const previous = slots[slot];
      if (!previous || !deps || deps.some((d, i) => !Object.is(d, previous.deps?.[i]))) {
        slots[slot] = { deps, cleanup: previous?.cleanup }; effects.push(() => { previous?.cleanup?.(); slots[slot].cleanup = fn(); });
      }
    }
  }, render(fn) { index = 0; const result = fn(); effects.splice(0).forEach(fn => fn()); return result; },
    dispose() { slots.forEach(slot => slot?.cleanup?.()); } };
}
export function nodes(tree) {
  const result = [];
  function visit(node) { if (Array.isArray(node)) return node.forEach(visit); if (node?.props) { result.push(node); visit(node.props.children); } }
  visit(tree); return result;
}
export const courses = loadCor('constants/courses.ts');
export const days = loadCor('constants/scheduleDays.ts');
export const mapping = loadCor('features/auth/utils/corStudentMapping.ts', { '@/constants/courses': courses, '@/constants/scheduleDays': days });
export const ready = { recordId: 'cor-record', version: 3, status: 'NeedsReview', documentUrl: 'uploads/parkflow/cor/scanned.pdf',
  canConfirm: true, canConfirmSchedule: true, fetchRequested: true, issues: [], items: [{ dayOfWeek: 1, startTime: '07:00:00', endTime: '10:00:00' }, { dayOfWeek: 1, startTime: '14:00:00', endTime: '17:00:00' }],
  studentInformation: { fullName: 'Example, Juan R.', firstName: 'Juan', lastName: 'Example', middleName: 'R.',
    studentNumber: '2023000001', college: 'CICT', course: 'Bachelor of Science in Information Technology', yearLevel: 4,
    section: '4A', academicYear: '2026-2027', semester: '1st Semester' } };
