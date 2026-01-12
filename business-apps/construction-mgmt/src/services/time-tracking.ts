/**
 * Time Tracking Service
 *
 * Comprehensive time tracking for construction projects:
 * - Clock in/out with GPS
 * - Timesheet management
 * - Break tracking
 * - Overtime calculations
 * - Payroll integration ready
 *
 * @module services/time-tracking
 */

import { supabase } from '../utils/supabase.js';
import { logger } from '../utils/logger.js';
import { v4 as uuidv4 } from 'uuid';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export type TimeEntryType = 'regular' | 'overtime' | 'double_time' | 'pto' | 'sick' | 'holiday';
export type ClockStatus = 'clocked_in' | 'on_break' | 'clocked_out';

export interface TimeEntry {
  id: string;
  projectId: string;
  taskId?: string;
  userId: string;
  date: string; // YYYY-MM-DD
  clockIn: Date;
  clockOut?: Date;
  breakMinutes: number;
  totalHours: number;
  regularHours: number;
  overtimeHours: number;
  doubleTimeHours: number;
  entryType: TimeEntryType;
  notes?: string;
  gpsClockIn?: { latitude: number; longitude: number };
  gpsClockOut?: { latitude: number; longitude: number };
  isBillable: boolean;
  hourlyRate?: number;
  approved: boolean;
  approvedBy?: string;
  approvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Break {
  id: string;
  timeEntryId: string;
  startTime: Date;
  endTime?: Date;
  type: 'lunch' | 'rest' | 'other';
  isPaid: boolean;
}

export interface Timesheet {
  id: string;
  userId: string;
  weekStart: string; // YYYY-MM-DD (Monday)
  weekEnd: string;   // YYYY-MM-DD (Sunday)
  status: 'draft' | 'submitted' | 'approved' | 'rejected';
  totalHours: number;
  regularHours: number;
  overtimeHours: number;
  entries: TimeEntry[];
  submittedAt?: Date;
  approvedBy?: string;
  approvedAt?: Date;
  rejectionReason?: string;
  createdAt: Date;
}

export interface OvertimeConfig {
  dailyOvertimeThreshold: number;   // hours (default 8)
  weeklyOvertimeThreshold: number;  // hours (default 40)
  dailyDoubleTimeThreshold: number; // hours (default 12)
  overtimeMultiplier: number;       // (default 1.5)
  doubleTimeMultiplier: number;     // (default 2.0)
}

export interface UserClockStatus {
  userId: string;
  status: ClockStatus;
  currentEntryId?: string;
  clockedInAt?: Date;
  currentBreakId?: string;
  breakStartedAt?: Date;
  projectId?: string;
  taskId?: string;
}

// ============================================================================
// TIME TRACKING SERVICE
// ============================================================================

export class TimeTrackingService {
  private overtimeConfig: OvertimeConfig = {
    dailyOvertimeThreshold: 8,
    weeklyOvertimeThreshold: 40,
    dailyDoubleTimeThreshold: 12,
    overtimeMultiplier: 1.5,
    doubleTimeMultiplier: 2.0,
  };

  // ==========================================================================
  // CLOCK IN/OUT
  // ==========================================================================

  /**
   * Clock in user
   */
  async clockIn(
    userId: string,
    projectId: string,
    options?: {
      taskId?: string;
      gps?: { latitude: number; longitude: number };
      notes?: string;
      hourlyRate?: number;
    }
  ): Promise<TimeEntry> {
    // Check if already clocked in
    const currentStatus = await this.getUserClockStatus(userId);
    if (currentStatus.status === 'clocked_in') {
      throw new Error('Already clocked in. Please clock out first.');
    }

    const now = new Date();
    const entry: TimeEntry = {
      id: uuidv4(),
      projectId,
      taskId: options?.taskId,
      userId,
      date: now.toISOString().split('T')[0],
      clockIn: now,
      breakMinutes: 0,
      totalHours: 0,
      regularHours: 0,
      overtimeHours: 0,
      doubleTimeHours: 0,
      entryType: 'regular',
      notes: options?.notes,
      gpsClockIn: options?.gps,
      isBillable: true,
      hourlyRate: options?.hourlyRate,
      approved: false,
      createdAt: now,
      updatedAt: now,
    };

    const { error } = await supabase.from('time_entries').insert({
      id: entry.id,
      project_id: entry.projectId,
      task_id: entry.taskId,
      user_id: entry.userId,
      date: entry.date,
      clock_in: entry.clockIn.toISOString(),
      break_minutes: entry.breakMinutes,
      total_hours: entry.totalHours,
      regular_hours: entry.regularHours,
      overtime_hours: entry.overtimeHours,
      double_time_hours: entry.doubleTimeHours,
      entry_type: entry.entryType,
      notes: entry.notes,
      gps_clock_in: entry.gpsClockIn,
      is_billable: entry.isBillable,
      hourly_rate: entry.hourlyRate,
      approved: entry.approved,
      created_at: entry.createdAt.toISOString(),
      updated_at: entry.updatedAt.toISOString(),
    });

    if (error) throw error;

    logger.info(`User ${userId} clocked in to project ${projectId}`);
    return entry;
  }

