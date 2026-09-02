import type { ServiceLedgerRow } from "@/lib/types/identity";

/**
 * Vertex operational identity. Not implemented in this repository.
 * Returns empty until worker_service_history is connected.
 */
export async function getVerifiedWorkHistory(profileId: string): Promise<ServiceLedgerRow[]> {
  void profileId;
  return [];
}

export const vertexHireAvailable = false;
export const vertexQuoteAvailable = false;
