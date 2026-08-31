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
  return backendFetch<{ attack_count: number; family_count: number; families: Record<string, number>; payment_rail_coverage: Record<string, number>; critical_count: number; very_high_difficulty_count: number; average_novelty: number; generators: Record<string, number> }>("/api/catalog/summary");
}

const categoryMap: Record<string, Attack["category"]> = {
  "identity-kyc": "identity", "social-engineering": "social-engineering", "account-takeover": "account-takeover",
  "merchant-commerce": "merchant", "transaction-evasion": "transaction-evasion", "mule-aml": "mule-aml",
  "payment-instrument": "payment-instrument", "api-digital": "api-abuse", "behavioral-device": "behavioral-device",
  "cross-channel": "cross-channel", "agentic-fraud": "autonomous-fraud", "synthetic-content": "synthetic-content",
};
const railMap: Record<string, Attack["paymentRails"][number]> = { CARD: "Cards", WALLET: "Wallets", IMPS: "Bank Transfer", UPI: "UPI", NEFT: "NEFT", RTGS: "RTGS", BNPL: "BNPL", "Cross-border": "Cross-border" };

export function adaptBackendAttack(a: BackendAttack): Attack {
  return {
    id: a.id, name: a.name, category: categoryMap[a.family] || "cross-channel", description: a.description,
    paymentRails: a.payment_rails.map(r => railMap[r] || r as Attack["paymentRails"][number]), aiCapabilities: a.ai_capabilities,
    observableSignals: a.observable_signals, defenseStrategy: a.defenses, severity: a.severity as Attack["severity"],
    difficulty: a.difficulty as Attack["difficulty"], detectionDifficulty: a.difficulty as Attack["detectionDifficulty"],
    noveltyScore: Math.round(a.novelty_score * 100), evidenceStatus: (a.evidence_status === "documented" || a.evidence_status === "emerging" || a.evidence_status === "research" || a.evidence_status === "hypothetical") ? a.evidence_status : "hypothetical",
    simulationStatus: "ready", target: ["Payment ecosystem"], attackSurface: "Synthetic payment event surface", financialImpact: "Variable", scalability: "High", scalabilityScore: "high",
    relatedAttackIds: [], attackChainIds: [], generatorId: a.generator_id, tags: [a.generator_id], lifecycle: [{ step: 1, title: "Synthetic scenario", description: "Generated defensive research event sequence." }], evidence: [],
    createdAt: "2026-08-31T00:00:00Z", updatedAt: "2026-08-31T00:00:00Z",
  };
}
