/**
 * Subcontractor Management Service
 *
 * Comprehensive subcontractor management including:
 * - Subcontractor directory and profiles
 * - Contract management
 * - Work order assignments
 * - Performance ratings
 * - Insurance and license verification
 * - Payment tracking and lien waivers
 */

import { supabase } from '../lib/supabase';

// Types
export interface Subcontractor {
  id: string;
  organization_id: string;
  company_name: string;
  contact_name: string;
  email: string;
  phone: string;
  address?: {
    street: string;
    city: string;
    state: string;
    zip: string;
  };
  trade: string; // electrician, plumber, HVAC, framing, roofing, etc.
  specialties?: string[];
  license_number?: string;
  license_state?: string;
  license_expiration?: Date;
  insurance_provider?: string;
  insurance_policy_number?: string;
  insurance_expiration?: Date;
  insurance_coverage_amount?: number;
  workers_comp_provider?: string;
  workers_comp_policy?: string;
  workers_comp_expiration?: Date;
  ein?: string; // Employer Identification Number
  payment_terms?: string; // Net 30, Net 15, etc.
  hourly_rate?: number;
  notes?: string;
  status: 'active' | 'inactive' | 'suspended' | 'pending_verification';
  rating?: number; // 1-5
  total_projects?: number;
  total_paid?: number;
  documents?: SubcontractorDocument[];
  metadata?: Record<string, any>;
  created_at: Date;
  updated_at: Date;
}

export interface SubcontractorDocument {
  id: string;
  subcontractor_id: string;
  type: 'license' | 'insurance_certificate' | 'workers_comp' | 'w9' | 'contract' | 'lien_waiver' | 'other';
  name: string;
  file_url: string;
  expiration_date?: Date;
  verified: boolean;
  verified_by?: string;
  verified_at?: Date;
  notes?: string;
  created_at: Date;
}

export interface SubcontractorContract {
  id: string;
  subcontractor_id: string;
  project_id: string;
  organization_id: string;
  contract_number: string;
  title: string;
  description?: string;
  contract_type: 'fixed_price' | 'time_and_materials' | 'cost_plus' | 'unit_price';
  total_amount: number;
  retainage_percentage?: number; // Typically 5-10%
  start_date: Date;
  end_date?: Date;
  scope_of_work: string;
  terms_and_conditions?: string;
  payment_schedule?: PaymentMilestone[];
  change_orders?: ChangeOrder[];
  status: 'draft' | 'pending_signature' | 'active' | 'completed' | 'terminated';
  signed_date?: Date;
  signed_by_contractor?: string;
  signed_by_subcontractor?: string;
  document_url?: string;
  created_at: Date;
  updated_at: Date;
}

export interface PaymentMilestone {
  id: string;
  description: string;
  amount: number;
  percentage?: number;
  due_date?: Date;
  status: 'pending' | 'invoiced' | 'paid';
  paid_date?: Date;
  invoice_number?: string;
}

export interface ChangeOrder {
  id: string;
  contract_id: string;
  change_order_number: string;
  description: string;
  amount: number; // Can be positive or negative
  days_extension?: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  approved_by?: string;
  approved_at?: Date;
  created_at: Date;
}

export interface WorkOrder {
  id: string;
  subcontractor_id: string;
  contract_id?: string;
  project_id: string;
  organization_id: string;
  work_order_number: string;
  title: string;
  description: string;
  location?: string; // Specific location within project
  scheduled_start: Date;
  scheduled_end: Date;
  actual_start?: Date;
  actual_end?: Date;
  estimated_hours?: number;
  actual_hours?: number;
  estimated_cost?: number;
  actual_cost?: number;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  status: 'pending' | 'assigned' | 'in_progress' | 'completed' | 'cancelled';
  checklist?: WorkOrderChecklistItem[];
  materials_required?: string[];
  notes?: string;
  completed_by?: string;
  inspected?: boolean;
  inspected_by?: string;
  inspection_notes?: string;
  created_at: Date;
  updated_at: Date;
}

export interface WorkOrderChecklistItem {
  id: string;
  description: string;
  completed: boolean;
  completed_at?: Date;
  completed_by?: string;
}

