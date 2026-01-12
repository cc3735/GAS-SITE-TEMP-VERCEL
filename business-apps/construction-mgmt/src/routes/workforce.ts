/**
 * Workforce Management Routes
 *
 * API endpoints for time tracking, equipment, and subcontractor management
 */

import { Router, Request, Response } from 'express';
import { timeTrackingService } from '../services/time-tracking';
import { equipmentTrackingService } from '../services/equipment-tracking';
import { subcontractorManagementService } from '../services/subcontractor-management';

const router = Router();

// ==================== TIME TRACKING ====================

/**
 * Clock in
 * POST /api/workforce/time/clock-in
 */
router.post('/time/clock-in', async (req: Request, res: Response) => {
  try {
    const { userId, projectId, taskId, notes, location } = req.body;

    if (!userId || !projectId) {
      return res.status(400).json({ error: 'userId and projectId are required' });
    }

    const entry = await timeTrackingService.clockIn(userId, projectId, {
      taskId,
      notes,
      location
    });

    res.json(entry);
  } catch (error) {
    console.error('Clock in error:', error);
    res.status(500).json({ error: 'Failed to clock in' });
  }
});

/**
 * Clock out
 * POST /api/workforce/time/clock-out
 */
router.post('/time/clock-out', async (req: Request, res: Response) => {
  try {
    const { userId, notes, location } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    const entry = await timeTrackingService.clockOut(userId, { notes, location });
    res.json(entry);
  } catch (error) {
    console.error('Clock out error:', error);
    res.status(500).json({ error: 'Failed to clock out' });
  }
});

/**
 * Start break
 * POST /api/workforce/time/break/start
 */
router.post('/time/break/start', async (req: Request, res: Response) => {
  try {
    const { userId, type, isPaid } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    const breakEntry = await timeTrackingService.startBreak(userId, type || 'break', isPaid ?? false);
    res.json(breakEntry);
  } catch (error) {
    console.error('Start break error:', error);
    res.status(500).json({ error: 'Failed to start break' });
  }
});

/**
 * End break
 * POST /api/workforce/time/break/:breakId/end
 */
router.post('/time/break/:breakId/end', async (req: Request, res: Response) => {
  try {
    const { breakId } = req.params;
    const breakEntry = await timeTrackingService.endBreak(breakId);
    res.json(breakEntry);
  } catch (error) {
    console.error('End break error:', error);
    res.status(500).json({ error: 'Failed to end break' });
  }
});

/**
 * Get time entries for a user
 * GET /api/workforce/time/entries/:userId
 */
router.get('/time/entries/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { startDate, endDate, projectId } = req.query;

    const entries = await timeTrackingService.getTimeEntries(userId, {
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
      projectId: projectId as string
    });

    res.json(entries);
  } catch (error) {
    console.error('Get time entries error:', error);
    res.status(500).json({ error: 'Failed to get time entries' });
  }
});

/**
 * Get active entry for a user
 * GET /api/workforce/time/active/:userId
 */
router.get('/time/active/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const entry = await timeTrackingService.getActiveEntry(userId);
    res.json(entry || { active: false });
  } catch (error) {
    console.error('Get active entry error:', error);
    res.status(500).json({ error: 'Failed to get active entry' });
  }
});

/**
 * Generate timesheet
 * POST /api/workforce/time/timesheet/generate
 */
router.post('/time/timesheet/generate', async (req: Request, res: Response) => {
  try {
    const { userId, weekStart } = req.body;

    if (!userId || !weekStart) {
      return res.status(400).json({ error: 'userId and weekStart are required' });
    }

    const timesheet = await timeTrackingService.generateTimesheet(userId, new Date(weekStart));
    res.json(timesheet);
  } catch (error) {
    console.error('Generate timesheet error:', error);
    res.status(500).json({ error: 'Failed to generate timesheet' });
  }
});

/**
 * Submit timesheet
 * POST /api/workforce/time/timesheet/:id/submit
 */
router.post('/time/timesheet/:id/submit', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const timesheet = await timeTrackingService.submitTimesheet(id);
    res.json(timesheet);
  } catch (error) {
    console.error('Submit timesheet error:', error);
    res.status(500).json({ error: 'Failed to submit timesheet' });
  }
});

