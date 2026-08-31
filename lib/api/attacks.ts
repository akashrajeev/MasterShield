import { backendFetch } from "./client";
import type { Attack } from "@/types/attack";

export type BackendAttack = {
  id: string; name: string; family: string; description: string;
  severity: string; difficulty: string; payment_rails: string[];
  ai_capabilities: string[]; observable_signals: string[];
  defenses: string[]; novelty_score: number; evidence_status: string; generator_id: string;
};

export async function listBackendAttacks(): Promise<BackendAttack[]> {
  const data = await backendFetch<{ attacks: BackendAttack[] }>("/api/attacks");
  return data.attacks;
}

export async function getBackendAttack(id: string): Promise<BackendAttack> {
  return backendFetch<BackendAttack>(`/api/attacks/${encodeURIComponent(id)}`);
}

export async function getCatalogSummary() {
  return backendFetch<{
    attack_count: number; family_count: number; families: Record<string, number>;
    payment_rail_coverage: Record<string, number>; critical_count: number;
    very_high_difficulty_count: number; average_novelty: number; generators: Record<string, number>;
  }>("/api/catalog/summary");
}

export function adaptBackendAttack(a: BackendAttack): Attack {
  const categoryMap: Record<string, Attack["category"]> = {
    "identity-kyc": "identity", "social-engineering": "social-engineering", "account-takeover": "account-takeover",
    "merchant-commerce": "merchant", "transaction-evasion": "transaction-evasion", "mule-aml": "mule-aml",
    "payment-instrument": "payment-instrument", "api-digital": "api-abuse", "behavioral-device": "behavioral-device",
    "cross-channel": "cross-channel", "agentic-fraud": "autonomous-fraud", "synthetic-content": "synthetic-content",
  };
  const rails = a.payment_rails.map(r => r === "CARD" ? "Cards" : r === "WALLET" ? "Wallets" : r === "IMPS" ? "Bank Transfer" : r) as Attack["paymentRails"];
  return {
    id: a.id, name: a.name, description: a.description, category: categoryMap[a.family] || "cross-channel",
    paymentRails: rails, aiCapabilities: a.ai_capabilities, observableSignals: a.observable_signals,
    severity: a.severity as Attack["severity"], difficulty: a.difficulty as Attack["difficulty"],
    noveltyScore: Math.round(a.novelty_score * 100), simulationStatus: "ready", evidenceStatus: a.evidence_status as Attack["evidenceStatus"],
    detectionDifficulty: a.difficulty, target: ["Payment ecosystem"], financialImpact: "Variable", scalability: "High",
    scalabilityScore: "High", defenseStrategy: a.defenses, relatedAttackIds: [], tags: [a.generator_id],
    lifecycle: [{ step: 1, title: "Synthetic scenario", description: "Generated defensive research event sequence." }], evidence: [],
  } as Attack;
}