export interface SubcontractorPayment {
  id: string;
  subcontractor_id: string;
  contract_id?: string;
  project_id: string;
  organization_id: string;
  invoice_number?: string;
  invoice_date?: Date;
  payment_type: 'progress' | 'final' | 'retainage_release' | 'change_order';
  amount: number;
  retainage_held?: number;
  net_amount: number;
  description?: string;
  status: 'pending' | 'approved' | 'paid' | 'rejected';
  approved_by?: string;
  approved_at?: Date;
  paid_date?: Date;
  payment_method?: string;
  check_number?: string;
  lien_waiver_received?: boolean;
  lien_waiver_document_id?: string;
  notes?: string;
  created_at: Date;
}

export interface PerformanceReview {
  id: string;
  subcontractor_id: string;
  project_id: string;
  reviewer_id: string;
  reviewer_name: string;
  review_date: Date;
  quality_rating: number; // 1-5
  timeliness_rating: number; // 1-5
  communication_rating: number; // 1-5
  safety_rating: number; // 1-5
  overall_rating: number; // 1-5 (calculated average)
  strengths?: string;
  areas_for_improvement?: string;
  would_hire_again: boolean;
  comments?: string;
  created_at: Date;
}

export class SubcontractorManagementService {
  // ==================== SUBCONTRACTOR CRUD ====================

  async createSubcontractor(data: Partial<Subcontractor>): Promise<Subcontractor> {
    const subcontractor: Partial<Subcontractor> = {
      ...data,
      status: data.status || 'pending_verification',
      total_projects: 0,
      total_paid: 0,
      created_at: new Date(),
      updated_at: new Date()
    };

    const { data: result, error } = await supabase
      .from('subcontractors')
      .insert(subcontractor)
      .select()
      .single();

    if (error) throw error;
    return result;
  }

  async getSubcontractor(id: string): Promise<Subcontractor | null> {
    const { data, error } = await supabase
      .from('subcontractors')
      .select('*, documents:subcontractor_documents(*)')
      .eq('id', id)
      .single();

    if (error) return null;
    return data;
  }

  async listSubcontractors(
    organizationId: string,
    options?: {
      status?: Subcontractor['status'];
      trade?: string;
      minRating?: number;
      search?: string;
      limit?: number;
      offset?: number;
    }
  ): Promise<{ subcontractors: Subcontractor[]; total: number }> {
    let query = supabase
      .from('subcontractors')
      .select('*', { count: 'exact' })
      .eq('organization_id', organizationId);

    if (options?.status) {
      query = query.eq('status', options.status);
    }
    if (options?.trade) {
      query = query.eq('trade', options.trade);
    }
    if (options?.minRating) {
      query = query.gte('rating', options.minRating);
    }
    if (options?.search) {
      query = query.or(
        `company_name.ilike.%${options.search}%,contact_name.ilike.%${options.search}%`
      );
    }

    query = query
      .order('company_name', { ascending: true })
      .range(
        options?.offset || 0,
        (options?.offset || 0) + (options?.limit || 50) - 1
      );

    const { data, error, count } = await query;
    if (error) throw error;

    return { subcontractors: data || [], total: count || 0 };
  }