  /**
   * Clock out user
   */
  async clockOut(
    userId: string,
    options?: {
      gps?: { latitude: number; longitude: number };
      notes?: string;
    }
  ): Promise<TimeEntry> {
    const currentStatus = await this.getUserClockStatus(userId);
    if (currentStatus.status !== 'clocked_in' || !currentStatus.currentEntryId) {
      throw new Error('Not clocked in.');
    }

    // End any active break first
    if (currentStatus.status === 'on_break' && currentStatus.currentBreakId) {
      await this.endBreak(currentStatus.currentBreakId);
    }

    const now = new Date();

    // Get current entry
    const { data: entryData } = await supabase
      .from('time_entries')
      .select('*')
      .eq('id', currentStatus.currentEntryId)
      .single();

    if (!entryData) throw new Error('Time entry not found');

    // Calculate hours
    const clockIn = new Date(entryData.clock_in);
    const totalMinutes = (now.getTime() - clockIn.getTime()) / 1000 / 60;
    const workedMinutes = totalMinutes - (entryData.break_minutes || 0);
    const totalHours = workedMinutes / 60;

    // Calculate overtime
    const { regular, overtime, doubleTime } = this.calculateOvertime(totalHours, entryData.date);

    const updates = {
      clock_out: now.toISOString(),
      gps_clock_out: options?.gps,
      notes: options?.notes ? `${entryData.notes || ''}\n${options.notes}`.trim() : entryData.notes,
      total_hours: totalHours,
      regular_hours: regular,
      overtime_hours: overtime,
      double_time_hours: doubleTime,
      updated_at: now.toISOString(),
    };

    const { data: updated, error } = await supabase
      .from('time_entries')
      .update(updates)
      .eq('id', currentStatus.currentEntryId)
      .select()
      .single();

    if (error) throw error;

    logger.info(`User ${userId} clocked out. Total hours: ${totalHours.toFixed(2)}`);
    return this.mapRowToTimeEntry(updated);
  }

  /**
   * Get user clock status
   */
  async getUserClockStatus(userId: string): Promise<UserClockStatus> {
    const today = new Date().toISOString().split('T')[0];

    // Get today's entry without clock_out
    const { data: entry } = await supabase
      .from('time_entries')
      .select('*')
      .eq('user_id', userId)
      .eq('date', today)
      .is('clock_out', null)
      .order('clock_in', { ascending: false })
      .limit(1)
      .single();

    if (!entry) {
      return { userId, status: 'clocked_out' };
    }

    // Check for active break
    const { data: activeBreak } = await supabase
      .from('time_breaks')
      .select('*')
      .eq('time_entry_id', entry.id)
      .is('end_time', null)
      .single();

    if (activeBreak) {
      return {
        userId,
        status: 'on_break',
        currentEntryId: entry.id,
        clockedInAt: new Date(entry.clock_in),
        currentBreakId: activeBreak.id,
        breakStartedAt: new Date(activeBreak.start_time),
        projectId: entry.project_id,
        taskId: entry.task_id,
      };
    }

    return {
      userId,
      status: 'clocked_in',
      currentEntryId: entry.id,
      clockedInAt: new Date(entry.clock_in),
      projectId: entry.project_id,
      taskId: entry.task_id,
    };
  }

  // ==========================================================================
  // BREAKS
  // ==========================================================================

  /**
   * Start break
   */
  async startBreak(
    userId: string,
    type: Break['type'] = 'rest',
    isPaid: boolean = false
  ): Promise<Break> {
    const status = await this.getUserClockStatus(userId);
    if (status.status !== 'clocked_in' || !status.currentEntryId) {
      throw new Error('Must be clocked in to take a break');
    }

    const breakEntry: Break = {
      id: uuidv4(),
      timeEntryId: status.currentEntryId,
      startTime: new Date(),
      type,
      isPaid,
    };

    const { error } = await supabase.from('time_breaks').insert({
      id: breakEntry.id,
      time_entry_id: breakEntry.timeEntryId,
      start_time: breakEntry.startTime.toISOString(),
      type: breakEntry.type,
      is_paid: breakEntry.isPaid,
    });

    if (error) throw error;

    logger.info(`User ${userId} started ${type} break`);
    return breakEntry;
  }

