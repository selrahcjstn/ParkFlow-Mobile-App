import { Text, type TextProps } from "react-native";

function cn(...parts: (string | undefined | false)[]) {
  return parts.filter(Boolean).join(" ");
}

/** Screen / section headings */
export function Title(props: TextProps) {
  return (
    <Text
      {...props}
      className={cn("font-black text-xl text-light-text", props.className)}
    />
  );
}

/** Primary body copy — base size for readability */
export function Body(props: TextProps) {
  return (
    <Text
      {...props}
      className={cn("font-book text-base text-light-text", props.className)}
    />
  );
}

/** Secondary / supporting text — sm only when slightly de-emphasized */
export function Caption(props: TextProps) {
  return (
    <Text
      {...props}
      className={cn("font-medium text-sm text-light-muted", props.className)}
    />
  );
}

/** Form labels and emphasized UI labels */
export function Label(props: TextProps) {
  return (
    <Text
      {...props}
      className={cn(
        "font-semibold text-base text-light-accent",
        props.className,
      )}
    />
  );
}
