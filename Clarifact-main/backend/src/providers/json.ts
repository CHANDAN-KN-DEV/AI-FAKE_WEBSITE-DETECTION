export function safeJsonParse(rawText: string): unknown {
  const trimmed = rawText.trim();
  try {
    return JSON.parse(trimmed);
  } catch {
    // attempt to extract first {...} or [...]
    const firstObj = trimmed.indexOf("{");
    const lastObj = trimmed.lastIndexOf("}");
    if (firstObj !== -1 && lastObj !== -1 && lastObj > firstObj) {
      const slice = trimmed.slice(firstObj, lastObj + 1);
      try {
        return JSON.parse(slice);
      } catch {
        // fall through
      }
    }
    const firstArr = trimmed.indexOf("[");
    const lastArr = trimmed.lastIndexOf("]");
    if (firstArr !== -1 && lastArr !== -1 && lastArr > firstArr) {
      const slice = trimmed.slice(firstArr, lastArr + 1);
      try {
        return JSON.parse(slice);
      } catch {
        // fall through
      }
    }
    return { parseError: true, rawText };
  }
}

export function nowMs() {
  return Date.now();
}

