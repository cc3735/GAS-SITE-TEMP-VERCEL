/**
 * Equipment Tracking Service
 *
 * Comprehensive equipment management for construction:
 * - Equipment inventory
 * - Check-out/check-in system
 * - Maintenance scheduling
 * - Location tracking
 * - Depreciation tracking
 *
 * @module services/equipment-tracking
 */

import { supabase } from '../utils/supabase.js';
import { logger } from '../utils/logger.js';
import { v4 as uuidv4 } from 'uuid';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export type EquipmentStatus = 'available' | 'in_use' | 'maintenance' | 'retired' | 'lost';
export type EquipmentCondition = 'excellent' | 'good' | 'fair' | 'poor' | 'non_functional';
export type MaintenanceType = 'preventive' | 'repair' | 'inspection' | 'certification';
export type MaintenanceStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled';

export interface Equipment {
  id: string;
  organizationId: string;
  name: string;
  description?: string;
  category: string;
  serialNumber?: string;
  model?: string;
  manufacturer?: string;
  purchaseDate?: Date;
  purchaseCost?: number;
  currentValue?: number;
  depreciationRate?: number; // percentage per year
  status: EquipmentStatus;
  condition: EquipmentCondition;
  currentProjectId?: string;
  currentUserId?: string;
  location?: string;
  gpsLocation?: { latitude: number; longitude: number };
  imageUrl?: string;
  specifications?: Record<string, any>;
  notes?: string;
  lastMaintenanceDate?: Date;
  nextMaintenanceDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface EquipmentCheckout {
  id: string;
  equipmentId: string;
  userId: string;
  projectId: string;
  checkoutDate: Date;
  expectedReturnDate?: Date;
  actualReturnDate?: Date;
  checkoutCondition: EquipmentCondition;
  returnCondition?: EquipmentCondition;
  checkoutNotes?: string;
  returnNotes?: string;
  status: 'active' | 'returned' | 'overdue';
  createdAt: Date;
}

export interface MaintenanceRecord {
  id: string;
  equipmentId: string;
  type: MaintenanceType;
  status: MaintenanceStatus;
  scheduledDate: Date;
  completedDate?: Date;
  description: string;
  cost?: number;
  vendor?: string;
  performedBy?: string;
  notes?: string;
  attachments?: string[];
  conditionBefore?: EquipmentCondition;
  conditionAfter?: EquipmentCondition;
  nextMaintenanceDue?: Date;
  createdAt: Date;
}

export interface EquipmentCategory {
  id: string;
  name: string;
  description?: string;
  maintenanceIntervalDays?: number;
  depreciationRate?: number;
}

// ============================================================================
// EQUIPMENT TRACKING SERVICE
// ============================================================================

export class EquipmentTrackingService {
  private defaultCategories: EquipmentCategory[] = [
    { id: 'power-tools', name: 'Power Tools', maintenanceIntervalDays: 180, depreciationRate: 20 },
    { id: 'hand-tools', name: 'Hand Tools', maintenanceIntervalDays: 365, depreciationRate: 10 },
    { id: 'heavy-equipment', name: 'Heavy Equipment', maintenanceIntervalDays: 90, depreciationRate: 15 },
    { id: 'vehicles', name: 'Vehicles', maintenanceIntervalDays: 30, depreciationRate: 15 },
    { id: 'safety', name: 'Safety Equipment', maintenanceIntervalDays: 90, depreciationRate: 25 },
    { id: 'scaffolding', name: 'Scaffolding', maintenanceIntervalDays: 180, depreciationRate: 10 },
    { id: 'electrical', name: 'Electrical Equipment', maintenanceIntervalDays: 180, depreciationRate: 20 },
    { id: 'measuring', name: 'Measuring Instruments', maintenanceIntervalDays: 365, depreciationRate: 15 },
  ];

  // ==========================================================================
  // EQUIPMENT CRUD
  // ==========================================================================

