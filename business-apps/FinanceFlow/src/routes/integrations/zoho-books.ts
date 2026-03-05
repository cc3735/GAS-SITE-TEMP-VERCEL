/**
 * Zoho Books Integration Routes
 *
 * Sync data between Zoho Books and FinanceFlow, and proxy financial reports.
 */

import { Router, type Request, type Response, type NextFunction } from 'express';
import { authenticate } from '../../middleware/auth.js';
import { supabaseAdmin } from '../../utils/supabase.js';
import { logger } from '../../utils/logger.js';
import * as zoho from '../../services/integrations/zoho-books.js';

const router = Router();
router.use(authenticate);

// ── Status ─────────────────────────────────────────────────────────

/** GET /status — check if Zoho Books is configured + last sync time */
router.get('/status', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const configured = await zoho.isConfigured(userId);

    let lastSync: string | null = null;
    if (configured) {
      const { data } = await supabaseAdmin
        .from('zoho_sync_log')
        .select('completed_at')
        .eq('user_id', userId)
        .eq('status', 'completed')
        .order('completed_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      lastSync = data?.completed_at ?? null;
    }

    res.json({ success: true, data: { configured, lastSync } });
  } catch (err) {
    next(err);
  }
});

// ── Sync ───────────────────────────────────────────────────────────

/** POST /sync — trigger a sync (invoices, bills, or full) */
router.post('/sync', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const { type = 'full' } = req.body as { type?: string };

    const configured = await zoho.isConfigured(userId);
    if (!configured) {
      return res.status(400).json({
        success: false,
        error: { code: 'NOT_CONFIGURED', message: 'Zoho Books is not configured. Add it from the MCP catalog.' },
      });
    }

    // Create sync log entry
    const { data: logEntry, error: logErr } = await supabaseAdmin
      .from('zoho_sync_log')
      .insert({ user_id: userId, sync_type: type, status: 'running' })
      .select()
      .single();

    if (logErr) throw logErr;

    // Run sync (non-blocking response for better UX)
    const syncId = logEntry.id;

    // Execute sync
    try {
      let recordsSynced = 0;

      if (type === 'invoices' || type === 'full') {
        recordsSynced += await zoho.syncInvoicesToAR(userId);
      }
      if (type === 'bills' || type === 'full') {
        recordsSynced += await zoho.syncBillsToAP(userId);
      }

      await supabaseAdmin
        .from('zoho_sync_log')
        .update({
          status: 'completed',
          records_synced: recordsSynced,
          completed_at: new Date().toISOString(),
        })
        .eq('id', syncId);

      logger.info('Zoho sync completed', { userId, type, recordsSynced });

      res.json({
        success: true,
        data: { syncId, status: 'completed', recordsSynced },
      });
    } catch (syncErr) {
      const errMsg = syncErr instanceof Error ? syncErr.message : 'Sync failed';
      await supabaseAdmin
        .from('zoho_sync_log')
        .update({
          status: 'failed',
          error_message: errMsg,
          completed_at: new Date().toISOString(),
        })
        .eq('id', syncId);

      logger.error('Zoho sync failed', { userId, type, error: errMsg });

      res.status(500).json({
        success: false,
        error: { code: 'SYNC_FAILED', message: errMsg },
      });
    }
  } catch (err) {
    next(err);
  }
});

/** GET /sync/:id — check sync progress */
router.get('/sync/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const { data, error } = await supabaseAdmin
      .from('zoho_sync_log')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (error || !data) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Sync log not found' },
      });
    }

    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

// ── Reports ────────────────────────────────────────────────────────

/** GET /reports/profit-loss?from=YYYY-MM-DD&to=YYYY-MM-DD */
router.get('/reports/profit-loss', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const { from, to } = req.query as { from?: string; to?: string };

    const now = new Date();
    const startDate = from || `${now.getFullYear()}-01-01`;
    const endDate = to || now.toISOString().split('T')[0];

    const report = await zoho.getProfitAndLoss(userId, startDate, endDate);
    res.json({ success: true, data: report });
  } catch (err) {
    next(err);
  }
});

/** GET /reports/balance-sheet?date=YYYY-MM-DD */
router.get('/reports/balance-sheet', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const { date } = req.query as { date?: string };
    const reportDate = date || new Date().toISOString().split('T')[0];

    const report = await zoho.getBalanceSheet(userId, reportDate);
    res.json({ success: true, data: report });
  } catch (err) {
    next(err);
  }
});

/** GET /reports/cash-flow?from=YYYY-MM-DD&to=YYYY-MM-DD */
router.get('/reports/cash-flow', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const { from, to } = req.query as { from?: string; to?: string };

    const now = new Date();
    const startDate = from || `${now.getFullYear()}-01-01`;
    const endDate = to || now.toISOString().split('T')[0];

    const report = await zoho.getCashFlowStatement(userId, startDate, endDate);
    res.json({ success: true, data: report });
  } catch (err) {
    next(err);
  }
});

export default router;
