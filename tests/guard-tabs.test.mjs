import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import vm from "node:vm";
import ts from "typescript";

const require = createRequire(import.meta.url);
const source = readFileSync(new URL("../app/(guard)/(tabs)/_layout.tsx", import.meta.url), "utf8");
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
}).outputText;

function renderTabBar(activeRouteName = "home") {
  const navigatedRoutes = [];
  const pushedRoutes = [];
  const dispatchedActions = [];
  const emittedEvents = [];

  const routes = [
    { key: "home-key", name: "home" },
    { key: "session-key", name: "session" },
    { key: "scan-qr-key", name: "scan-qr" },
    { key: "history-key", name: "history" },
    { key: "account-key", name: "account" },
  ];
  const activeIndex = routes.findIndex((r) => r.name === activeRouteName);

  const state = {
    index: activeIndex >= 0 ? activeIndex : 0,
    key: "tabs-state-key",
    routes,
  };

  const descriptors = {
    "home-key": { options: { title: "Home" } },
    "session-key": { options: { title: "Sessions" } },
    "scan-qr-key": { options: { title: "Scan" } },
    "history-key": { options: { title: "History" } },
    "account-key": { options: { title: "Account" } },
  };

  const navigation = {
    emit: (event) => {
      emittedEvents.push(event);
      return { defaultPrevented: false };
    },
    dispatch: (action) => {
      dispatchedActions.push(action);
    },
  };

  let capturedTabBar = null;

  const exports = {};
  vm.runInNewContext(compiled, {
    exports,
    console,
    require(name) {
      if (name === "react/jsx-runtime") return require(name);
      if (name === "react") {
        return {
          default: { createElement: () => null },
          useState: (init) => [init, () => {}],
          useMemo: (fn) => fn(),
          useCallback: (fn) => fn,
        };
      }
      if (name === "react-native") {
        return {
          Dimensions: { get: () => ({ width: 390 }) },
          Platform: { OS: "ios", select: (obj) => obj.ios },
          View: "View",
          Text: "Text",
          TouchableOpacity: "TouchableOpacity",
        };
      }
      if (name === "react-native-safe-area-context") {
        return { useSafeAreaInsets: () => ({ bottom: 34, top: 47 }) };
      }
      if (name === "react-native-svg") {
        return { default: "Svg", Path: "Path" };
      }
      if (name === "lucide-react-native") {
        return {
          Home: "Home",
          LayoutList: "LayoutList",
          ScanLine: "ScanLine",
          History: "History",
          User: "User",
        };
      }
      if (name === "@/components/layouts") {
        return { TabHeader: "TabHeader" };
      }
      if (name === "@/hooks/useAppTheme") {
        return {
          useAppTheme: () => ({
            colors: {
              background: "#0F172A",
              surface: "#1E293B",
              text: "#F8FAFC",
              muted: "#94A3B8",
              border: "#334155",
              primary: "#38BDF8",
            },
          }),
        };
      }
      if (name === "expo-router") {
        const TabsComponent = (props) => {
          if (props.tabBar) capturedTabBar = props.tabBar;
          return { type: "Tabs", props };
        };
        TabsComponent.Screen = "Tabs.Screen";
        return {
          Tabs: TabsComponent,
          router: {
            push: (path) => pushedRoutes.push(path),
            navigate: (path) => navigatedRoutes.push(path),
          },
        };
      }
      if (name === "@react-navigation/native") {
        return {
          CommonActions: {
            navigate: (payload) => ({ type: "NAVIGATE", payload }),
          },
        };
      }
      return { __esModule: true, default: name };
    },
  });

  const vdom = exports.default();
  capturedTabBar = vdom.props?.tabBar;
  assert.ok(capturedTabBar, "Custom tabBar must be registered on Tabs");

  const colors = {
    background: "#0F172A",
    surface: "#1E293B",
    text: "#F8FAFC",
    muted: "#94A3B8",
    border: "#334155",
    primary: "#38BDF8",
  };
  const tabBarElement = capturedTabBar({ state, descriptors, navigation, insets: { bottom: 34 }, colors });
  const renderedTree = typeof tabBarElement.type === "function" ? tabBarElement.type(tabBarElement.props) : tabBarElement;

  // Collect touchable elements
  const touchables = [];
  function walk(node) {
    if (!node) return;
    if (Array.isArray(node)) return node.forEach(walk);
    if (node.type === "TouchableOpacity" && node.props?.onPress) {
      touchables.push(node);
    }
    if (node.props?.children) walk(node.props.children);
  }
  walk(renderedTree);

  return {
    touchables,
    navigatedRoutes,
    pushedRoutes,
    dispatchedActions,
    emittedEvents,
  };
}

test("tapping unfocused tabs on guard layout navigates to session, history, and account", () => {
  const { touchables, navigatedRoutes, dispatchedActions } = renderTabBar("home");
  assert.equal(touchables.length, 5);

  // Tab 0: Home (already focused) -> should not trigger navigation
  touchables[0].props.onPress();
  assert.equal(navigatedRoutes.length, 0);

  // Tab 1: Sessions
  touchables[1].props.onPress();
  assert.equal(navigatedRoutes[0], "/(guard)/(tabs)/session");
  assert.equal(dispatchedActions[0].target, "tabs-state-key");
  assert.equal(dispatchedActions[0].payload.name, "session");

  // Tab 3: History (tab 2 is scan-qr)
  touchables[3].props.onPress();
  assert.equal(navigatedRoutes[1], "/(guard)/(tabs)/history");
  assert.equal(dispatchedActions[1].target, "tabs-state-key");
  assert.equal(dispatchedActions[1].payload.name, "history");

  // Tab 4: Account
  touchables[4].props.onPress();
  assert.equal(navigatedRoutes[2], "/(guard)/(tabs)/account");
  assert.equal(dispatchedActions[2].target, "tabs-state-key");
  assert.equal(dispatchedActions[2].payload.name, "account");
});

test("tapping scan-qr floating center button pushes the QR scan modal", () => {
  const { touchables, pushedRoutes } = renderTabBar("home");
  touchables[2].props.onPress();
  assert.equal(pushedRoutes[0], "/(guard)/(scan)/scan-qr");
});

test("when on session tab, tapping home navigates back to home", () => {
  const { touchables, navigatedRoutes, dispatchedActions } = renderTabBar("session");
  // Tab 0: Home is now unfocused
  touchables[0].props.onPress();
  assert.equal(navigatedRoutes[0], "/(guard)/(tabs)/home");
  assert.equal(dispatchedActions[0].payload.name, "home");
  assert.equal(dispatchedActions[0].target, "tabs-state-key");
});
