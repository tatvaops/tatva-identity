/**
 * Vertex operational identity lives in Tatva Vertex, not this repository.
 * These ports stay empty/false until worker history, hire and quote services are connected.
 * Do not duplicate attendance, payroll, PF/ESI, or site operations here.
 */
import type { ServiceLedgerRow } from "@/lib/types/identity";

export async function getVerifiedWorkHistory(profileId: string): Promise<ServiceLedgerRow[]> {
  void profileId;
  return [];
}

export async function getVertexReliabilitySignals(profileId: string): Promise<never[]> {
  void profileId;
  return [];
}

export const vertexHireAvailable = false;
export const vertexQuoteAvailable = false;
