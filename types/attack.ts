export type AttackCategory =
  | "identity"
  | "social-engineering"
  | "account-takeover"
  | "merchant"
  | "transaction-evasion"
  | "mule-aml"
  | "payment-instrument"
  | "api-abuse"
  | "behavioral-device"
  | "cross-channel"
  | "autonomous-fraud"
  | "synthetic-content";

export type PaymentRail =
  | "UPI"
  | "Cards"
  | "Wallets"
  | "Bank Transfer"
  | "RTGS"
  | "NEFT"
  | "BNPL"
  | "Cross-border";

export type Severity = "low" | "medium" | "high" | "critical";
export type Difficulty = "low" | "medium" | "high" | "very-high";
export type EvidenceStatus = "documented" | "emerging" | "research" | "hypothetical";
export type SimulationStatus = "ready" | "in-development" | "research-only" | "not-simulated";
export type AdaptationLevel = "static" | "adaptive" | "adversarial-rl";

export type AttackEvidence = {
  sourceType: string;
  title: string;
  publisher: string;
  publicationDate?: string;
  url?: string;
  summary: string;
};

export type AttackLifecycleStep = {
  step: number;
  title: string;
  description: string;
};

export type SimulationProfile = {
  attackId: string;
  generatorId: string;
  available: boolean;
  generatedFeatures: string[];
  supportedRails: PaymentRail[];
  defaultVolume: number;
  maxVolume: number;
  version: string;
};

export type DefenseMapping = {
  attackId: string;
  observableSignals: string[];
  detectionMethods: string[];
  mitigationActions: string[];
};

export type Attack = {
  id: string;
  name: string;
  category: AttackCategory;
  subcategory?: string;
  description: string;
  shortDescription?: string;
  detailedDescription?: string;
  paymentRails: PaymentRail[];
  attackSurface: string;
  aiCapabilities: string[];
  target: string[];
  severity: Severity;
  difficulty: Difficulty;
  noveltyScore: number; // 1-100
  scalabilityScore?: "low" | "medium" | "high";
  scalability?: string;
  expectedImpact?: Severity;
  financialImpact: string;
  evidenceStatus: EvidenceStatus;
  simulationStatus: SimulationStatus;
  detectionDifficulty: "low" | "medium" | "high" | "very-high";
  observableSignals: string[];
  defenseStrategy: string[];
  recommendedDefenses?: string[];
  lifecycle: AttackLifecycleStep[];
  tags: string[];
  relatedAttackIds: string[];
  attackChainIds: string[];
  generatorId?: string;
  evidence: AttackEvidence[];
  createdAt: string;
  updatedAt: string;
};

export type SyntheticTransaction = {
  id: string;
  timestamp: string;
  accountId: string;
  accountAgeDays: number;
  merchantId: string;
  merchantName: string;
  merchantCategory: string;
  beneficiaryId: string;
  beneficiaryNovelty: number; // 0.0 - 1.0 (1.0 = brand new never seen)
  paymentRail: PaymentRail;
  amount: number;
  currency: string;
  deviceTrustScore: number; // 0 - 100 (100 = verified known hardware)
  behavioralDeviation: number; // z-score or 0-100 anomaly level
  velocityAnomalyScore: number; // 0-100
  graphLinkageScore: number; // 0-100 mule cluster connectivity
  geographicConsistency: number; // 0-100
  syntheticContentIndicator: number; // 0-100
  attackFamily?: string;
  syntheticAttackLabel?: string;
  isFraud: boolean; // Ground truth
  modelRiskScore: number; // 0 - 100
  decision: "ALLOW" | "MONITOR" | "STEP_UP" | "BLOCK";
  shuffledIndex?: number;
  explanation: {
    primaryReason: string;
    featureContributions: { feature: string; impact: number; description: string }[];
    attackConfidence: number;
  };
};

export type DetectionMetrics = {
  totalEvents: number;
  fraudEvents: number;
  benignEvents: number;
  truePositives: number;
  falsePositives: number;
  trueNegatives: number;
  falseNegatives: number;
  precision: number;
  recall: number;
  f1Score: number;
  rocAuc: number;
  falsePositiveRate: number;
  falseNegativeRate: number;
  avgLatencyMs: number;
  threshold: number;
  confusionMatrix: {
    tp: number;
    fp: number;
    tn: number;
    fn: number;
  };
  categoryPerformance: Record<AttackCategory, { precision: number; recall: number; f1: number; count: number }>;
  railPerformance: Record<PaymentRail, { precision: number; recall: number; f1: number; count: number }>;
  difficultyPerformance: Record<Difficulty, { precision: number; recall: number; f1: number; count: number }>;
};

export type ClosedLoopRound = {
  roundNumber: number;
  roundTitle: string;
  timestamp: string;
  attacksCount: number;
  evasionTactics: string[];
  detectionF1: number;
  precision: number;
  recall: number;
  fpr: number;
  mutatedAttackFamilies: {
    family: string;
    tactic: string;
    evasionDelta: string;
    countermeasure: string;
  }[];
  defenseAdaptations: string[];
};

export type NovelThreatConcept = {
  id: string;
  title: string;
  category: AttackCategory;
  status: EvidenceStatus;
  targetSurface: string;
  paymentRails: PaymentRail[];
  aiCapabilities: string[];
  attackChain: string[];
  expectedDetectionWeakness: string;
  simulationStrategy: string;
  defenseHypothesis: string;
  noveltyScore: number;
  createdDate: string;
};