/**
 * Approve timesheet
 * POST /api/workforce/time/timesheet/:id/approve
 */
router.post('/time/timesheet/:id/approve', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { approvedBy, notes } = req.body;

    if (!approvedBy) {
      return res.status(400).json({ error: 'approvedBy is required' });
    }

    const timesheet = await timeTrackingService.approveTimesheet(id, approvedBy, notes);
    res.json(timesheet);
  } catch (error) {
    console.error('Approve timesheet error:', error);
    res.status(500).json({ error: 'Failed to approve timesheet' });
  }
});

/**
 * Get project labor summary
 * GET /api/workforce/time/project/:projectId/summary
 */
router.get('/time/project/:projectId/summary', async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    const { startDate, endDate } = req.query;

    const summary = await timeTrackingService.getProjectLaborSummary(
      projectId,
      startDate ? new Date(startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      endDate ? new Date(endDate as string) : new Date()
    );

    res.json(summary);
  } catch (error) {
    console.error('Get project labor summary error:', error);
    res.status(500).json({ error: 'Failed to get labor summary' });
  }
});

// ==================== EQUIPMENT TRACKING ====================

/**
 * Create equipment
 * POST /api/workforce/equipment
 */
router.post('/equipment', async (req: Request, res: Response) => {
  try {
    const equipment = await equipmentTrackingService.createEquipment(req.body);
    res.json(equipment);
  } catch (error) {
    console.error('Create equipment error:', error);
    res.status(500).json({ error: 'Failed to create equipment' });
  }
});

/**
 * Get equipment
 * GET /api/workforce/equipment/:id
 */
router.get('/equipment/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const equipment = await equipmentTrackingService.getEquipment(id);
    if (!equipment) {
      return res.status(404).json({ error: 'Equipment not found' });
    }
    res.json(equipment);
  } catch (error) {
    console.error('Get equipment error:', error);
    res.status(500).json({ error: 'Failed to get equipment' });
  }
});

/**
 * List equipment
 * GET /api/workforce/equipment
 */
router.get('/equipment', async (req: Request, res: Response) => {
  try {
    const { organizationId, status, category, search, limit, offset } = req.query;

    if (!organizationId) {
      return res.status(400).json({ error: 'organizationId is required' });
    }

    const result = await equipmentTrackingService.listEquipment(
      organizationId as string,
      {
        status: status as any,
        category: category as string,
        search: search as string,
        limit: limit ? parseInt(limit as string) : undefined,
        offset: offset ? parseInt(offset as string) : undefined
      }
    );

    res.json(result);
  } catch (error) {
    console.error('List equipment error:', error);
    res.status(500).json({ error: 'Failed to list equipment' });
  }
});

/**
 * Checkout equipment
 * POST /api/workforce/equipment/:id/checkout
 */
router.post('/equipment/:id/checkout', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { userId, projectId, expectedReturn, notes, condition } = req.body;

    if (!userId || !projectId) {
      return res.status(400).json({ error: 'userId and projectId are required' });
    }

    const checkout = await equipmentTrackingService.checkoutEquipment(
      id,
      userId,
      projectId,
      {
        expectedReturn: expectedReturn ? new Date(expectedReturn) : undefined,
        notes,
        conditionAtCheckout: condition
      }
    );

    res.json(checkout);
  } catch (error) {
    console.error('Checkout equipment error:', error);
    res.status(500).json({ error: 'Failed to checkout equipment' });
  }
});

/**
 * Return equipment
 * POST /api/workforce/equipment/checkout/:checkoutId/return
 */
router.post('/equipment/checkout/:checkoutId/return', async (req: Request, res: Response) => {
  try {
    const { checkoutId } = req.params;
    const { condition, notes, issues } = req.body;

    const checkout = await equipmentTrackingService.returnEquipment(checkoutId, {
      conditionAtReturn: condition,
      notes,
      issues
    });

    res.json(checkout);
  } catch (error) {
    console.error('Return equipment error:', error);
    res.status(500).json({ error: 'Failed to return equipment' });
  }
});

/**
 * Get equipment by project
 * GET /api/workforce/equipment/project/:projectId
 */
router.get('/equipment/project/:projectId', async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    const equipment = await equipmentTrackingService.getEquipmentByProject(projectId);
    res.json(equipment);
  } catch (error) {
    console.error('Get equipment by project error:', error);
    res.status(500).json({ error: 'Failed to get equipment' });
  }
});

