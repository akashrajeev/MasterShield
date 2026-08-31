import { backendFetch } from "./client";

export type SimulationConfig = {
  events: number; seed: number; attack_ids?: string[] | null; fraud_rate: number;
  difficulty: "low" | "medium" | "high" | "very-high";
  adaptation: "static" | "adaptive" | "adversarial";
  noise: "low" | "medium" | "high"; threshold: number;
};

export type SimulationResponse = {
  simulation_id: string; seed: number; events_generated: number; fraud_events: number;
  attack_count: number; graph: Record<string, unknown>; sample: Record<string, unknown>[];
};

export async function createSimulation(config: SimulationConfig) {
  return backendFetch<SimulationResponse>("/api/simulate", { method: "POST", body: JSON.stringify(config) });
}

export async function getSimulation(id: string) {
  return backendFetch<Record<string, unknown>>(`/api/simulations/${encodeURIComponent(id)}`);
}

export async function getSimulationEvents(id: string, limit = 100, offset = 0) {
  return backendFetch<{ simulation_id: string; offset: number; limit: number; total: number; events: Record<string, unknown>[] }>(
    `/api/simulations/${encodeURIComponent(id)}/events?limit=${limit}&offset=${offset}`
  );
}

export async function getSimulationResults(id: string) {
  return backendFetch<Record<string, unknown>>(`/api/simulations/${encodeURIComponent(id)}/results`);
}
