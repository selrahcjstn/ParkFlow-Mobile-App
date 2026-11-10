import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentRef,
  type ReactNode,
} from "react";
import {
  Dimensions,
  Keyboard,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  type KeyboardEvent,
  type LayoutChangeEvent,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  type ScrollViewProps,
} from "react-native";

/**
 * Keeps the focused input visible above the on-screen keyboard.
 *
 * Why not rely on the OS: this app runs edge-to-edge on Android, so `adjustResize` no longer
 * shrinks the window, and a plain ScrollView has no idea the keyboard is covering it. This
 * component measures how much of the scroll area the keyboard actually covers, pads the content
 * by exactly that amount (so the last field can scroll clear of the keyboard) and scrolls the
 * focused input into view. If the OS already resized the window the measured overlap is 0 and
 * nothing extra is added.
 */

const MARGIN_TOP = 56; // keeps the field's label visible above the input
const MARGIN_BOTTOM = 44; // keeps an error message under the input visible

type ScrollViewRef = ComponentRef<typeof ScrollView>;

interface KeyboardScrollContextValue {
  /** Scroll the currently focused input into view. Safe to call on every focus. */
  scrollToFocused: (delayMs?: number) => void;
}

const KeyboardScrollContext = createContext<KeyboardScrollContextValue | null>(null);

/** Returns null outside a KeyboardAwareScrollView, so inputs work anywhere. */
export const useKeyboardScroll = () => useContext(KeyboardScrollContext);

interface Props extends ScrollViewProps {
  children?: ReactNode;
}

export default function KeyboardAwareScrollView({
  children,
  contentContainerStyle,
  onScroll,
  onLayout,
  keyboardShouldPersistTaps = "handled",
  keyboardDismissMode,
  ...rest
}: Props) {
  const scrollRef = useRef<ScrollViewRef>(null);
  const scrollY = useRef(0);
  const viewHeight = useRef(0);
  const keyboardTop = useRef(Number.POSITIVE_INFINITY);
  const overlapRef = useRef(0);
  const [overlap, setOverlap] = useState(0);
  overlapRef.current = overlap;

  const scrollToFocused = useCallback((delayMs = 0) => {
    setTimeout(() => {
      const scroller = scrollRef.current;
      const input = (TextInput as any).State?.currentlyFocusedInput?.();
      const content = scroller?.getInnerViewRef?.();
      if (!scroller || !input || !content) return;
      input.measureLayout(
        content,
        (_x: number, y: number, _w: number, h: number) => {
          const visible = viewHeight.current - overlapRef.current;
          if (visible <= 0) return;
          const top = scrollY.current;
          let target = top;
          if (y + h + MARGIN_BOTTOM > top + visible) target = y + h + MARGIN_BOTTOM - visible;
          else if (y - MARGIN_TOP < top) target = Math.max(0, y - MARGIN_TOP);
          if (Math.abs(target - top) > 1) scroller.scrollTo({ y: target, animated: true });
        },
        () => {},
      );
    }, delayMs);
  }, []);

  const measureOverlap = useCallback(() => {
    const node = scrollRef.current?.getNativeScrollRef?.();
    if (!node || !Number.isFinite(keyboardTop.current)) return;
    node.measureInWindow((_x: number, y: number, _w: number, h: number) => {
      setOverlap(Math.max(0, Math.round(y + h - keyboardTop.current)));
    });
  }, []);

  useEffect(() => {
    const isIos = Platform.OS === "ios";
    const onShow = (event: KeyboardEvent) => {
      const { screenY, height } = event.endCoordinates;
      keyboardTop.current = screenY > 0 ? screenY : Dimensions.get("screen").height - height;
      // Let any OS-driven resize settle before measuring.
      setTimeout(measureOverlap, 60);
    };
    const onHide = () => {
      keyboardTop.current = Number.POSITIVE_INFINITY;
      setOverlap(0);
    };
    const subs = [
      Keyboard.addListener(isIos ? "keyboardWillChangeFrame" : "keyboardDidShow", (event) => {
        // iOS reports "hide" as a frame that starts at the bottom edge of the screen.
        if (isIos && event.endCoordinates.screenY >= Dimensions.get("screen").height) onHide();
        else onShow(event);
      }),
      Keyboard.addListener(isIos ? "keyboardWillHide" : "keyboardDidHide", onHide),
    ];
    return () => subs.forEach((sub) => sub.remove());
  }, [measureOverlap]);

  // Once the extra bottom space exists, bring the focused field into view.
  useEffect(() => {
    if (overlap > 0) scrollToFocused(50);
  }, [overlap, scrollToFocused]);

  const contentStyle = useMemo(() => {
    const flat = StyleSheet.flatten(contentContainerStyle) ?? {};
    const basePadding = typeof flat.paddingBottom === "number" ? flat.paddingBottom : 0;
    return [flat, { paddingBottom: basePadding + overlap }];
  }, [contentContainerStyle, overlap]);

  const context = useMemo(() => ({ scrollToFocused }), [scrollToFocused]);

  return (
    <KeyboardScrollContext.Provider value={context}>
      <ScrollView
        ref={scrollRef}
        keyboardShouldPersistTaps={keyboardShouldPersistTaps}
        // iOS: drag the keyboard down to dismiss. Android: keep the keyboard open while scrolling.
        keyboardDismissMode={keyboardDismissMode ?? (Platform.OS === "ios" ? "interactive" : "none")}
        scrollEventThrottle={16}
        onLayout={(event: LayoutChangeEvent) => {
          viewHeight.current = event.nativeEvent.layout.height;
          onLayout?.(event);
          if (Number.isFinite(keyboardTop.current)) measureOverlap();
        }}
        onScroll={(event: NativeSyntheticEvent<NativeScrollEvent>) => {
          scrollY.current = event.nativeEvent.contentOffset.y;
          onScroll?.(event);
        }}
        contentContainerStyle={contentStyle}
        {...rest}
      >
        {children}
      </ScrollView>
    </KeyboardScrollContext.Provider>
  );
}
