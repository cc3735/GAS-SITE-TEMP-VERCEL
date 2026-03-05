/**
 * Accounts Payable and Accounts Receivable Routes
 *
 * AP: bills the business owes to vendors
 * AR: invoices the business has sent to clients
 */

import { Router, Request, Response, NextFunction } from 'express';
import { authenticate } from '../../middleware/auth.js';
import { supabaseAdmin } from '../../utils/supabase.js';

const router = Router();
router.use(authenticate);

// ============================================================================
// ACCOUNTS PAYABLE
// ============================================================================

/** GET /ap — list all payables for the user */
router.get('/ap', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const { status, businessId } = req.query;

    let query = supabaseAdmin
      .from('accounts_payable')
      .select('*')
      .eq('user_id', userId)
      .order('due_date', { ascending: true });

    if (status) query = query.eq('status', status as string);
    if (businessId) query = query.eq('business_id', businessId as string);

    const { data, error } = await query;
    if (error) throw error;

    // Compute overdue status in-memory (due date passed, not paid)
    const rows = (data || []).map((row) => ({
      ...row,
      computedStatus:
        row.status !== 'paid' && row.status !== 'voided' && row.due_date && new Date(row.due_date) < new Date()
          ? 'overdue'
          : row.status,
      balanceDue: Number(row.amount) - Number(row.amount_paid),
    }));

    res.json({ success: true, data: { payables: rows, total: rows.length } });
  } catch (err) {
    next(err);
  }
});

/** POST /ap — create a payable */
router.post('/ap', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const {
      vendorName, vendorEmail, vendorPhone,
      invoiceNumber, description, amount,
      dueDate, issueDate, category, taxDeductible, notes, businessId,
    } = req.body;

    if (!vendorName || !amount) {
      return res.status(400).json({ success: false, error: { message: 'vendorName and amount are required' } });
    }

    const { data, error } = await supabaseAdmin
      .from('accounts_payable')
      .insert({
        user_id: userId,
        business_id: businessId || null,
        vendor_name: vendorName,
        vendor_email: vendorEmail || null,
        vendor_phone: vendorPhone || null,
        invoice_number: invoiceNumber || null,
        description: description || null,
        amount: Number(amount),
        amount_paid: 0,
        due_date: dueDate || null,
        issue_date: issueDate || new Date().toISOString().split('T')[0],
        category: category || null,
        tax_deductible: taxDeductible ?? false,
        notes: notes || null,
        status: 'open',
      })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

/** PUT /ap/:id — update a payable (e.g. mark paid) */
router.put('/ap/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    // Verify ownership
    const { data: existing } = await supabaseAdmin
      .from('accounts_payable')
      .select('id')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (!existing) {
      return res.status(404).json({ success: false, error: { message: 'Payable not found' } });
    }

    const allowed = ['vendor_name', 'vendor_email', 'vendor_phone', 'invoice_number',
      'description', 'amount', 'amount_paid', 'due_date', 'issue_date', 'paid_date',
      'status', 'category', 'tax_deductible', 'notes'];

    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    for (const field of allowed) {
      const camel = field.replace(/_([a-z])/g, (_, l) => l.toUpperCase());
      if (req.body[camel] !== undefined) updates[field] = req.body[camel];
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    }

    const { data, error } = await supabaseAdmin
      .from('accounts_payable')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

/** DELETE /ap/:id */
router.delete('/ap/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const { error } = await supabaseAdmin
      .from('accounts_payable')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) throw error;

    res.json({ success: true, message: 'Payable deleted' });
  } catch (err) {
    next(err);
  }
});

// ============================================================================
// ACCOUNTS RECEIVABLE
// ============================================================================

/** GET /ar — list all receivables for the user */
router.get('/ar', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const { status, businessId } = req.query;

    let query = supabaseAdmin
      .from('accounts_receivable')
      .select('*')
      .eq('user_id', userId)
      .order('due_date', { ascending: true });

    if (status) query = query.eq('status', status as string);
    if (businessId) query = query.eq('business_id', businessId as string);

    const { data, error } = await query;
    if (error) throw error;

    const rows = (data || []).map((row) => ({
      ...row,
      computedStatus:
        !['paid', 'written_off'].includes(row.status) && row.due_date && new Date(row.due_date) < new Date()
          ? 'overdue'
          : row.status,
      balanceOwed: Number(row.amount) - Number(row.amount_received),
    }));

    res.json({ success: true, data: { receivables: rows, total: rows.length } });
  } catch (err) {
    next(err);
  }
});

