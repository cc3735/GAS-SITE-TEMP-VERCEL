/**
 * Automated Data Update Scheduler
 * 
 * Handles periodic updates of tax rules, child support guidelines,
 * and legal filing requirements to ensure data stays current.
 */

import { supabaseAdmin } from '../../utils/supabase.js';
import { logger } from '../../utils/logger.js';
import { FederalTaxDataIngestion } from '../data-ingestion/federal-tax.js';
import { StateTaxDataIngestion } from '../data-ingestion/state-tax.js';
import { ChildSupportDataIngestion } from '../data-ingestion/child-support.js';
import { BusinessFormationIngestion } from '../data-ingestion/business-formation.js';
import type { IngestionResult } from '../data-ingestion/types.js';

export interface UpdateSchedule {
  dataType: string;
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'annually';
  lastRun?: Date;
  nextRun?: Date;
  enabled: boolean;
}

export interface UpdateResult {
  dataType: string;
  status: 'success' | 'failed' | 'skipped';
  recordsUpdated: number;
  duration: number;
  error?: string;
  timestamp: Date;
}

// Default update schedules for different data types
const DEFAULT_SCHEDULES: UpdateSchedule[] = [
  { dataType: 'federal_tax', frequency: 'annually', enabled: true },
  { dataType: 'state_tax', frequency: 'annually', enabled: true },
  { dataType: 'child_support', frequency: 'quarterly', enabled: true },
  { dataType: 'business_formation', frequency: 'quarterly', enabled: true },
  { dataType: 'filing_requirements', frequency: 'monthly', enabled: true },
];

export class DataUpdateScheduler {
  private schedules: Map<string, UpdateSchedule> = new Map();
  private updateInterval: NodeJS.Timeout | null = null;

  constructor() {
    // Initialize with default schedules
    for (const schedule of DEFAULT_SCHEDULES) {
      this.schedules.set(schedule.dataType, schedule);
    }
  }

  /**
   * Start the automated update scheduler
   * Checks every hour if any updates are due
   */
  start(): void {
    logger.info('Starting data update scheduler');
    
    // Check for updates every hour
    this.updateInterval = setInterval(() => {
      this.checkAndRunUpdates();
    }, 3600000); // 1 hour

    // Also run immediately on start
    this.checkAndRunUpdates();
  }

