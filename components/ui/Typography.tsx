import { Text, type TextProps } from "react-native";

function cn(...parts: (string | undefined | false)[]) {
  return parts.filter(Boolean).join(" ");
}

/** Large screen titles */
export function Title(props: TextProps) {
  return (
    <Text
      {...props}
      className={cn(
        "font-black text-2xl leading-8 text-light-text tracking-tight",
        props.className,
      )}
    />
  );
}

/** Section headings */
export function Heading(props: TextProps) {
  return (
    <Text
      {...props}
      className={cn(
        "font-heavy text-lg leading-7 text-light-text",
        props.className,
      )}
    />
  );
}

/** Primary readable body text */
export function Body(props: TextProps) {
  return (
    <Text
      {...props}
      className={cn(
        "font-book text-base leading-6 text-light-text",
        props.className,
      )}
    />
  );
}

/** Secondary supporting text */
export function Caption(props: TextProps) {
  return (
    <Text
      {...props}
      className={cn(
        "font-book text-base leading-5 text-light-muted",
        props.className,
      )}
    />
  );
}

/** Labels / form text */
export function Label(props: TextProps) {
  return (
    <Text
      {...props}
      className={cn(
        "font-heavy text-base leading-5 text-light-text",
        props.className,
      )}
    />
  );
}
