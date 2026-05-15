export type StringLengthProblem = {
  path: string;
  length: number;
  value: string;
};

export function validatePayloadStringLengths(
  obj: unknown,
  limit = 256,
  prefix = "",
): StringLengthProblem[] {
  const problems: StringLengthProblem[] = [];

  const walk = (val: unknown, path: string) => {
    if (val == null) return;
    if (typeof val === "string") {
      if (val.length > limit)
        problems.push({ path, length: val.length, value: val });
      return;
    }
    if (typeof val === "number" || typeof val === "boolean") return;
    if (Array.isArray(val)) {
      val.forEach((v, i) => walk(v, `${path}[${i}]`));
      return;
    }
    if (typeof val === "object") {
      Object.keys(val).forEach((k) =>
        walk((val as Record<string, unknown>)[k], path ? `${path}.${k}` : k),
      );
    }
  };

  walk(obj, prefix || "");
  return problems;
}
