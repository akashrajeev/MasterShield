export type AttackCategory = "identity" | "social-engineering" | "account-takeover" | "merchant" | "transaction-evasion" | "mule-aml";
export type Severity = "low" | "medium" | "high" | "critical";
export type EvidenceStatus = "documented" | "emerging" | "research" | "hypothetical";
export type SimulationStatus = "ready" | "in-development" | "research-only" | "not-simulated";

export type AttackEvidence = { sourceType: string; title: string; publisher: string; publicationDate?: string; url?: string; summary: string };
export type AttackLifecycleStep = { step: number; title: string; description: string };
export type SimulationProfile = { attackId: string; generatorId: string; available: boolean; generatedFeatures: string[]; supportedRails: string[]; defaultVolume: number; maxVolume: number; version: string };
export type DefenseMapping = { attackId: string; observableSignals: string[]; detectionMethods: string[]; mitigationActions: string[] };

export type Attack = {
  id: string; name: string; category: AttackCategory; description: string; paymentRails: string[]; aiCapabilities: string[];
  severity: Severity; evidenceStatus: EvidenceStatus; difficulty: "low" | "medium" | "high" | "very-high";
  target: string[]; financialImpact: string; scalability: "low" | "medium" | "high"; detectionDifficulty: "low" | "medium" | "high";
  simulationStatus: SimulationStatus; generatorId?: string; defenseStrategy: string[]; observableSignals: string[];
  relatedAttackIds: string[]; attackChainIds: string[]; evidence: AttackEvidence[]; lifecycle: AttackLifecycleStep[]; createdAt: string; updatedAt: string;
};