/**
 * Schedule maintenance
 * POST /api/workforce/equipment/:id/maintenance
 */
router.post('/equipment/:id/maintenance', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const maintenance = await equipmentTrackingService.scheduleMaintenance(id, req.body);
    res.json(maintenance);
  } catch (error) {
    console.error('Schedule maintenance error:', error);
    res.status(500).json({ error: 'Failed to schedule maintenance' });
  }
});

/**
 * Complete maintenance
 * POST /api/workforce/equipment/maintenance/:maintenanceId/complete
 */
router.post('/equipment/maintenance/:maintenanceId/complete', async (req: Request, res: Response) => {
  try {
    const { maintenanceId } = req.params;
    const maintenance = await equipmentTrackingService.completeMaintenance(maintenanceId, req.body);
    res.json(maintenance);
  } catch (error) {
    console.error('Complete maintenance error:', error);
    res.status(500).json({ error: 'Failed to complete maintenance' });
  }
});

/**
 * Get equipment summary
 * GET /api/workforce/equipment/:id/summary
 */
router.get('/equipment/:id/summary', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const summary = await equipmentTrackingService.getEquipmentSummary(id);
    res.json(summary);
  } catch (error) {
    console.error('Get equipment summary error:', error);
    res.status(500).json({ error: 'Failed to get equipment summary' });
  }
});

/**
 * Get overdue equipment
 * GET /api/workforce/equipment/overdue/:organizationId
 */
router.get('/equipment/overdue/:organizationId', async (req: Request, res: Response) => {
  try {
    const { organizationId } = req.params;
    const overdue = await equipmentTrackingService.getOverdueEquipment(organizationId);
    res.json(overdue);
  } catch (error) {
    console.error('Get overdue equipment error:', error);
    res.status(500).json({ error: 'Failed to get overdue equipment' });
  }
});

// ==================== SUBCONTRACTOR MANAGEMENT ====================

/**
 * Create subcontractor
 * POST /api/workforce/subcontractors
 */
router.post('/subcontractors', async (req: Request, res: Response) => {
  try {
    const subcontractor = await subcontractorManagementService.createSubcontractor(req.body);
    res.json(subcontractor);
  } catch (error) {
    console.error('Create subcontractor error:', error);
    res.status(500).json({ error: 'Failed to create subcontractor' });
  }
});

/**
 * Get subcontractor
 * GET /api/workforce/subcontractors/:id
 */
router.get('/subcontractors/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const subcontractor = await subcontractorManagementService.getSubcontractor(id);
    if (!subcontractor) {
      return res.status(404).json({ error: 'Subcontractor not found' });
    }
    res.json(subcontractor);
  } catch (error) {
    console.error('Get subcontractor error:', error);
    res.status(500).json({ error: 'Failed to get subcontractor' });
  }
});

/**
 * List subcontractors
 * GET /api/workforce/subcontractors
 */
router.get('/subcontractors', async (req: Request, res: Response) => {
  try {
    const { organizationId, status, trade, minRating, search, limit, offset } = req.query;

    if (!organizationId) {
      return res.status(400).json({ error: 'organizationId is required' });
    }

    const result = await subcontractorManagementService.listSubcontractors(
      organizationId as string,
      {
        status: status as any,
        trade: trade as string,
        minRating: minRating ? parseFloat(minRating as string) : undefined,
        search: search as string,
        limit: limit ? parseInt(limit as string) : undefined,
        offset: offset ? parseInt(offset as string) : undefined
      }
    );

    res.json(result);
  } catch (error) {
    console.error('List subcontractors error:', error);
    res.status(500).json({ error: 'Failed to list subcontractors' });
  }
});

/**
 * Update subcontractor
 * PUT /api/workforce/subcontractors/:id
 */
router.put('/subcontractors/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const subcontractor = await subcontractorManagementService.updateSubcontractor(id, req.body);
    res.json(subcontractor);
  } catch (error) {
    console.error('Update subcontractor error:', error);
    res.status(500).json({ error: 'Failed to update subcontractor' });
  }
});

/**
 * Get subcontractors by trade
 * GET /api/workforce/subcontractors/trade/:trade
 */
