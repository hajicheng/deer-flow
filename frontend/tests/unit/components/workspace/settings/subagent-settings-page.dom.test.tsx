import { afterEach, describe, expect, it, rs } from "@rstest/core";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";

import { SubagentSettingsPage } from "@/components/workspace/settings/subagent-settings-page";
import { enUS } from "@/core/i18n/locales/en-US";
import type { Subagent } from "@/core/subagents";

const {
  useSubagents,
  useCreateManagedSubagent,
  useUpdateManagedSubagent,
  useDeleteManagedSubagent,
  useCapabilityInstallations,
} = rs.hoisted(() => ({
  useSubagents: rs.fn(),
  useCreateManagedSubagent: rs.fn(),
  useUpdateManagedSubagent: rs.fn(),
  useDeleteManagedSubagent: rs.fn(),
  useCapabilityInstallations: rs.fn(),
}));

rs.mock("@/core/auth/AuthProvider", () => ({
  useAuth: () => ({ user: { id: "admin-1", system_role: "admin" } }),
}));
rs.mock("@/core/i18n/hooks", () => ({
  useI18n: () => ({ locale: "en-US", t: enUS }),
}));
rs.mock("@/core/models/hooks", () => ({
  useModels: () => ({ models: [{ name: "gpt-5", display_name: "GPT-5" }] }),
}));
rs.mock("@/core/subagents", () => ({
  useSubagents,
  useCreateManagedSubagent,
  useUpdateManagedSubagent,
  useDeleteManagedSubagent,
}));
rs.mock("@/core/capabilities/hooks", () => ({
  useCapabilityInstallations,
}));
rs.mock("sonner", () => ({
  toast: { success: rs.fn(), error: rs.fn() },
}));
rs.mock("@/components/ui/dialog", () => ({
  Dialog: ({ open, children }: { open: boolean; children: React.ReactNode }) =>
    open ? <div>{children}</div> : null,
  DialogContent: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  DialogDescription: ({ children }: { children: React.ReactNode }) => (
    <p>{children}</p>
  ),
  DialogFooter: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  DialogHeader: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  DialogTitle: ({ children }: { children: React.ReactNode }) => (
    <h2>{children}</h2>
  ),
}));
rs.mock("@/components/ui/select", () => ({
  Select: ({
    value,
    onValueChange,
    children,
  }: {
    value: string;
    onValueChange: (value: string) => void;
    children: React.ReactNode;
  }) => (
    <select
      aria-label="select"
      value={value}
      onChange={(event) => onValueChange(event.target.value)}
    >
      {children}
    </select>
  ),
  SelectTrigger: () => null,
  SelectValue: () => null,
  SelectContent: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
  SelectItem: ({
    value,
    children,
  }: {
    value: string;
    children: React.ReactNode;
  }) => <option value={value}>{children}</option>,
}));

afterEach(() => {
  cleanup();
  useSubagents.mockReset();
  useCreateManagedSubagent.mockReset();
  useUpdateManagedSubagent.mockReset();
  useDeleteManagedSubagent.mockReset();
  useCapabilityInstallations.mockReset();
});

function setup(subagents: Subagent[]) {
  const createMutateAsync = rs.fn().mockResolvedValue({});
  const updateMutateAsync = rs.fn().mockResolvedValue({});
  useSubagents.mockReturnValue({
    subagents,
    isLoading: false,
    error: null,
  });
  useCreateManagedSubagent.mockReturnValue({
    mutateAsync: createMutateAsync,
    isPending: false,
  });
  useUpdateManagedSubagent.mockReturnValue({
    mutateAsync: updateMutateAsync,
    isPending: false,
  });
  useDeleteManagedSubagent.mockReturnValue({
    mutateAsync: rs.fn().mockResolvedValue(undefined),
    isPending: false,
  });
  useCapabilityInstallations.mockReturnValue({
    data: {
      items: [
        {
          id: "jira-id",
          name: "Jira",
          installed: true,
          selectable: true,
          enabled: true,
        },
        {
          id: "db-id",
          name: "Postgres",
          installed: true,
          selectable: true,
          enabled: false,
        },
      ],
    },
    isLoading: false,
    isError: false,
  });
  return { createMutateAsync, updateMutateAsync };
}

describe("SubagentSettingsPage MCP plugin selector", () => {
  it("queries deployment-scoped MCP installations and creates with selected plugin IDs", async () => {
    const { createMutateAsync } = setup([]);
    render(<SubagentSettingsPage />);

    fireEvent.click(screen.getByText(enUS.settings.subagents.create));

    expect(useCapabilityInstallations).toHaveBeenCalledWith(
      "mcp",
      "deployment",
    );

    fireEvent.change(screen.getByLabelText(/^Name/), {
      target: { value: "jira-worker" },
    });
    fireEvent.change(
      screen.getByLabelText(enUS.settings.subagents.descriptionLabel),
      { target: { value: "Handles Jira" } },
    );
    fireEvent.change(
      screen.getByLabelText(enUS.settings.subagents.systemPrompt),
      { target: { value: "Search Jira." } },
    );

    const selects = screen.getAllByRole("combobox");
    const mcpSelect = selects[3]!;
    fireEvent.change(mcpSelect, { target: { value: "selected" } });

    const jiraCheckbox = screen.getByLabelText<HTMLInputElement>("Jira");
    expect(jiraCheckbox.checked).toBe(false);
    fireEvent.click(jiraCheckbox);

    fireEvent.click(screen.getByText(enUS.common.save));

    await waitFor(() => {
      expect(createMutateAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "jira-worker",
          mcp_plugins: ["jira-id"],
        }),
      );
    });
  });

  it("omits unchanged mcp_plugins on unrelated edits even when a saved plugin is missing", async () => {
    const existing: Subagent = {
      name: "specialist",
      display_name: "Specialist",
      description: "Old description",
      system_prompt: "Work.",
      tools: null,
      disallowed_tools: ["task", "ask_clarification", "present_files"],
      skills: null,
      mcp_plugins: ["removed-id"],
      model: "inherit",
      max_turns: 50,
      timeout_seconds: 900,
      enabled: true,
      source: "managed",
      editable: true,
      conflict: false,
      config_overrides: {},
    };
    const { updateMutateAsync } = setup([existing]);
    render(<SubagentSettingsPage />);

    fireEvent.click(screen.getByRole("button", { name: enUS.common.edit }));

    const missingCheckbox = screen.getByLabelText<HTMLInputElement>(
      `removed-id (${enUS.settings.subagents.missing})`,
    );
    expect(missingCheckbox.checked).toBe(true);

    fireEvent.change(
      screen.getByLabelText(enUS.settings.subagents.descriptionLabel),
      { target: { value: "Updated description" } },
    );
    fireEvent.click(screen.getByText(enUS.common.save));

    await waitFor(() => {
      expect(updateMutateAsync).toHaveBeenCalledTimes(1);
    });
    const sent = updateMutateAsync.mock.calls[0]?.[0]?.request as Record<
      string,
      unknown
    >;
    expect(sent.description).toBe("Updated description");
    expect("mcp_plugins" in sent).toBe(false);
  });
});
