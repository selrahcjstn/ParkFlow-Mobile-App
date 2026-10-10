import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import vm from "node:vm";
import ts from "typescript";

const require = createRequire(import.meta.url);
const tokens = require("../tailwind.config.js").theme.extend.colors;

function load(path, overrides = {}) {
  const code = ts.transpileModule(readFileSync(new URL(`../${path}`, import.meta.url), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  const exports = {};
  vm.runInNewContext(code, { exports, require(name) {
    if (name in overrides) return overrides[name];
    if (name === "react/jsx-runtime") return require(name);
    if (name === "react") return {
      useState: initial => [typeof initial === "function" ? initial() : initial, () => {}],
      useCallback: callback => callback, useMemo: callback => callback(), useEffect() {},
    };
    if (name === "react-native") return {
      ActivityIndicator: "ActivityIndicator", View: "View", Text: "Text", TouchableOpacity: "TouchableOpacity",
      RefreshControl: "RefreshControl", Animated: { Value: function () {}, ScrollView: "ScrollView", event() {} },
    };
    if (name === "@/hooks/useAppTheme") return { useAppTheme: () => ({ isDark: false, colors: tokens.light }) };
    if (name === "expo-router") return { useSegments: () => [], useFocusEffect() {}, Tabs: { Screen: "Screen" }, router: {} };
    if (name === "lucide-react-native") return { Search: "Search", CalendarDays: "CalendarDays" };
    if (name === "@/components/layouts") return { ContentWrapper: "ContentWrapper", DashboardHeader: "DashboardHeader", TabHeader: "TabHeader" };
    if (name === "react-native-safe-area-context") return { useSafeAreaInsets: () => ({ top: 0, bottom: 0 }) };
    if (name === "@/hooks/useTabBarHeight") return { useTabBarHeight: () => 64 };
    if (name === "@/features/session/store/parking-session.store") return { useParkingSessionStore: () => ({ getParkingSessionStats() {} }) };
    return { __esModule: true, default: name };
  } });
  return exports.default;
}

function nodesOf(root) {
  const nodes = [];
  function visit(node) {
    if (Array.isArray(node)) return node.forEach(visit);
    if (node?.props) { nodes.push(node); visit(node.props.children); }
  }
  visit(root);
  return nodes;
}

test("shared buttons keep sentence-case labels compact and constrain long text", () => {
  const Button = load("components/ui/AppButton.tsx");
  const nodes = nodesOf(Button({ label: "Employee ID verification", uppercase: false, size: "sm", icon: "Icon" }));
  assert.match(nodes[0].props.className, /min-h-\[44px\]/);
  assert.equal(nodes[0].props.accessibilityRole, "button");
  assert.ok(nodes.some(n => /max-w-full/.test(n.props.className ?? "")));
  const label = nodes.find(n => n.type === "Text").props;
  assert.match(label.className, /shrink text-center/);
  assert.match(label.className, /tracking-normal/);
  assert.doesNotMatch(label.className, /tracking-widest|uppercase/);
});

test("loading and disabled buttons preserve busy states and maroon-theme contrast", () => {
  const Button = load("components/ui/AppButton.tsx", {
    "@/hooks/useAppTheme": { useAppTheme: () => ({ isDark: true, colors: tokens.dark }) },
  });
  const busy = nodesOf(Button({ label: "Process Exit", loading: true, variant: "primary" }));
  assert.equal(busy[0].props.disabled, true);
  assert.equal(busy[0].props.accessibilityState.busy, true);
  assert.equal(busy.find(n => n.type === "ActivityIndicator").props.color, tokens.dark.background);
  assert.match(busy[0].props.className, /bg-light-primary dark:bg-dark-primary/);
  const ready = nodesOf(Button({ label: "Process Exit", variant: "primary" }));
  assert.match(ready.find(n => n.type === "Text").props.className, /dark:text-dark-background/);
  assert.equal(nodesOf(Button({ label: "Next", disabled: true }))[0].props.accessibilityState.disabled, true);
});

test("guard reservation search has a themed outlined action and still opens paginated reservations", () => {
  for (const totalCount of [0, 5, 6]) {
    const routes = [];
    const Home = load("features/guard/pages/GuardHomePage.tsx", {
      "../hooks/useTodayReservations": { useTodayReservations: () => ({ data: { totalCount, items: [] }, refetch() {} }) },
      "expo-router": { router: { push: path => routes.push(path) }, useFocusEffect() {} },
    });
    const button = nodesOf(Home()).find(n => n.props.accessibilityLabel === "Search or view all today's reservations").props;
    assert.equal(button.label, totalCount > 5 ? "View all" : "Search");
    assert.equal(button.variant, "outline");
    assert.equal(button.uppercase, false);
    assert.equal(button.icon.type, "Search");
    assert.match(button.textClassName, /text-light-primary dark:text-dark-primary/);
    button.onPress();
    assert.deepEqual(routes, ["/(guard)/reservations"]);
  }
});

test("Parking hours navigation label fits one line and keeps the student label unchanged", () => {
  for (const profileType of ["personnel", "student"]) {
    const Tabs = load("app/(users)/(tabs)/_layout.tsx", {
      "@/features/auth/store/auth.store": { useAuthStore: () => ({ user: { profileType } }) },
    });
    const screen = nodesOf(Tabs()).find(n => n.props.name === "schedule");
    const label = screen.props.options.tabBarLabel({ color: tokens.light.primary });
    assert.equal(label.props.children, profileType === "personnel" ? "Parking hours" : "Schedule");
    assert.equal(label.props.numberOfLines, 1);
    assert.equal(label.props.adjustsFontSizeToFit, true);
    assert.equal(label.props.style.color, tokens.light.primary);
  }
});