router.get('/subcontractors/trade/:trade', async (req: Request, res: Response) => {
  try {
    const { trade } = req.params;
    const { organizationId } = req.query;

    if (!organizationId) {
      return res.status(400).json({ error: 'organizationId is required' });
    }

    const subcontractors = await subcontractorManagementService.getSubcontractorsByTrade(
      organizationId as string,
      trade
    );

    res.json(subcontractors);
  } catch (error) {
    console.error('Get subcontractors by trade error:', error);
    res.status(500).json({ error: 'Failed to get subcontractors' });
  }
});

/**
 * Add document to subcontractor
 * POST /api/workforce/subcontractors/:id/documents
 */
router.post('/subcontractors/:id/documents', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const document = await subcontractorManagementService.addDocument(id, req.body);
    res.json(document);
  } catch (error) {
    console.error('Add document error:', error);
    res.status(500).json({ error: 'Failed to add document' });
  }
});

/**
 * Verify document
 * POST /api/workforce/subcontractors/documents/:documentId/verify
 */
router.post('/subcontractors/documents/:documentId/verify', async (req: Request, res: Response) => {
  try {
    const { documentId } = req.params;
    const { verifiedBy } = req.body;

    if (!verifiedBy) {
      return res.status(400).json({ error: 'verifiedBy is required' });
    }

    const document = await subcontractorManagementService.verifyDocument(documentId, verifiedBy);
    res.json(document);
  } catch (error) {
    console.error('Verify document error:', error);
    res.status(500).json({ error: 'Failed to verify document' });
  }
});

/**
 * Get expiring documents
 * GET /api/workforce/subcontractors/documents/expiring
 */
router.get('/subcontractors/documents/expiring', async (req: Request, res: Response) => {
  try {
    const { organizationId, daysAhead } = req.query;

    if (!organizationId) {
      return res.status(400).json({ error: 'organizationId is required' });
    }

    const documents = await subcontractorManagementService.getExpiringDocuments(
      organizationId as string,
      daysAhead ? parseInt(daysAhead as string) : 30
    );

    res.json(documents);
  } catch (error) {
    console.error('Get expiring documents error:', error);
    res.status(500).json({ error: 'Failed to get expiring documents' });
  }
});

/**
 * Create contract
 * POST /api/workforce/contracts
 */
router.post('/contracts', async (req: Request, res: Response) => {
  try {
    const contract = await subcontractorManagementService.createContract(req.body);
    res.json(contract);
  } catch (error) {
    console.error('Create contract error:', error);
    res.status(500).json({ error: 'Failed to create contract' });
  }
});

/**
 * Get contract
 * GET /api/workforce/contracts/:id
 */
router.get('/contracts/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const contract = await subcontractorManagementService.getContract(id);
    if (!contract) {
      return res.status(404).json({ error: 'Contract not found' });
    }
    res.json(contract);
  } catch (error) {
    console.error('Get contract error:', error);
    res.status(500).json({ error: 'Failed to get contract' });
  }
});

/**
 * List contracts
 * GET /api/workforce/contracts/project/:projectId
 */
router.get('/contracts/project/:projectId', async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    const { status, subcontractorId } = req.query;

    const contracts = await subcontractorManagementService.listContracts(projectId, {
      status: status as any,
      subcontractorId: subcontractorId as string
    });

    res.json(contracts);
  } catch (error) {
    console.error('List contracts error:', error);
    res.status(500).json({ error: 'Failed to list contracts' });
  }
});

/**
 * Update contract status
 * POST /api/workforce/contracts/:id/status
 */
router.post('/contracts/:id/status', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, signedByContractor, signedBySubcontractor } = req.body;

    const contract = await subcontractorManagementService.updateContractStatus(id, status, {
      signed_by_contractor: signedByContractor,
      signed_by_subcontractor: signedBySubcontractor
    });

    res.json(contract);
  } catch (error) {
    console.error('Update contract status error:', error);
    res.status(500).json({ error: 'Failed to update contract status' });
  }
});

/**
 * Create change order
 * POST /api/workforce/contracts/:contractId/change-orders
 */