  /**
   * End break
   */
  async endBreak(breakId: string): Promise<Break> {
    const now = new Date();

    const { data: breakData, error: fetchError } = await supabase
      .from('time_breaks')
      .select('*')
      .eq('id', breakId)
      .single();

    if (fetchError || !breakData) throw new Error('Break not found');

    // Update break
    const { data: updated, error } = await supabase
      .from('time_breaks')
      .update({ end_time: now.toISOString() })
      .eq('id', breakId)
      .select()
      .single();

    if (error) throw error;

    // Calculate break duration and update time entry
    const breakMinutes = Math.round(
      (now.getTime() - new Date(breakData.start_time).getTime()) / 1000 / 60
    );

    // Only add unpaid breaks to break_minutes
    if (!breakData.is_paid) {
      const { data: entry } = await supabase
        .from('time_entries')
        .select('break_minutes')
        .eq('id', breakData.time_entry_id)
        .single();

      await supabase
        .from('time_entries')
        .update({
          break_minutes: (entry?.break_minutes || 0) + breakMinutes,
          updated_at: now.toISOString(),
        })
        .eq('id', breakData.time_entry_id);
    }

    logger.info(`Break ended. Duration: ${breakMinutes} minutes`);
    return {
      id: updated.id,
      timeEntryId: updated.time_entry_id,
      startTime: new Date(updated.start_time),
      endTime: new Date(updated.end_time),
      type: updated.type,
      isPaid: updated.is_paid,
    };
  }

  // ==========================================================================
  // OVERTIME CALCULATIONS
  // ==========================================================================

  /**
   * Calculate overtime breakdown
   */
  calculateOvertime(
    totalHours: number,
    date: string
  ): { regular: number; overtime: number; doubleTime: number } {
    let regular = 0;
    let overtime = 0;
    let doubleTime = 0;

    // Double time (over 12 hours)
    if (totalHours > this.overtimeConfig.dailyDoubleTimeThreshold) {
      doubleTime = totalHours - this.overtimeConfig.dailyDoubleTimeThreshold;
      totalHours = this.overtimeConfig.dailyDoubleTimeThreshold;
    }

    // Overtime (over 8 hours)
    if (totalHours > this.overtimeConfig.dailyOvertimeThreshold) {
      overtime = totalHours - this.overtimeConfig.dailyOvertimeThreshold;
      regular = this.overtimeConfig.dailyOvertimeThreshold;
    } else {
      regular = totalHours;
    }

    return { regular, overtime, doubleTime };
  }

  // ==========================================================================
  // TIMESHEETS
  // ==========================================================================

  /**
   * Get or create timesheet for week
   */
  async getOrCreateTimesheet(userId: string, date: Date = new Date()): Promise<Timesheet> {
    const { weekStart, weekEnd } = this.getWeekBounds(date);

    // Check for existing timesheet
    const { data: existing } = await supabase
      .from('timesheets')
      .select('*')
      .eq('user_id', userId)
      .eq('week_start', weekStart)
      .single();

    if (existing) {
      return await this.populateTimesheetEntries(existing);
    }

    // Create new timesheet
    const timesheet: Timesheet = {
      id: uuidv4(),
      userId,
      weekStart,
      weekEnd,
      status: 'draft',
      totalHours: 0,
      regularHours: 0,
      overtimeHours: 0,
      entries: [],
      createdAt: new Date(),
    };

    const { error } = await supabase.from('timesheets').insert({
      id: timesheet.id,
      user_id: timesheet.userId,
      week_start: timesheet.weekStart,
      week_end: timesheet.weekEnd,
      status: timesheet.status,
      total_hours: timesheet.totalHours,
      regular_hours: timesheet.regularHours,
      overtime_hours: timesheet.overtimeHours,
      created_at: timesheet.createdAt.toISOString(),
    });

    if (error) throw error;

    return timesheet;
  }

