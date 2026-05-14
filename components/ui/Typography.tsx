import { Text, TextProps } from "react-native";

export function Title(props: TextProps) {
  return (
    <Text
      {...props}
      className={`font-black text-xl text-light-text ${props.className || ""}`}
    />
  );
}

export function Body(props: TextProps) {
  return (
    <Text
      {...props}
      className={`font-book text-light-text ${props.className || ""}`}
    />
  );
}

export function Caption(props: TextProps) {
  return (
    <Text
      {...props}
      className={`font-medium text-xs text-light-muted ${props.className || ""}`}
    />
  );
}