/** POST /ar — create a receivable */
router.post('/ar', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const {
      clientName, clientEmail, clientPhone,
      invoiceNumber, description, amount,
      dueDate, issueDate, category, notes, businessId,
    } = req.body;

    if (!clientName || !amount) {
      return res.status(400).json({ success: false, error: { message: 'clientName and amount are required' } });
    }

    const { data, error } = await supabaseAdmin
      .from('accounts_receivable')
      .insert({
        user_id: userId,
        business_id: businessId || null,
        client_name: clientName,
        client_email: clientEmail || null,
        client_phone: clientPhone || null,
        invoice_number: invoiceNumber || null,
        description: description || null,
        amount: Number(amount),
        amount_received: 0,
        due_date: dueDate || null,
        issue_date: issueDate || new Date().toISOString().split('T')[0],
        category: category || null,
        notes: notes || null,
        status: 'draft',
      })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

/** PUT /ar/:id — update a receivable */
router.put('/ar/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const { data: existing } = await supabaseAdmin
      .from('accounts_receivable')
      .select('id')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (!existing) {
      return res.status(404).json({ success: false, error: { message: 'Receivable not found' } });
    }

    const allowed = ['client_name', 'client_email', 'client_phone', 'invoice_number',
      'description', 'amount', 'amount_received', 'due_date', 'issue_date', 'received_date',
      'status', 'category', 'notes'];

    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    for (const field of allowed) {
      const camel = field.replace(/_([a-z])/g, (_, l) => l.toUpperCase());
      if (req.body[camel] !== undefined) updates[field] = req.body[camel];
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    }

    const { data, error } = await supabaseAdmin
      .from('accounts_receivable')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

/** DELETE /ar/:id */
router.delete('/ar/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const { error } = await supabaseAdmin
      .from('accounts_receivable')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) throw error;

    res.json({ success: true, message: 'Receivable deleted' });
  } catch (err) {
    next(err);
  }
});

// ============================================================================
// PAYMENT RECORDING
// ============================================================================

/** POST /ap/:id/pay — record a payment on a payable */
router.post('/ap/:id/pay', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    const { amount, notes, paidDate } = req.body;

    if (!amount || Number(amount) <= 0) {
      return res.status(400).json({ success: false, error: { message: 'amount is required and must be > 0' } });
    }

    const { data: existing, error: fetchErr } = await supabaseAdmin
      .from('accounts_payable')
      .select('amount, amount_paid')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (fetchErr || !existing) {
      return res.status(404).json({ success: false, error: { message: 'Payable not found' } });
    }

    const newAmountPaid = Number(existing.amount_paid) + Number(amount);
    const newStatus = newAmountPaid >= Number(existing.amount) ? 'paid' : 'partial';

    const updates: Record<string, unknown> = {
      amount_paid: newAmountPaid,
      status: newStatus,
      updated_at: new Date().toISOString(),
    };
    if (newStatus === 'paid') {
      updates.paid_date = paidDate || new Date().toISOString().split('T')[0];
    }

    const { data, error } = await supabaseAdmin
      .from('accounts_payable')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    // Record in payment history
    await supabaseAdmin.from('payment_history').insert({
      user_id: userId,
      record_type: 'ap',
      record_id: id,
      amount: Number(amount),
      payment_method: 'manual',
      notes: notes || null,
    });

    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

/** POST /ar/:id/payment — record a payment on a receivable */
router.post('/ar/:id/payment', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    const { amount, notes, paymentMethod } = req.body;

    if (!amount || Number(amount) <= 0) {
      return res.status(400).json({ success: false, error: { message: 'amount is required and must be > 0' } });
    }

    const { data: existing, error: fetchErr } = await supabaseAdmin
      .from('accounts_receivable')
      .select('amount, amount_received')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (fetchErr || !existing) {
      return res.status(404).json({ success: false, error: { message: 'Receivable not found' } });
    }

    const newAmountReceived = Number(existing.amount_received) + Number(amount);
    const newStatus = newAmountReceived >= Number(existing.amount) ? 'paid' : 'partial';

    const updates: Record<string, unknown> = {
      amount_received: newAmountReceived,
      status: newStatus,
      updated_at: new Date().toISOString(),
    };
    if (newStatus === 'paid') {
      updates.received_date = new Date().toISOString().split('T')[0];
    }

    const { data, error } = await supabaseAdmin
      .from('accounts_receivable')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    // Record in payment history
    await supabaseAdmin.from('payment_history').insert({
      user_id: userId,
      record_type: 'ar',
      record_id: id,
      amount: Number(amount),
      payment_method: paymentMethod || 'manual',
      notes: notes || null,
    });

    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

export default router;
