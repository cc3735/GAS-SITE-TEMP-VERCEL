/**
 * Types for tax data ingestion services
 *
 * These use permissive index signatures because the ingestion
 * data can come in various shapes (camelCase vs snake_case, extra fields).
 * TODO: Tighten these types once ingestion data shapes are finalized.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

export interface IngestionResult {
  [key: string]: any;
  success: boolean;
  recordsProcessed: number;
}

export interface TaxBracket {
  [key: string]: any;
}

export interface TaxDeduction {
  [key: string]: any;
}

export interface TaxCredit {
  [key: string]: any;
}

export interface StateTaxInfo {
  [key: string]: any;
}