  /**
   * Stop the scheduler
   */
  stop(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
      logger.info('Data update scheduler stopped');
    }
  }

  /**
   * Check which updates are due and run them
   */
  async checkAndRunUpdates(): Promise<void> {
    const now = new Date();
    const results: UpdateResult[] = [];

    for (const [dataType, schedule] of this.schedules) {
      if (!schedule.enabled) continue;

      const isDue = this.isUpdateDue(schedule, now);
      if (isDue) {
        logger.info(`Update due for ${dataType}`);
        const result = await this.runUpdate(dataType);
        results.push(result);

        // Update last run time
        schedule.lastRun = now;
        schedule.nextRun = this.calculateNextRun(schedule.frequency, now);
      }
    }

    // Log summary
    if (results.length > 0) {
      const successful = results.filter(r => r.status === 'success').length;
      const failed = results.filter(r => r.status === 'failed').length;
      logger.info(`Data update batch completed: ${successful} successful, ${failed} failed`);
    }
  }

  /**
   * Check if an update is due based on schedule
   */
  private isUpdateDue(schedule: UpdateSchedule, now: Date): boolean {
    if (!schedule.lastRun) return true;

    const lastRun = new Date(schedule.lastRun);
    const msSinceLastRun = now.getTime() - lastRun.getTime();
    const daysSinceLastRun = msSinceLastRun / (1000 * 60 * 60 * 24);

    switch (schedule.frequency) {
      case 'daily':
        return daysSinceLastRun >= 1;
      case 'weekly':
        return daysSinceLastRun >= 7;
      case 'monthly':
        return daysSinceLastRun >= 30;
      case 'quarterly':
        return daysSinceLastRun >= 90;
      case 'annually':
        return daysSinceLastRun >= 365;
      default:
        return false;
    }
  }

  /**
   * Calculate next run time based on frequency
   */
  private calculateNextRun(frequency: UpdateSchedule['frequency'], from: Date): Date {
    const next = new Date(from);
    switch (frequency) {
      case 'daily':
        next.setDate(next.getDate() + 1);
        break;
      case 'weekly':
        next.setDate(next.getDate() + 7);
        break;
      case 'monthly':
        next.setMonth(next.getMonth() + 1);
        break;
      case 'quarterly':
        next.setMonth(next.getMonth() + 3);
        break;
      case 'annually':
        next.setFullYear(next.getFullYear() + 1);
        break;
    }
    return next;
  }

  /**
   * Run update for a specific data type
   */
  async runUpdate(dataType: string): Promise<UpdateResult> {
    const startTime = Date.now();
    const timestamp = new Date();

    try {
      let ingestionResult: IngestionResult;
      const currentYear = new Date().getFullYear();

      switch (dataType) {
        case 'federal_tax':
          ingestionResult = await new FederalTaxDataIngestion(currentYear).ingestAll();
          break;
        case 'state_tax':
          ingestionResult = await new StateTaxDataIngestion(currentYear).ingestAll();
          break;
        case 'child_support':
          ingestionResult = await new ChildSupportDataIngestion().ingestAll();
          break;
        case 'business_formation':
          ingestionResult = await new BusinessFormationIngestion().ingestAll();
          break;
        default:
          throw new Error(`Unknown data type: ${dataType}`);
      }

      // Log the update
      await this.logUpdate({
        dataType,
        status: ingestionResult.success ? 'success' : 'failed',
        recordsUpdated: ingestionResult.recordsCreated + ingestionResult.recordsUpdated,
        duration: Date.now() - startTime,
        timestamp,
      });

      return {
        dataType,
        status: ingestionResult.success ? 'success' : 'failed',
        recordsUpdated: ingestionResult.recordsCreated + ingestionResult.recordsUpdated,
        duration: Date.now() - startTime,
        timestamp,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error(`Update failed for ${dataType}`, { error: errorMessage });

      await this.logUpdate({
        dataType,
        status: 'failed',
        recordsUpdated: 0,
        duration: Date.now() - startTime,
        error: errorMessage,
        timestamp,
      });

      return {
        dataType,
        status: 'failed',
        recordsUpdated: 0,
        duration: Date.now() - startTime,
        error: errorMessage,
        timestamp,
      };
    }
  }

  /**
   * Log update to database
   */
  private async logUpdate(result: UpdateResult): Promise<void> {
    try {
      await supabaseAdmin
        .from('lf_data_ingestion_log')
        .insert({
          data_type: result.dataType,
          source: 'automated_scheduler',
          records_processed: result.recordsUpdated,
          records_created: result.status === 'success' ? result.recordsUpdated : 0,
          records_updated: 0,
          records_failed: result.status === 'failed' ? 1 : 0,
          status: result.status === 'success' ? 'completed' : 'failed',
          error_message: result.error,
          started_at: new Date(result.timestamp.getTime() - result.duration).toISOString(),
          completed_at: result.timestamp.toISOString(),
        });
    } catch (error) {
      logger.error('Failed to log update result', { error });
    }
  }

  /**
   * Get current schedule status
   */
  getScheduleStatus(): Array<UpdateSchedule & { status: string }> {
    const now = new Date();
    const result: Array<UpdateSchedule & { status: string }> = [];

    for (const [dataType, schedule] of this.schedules) {
      const isDue = this.isUpdateDue(schedule, now);
      result.push({
        ...schedule,
        status: isDue ? 'due' : 'scheduled',
        nextRun: schedule.nextRun || this.calculateNextRun(schedule.frequency, schedule.lastRun || now),
      });
    }

    return result;
  }

  /**
   * Update schedule for a data type
   */
  updateSchedule(dataType: string, updates: Partial<UpdateSchedule>): void {
    const existing = this.schedules.get(dataType);
    if (existing) {
      this.schedules.set(dataType, { ...existing, ...updates });
      logger.info(`Schedule updated for ${dataType}`, updates);
    }
  }

  /**
   * Manually trigger an update for a data type
   */
  async triggerUpdate(dataType: string): Promise<UpdateResult> {
    logger.info(`Manual update triggered for ${dataType}`);
    return this.runUpdate(dataType);
  }

  /**
   * Get update history from database
   */
  async getUpdateHistory(limit = 50): Promise<Array<{
    id: string;
    dataType: string;
    status: string;
    recordsProcessed: number;
    startedAt: string;
    completedAt: string;
    errorMessage?: string;
  }>> {
    const { data, error } = await supabaseAdmin
      .from('lf_data_ingestion_log')
      .select('*')
      .order('completed_at', { ascending: false })
      .limit(limit);

    if (error) {
      logger.error('Failed to fetch update history', { error });
      return [];
    }

    return (data || []).map(log => ({
      id: log.id,
      dataType: log.data_type,
      status: log.status,
      recordsProcessed: log.records_processed,
      startedAt: log.started_at,
      completedAt: log.completed_at,
      errorMessage: log.error_message,
    }));
  }
}

// Export singleton instance
export const dataUpdateScheduler = new DataUpdateScheduler();