  /**
   * Submit timesheet for approval
   */
  async submitTimesheet(timesheetId: string): Promise<Timesheet> {
    const { data: timesheet, error: fetchError } = await supabase
      .from('timesheets')
      .select('*')
      .eq('id', timesheetId)
      .single();

    if (fetchError || !timesheet) throw new Error('Timesheet not found');

    if (timesheet.status !== 'draft') {
      throw new Error('Only draft timesheets can be submitted');
    }

    // Calculate totals from entries
    const { data: entries } = await supabase
      .from('time_entries')
      .select('*')
      .eq('user_id', timesheet.user_id)
      .gte('date', timesheet.week_start)
      .lte('date', timesheet.week_end);

    const totals = (entries || []).reduce(
      (acc, e) => ({
        total: acc.total + (e.total_hours || 0),
        regular: acc.regular + (e.regular_hours || 0),
        overtime: acc.overtime + (e.overtime_hours || 0),
      }),
      { total: 0, regular: 0, overtime: 0 }
    );

    const { data: updated, error } = await supabase
      .from('timesheets')
      .update({
        status: 'submitted',
        submitted_at: new Date().toISOString(),
        total_hours: totals.total,
        regular_hours: totals.regular,
        overtime_hours: totals.overtime,
      })
      .eq('id', timesheetId)
      .select()
      .single();

    if (error) throw error;

    logger.info(`Timesheet ${timesheetId} submitted`);
    return await this.populateTimesheetEntries(updated);
  }

  /**
   * Approve timesheet
   */
  async approveTimesheet(timesheetId: string, approvedBy: string): Promise<Timesheet> {
    const { data: updated, error } = await supabase
      .from('timesheets')
      .update({
        status: 'approved',
        approved_by: approvedBy,
        approved_at: new Date().toISOString(),
      })
      .eq('id', timesheetId)
      .eq('status', 'submitted')
      .select()
      .single();

    if (error) throw error;

    // Approve all entries in the timesheet
    const { data: timesheet } = await supabase
      .from('timesheets')
      .select('*')
      .eq('id', timesheetId)
      .single();

    if (timesheet) {
      await supabase
        .from('time_entries')
        .update({
          approved: true,
          approved_by: approvedBy,
          approved_at: new Date().toISOString(),
        })
        .eq('user_id', timesheet.user_id)
        .gte('date', timesheet.week_start)
        .lte('date', timesheet.week_end);
    }

    logger.info(`Timesheet ${timesheetId} approved by ${approvedBy}`);
    return await this.populateTimesheetEntries(updated);
  }

  /**
   * Reject timesheet
   */
  async rejectTimesheet(timesheetId: string, reason: string): Promise<Timesheet> {
    const { data: updated, error } = await supabase
      .from('timesheets')
      .update({
        status: 'rejected',
        rejection_reason: reason,
      })
      .eq('id', timesheetId)
      .eq('status', 'submitted')
      .select()
      .single();

    if (error) throw error;

    logger.info(`Timesheet ${timesheetId} rejected: ${reason}`);
    return await this.populateTimesheetEntries(updated);
  }

  // ==========================================================================
  // REPORTS
  // ==========================================================================

  /**
   * Get project time summary
   */
  async getProjectTimeSummary(
    projectId: string,
    startDate?: string,
    endDate?: string
  ): Promise<{
    totalHours: number;
    regularHours: number;
    overtimeHours: number;
    billableHours: number;
    totalCost: number;
    byUser: Array<{ userId: string; hours: number; cost: number }>;
    byTask: Array<{ taskId: string; hours: number }>;
  }> {
    let query = supabase
      .from('time_entries')
      .select('*')
      .eq('project_id', projectId);

    if (startDate) query = query.gte('date', startDate);
    if (endDate) query = query.lte('date', endDate);

    const { data: entries } = await query;

    if (!entries || entries.length === 0) {
      return {
        totalHours: 0,
        regularHours: 0,
        overtimeHours: 0,
        billableHours: 0,
        totalCost: 0,
        byUser: [],
        byTask: [],
      };
    }

    const byUser: Map<string, { hours: number; cost: number }> = new Map();
    const byTask: Map<string, number> = new Map();

    let totalHours = 0;
    let regularHours = 0;
    let overtimeHours = 0;
    let billableHours = 0;
    let totalCost = 0;

    for (const entry of entries) {
      totalHours += entry.total_hours || 0;
      regularHours += entry.regular_hours || 0;
      overtimeHours += entry.overtime_hours || 0;

      if (entry.is_billable) {
        billableHours += entry.total_hours || 0;
      }

      const entryCost = (entry.total_hours || 0) * (entry.hourly_rate || 0);
      totalCost += entryCost;

      // By user
      const userStats = byUser.get(entry.user_id) || { hours: 0, cost: 0 };
      userStats.hours += entry.total_hours || 0;
      userStats.cost += entryCost;
      byUser.set(entry.user_id, userStats);

      // By task
      if (entry.task_id) {
        const taskHours = byTask.get(entry.task_id) || 0;
        byTask.set(entry.task_id, taskHours + (entry.total_hours || 0));
      }
    }

    return {
      totalHours,
      regularHours,
      overtimeHours,
      billableHours,
      totalCost,
      byUser: Array.from(byUser.entries()).map(([userId, stats]) => ({
        userId,
        ...stats,
      })),
      byTask: Array.from(byTask.entries()).map(([taskId, hours]) => ({
        taskId,
        hours,
      })),
    };
  }

