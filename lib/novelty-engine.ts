import type { AttackCategory, NovelThreatConcept, PaymentRail } from "@/types/attack";

export const EMERGING_RESEARCH_CONCEPTS: NovelThreatConcept[] = [
  {
    id: "NOV-01",
    title: "Context-Adaptive Beneficiary Smurfing Swarm",
    category: "autonomous-fraud",
    status: "research",
    targetSurface: "Interbank Immediate Payment Infrastructure (UPI / IMPS / FedNow)",
    paymentRails: ["UPI", "Bank Transfer", "Wallets"],
    aiCapabilities: ["Multi-Agent AI", "Reinforcement Learning", "Graph Optimization"],
    attackChain: [
      "Target high-velocity consumer accounts",
      "Decompose target balance into randomized sub-₹5,000 transactions",
      "Deploy transient mule VPAs with active reciprocal micro-warming",
      "Dynamic routing based on live interbank timeout latency"
    ],
    expectedDetectionWeakness: "Individual transactions evade static rule thresholds; graph clustering is delayed by randomized edge insertion.",
    simulationStrategy: "Simulate multi-agent swarm varying payment intervals between 45s and 300s across 20 distinct IFSC banks.",
    defenseHypothesis: "Sub-second interbank graph stream correlation using dynamic community detection (Louvain) on temporal edges.",
    noveltyScore: 98,
    createdDate: "2026-08-31"
  },
  {
    id: "NOV-02",
    title: "Multimodal Voice + Document Dual-Factor Social Engineering",
    category: "social-engineering",
    status: "emerging",
    targetSurface: "Commercial Loan Drawdown & High-Value RTGS",
    paymentRails: ["RTGS", "NEFT", "Bank Transfer"],
    aiCapabilities: ["Voice Cloning (Zero-Shot)", "LLM Document Generation", "Video Synthesis"],
    attackChain: [
      "Scrape CFO speaking audio from public earnings webcast",
      "Synthesize urgent emergency wire instruction matching board governance format",
      "Initiate simultaneous deepfake audio call confirming document authenticity",
      "Pressure finance controller to bypass secondary physical key check"
    ],
    expectedDetectionWeakness: "Appears as an authorized internal instruction supported by multimodal verification from legitimate executive voice sample.",
    simulationStrategy: "Generate realistic high-value RTGS telemetry with acoustic frequency compression markers and out-of-band email headers.",
    defenseHypothesis: "Mandatory hardware cryptographic FIDO2 token co-signing and real-time audio spectral phase liveness analysis.",
    noveltyScore: 96,
    createdDate: "2026-08-31"
  },
  {
    id: "NOV-03",
    title: "Quantum-Resistant Synthetic Identity Collisions",
    category: "identity",
    status: "research",
    targetSurface: "Alternative Underwriting & Digital National Registries",
    paymentRails: ["Cards", "BNPL", "Wallets"],
    aiCapabilities: ["Constraint Satisfaction Modeling", "Diffusion Models"],
    attackChain: [
      "Mine public voter lists and gazettes for dormant demographic fragments",
      "Synthesize composite identity tuples that mathematically maximize bureau match distance",
      "Maintain active low-utilization credit line for 180 days across 3 fintechs",
      "Simultaneous credit line liquidation followed by complete persona abandonment"
    ],
    expectedDetectionWeakness: "Bypasses legacy deduplication rules by exploiting partial fuzzy string matching tolerance windows.",
    simulationStrategy: "Simulate 500 composite applicant profiles with varying attribute overlap across 4 credit bureaus.",
    defenseHypothesis: "Deterministic biometric vector hashing and cross-institution federated identity graph resolution.",
    noveltyScore: 94,
    createdDate: "2026-08-31"
  },
  {
    id: "NOV-04",
    title: "Headless Browser Canvas Jitter & RF Emulation",
    category: "behavioral-device",
    status: "emerging",
    targetSurface: "Mobile & Web Payment Checkouts",
    paymentRails: ["Cards", "UPI", "Wallets"],
    aiCapabilities: ["Physics-Based Simulation", "GANs", "Browser Automation"],
    attackChain: [
      "Emulate mobile browser WebGL context with synthetic GPU shader latency",
      "Inject human-like Bezier curve mouse jitter and neuromuscular micro-tremors",
      "Spoof ambient cell tower RF noise metrics matching victim's commute path",
      "Execute card-on-file checkout without triggering device trust challenges"
    ],
    expectedDetectionWeakness: "Device fingerprint matches high-reputation consumer profile; behavioral score satisfies human threshold.",
    simulationStrategy: "Inject synthetic touch/mouse coordinates with varying entropy into simulated payment checkout streams.",
    defenseHypothesis: "Multi-sensor dynamic challenge injection (requesting interactive UI physical movement) + TLS stack fingerprinting.",
    noveltyScore: 95,
    createdDate: "2026-08-31"
  }
];

export function generateNovelThreatFamily(params: {
  category: AttackCategory;
  rail: PaymentRail;
  aiCapability: string;
  focusArea: string;
}): NovelThreatConcept {
  const count = Math.floor(Math.random() * 900 + 100);
  const id = `NOV-GEN-${count}`;
  const title = `Autonomous ${params.focusArea || "Adversarial"} ${params.category.replace("-", " ").toUpperCase()} Framework`;

  return {
    id,
    title,
    category: params.category,
    status: "research",
    targetSurface: `${params.rail} Infrastructure & Digital Gateways`,
    paymentRails: [params.rail],
    aiCapabilities: [params.aiCapability, "Reinforcement Learning", "Multi-Agent AI"],
    attackChain: [
      `Enumerate ${params.rail} API rate-limit and validation boundaries`,
      `Synthesize adaptive attack payload leveraging ${params.aiCapability}`,
      "Execute low-noise probing transactions to test detector boundary",
      "Orchestrate coordinated exfiltration using automated routing"
    ],
    expectedDetectionWeakness: `Exploits timing and contextual feature blind spots in traditional single-rail ${params.rail} monitors.`,
    simulationStrategy: `Simulate high-fidelity synthetic ${params.rail} transaction streams with dynamic feature mutation.`,
    defenseHypothesis: `Deploy real-time cross-feature anomaly scoring and stochastic thresholding on ${params.rail} gateways.`,
    noveltyScore: Math.floor(Math.random() * 10 + 90),
    createdDate: new Date().toISOString().split("T")[0]
  };
}