  /**
   * Create equipment
   */
  async createEquipment(data: Partial<Equipment>): Promise<Equipment> {
    const equipment: Equipment = {
      id: uuidv4(),
      organizationId: data.organizationId || '',
      name: data.name || '',
      description: data.description,
      category: data.category || 'other',
      serialNumber: data.serialNumber,
      model: data.model,
      manufacturer: data.manufacturer,
      purchaseDate: data.purchaseDate,
      purchaseCost: data.purchaseCost,
      currentValue: data.purchaseCost,
      depreciationRate: data.depreciationRate || 15,
      status: 'available',
      condition: data.condition || 'good',
      location: data.location,
      gpsLocation: data.gpsLocation,
      imageUrl: data.imageUrl,
      specifications: data.specifications,
      notes: data.notes,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const { error } = await supabase.from('equipment').insert({
      id: equipment.id,
      organization_id: equipment.organizationId,
      name: equipment.name,
      description: equipment.description,
      category: equipment.category,
      serial_number: equipment.serialNumber,
      model: equipment.model,
      manufacturer: equipment.manufacturer,
      purchase_date: equipment.purchaseDate?.toISOString(),
      purchase_cost: equipment.purchaseCost,
      current_value: equipment.currentValue,
      depreciation_rate: equipment.depreciationRate,
      status: equipment.status,
      condition: equipment.condition,
      location: equipment.location,
      gps_location: equipment.gpsLocation,
      image_url: equipment.imageUrl,
      specifications: equipment.specifications,
      notes: equipment.notes,
      created_at: equipment.createdAt.toISOString(),
      updated_at: equipment.updatedAt.toISOString(),
    });

    if (error) throw error;

    logger.info(`Equipment created: ${equipment.name} (${equipment.id})`);
    return equipment;
  }

  /**
   * Get equipment by ID
   */
  async getEquipment(id: string): Promise<Equipment | null> {
    const { data, error } = await supabase
      .from('equipment')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) return null;
    return this.mapRowToEquipment(data);
  }