router.post('/contracts/:contractId/change-orders', async (req: Request, res: Response) => {
  try {
    const { contractId } = req.params;
    const changeOrder = await subcontractorManagementService.createChangeOrder(contractId, req.body);
    res.json(changeOrder);
  } catch (error) {
    console.error('Create change order error:', error);
    res.status(500).json({ error: 'Failed to create change order' });
  }
});

/**
 * Approve change order
 * POST /api/workforce/contracts/:contractId/change-orders/:changeOrderId/approve
 */
router.post('/contracts/:contractId/change-orders/:changeOrderId/approve', async (req: Request, res: Response) => {
  try {
    const { contractId, changeOrderId } = req.params;
    const { approvedBy } = req.body;

    if (!approvedBy) {
      return res.status(400).json({ error: 'approvedBy is required' });
    }

    const contract = await subcontractorManagementService.approveChangeOrder(
      contractId,
      changeOrderId,
      approvedBy
    );

    res.json(contract);
  } catch (error) {
    console.error('Approve change order error:', error);
    res.status(500).json({ error: 'Failed to approve change order' });
  }
});

/**
 * Create work order
 * POST /api/workforce/work-orders
 */
router.post('/work-orders', async (req: Request, res: Response) => {
  try {
    const workOrder = await subcontractorManagementService.createWorkOrder(req.body);
    res.json(workOrder);
  } catch (error) {
    console.error('Create work order error:', error);
    res.status(500).json({ error: 'Failed to create work order' });
  }
});

/**
 * Get work order
 * GET /api/workforce/work-orders/:id
 */
router.get('/work-orders/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const workOrder = await subcontractorManagementService.getWorkOrder(id);
    if (!workOrder) {
      return res.status(404).json({ error: 'Work order not found' });
    }
    res.json(workOrder);
  } catch (error) {
    console.error('Get work order error:', error);
    res.status(500).json({ error: 'Failed to get work order' });
  }
});

/**
 * List work orders
 * GET /api/workforce/work-orders/project/:projectId
 */
router.get('/work-orders/project/:projectId', async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    const { status, subcontractorId, priority, startDate, endDate } = req.query;

    const workOrders = await subcontractorManagementService.listWorkOrders(projectId, {
      status: status as any,
      subcontractorId: subcontractorId as string,
      priority: priority as any,
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined
    });

    res.json(workOrders);
  } catch (error) {
    console.error('List work orders error:', error);
    res.status(500).json({ error: 'Failed to list work orders' });
  }
});

/**
 * Update work order status
 * POST /api/workforce/work-orders/:id/status
 */
router.post('/work-orders/:id/status', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, actualStart, actualEnd, actualHours, actualCost, completedBy } = req.body;

    const workOrder = await subcontractorManagementService.updateWorkOrderStatus(id, status, {
      actual_start: actualStart ? new Date(actualStart) : undefined,
      actual_end: actualEnd ? new Date(actualEnd) : undefined,
      actual_hours: actualHours,
      actual_cost: actualCost,
      completed_by: completedBy
    });

    res.json(workOrder);
  } catch (error) {
    console.error('Update work order status error:', error);
    res.status(500).json({ error: 'Failed to update work order status' });
  }
});

/**
 * Update checklist item
 * POST /api/workforce/work-orders/:id/checklist/:itemId
 */
router.post('/work-orders/:id/checklist/:itemId', async (req: Request, res: Response) => {
  try {
    const { id, itemId } = req.params;
    const { completed, completedBy } = req.body;

    const workOrder = await subcontractorManagementService.updateChecklistItem(
      id,
      itemId,
      completed,
      completedBy
    );

    res.json(workOrder);
  } catch (error) {
    console.error('Update checklist item error:', error);
    res.status(500).json({ error: 'Failed to update checklist item' });
  }
});

/**
 * Inspect work order
 * POST /api/workforce/work-orders/:id/inspect
 */
router.post('/work-orders/:id/inspect', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { inspectedBy, notes, passed } = req.body;

    if (!inspectedBy) {
      return res.status(400).json({ error: 'inspectedBy is required' });
    }

    const workOrder = await subcontractorManagementService.inspectWorkOrder(
      id,
      inspectedBy,
      notes,
      passed ?? true
    );

    res.json(workOrder);
  } catch (error) {
    console.error('Inspect work order error:', error);
    res.status(500).json({ error: 'Failed to inspect work order' });
  }
});

