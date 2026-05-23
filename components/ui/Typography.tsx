import { Text, type TextProps } from "react-native";

function cn(...parts: (string | undefined | false)[]) {
  return parts.filter(Boolean).join(" ");
}

/** Helper to check if className contains a custom color class */
const hasCustomColor = (className?: string) => {
  if (!className) return false;
  const classes = className.split(" ");
  return classes.some(
    (c) =>
      c.startsWith("text-") &&
      !c.startsWith("text-xs") &&
      !c.startsWith("text-sm") &&
      !c.startsWith("text-base") &&
      !c.startsWith("text-lg") &&
      !c.startsWith("text-xl") &&
      !c.startsWith("text-2xl") &&
      !c.startsWith("text-[")
  );
};

/** Large screen titles */
export function Title(props: TextProps) {
  const defaultColor = hasCustomColor(props.className) ? "" : "text-light-text";
  return (
    <Text
      {...props}
      className={cn(
        "font-black text-2xl leading-8 tracking-tight",
        defaultColor,
        props.className
      )}
    />
  );
}

/** Section headings */
export function Heading(props: TextProps) {
  const defaultColor = hasCustomColor(props.className) ? "" : "text-light-text";
  return (
    <Text
      {...props}
      className={cn(
        "font-heavy text-lg leading-7",
        defaultColor,
        props.className
      )}
    />
  );
}

/** Primary readable body text */
export function Body(props: TextProps) {
  const defaultColor = hasCustomColor(props.className) ? "" : "text-light-text";
  return (
    <Text
      {...props}
      className={cn(
        "font-book text-base leading-6",
        defaultColor,
        props.className
      )}
    />
  );
}

/** Secondary supporting text */
export function Caption(props: TextProps) {
  const defaultColor = hasCustomColor(props.className) ? "" : "text-light-muted";
  return (
    <Text
      {...props}
      className={cn(
        "font-book text-base leading-5",
        defaultColor,
        props.className
      )}
    />
  );
}

/** Labels / form text */
export function Label(props: TextProps) {
  const defaultColor = hasCustomColor(props.className) ? "" : "text-light-text";
  return (
    <Text
      {...props}
      className={cn(
        "font-heavy text-base leading-5",
        defaultColor,
        props.className
      )}
    />
  );
}
