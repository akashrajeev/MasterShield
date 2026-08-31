import { backendFetch } from "./client";

export async function getTransaction(transactionId: string, seed = 829134, events = 10000) {
  return backendFetch<Record<string, unknown>>(`/api/transactions/${encodeURIComponent(transactionId)}?seed=${seed}&events=${events}`);
}

export async function getTransactionAssessment(transactionId: string, seed = 829134, events = 10000, threshold = .5) {
  return backendFetch<Record<string, unknown>>(
    `/api/transactions/${encodeURIComponent(transactionId)}/assessment?seed=${seed}&events=${events}&threshold=${threshold}`
  );
}