/**
 * Create payment
 * POST /api/workforce/payments
 */
router.post('/payments', async (req: Request, res: Response) => {
  try {
    const payment = await subcontractorManagementService.createPayment(req.body);
    res.json(payment);
  } catch (error) {
    console.error('Create payment error:', error);
    res.status(500).json({ error: 'Failed to create payment' });
  }
});

/**
 * Approve payment
 * POST /api/workforce/payments/:id/approve
 */
router.post('/payments/:id/approve', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { approvedBy } = req.body;

    if (!approvedBy) {
      return res.status(400).json({ error: 'approvedBy is required' });
    }

    const payment = await subcontractorManagementService.approvePayment(id, approvedBy);
    res.json(payment);
  } catch (error) {
    console.error('Approve payment error:', error);
    res.status(500).json({ error: 'Failed to approve payment' });
  }
});

/**
 * Mark payment as paid
 * POST /api/workforce/payments/:id/paid
 */
router.post('/payments/:id/paid', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { paymentMethod, checkNumber, lienWaiverReceived, lienWaiverDocumentId } = req.body;

    const payment = await subcontractorManagementService.markPaymentPaid(id, {
      payment_method: paymentMethod,
      check_number: checkNumber,
      lien_waiver_received: lienWaiverReceived,
      lien_waiver_document_id: lienWaiverDocumentId
    });

    res.json(payment);
  } catch (error) {
    console.error('Mark payment paid error:', error);
    res.status(500).json({ error: 'Failed to mark payment as paid' });
  }
});

/**
 * Get payment history
 * GET /api/workforce/payments/subcontractor/:subcontractorId
 */
router.get('/payments/subcontractor/:subcontractorId', async (req: Request, res: Response) => {
  try {
    const { subcontractorId } = req.params;
    const { projectId, status, limit } = req.query;

    const payments = await subcontractorManagementService.getPaymentHistory(subcontractorId, {
      projectId: projectId as string,
      status: status as any,
      limit: limit ? parseInt(limit as string) : undefined
    });

    res.json(payments);
  } catch (error) {
    console.error('Get payment history error:', error);
    res.status(500).json({ error: 'Failed to get payment history' });
  }
});

/**
 * Create performance review
 * POST /api/workforce/reviews
 */
router.post('/reviews', async (req: Request, res: Response) => {
  try {
    const review = await subcontractorManagementService.createPerformanceReview(req.body);
    res.json(review);
  } catch (error) {
    console.error('Create review error:', error);
    res.status(500).json({ error: 'Failed to create review' });
  }
});

/**
 * Get performance reviews for subcontractor
 * GET /api/workforce/reviews/subcontractor/:subcontractorId
 */
router.get('/reviews/subcontractor/:subcontractorId', async (req: Request, res: Response) => {
  try {
    const { subcontractorId } = req.params;
    const reviews = await subcontractorManagementService.getPerformanceReviews(subcontractorId);
    res.json(reviews);
  } catch (error) {
    console.error('Get reviews error:', error);
    res.status(500).json({ error: 'Failed to get reviews' });
  }
});

/**
 * Get subcontractor summary
 * GET /api/workforce/subcontractors/:id/summary
 */
router.get('/subcontractors/:id/summary', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const summary = await subcontractorManagementService.getSubcontractorSummary(id);
    res.json(summary);
  } catch (error) {
    console.error('Get subcontractor summary error:', error);
    res.status(500).json({ error: 'Failed to get summary' });
  }
});

/**
 * Get project subcontractor report
 * GET /api/workforce/reports/project/:projectId/subcontractors
 */
router.get('/reports/project/:projectId/subcontractors', async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    const report = await subcontractorManagementService.getProjectSubcontractorReport(projectId);
    res.json(report);
  } catch (error) {
    console.error('Get project subcontractor report error:', error);
    res.status(500).json({ error: 'Failed to get report' });
  }
});

/**
 * Check subcontractor compliance
 * GET /api/workforce/subcontractors/:id/compliance
 */
router.get('/subcontractors/:id/compliance', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const compliance = await subcontractorManagementService.checkSubcontractorCompliance(id);
    res.json(compliance);
  } catch (error) {
    console.error('Check compliance error:', error);
    res.status(500).json({ error: 'Failed to check compliance' });
  }
});

export default router;
