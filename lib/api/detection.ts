import { backendFetch } from "./client";
import type { SimulationConfig } from "./simulations";

export async function detectSimulation(config: SimulationConfig) {
  return backendFetch<{
    experiment_id: string; model_version: string; metrics: Record<string, number>;
    thresholds: Array<Record<string, number>>; by_attack: Record<string, Record<string, number>>;
    by_family: Record<string, Record<string, number>>; by_difficulty: Record<string, Record<string, number>>;
    by_rail: Record<string, Record<string, number>>; events: number; test_events: number;
    sample_predictions: Array<Record<string, unknown>>;
  }>("/api/detect", { method: "POST", body: JSON.stringify(config) });
}

export async function predictEvents(events: Record<string, unknown>[], threshold = .5, seed = 829134) {
  return backendFetch<{ model_version: string; threshold: number; count: number; results: Array<Record<string, unknown>> }>(
    "/api/predict", { method: "POST", body: JSON.stringify({ events, threshold, seed }) }
  );
}

export async function getCurrentModel() {
  return backendFetch<{ available: boolean; version: string; features?: string[]; feature_importance?: Record<string, number> }>("/api/models/current");
}