  /**
   * List equipment with filters
   */
  async listEquipment(options?: {
    organizationId?: string;
    category?: string;
    status?: EquipmentStatus;
    projectId?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ equipment: Equipment[]; total: number }> {
    let query = supabase.from('equipment').select('*', { count: 'exact' });

    if (options?.organizationId) query = query.eq('organization_id', options.organizationId);
    if (options?.category) query = query.eq('category', options.category);
    if (options?.status) query = query.eq('status', options.status);
    if (options?.projectId) query = query.eq('current_project_id', options.projectId);
    if (options?.search) {
      query = query.or(`name.ilike.%${options.search}%,serial_number.ilike.%${options.search}%`);
    }

    query = query.order('name', { ascending: true });

    if (options?.limit) query = query.limit(options.limit);
    if (options?.offset) query = query.range(options.offset, options.offset + (options.limit || 50) - 1);

    const { data, count, error } = await query;

    if (error) throw error;

    return {
      equipment: (data || []).map(row => this.mapRowToEquipment(row)),
      total: count || 0,
    };
  }

  /**
   * Update equipment
   */
  async updateEquipment(id: string, updates: Partial<Equipment>): Promise<Equipment | null> {
    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (updates.name) updateData.name = updates.name;
    if (updates.description !== undefined) updateData.description = updates.description;
    if (updates.category) updateData.category = updates.category;
    if (updates.serialNumber !== undefined) updateData.serial_number = updates.serialNumber;
    if (updates.model !== undefined) updateData.model = updates.model;
    if (updates.manufacturer !== undefined) updateData.manufacturer = updates.manufacturer;
    if (updates.status) updateData.status = updates.status;
    if (updates.condition) updateData.condition = updates.condition;
    if (updates.location !== undefined) updateData.location = updates.location;
    if (updates.gpsLocation !== undefined) updateData.gps_location = updates.gpsLocation;
    if (updates.currentValue !== undefined) updateData.current_value = updates.currentValue;
    if (updates.notes !== undefined) updateData.notes = updates.notes;
    if (updates.nextMaintenanceDate) updateData.next_maintenance_date = updates.nextMaintenanceDate.toISOString();

    const { data, error } = await supabase
      .from('equipment')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return this.mapRowToEquipment(data);
  }

  // ==========================================================================
  // CHECKOUT SYSTEM
  // ==========================================================================

  /**
   * Check out equipment
   */
  async checkoutEquipment(
    equipmentId: string,
    userId: string,
    projectId: string,
    options?: {
      expectedReturnDate?: Date;
      notes?: string;
    }
  ): Promise<EquipmentCheckout> {
    const equipment = await this.getEquipment(equipmentId);
    if (!equipment) throw new Error('Equipment not found');
    if (equipment.status !== 'available') {
      throw new Error(`Equipment is not available (status: ${equipment.status})`);
    }

    const checkout: EquipmentCheckout = {
      id: uuidv4(),
      equipmentId,
      userId,
      projectId,
      checkoutDate: new Date(),
      expectedReturnDate: options?.expectedReturnDate,
      checkoutCondition: equipment.condition,
      checkoutNotes: options?.notes,
      status: 'active',
      createdAt: new Date(),
    };

    const { error } = await supabase.from('equipment_checkouts').insert({
      id: checkout.id,
      equipment_id: checkout.equipmentId,
      user_id: checkout.userId,
      project_id: checkout.projectId,
      checkout_date: checkout.checkoutDate.toISOString(),
      expected_return_date: checkout.expectedReturnDate?.toISOString(),
      checkout_condition: checkout.checkoutCondition,
      checkout_notes: checkout.checkoutNotes,
      status: checkout.status,
      created_at: checkout.createdAt.toISOString(),
    });

    if (error) throw error;

    // Update equipment status
    await supabase.from('equipment').update({
      status: 'in_use',
      current_project_id: projectId,
      current_user_id: userId,
      updated_at: new Date().toISOString(),
    }).eq('id', equipmentId);

    logger.info(`Equipment ${equipmentId} checked out to user ${userId} for project ${projectId}`);
    return checkout;
  }

  /**
   * Return equipment
   */
  async returnEquipment(
    checkoutId: string,
    options?: {
      condition?: EquipmentCondition;
      notes?: string;
      location?: string;
    }
  ): Promise<EquipmentCheckout> {
    const { data: checkout, error: fetchError } = await supabase
      .from('equipment_checkouts')
      .select('*')
      .eq('id', checkoutId)
      .single();

    if (fetchError || !checkout) throw new Error('Checkout not found');
    if (checkout.status !== 'active') throw new Error('Checkout is not active');

    const now = new Date();

    // Update checkout
    const { data: updated, error } = await supabase
      .from('equipment_checkouts')
      .update({
        actual_return_date: now.toISOString(),
        return_condition: options?.condition,
        return_notes: options?.notes,
        status: 'returned',
      })
      .eq('id', checkoutId)
      .select()
      .single();

    if (error) throw error;

    // Update equipment
    await supabase.from('equipment').update({
      status: 'available',
      current_project_id: null,
      current_user_id: null,
      condition: options?.condition || checkout.checkout_condition,
      location: options?.location,
      updated_at: now.toISOString(),
    }).eq('id', checkout.equipment_id);

    logger.info(`Equipment ${checkout.equipment_id} returned`);

    return {
      id: updated.id,
      equipmentId: updated.equipment_id,
      userId: updated.user_id,
      projectId: updated.project_id,
      checkoutDate: new Date(updated.checkout_date),
      expectedReturnDate: updated.expected_return_date ? new Date(updated.expected_return_date) : undefined,
      actualReturnDate: new Date(updated.actual_return_date),
      checkoutCondition: updated.checkout_condition,
      returnCondition: updated.return_condition,
      checkoutNotes: updated.checkout_notes,
      returnNotes: updated.return_notes,
      status: updated.status,
      createdAt: new Date(updated.created_at),
    };
  }

  /**
   * Get active checkouts
   */
  async getActiveCheckouts(options?: {
    projectId?: string;
    userId?: string;
    overdue?: boolean;
  }): Promise<EquipmentCheckout[]> {
    let query = supabase
      .from('equipment_checkouts')
      .select('*')
      .eq('status', 'active');

    if (options?.projectId) query = query.eq('project_id', options.projectId);
    if (options?.userId) query = query.eq('user_id', options.userId);
    if (options?.overdue) {
      query = query.lt('expected_return_date', new Date().toISOString());
    }

    const { data } = await query.order('checkout_date', { ascending: false });

    return (data || []).map(row => ({
      id: row.id,
      equipmentId: row.equipment_id,
      userId: row.user_id,
      projectId: row.project_id,
      checkoutDate: new Date(row.checkout_date),
      expectedReturnDate: row.expected_return_date ? new Date(row.expected_return_date) : undefined,
      checkoutCondition: row.checkout_condition,
      checkoutNotes: row.checkout_notes,
      status: row.status,
      createdAt: new Date(row.created_at),
    }));
  }

  // ==========================================================================
  // MAINTENANCE
  // ==========================================================================

  /**
   * Schedule maintenance
   */
  async scheduleMaintenance(
    equipmentId: string,
    data: {
      type: MaintenanceType;
      scheduledDate: Date;
      description: string;
      vendor?: string;
      estimatedCost?: number;
    }
  ): Promise<MaintenanceRecord> {
    const record: MaintenanceRecord = {
      id: uuidv4(),
      equipmentId,
      type: data.type,
      status: 'scheduled',
      scheduledDate: data.scheduledDate,
      description: data.description,
      vendor: data.vendor,
      cost: data.estimatedCost,
      createdAt: new Date(),
    };

    const { error } = await supabase.from('maintenance_records').insert({
      id: record.id,
      equipment_id: record.equipmentId,
      type: record.type,
      status: record.status,
      scheduled_date: record.scheduledDate.toISOString(),
      description: record.description,
      vendor: record.vendor,
      cost: record.cost,
      created_at: record.createdAt.toISOString(),
    });

    if (error) throw error;

    logger.info(`Maintenance scheduled for equipment ${equipmentId} on ${data.scheduledDate}`);
    return record;
  }

  /**
   * Complete maintenance
   */
  async completeMaintenance(
    maintenanceId: string,
    data: {
      cost?: number;
      performedBy?: string;
      notes?: string;
      conditionAfter?: EquipmentCondition;
      nextMaintenanceDue?: Date;
    }
  ): Promise<MaintenanceRecord> {
    const now = new Date();

    const { data: record, error: fetchError } = await supabase
      .from('maintenance_records')
      .select('*')
      .eq('id', maintenanceId)
      .single();

    if (fetchError || !record) throw new Error('Maintenance record not found');

    // Update maintenance record
    const { data: updated, error } = await supabase
      .from('maintenance_records')
      .update({
        status: 'completed',
        completed_date: now.toISOString(),
        cost: data.cost,
        performed_by: data.performedBy,
        notes: data.notes,
        condition_after: data.conditionAfter,
        next_maintenance_due: data.nextMaintenanceDue?.toISOString(),
      })
      .eq('id', maintenanceId)
      .select()
      .single();

    if (error) throw error;

    // Update equipment
    const equipmentUpdates: any = {
      last_maintenance_date: now.toISOString(),
      status: 'available',
      updated_at: now.toISOString(),
    };

    if (data.conditionAfter) {
      equipmentUpdates.condition = data.conditionAfter;
    }

    if (data.nextMaintenanceDue) {
      equipmentUpdates.next_maintenance_date = data.nextMaintenanceDue.toISOString();
    }

    await supabase.from('equipment').update(equipmentUpdates).eq('id', record.equipment_id);

    logger.info(`Maintenance ${maintenanceId} completed for equipment ${record.equipment_id}`);

    return this.mapRowToMaintenanceRecord(updated);
  }

  /**
   * Get equipment maintenance history
   */
  async getMaintenanceHistory(
    equipmentId: string,
    limit: number = 20
  ): Promise<MaintenanceRecord[]> {
    const { data } = await supabase
      .from('maintenance_records')
      .select('*')
      .eq('equipment_id', equipmentId)
      .order('scheduled_date', { ascending: false })
      .limit(limit);

    return (data || []).map(row => this.mapRowToMaintenanceRecord(row));
  }

  /**
   * Get upcoming maintenance
   */
  async getUpcomingMaintenance(days: number = 30): Promise<MaintenanceRecord[]> {
    const futureDate = new Date(Date.now() + days * 24 * 60 * 60 * 1000);

    const { data } = await supabase
      .from('maintenance_records')
      .select('*')
      .eq('status', 'scheduled')
      .lte('scheduled_date', futureDate.toISOString())
      .order('scheduled_date', { ascending: true });

    return (data || []).map(row => this.mapRowToMaintenanceRecord(row));
  }

  // ==========================================================================
  // DEPRECIATION
  // ==========================================================================

  /**
   * Calculate current equipment value
   */
  calculateCurrentValue(equipment: Equipment): number {
    if (!equipment.purchaseCost || !equipment.purchaseDate || !equipment.depreciationRate) {
      return equipment.currentValue || 0;
    }

    const yearsSincePurchase = (Date.now() - equipment.purchaseDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000);
    const depreciationFactor = Math.pow(1 - equipment.depreciationRate / 100, yearsSincePurchase);
    const currentValue = equipment.purchaseCost * depreciationFactor;

    // Minimum 10% of original value
    return Math.max(currentValue, equipment.purchaseCost * 0.1);
  }

  /**
   * Update depreciated values for all equipment
   */
  async updateDepreciatedValues(organizationId: string): Promise<number> {
    const { data: equipmentList } = await supabase
      .from('equipment')
      .select('*')
      .eq('organization_id', organizationId)
      .not('purchase_cost', 'is', null)
      .not('purchase_date', 'is', null);

    if (!equipmentList) return 0;

    let updated = 0;
    for (const row of equipmentList) {
      const equipment = this.mapRowToEquipment(row);
      const newValue = this.calculateCurrentValue(equipment);

      if (Math.abs(newValue - (equipment.currentValue || 0)) > 0.01) {
        await supabase.from('equipment').update({
          current_value: newValue,
          updated_at: new Date().toISOString(),
        }).eq('id', equipment.id);
        updated++;
      }
    }

    logger.info(`Updated depreciated values for ${updated} equipment items`);
    return updated;
  }

  // ==========================================================================
  // REPORTS
  // ==========================================================================

  /**
   * Get equipment summary
   */
  async getEquipmentSummary(organizationId: string): Promise<{
    totalCount: number;
    totalValue: number;
    byStatus: Record<EquipmentStatus, number>;
    byCategory: Record<string, number>;
    maintenancesDue: number;
    overdueCheckouts: number;
  }> {
    const { data: equipment } = await supabase
      .from('equipment')
      .select('*')
      .eq('organization_id', organizationId);

    const byStatus: Record<string, number> = {};
    const byCategory: Record<string, number> = {};
    let totalValue = 0;
    let maintenancesDue = 0;

    for (const item of equipment || []) {
      byStatus[item.status] = (byStatus[item.status] || 0) + 1;
      byCategory[item.category] = (byCategory[item.category] || 0) + 1;
      totalValue += item.current_value || 0;

      if (item.next_maintenance_date && new Date(item.next_maintenance_date) <= new Date()) {
        maintenancesDue++;
      }
    }

    // Count overdue checkouts
    const { count: overdueCheckouts } = await supabase
      .from('equipment_checkouts')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active')
      .lt('expected_return_date', new Date().toISOString());

    return {
      totalCount: equipment?.length || 0,
      totalValue,
      byStatus: byStatus as Record<EquipmentStatus, number>,
      byCategory,
      maintenancesDue,
      overdueCheckouts: overdueCheckouts || 0,
    };
  }

  /**
   * Get categories
   */
  getCategories(): EquipmentCategory[] {
    return this.defaultCategories;
  }

  // ==========================================================================
  // UTILITIES
  // ==========================================================================

  /**
   * Map database row to Equipment
   */
  private mapRowToEquipment(row: any): Equipment {
    return {
      id: row.id,
      organizationId: row.organization_id,
      name: row.name,
      description: row.description,
      category: row.category,
      serialNumber: row.serial_number,
      model: row.model,
      manufacturer: row.manufacturer,
      purchaseDate: row.purchase_date ? new Date(row.purchase_date) : undefined,
      purchaseCost: row.purchase_cost,
      currentValue: row.current_value,
      depreciationRate: row.depreciation_rate,
      status: row.status,
      condition: row.condition,
      currentProjectId: row.current_project_id,
      currentUserId: row.current_user_id,
      location: row.location,
      gpsLocation: row.gps_location,
      imageUrl: row.image_url,
      specifications: row.specifications,
      notes: row.notes,
      lastMaintenanceDate: row.last_maintenance_date ? new Date(row.last_maintenance_date) : undefined,
      nextMaintenanceDate: row.next_maintenance_date ? new Date(row.next_maintenance_date) : undefined,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }

  /**
   * Map database row to MaintenanceRecord
   */
  private mapRowToMaintenanceRecord(row: any): MaintenanceRecord {
    return {
      id: row.id,
      equipmentId: row.equipment_id,
      type: row.type,
      status: row.status,
      scheduledDate: new Date(row.scheduled_date),
      completedDate: row.completed_date ? new Date(row.completed_date) : undefined,
      description: row.description,
      cost: row.cost,
      vendor: row.vendor,
      performedBy: row.performed_by,
      notes: row.notes,
      attachments: row.attachments,
      conditionBefore: row.condition_before,
      conditionAfter: row.condition_after,
      nextMaintenanceDue: row.next_maintenance_due ? new Date(row.next_maintenance_due) : undefined,
      createdAt: new Date(row.created_at),
    };
  }
}

// Export singleton
export const equipmentTrackingService = new EquipmentTrackingService();
