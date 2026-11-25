import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { fetch } from "@/core/api/fetcher";
import { useAuth } from "@/core/auth/AuthProvider";
import { getBackendBaseURL } from "@/core/config";

import type { InstallationList, PluginManifest } from "./types";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(
    `${getBackendBaseURL()}/api/capabilities/${path}`,
    init,
  );
  if (!response.ok) {
    const error = (await response.json().catch(() => null)) as {
      detail?: unknown;
    } | null;
    throw new Error(
      typeof error?.detail === "string"
        ? error.detail
        : `Capability request failed (${response.status})`,
    );
  }
  return response.json() as Promise<T>;
}
export function useCapabilityCatalog() {
  return useQuery({
    queryKey: ["capabilities", "catalog"],
    queryFn: () => request<PluginManifest[]>("catalog"),
    staleTime: 60_000,
  });
}
export type CapabilityInstallationScope = "deployment" | "user" | "all";

export function useCapabilityInstallations(
  adapter: string,
  scope: CapabilityInstallationScope = "all",
) {
  const { user } = useAuth();
  return useQuery(installationQuery(adapter, user?.id, scope));
}
export function useInstallCapability() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (body: {
      plugin_id: string;
      name: string;
      configuration: Record<string, unknown>;
    }) =>
      request<InstallationList>("installations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...body, scope: "user" }),
      }),
    onSuccess: async () => {
      await Promise.all([
        client.invalidateQueries({ queryKey: ["capabilities"] }),
        client.invalidateQueries({ queryKey: ["mcpConfig"] }),
        client.invalidateQueries({ queryKey: ["skills"] }),
      ]);
    },
  });
}

export function installationQuery(
  adapter: string,
  userId?: string,
  scope: CapabilityInstallationScope = "all",
) {
  return {
    queryKey:
      scope === "all"
        ? ["capabilities", "installations", adapter, userId]
        : ["capabilities", "installations", adapter, userId, scope],
    queryFn: () =>
      request<InstallationList>(
        `installations/${encodeURIComponent(adapter)}?scope=${encodeURIComponent(scope)}`,
      ),
  };
}
