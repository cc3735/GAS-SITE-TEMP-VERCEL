/**
 * Data Ingestion Scheduler
 * 
 * Coordinates and schedules data ingestion from all sources
 */

import { FederalTaxDataIngestion } from './federal-tax.js';
import { StateTaxDataIngestion } from './state-tax.js';
import { ChildSupportDataIngestion } from './child-support.js';
import { BusinessFormationIngestion } from './business-formation.js';
import { LegalTemplatesIngestion } from './legal-templates.js';
import { JurisdictionRulesIngestion } from './jurisdiction-rules.js';
import { logger } from '../../utils/logger.js';
import type { IngestionResult } from './types.js';

export class DataIngestionScheduler {
  async runFullIngestion(): Promise<Record<string, IngestionResult>> {
    const results: Record<string, IngestionResult> = {};
    const startTime = Date.now();

    logger.info('Starting full data ingestion...');

    try {
      // 1. Federal Tax Data
      logger.info('Ingesting federal tax data...');
      const federalTax = new FederalTaxDataIngestion(2024);
      results.federalTax = await federalTax.ingestAll();
      logger.info('Federal tax data completed', { stats: results.federalTax });

      // 2. State Tax Data
      logger.info('Ingesting state tax data...');
      const stateTax = new StateTaxDataIngestion(2024);
      results.stateTax = await stateTax.ingestAll();
      logger.info('State tax data completed', { stats: results.stateTax });

      // 3. Child Support Guidelines
      logger.info('Ingesting child support guidelines...');
      const childSupport = new ChildSupportDataIngestion();
      results.childSupport = await childSupport.ingestAll();
      logger.info('Child support data completed', { stats: results.childSupport });

      // 4. Business Formation Requirements
      logger.info('Ingesting business formation requirements...');
      const businessFormation = new BusinessFormationIngestion();
      results.businessFormation = await businessFormation.ingestAll();
      logger.info('Business formation data completed', { stats: results.businessFormation });

      // 5. Legal Templates
      logger.info('Ingesting legal templates...');
      const legalTemplates = new LegalTemplatesIngestion();
      results.legalTemplates = await legalTemplates.ingestAll();
      logger.info('Legal templates completed', { stats: results.legalTemplates });

      // 6. Jurisdiction Rules
      logger.info('Ingesting jurisdiction rules...');
      const jurisdictionRules = new JurisdictionRulesIngestion();
      results.jurisdictionRules = await jurisdictionRules.ingestAll();
      logger.info('Jurisdiction rules completed', { stats: results.jurisdictionRules });

      const totalDuration = Date.now() - startTime;
      const totalRecords = Object.values(results).reduce((sum, r) => sum + r.recordsProcessed, 0);
      const totalCreated = Object.values(results).reduce((sum, r) => sum + r.recordsCreated, 0);
      const totalFailed = Object.values(results).reduce((sum, r) => sum + r.recordsFailed, 0);

      logger.info('Full data ingestion completed', {
        totalRecords,
        totalCreated,
        totalFailed,
        duration: `${(totalDuration / 1000).toFixed(2)}s`,
      });

    } catch (error) {
      logger.error('Data ingestion failed', { error });
      throw error;
    }

    return results;
  }

  async runIncrementalUpdate(dataType: string): Promise<IngestionResult> {
    logger.info(`Running incremental update for ${dataType}...`);

    switch (dataType) {
      case 'federal_tax':
        return new FederalTaxDataIngestion(2024).ingestAll();
      case 'state_tax':
        return new StateTaxDataIngestion(2024).ingestAll();
      case 'child_support':
        return new ChildSupportDataIngestion().ingestAll();
      case 'business_formation':
        return new BusinessFormationIngestion().ingestAll();
      case 'legal_templates':
        return new LegalTemplatesIngestion().ingestAll();
      case 'jurisdiction_rules':
        return new JurisdictionRulesIngestion().ingestAll();
      default:
        throw new Error(`Unknown data type: ${dataType}`);
    }
  }
}

