import { backendFetch } from "./client";
import type { SimulationConfig } from "./simulations";

export async function searchAdversarial(config: SimulationConfig) {
  return backendFetch<{ simulation_id: string; findings: Record<string, unknown>[]; count: number }>(
    "/api/adversarial/search", { method: "POST", body: JSON.stringify(config) }
  );
}

export async function hardenDetector(config: SimulationConfig) {
  return backendFetch<{
    simulation_id: string; baseline: Record<string, number>; rounds: Array<Record<string, unknown>>;
    model_version: string; train_events: number; red_team_events: number; untouched_test_events: number;
  }>("/api/adversarial/harden", { method: "POST", body: JSON.stringify(config) });
}

export async function discoverThreats(limit = 12) {
  return backendFetch<{ count: number; hypotheses: Record<string, unknown>[]; safe_simulation_only: boolean }>(
    `/api/catalog/discover?limit=${limit}`
  );
}
