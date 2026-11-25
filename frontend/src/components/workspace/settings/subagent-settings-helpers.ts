export type OptionalNameListMode = "all" | "none" | "selected";
export type McpPluginsMode = "inherit" | "none" | "selected";

export function optionalNameListToDraft(value: string[] | null): {
  mode: OptionalNameListMode;
  text: string;
} {
  if (value == null) return { mode: "all", text: "" };
  if (value.length === 0) return { mode: "none", text: "" };
  return { mode: "selected", text: value.join(", ") };
}

export function optionalNameListFromDraft(
  mode: OptionalNameListMode,
  text: string,
): string[] | null {
  if (mode === "all") return null;
  if (mode === "none") return [];
  const values = text
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  return Array.from(new Set(values));
}

export function mcpPluginsToDraft(value: string[] | null | undefined): {
  mode: McpPluginsMode;
  selected: string[];
} {
  if (value == null) return { mode: "inherit", selected: [] };
  if (value.length === 0) return { mode: "none", selected: [] };
  return { mode: "selected", selected: Array.from(new Set(value)) };
}

export function mcpPluginsFromDraft(
  mode: McpPluginsMode,
  selected: string[],
): string[] | null {
  if (mode === "inherit") return null;
  if (mode === "none") return [];
  return Array.from(
    new Set(selected.map((item) => item.trim()).filter(Boolean)),
  );
}

export function sameOptionalStringList(
  left: string[] | null | undefined,
  right: string[] | null | undefined,
): boolean {
  const a = left ?? null;
  const b = right ?? null;
  if (a === null || b === null) return a === b;
  const setA = new Set(a);
  const setB = new Set(b);
  return setA.size === setB.size && [...setA].every((id) => setB.has(id));
}

export function positiveInteger(value: string): number | null {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

export function isValidManagedSubagentName(value: string): boolean {
  return /^[A-Za-z0-9-]+$/.test(value.trim());
}
