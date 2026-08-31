import type { AttackCategory } from "@/types/attack";

export const categoryLabel: Record<AttackCategory, string> = {
  identity: "Identity & KYC",
  "social-engineering": "Social Engineering",
  "account-takeover": "Account Takeover",
  merchant: "Merchant & Commerce",
  "transaction-evasion": "Transaction Evasion",
  "mule-aml": "Mule & Money Laundering",
  "payment-instrument": "Payment Instrument Abuse",
  "api-abuse": "API & Digital Rail Abuse",
  "behavioral-device": "Behavioral & Device Evasion",
  "cross-channel": "Cross-Channel Fraud",
  "autonomous-fraud": "AI Agent & Autonomous Fraud",
  "synthetic-content": "Synthetic Content & Docs",
};
