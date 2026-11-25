import { describe, expect, it } from "@rstest/core";

import {
  isValidManagedSubagentName,
  mcpPluginsFromDraft,
  mcpPluginsToDraft,
  optionalNameListFromDraft,
  optionalNameListToDraft,
  positiveInteger,
  sameOptionalStringList,
} from "@/components/workspace/settings/subagent-settings-helpers";

describe("managed Subagent optional name lists", () => {
  it("round-trips inherit-all, deny-all, and selected as distinct states", () => {
    expect(optionalNameListToDraft(null)).toEqual({ mode: "all", text: "" });
    expect(optionalNameListToDraft([])).toEqual({ mode: "none", text: "" });
    expect(optionalNameListToDraft(["read_file", "web_search"])).toEqual({
      mode: "selected",
      text: "read_file, web_search",
    });

    expect(optionalNameListFromDraft("all", "ignored")).toBeNull();
    expect(optionalNameListFromDraft("none", "ignored")).toEqual([]);
    expect(
      optionalNameListFromDraft(
        "selected",
        " read_file, web_search, read_file ",
      ),
    ).toEqual(["read_file", "web_search"]);
  });

  it("keeps an empty selected list as [] instead of widening it to null", () => {
    expect(optionalNameListFromDraft("selected", "  ")).toEqual([]);
  });
});

describe("managed Subagent MCP plugin selection", () => {
  it("round-trips inherit, none, and selected tri-state values", () => {
    expect(mcpPluginsToDraft(null)).toEqual({ mode: "inherit", selected: [] });
    expect(mcpPluginsToDraft(undefined)).toEqual({
      mode: "inherit",
      selected: [],
    });
    expect(mcpPluginsToDraft([])).toEqual({ mode: "none", selected: [] });
    expect(mcpPluginsToDraft(["jira-id", "db-id", "jira-id"])).toEqual({
      mode: "selected",
      selected: ["jira-id", "db-id"],
    });

    expect(mcpPluginsFromDraft("inherit", ["ignored"])).toBeNull();
    expect(mcpPluginsFromDraft("none", ["ignored"])).toEqual([]);
    expect(
      mcpPluginsFromDraft("selected", [" jira-id ", "", "db-id", "jira-id"]),
    ).toEqual(["jira-id", "db-id"]);
  });

  it("compares optional plugin lists while preserving tri-state boundaries", () => {
    expect(sameOptionalStringList(null, undefined)).toBe(true);
    expect(sameOptionalStringList(null, [])).toBe(false);
    expect(sameOptionalStringList([], [])).toBe(true);
    expect(sameOptionalStringList(["a", "b"], ["b", "a"])).toBe(true);
    expect(sameOptionalStringList(["a"], ["a", "b"])).toBe(false);
  });
});

describe("managed Subagent field validation", () => {
  it("matches the backend name and positive-integer boundaries", () => {
    expect(isValidManagedSubagentName("creative-planner")).toBe(true);
    expect(isValidManagedSubagentName("../planner")).toBe(false);
    expect(isValidManagedSubagentName("creative_planner")).toBe(false);
    expect(positiveInteger("1")).toBe(1);
    expect(positiveInteger("1.5")).toBeNull();
    expect(positiveInteger("")).toBeNull();
  });
});