  async updateSubcontractor(id: string, data: Partial<Subcontractor>): Promise<Subcontractor> {
    const { data: result, error } = await supabase
      .from('subcontractors')
      .update({
        ...data,
        updated_at: new Date()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return result;
  }

  async getSubcontractorsByTrade(
    organizationId: string,
    trade: string
  ): Promise<Subcontractor[]> {
    const { data, error } = await supabase
      .from('subcontractors')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('trade', trade)
      .eq('status', 'active')
      .order('rating', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  // ==================== DOCUMENT MANAGEMENT ====================

  async addDocument(
    subcontractorId: string,
    data: Partial<SubcontractorDocument>
  ): Promise<SubcontractorDocument> {
    const document: Partial<SubcontractorDocument> = {
      ...data,
      subcontractor_id: subcontractorId,
      verified: false,
      created_at: new Date()
    };

    const { data: result, error } = await supabase
      .from('subcontractor_documents')
      .insert(document)
      .select()
      .single();

    if (error) throw error;
    return result;
  }

  async verifyDocument(
    documentId: string,
    verifiedBy: string
  ): Promise<SubcontractorDocument> {
    const { data, error } = await supabase
      .from('subcontractor_documents')
      .update({
        verified: true,
        verified_by: verifiedBy,
        verified_at: new Date()
      })
      .eq('id', documentId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async getExpiringDocuments(
    organizationId: string,
    daysAhead: number = 30
  ): Promise<SubcontractorDocument[]> {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + daysAhead);

    const { data, error } = await supabase
      .from('subcontractor_documents')
      .select('*, subcontractor:subcontractors(*)')
      .eq('subcontractor.organization_id', organizationId)
      .not('expiration_date', 'is', null)
      .lte('expiration_date', futureDate.toISOString())
      .order('expiration_date', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  // ==================== CONTRACT MANAGEMENT ====================

  async createContract(data: Partial<SubcontractorContract>): Promise<SubcontractorContract> {
    // Generate contract number
    const contractNumber = `SC-${Date.now().toString(36).toUpperCase()}`;

    const contract: Partial<SubcontractorContract> = {
      ...data,
      contract_number: contractNumber,
      status: data.status || 'draft',
      change_orders: [],
      created_at: new Date(),
      updated_at: new Date()
    };

    const { data: result, error } = await supabase
      .from('subcontractor_contracts')
      .insert(contract)
      .select()
      .single();

    if (error) throw error;
    return result;
  }

  async getContract(id: string): Promise<SubcontractorContract | null> {
    const { data, error } = await supabase
      .from('subcontractor_contracts')
      .select('*, subcontractor:subcontractors(*)')
      .eq('id', id)
      .single();

    if (error) return null;
    return data;
  }

  async listContracts(
    projectId: string,
    options?: {
      status?: SubcontractorContract['status'];
      subcontractorId?: string;
    }
  ): Promise<SubcontractorContract[]> {
    let query = supabase
      .from('subcontractor_contracts')
      .select('*, subcontractor:subcontractors(company_name, contact_name)')
      .eq('project_id', projectId);

    if (options?.status) {
      query = query.eq('status', options.status);
    }
    if (options?.subcontractorId) {
      query = query.eq('subcontractor_id', options.subcontractorId);
    }

    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  }

  async updateContractStatus(
    contractId: string,
    status: SubcontractorContract['status'],
    signatureInfo?: {
      signed_by_contractor?: string;
      signed_by_subcontractor?: string;
    }
  ): Promise<SubcontractorContract> {
    const update: Partial<SubcontractorContract> = {
      status,
      updated_at: new Date()
    };

    if (status === 'active' && signatureInfo) {
      update.signed_date = new Date();
      update.signed_by_contractor = signatureInfo.signed_by_contractor;
      update.signed_by_subcontractor = signatureInfo.signed_by_subcontractor;
    }

    const { data, error } = await supabase
      .from('subcontractor_contracts')
      .update(update)
      .eq('id', contractId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // ==================== CHANGE ORDERS ====================

  async createChangeOrder(
    contractId: string,
    data: Partial<ChangeOrder>
  ): Promise<ChangeOrder> {
    // Get contract
    const contract = await this.getContract(contractId);
    if (!contract) throw new Error('Contract not found');

    // Generate change order number
    const changeOrderCount = (contract.change_orders?.length || 0) + 1;
    const changeOrderNumber = `CO-${changeOrderCount.toString().padStart(3, '0')}`;

    const changeOrder: ChangeOrder = {
      id: crypto.randomUUID(),
      contract_id: contractId,
      change_order_number: changeOrderNumber,
      description: data.description || '',
      amount: data.amount || 0,
      days_extension: data.days_extension,
      reason: data.reason || '',
      status: 'pending',
      created_at: new Date()
    };

    // Add to contract's change orders
    const updatedChangeOrders = [...(contract.change_orders || []), changeOrder];

    await supabase
      .from('subcontractor_contracts')
      .update({
        change_orders: updatedChangeOrders,
        updated_at: new Date()
      })
      .eq('id', contractId);

    return changeOrder;
  }

  async approveChangeOrder(
    contractId: string,
    changeOrderId: string,
    approvedBy: string
  ): Promise<SubcontractorContract> {
    const contract = await this.getContract(contractId);
    if (!contract) throw new Error('Contract not found');

    const updatedChangeOrders = contract.change_orders?.map(co => {
      if (co.id === changeOrderId) {
        return {
          ...co,
          status: 'approved' as const,
          approved_by: approvedBy,
          approved_at: new Date()
        };
      }
      return co;
    });

    // Calculate new total amount
    const approvedChangeOrdersTotal = updatedChangeOrders
      ?.filter(co => co.status === 'approved')
      .reduce((sum, co) => sum + co.amount, 0) || 0;

    const { data, error } = await supabase
      .from('subcontractor_contracts')
      .update({
        change_orders: updatedChangeOrders,
        total_amount: contract.total_amount + approvedChangeOrdersTotal,
        updated_at: new Date()
      })
      .eq('id', contractId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // ==================== WORK ORDERS ====================

  async createWorkOrder(data: Partial<WorkOrder>): Promise<WorkOrder> {
    // Generate work order number
    const workOrderNumber = `WO-${Date.now().toString(36).toUpperCase()}`;

    const workOrder: Partial<WorkOrder> = {
      ...data,
      work_order_number: workOrderNumber,
      status: 'pending',
      checklist: data.checklist || [],
      created_at: new Date(),
      updated_at: new Date()
    };

    const { data: result, error } = await supabase
      .from('work_orders')
      .insert(workOrder)
      .select()
      .single();

    if (error) throw error;
    return result;
  }

  async getWorkOrder(id: string): Promise<WorkOrder | null> {
    const { data, error } = await supabase
      .from('work_orders')
      .select('*, subcontractor:subcontractors(company_name, contact_name, phone)')
      .eq('id', id)
      .single();

    if (error) return null;
    return data;
  }

  async listWorkOrders(
    projectId: string,
    options?: {
      status?: WorkOrder['status'];
      subcontractorId?: string;
      priority?: WorkOrder['priority'];
      startDate?: Date;
      endDate?: Date;
    }
  ): Promise<WorkOrder[]> {
    let query = supabase
      .from('work_orders')
      .select('*, subcontractor:subcontractors(company_name, contact_name)')
      .eq('project_id', projectId);

    if (options?.status) {
      query = query.eq('status', options.status);
    }
    if (options?.subcontractorId) {
      query = query.eq('subcontractor_id', options.subcontractorId);
    }
    if (options?.priority) {
      query = query.eq('priority', options.priority);
    }
    if (options?.startDate) {
      query = query.gte('scheduled_start', options.startDate.toISOString());
    }
    if (options?.endDate) {
      query = query.lte('scheduled_end', options.endDate.toISOString());
    }

    const { data, error } = await query.order('scheduled_start', { ascending: true });
    if (error) throw error;
    return data || [];
  }

  async updateWorkOrderStatus(
    workOrderId: string,
    status: WorkOrder['status'],
    options?: {
      actual_start?: Date;
      actual_end?: Date;
      actual_hours?: number;
      actual_cost?: number;
      completed_by?: string;
    }
  ): Promise<WorkOrder> {
    const update: Partial<WorkOrder> = {
      status,
      ...options,
      updated_at: new Date()
    };

    const { data, error } = await supabase
      .from('work_orders')
      .update(update)
      .eq('id', workOrderId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updateChecklistItem(
    workOrderId: string,
    itemId: string,
    completed: boolean,
    completedBy?: string
  ): Promise<WorkOrder> {
    const workOrder = await this.getWorkOrder(workOrderId);
    if (!workOrder) throw new Error('Work order not found');

    const updatedChecklist = workOrder.checklist?.map(item => {
      if (item.id === itemId) {
        return {
          ...item,
          completed,
          completed_at: completed ? new Date() : undefined,
          completed_by: completed ? completedBy : undefined
        };
      }
      return item;
    });

    const { data, error } = await supabase
      .from('work_orders')
      .update({
        checklist: updatedChecklist,
        updated_at: new Date()
      })
      .eq('id', workOrderId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async inspectWorkOrder(
    workOrderId: string,
    inspectedBy: string,
    notes?: string,
    passed: boolean = true
  ): Promise<WorkOrder> {
    const { data, error } = await supabase
      .from('work_orders')
      .update({
        inspected: true,
        inspected_by: inspectedBy,
        inspection_notes: notes,
        status: passed ? 'completed' : 'in_progress',
        updated_at: new Date()
      })
      .eq('id', workOrderId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // ==================== PAYMENTS ====================

  async createPayment(data: Partial<SubcontractorPayment>): Promise<SubcontractorPayment> {
    // Calculate retainage if applicable
    let retainageHeld = 0;
    let netAmount = data.amount || 0;

    if (data.contract_id && data.payment_type !== 'retainage_release') {
      const contract = await this.getContract(data.contract_id);
      if (contract?.retainage_percentage) {
        retainageHeld = (data.amount || 0) * (contract.retainage_percentage / 100);
        netAmount = (data.amount || 0) - retainageHeld;
      }
    }

    const payment: Partial<SubcontractorPayment> = {
      ...data,
      retainage_held: retainageHeld,
      net_amount: netAmount,
      status: 'pending',
      created_at: new Date()
    };

    const { data: result, error } = await supabase
      .from('subcontractor_payments')
      .insert(payment)
      .select()
      .single();

    if (error) throw error;
    return result;
  }

  async approvePayment(
    paymentId: string,
    approvedBy: string
  ): Promise<SubcontractorPayment> {
    const { data, error } = await supabase
      .from('subcontractor_payments')
      .update({
        status: 'approved',
        approved_by: approvedBy,
        approved_at: new Date()
      })
      .eq('id', paymentId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async markPaymentPaid(
    paymentId: string,
    options?: {
      payment_method?: string;
      check_number?: string;
      lien_waiver_received?: boolean;
      lien_waiver_document_id?: string;
    }
  ): Promise<SubcontractorPayment> {
    const { data: payment, error } = await supabase
      .from('subcontractor_payments')
      .update({
        status: 'paid',
        paid_date: new Date(),
        ...options
      })
      .eq('id', paymentId)
      .select()
      .single();

    if (error) throw error;

    // Update subcontractor total paid
    await supabase.rpc('increment_subcontractor_total_paid', {
      sub_id: payment.subcontractor_id,
      amount: payment.net_amount
    });

    return payment;
  }

  async getPaymentHistory(
    subcontractorId: string,
    options?: {
      projectId?: string;
      status?: SubcontractorPayment['status'];
      limit?: number;
    }
  ): Promise<SubcontractorPayment[]> {
    let query = supabase
      .from('subcontractor_payments')
      .select('*')
      .eq('subcontractor_id', subcontractorId);

    if (options?.projectId) {
      query = query.eq('project_id', options.projectId);
    }
    if (options?.status) {
      query = query.eq('status', options.status);
    }

    const { data, error } = await query
      .order('created_at', { ascending: false })
      .limit(options?.limit || 100);

    if (error) throw error;
    return data || [];
  }

  async getRetainageOwed(subcontractorId: string): Promise<number> {
    const { data, error } = await supabase
      .from('subcontractor_payments')
      .select('retainage_held')
      .eq('subcontractor_id', subcontractorId)
      .neq('payment_type', 'retainage_release');

    if (error) throw error;

    // Get released retainage
    const { data: released } = await supabase
      .from('subcontractor_payments')
      .select('amount')
      .eq('subcontractor_id', subcontractorId)
      .eq('payment_type', 'retainage_release')
      .eq('status', 'paid');

    const totalHeld = data?.reduce((sum, p) => sum + (p.retainage_held || 0), 0) || 0;
    const totalReleased = released?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0;

    return totalHeld - totalReleased;
  }

  // ==================== PERFORMANCE REVIEWS ====================

  async createPerformanceReview(
    data: Partial<PerformanceReview>
  ): Promise<PerformanceReview> {
    // Calculate overall rating as average
    const ratings = [
      data.quality_rating || 0,
      data.timeliness_rating || 0,
      data.communication_rating || 0,
      data.safety_rating || 0
    ];
    const overall_rating = ratings.reduce((a, b) => a + b, 0) / ratings.length;

    const review: Partial<PerformanceReview> = {
      ...data,
      overall_rating: Math.round(overall_rating * 10) / 10,
      review_date: new Date(),
      created_at: new Date()
    };

    const { data: result, error } = await supabase
      .from('performance_reviews')
      .insert(review)
      .select()
      .single();

    if (error) throw error;

    // Update subcontractor's average rating
    await this.updateSubcontractorRating(data.subcontractor_id!);

    return result;
  }

  async getPerformanceReviews(
    subcontractorId: string
  ): Promise<PerformanceReview[]> {
    const { data, error } = await supabase
      .from('performance_reviews')
      .select('*')
      .eq('subcontractor_id', subcontractorId)
      .order('review_date', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  private async updateSubcontractorRating(subcontractorId: string): Promise<void> {
    const reviews = await this.getPerformanceReviews(subcontractorId);

    if (reviews.length === 0) return;

    const avgRating = reviews.reduce((sum, r) => sum + r.overall_rating, 0) / reviews.length;

    await supabase
      .from('subcontractors')
      .update({
        rating: Math.round(avgRating * 10) / 10,
        updated_at: new Date()
      })
      .eq('id', subcontractorId);
  }

  // ==================== REPORTS & ANALYTICS ====================

  async getSubcontractorSummary(subcontractorId: string): Promise<{
    subcontractor: Subcontractor;
    activeContracts: number;
    totalContractValue: number;
    pendingPayments: number;
    retainageOwed: number;
    openWorkOrders: number;
    avgRating: number;
    expiringDocuments: SubcontractorDocument[];
  }> {
    const subcontractor = await this.getSubcontractor(subcontractorId);
    if (!subcontractor) throw new Error('Subcontractor not found');

    // Get active contracts
    const { data: contracts } = await supabase
      .from('subcontractor_contracts')
      .select('total_amount')
      .eq('subcontractor_id', subcontractorId)
      .eq('status', 'active');

    // Get pending payments
    const { data: payments } = await supabase
      .from('subcontractor_payments')
      .select('net_amount')
      .eq('subcontractor_id', subcontractorId)
      .in('status', ['pending', 'approved']);

    // Get open work orders
    const { count: openWorkOrders } = await supabase
      .from('work_orders')
      .select('*', { count: 'exact', head: true })
      .eq('subcontractor_id', subcontractorId)
      .in('status', ['pending', 'assigned', 'in_progress']);

    // Get expiring documents (next 30 days)
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 30);

    const { data: expiringDocs } = await supabase
      .from('subcontractor_documents')
      .select('*')
      .eq('subcontractor_id', subcontractorId)
      .not('expiration_date', 'is', null)
      .lte('expiration_date', futureDate.toISOString());

    const retainageOwed = await this.getRetainageOwed(subcontractorId);

    return {
      subcontractor,
      activeContracts: contracts?.length || 0,
      totalContractValue: contracts?.reduce((sum, c) => sum + c.total_amount, 0) || 0,
      pendingPayments: payments?.reduce((sum, p) => sum + p.net_amount, 0) || 0,
      retainageOwed,
      openWorkOrders: openWorkOrders || 0,
      avgRating: subcontractor.rating || 0,
      expiringDocuments: expiringDocs || []
    };
  }

  async getProjectSubcontractorReport(projectId: string): Promise<{
    totalSubcontractors: number;
    totalContractValue: number;
    totalPaid: number;
    totalPending: number;
    totalRetainageHeld: number;
    byTrade: { trade: string; count: number; value: number }[];
    workOrderStats: {
      total: number;
      completed: number;
      inProgress: number;
      pending: number;
    };
  }> {
    // Get all contracts for project
    const { data: contracts } = await supabase
      .from('subcontractor_contracts')
      .select('*, subcontractor:subcontractors(trade)')
      .eq('project_id', projectId);

    // Get payments for project
    const { data: payments } = await supabase
      .from('subcontractor_payments')
      .select('*')
      .eq('project_id', projectId);

    // Get work orders for project
    const { data: workOrders } = await supabase
      .from('work_orders')
      .select('status')
      .eq('project_id', projectId);

    // Aggregate by trade
    const byTrade = new Map<string, { count: number; value: number }>();
    contracts?.forEach(c => {
      const trade = (c.subcontractor as any)?.trade || 'Unknown';
      const current = byTrade.get(trade) || { count: 0, value: 0 };
      byTrade.set(trade, {
        count: current.count + 1,
        value: current.value + c.total_amount
      });
    });

    const paidPayments = payments?.filter(p => p.status === 'paid') || [];
    const pendingPayments = payments?.filter(p => p.status !== 'paid') || [];

    return {
      totalSubcontractors: new Set(contracts?.map(c => c.subcontractor_id)).size,
      totalContractValue: contracts?.reduce((sum, c) => sum + c.total_amount, 0) || 0,
      totalPaid: paidPayments.reduce((sum, p) => sum + p.net_amount, 0),
      totalPending: pendingPayments.reduce((sum, p) => sum + p.net_amount, 0),
      totalRetainageHeld: payments?.reduce((sum, p) => sum + (p.retainage_held || 0), 0) || 0,
      byTrade: Array.from(byTrade.entries()).map(([trade, data]) => ({
        trade,
        ...data
      })),
      workOrderStats: {
        total: workOrders?.length || 0,
        completed: workOrders?.filter(w => w.status === 'completed').length || 0,
        inProgress: workOrders?.filter(w => w.status === 'in_progress').length || 0,
        pending: workOrders?.filter(w => w.status === 'pending' || w.status === 'assigned').length || 0
      }
    };
  }

  // ==================== COMPLIANCE CHECKS ====================

  async checkSubcontractorCompliance(subcontractorId: string): Promise<{
    isCompliant: boolean;
    issues: string[];
    warnings: string[];
  }> {
    const subcontractor = await this.getSubcontractor(subcontractorId);
    if (!subcontractor) throw new Error('Subcontractor not found');

    const issues: string[] = [];
    const warnings: string[] = [];
    const now = new Date();

    // Check license expiration
    if (subcontractor.license_expiration) {
      const licenseExp = new Date(subcontractor.license_expiration);
      if (licenseExp < now) {
        issues.push('License has expired');
      } else if (licenseExp < new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)) {
        warnings.push('License expires within 30 days');
      }
    }

    // Check insurance expiration
    if (subcontractor.insurance_expiration) {
      const insuranceExp = new Date(subcontractor.insurance_expiration);
      if (insuranceExp < now) {
        issues.push('Insurance has expired');
      } else if (insuranceExp < new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)) {
        warnings.push('Insurance expires within 30 days');
      }
    }

    // Check workers comp expiration
    if (subcontractor.workers_comp_expiration) {
      const wcExp = new Date(subcontractor.workers_comp_expiration);
      if (wcExp < now) {
        issues.push("Workers' comp has expired");
      } else if (wcExp < new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)) {
        warnings.push("Workers' comp expires within 30 days");
      }
    }

    // Check for required documents
    const documents = subcontractor.documents || [];
    const hasW9 = documents.some(d => d.type === 'w9' && d.verified);
    const hasInsuranceCert = documents.some(d => d.type === 'insurance_certificate' && d.verified);

    if (!hasW9) {
      issues.push('Missing verified W-9');
    }
    if (!hasInsuranceCert) {
      issues.push('Missing verified insurance certificate');
    }

    return {
      isCompliant: issues.length === 0,
      issues,
      warnings
    };
  }
}

// Export singleton instance
export const subcontractorManagementService = new SubcontractorManagementService();

// Export convenience functions
export const createSubcontractor = (data: Partial<Subcontractor>) =>
  subcontractorManagementService.createSubcontractor(data);

export const getSubcontractor = (id: string) =>
  subcontractorManagementService.getSubcontractor(id);

export const createContract = (data: Partial<SubcontractorContract>) =>
  subcontractorManagementService.createContract(data);

export const createWorkOrder = (data: Partial<WorkOrder>) =>
  subcontractorManagementService.createWorkOrder(data);

export const createPayment = (data: Partial<SubcontractorPayment>) =>
  subcontractorManagementService.createPayment(data);