  /**
   * Get user time report
   */
  async getUserTimeReport(
    userId: string,
    startDate: string,
    endDate: string
  ): Promise<{
    entries: TimeEntry[];
    summary: {
      totalHours: number;
      regularHours: number;
      overtimeHours: number;
      doubleTimeHours: number;
      byProject: Array<{ projectId: string; hours: number }>;
    };
  }> {
    const { data } = await supabase
      .from('time_entries')
      .select('*')
      .eq('user_id', userId)
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: true });

    const entries = (data || []).map(row => this.mapRowToTimeEntry(row));

    const byProject: Map<string, number> = new Map();
    let totalHours = 0;
    let regularHours = 0;
    let overtimeHours = 0;
    let doubleTimeHours = 0;

    for (const entry of entries) {
      totalHours += entry.totalHours;
      regularHours += entry.regularHours;
      overtimeHours += entry.overtimeHours;
      doubleTimeHours += entry.doubleTimeHours;

      const projectHours = byProject.get(entry.projectId) || 0;
      byProject.set(entry.projectId, projectHours + entry.totalHours);
    }

    return {
      entries,
      summary: {
        totalHours,
        regularHours,
        overtimeHours,
        doubleTimeHours,
        byProject: Array.from(byProject.entries()).map(([projectId, hours]) => ({
          projectId,
          hours,
        })),
      },
    };
  }

  // ==========================================================================
  // UTILITIES
  // ==========================================================================

  /**
   * Get week bounds (Monday-Sunday)
   */
  private getWeekBounds(date: Date): { weekStart: string; weekEnd: string } {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday

    const monday = new Date(d.setDate(diff));
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);

    return {
      weekStart: monday.toISOString().split('T')[0],
      weekEnd: sunday.toISOString().split('T')[0],
    };
  }

  /**
   * Populate timesheet with entries
   */
  private async populateTimesheetEntries(timesheet: any): Promise<Timesheet> {
    const { data: entries } = await supabase
      .from('time_entries')
      .select('*')
      .eq('user_id', timesheet.user_id)
      .gte('date', timesheet.week_start)
      .lte('date', timesheet.week_end)
      .order('date', { ascending: true });

    return {
      id: timesheet.id,
      userId: timesheet.user_id,
      weekStart: timesheet.week_start,
      weekEnd: timesheet.week_end,
      status: timesheet.status,
      totalHours: timesheet.total_hours,
      regularHours: timesheet.regular_hours,
      overtimeHours: timesheet.overtime_hours,
      entries: (entries || []).map(row => this.mapRowToTimeEntry(row)),
      submittedAt: timesheet.submitted_at ? new Date(timesheet.submitted_at) : undefined,
      approvedBy: timesheet.approved_by,
      approvedAt: timesheet.approved_at ? new Date(timesheet.approved_at) : undefined,
      rejectionReason: timesheet.rejection_reason,
      createdAt: new Date(timesheet.created_at),
    };
  }

  /**
   * Map database row to TimeEntry
   */
  private mapRowToTimeEntry(row: any): TimeEntry {
    return {
      id: row.id,
      projectId: row.project_id,
      taskId: row.task_id,
      userId: row.user_id,
      date: row.date,
      clockIn: new Date(row.clock_in),
      clockOut: row.clock_out ? new Date(row.clock_out) : undefined,
      breakMinutes: row.break_minutes || 0,
      totalHours: row.total_hours || 0,
      regularHours: row.regular_hours || 0,
      overtimeHours: row.overtime_hours || 0,
      doubleTimeHours: row.double_time_hours || 0,
      entryType: row.entry_type,
      notes: row.notes,
      gpsClockIn: row.gps_clock_in,
      gpsClockOut: row.gps_clock_out,
      isBillable: row.is_billable,
      hourlyRate: row.hourly_rate,
      approved: row.approved,
      approvedBy: row.approved_by,
      approvedAt: row.approved_at ? new Date(row.approved_at) : undefined,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }
}

// Export singleton
export const timeTrackingService = new TimeTrackingService();
