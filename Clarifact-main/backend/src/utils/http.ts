export function asString(v: string | string[] | undefined): string | undefined {
  if (typeof v === "string") return v;
  if (Array.isArray(v)) return v[0];
  return undefined;
}

export function requireStringParam(v: string | string[] | undefined, name: string) {
  const s = asString(v);
  if (!s) throw new Error(`Missing param: ${name}`);
  return s;
}

