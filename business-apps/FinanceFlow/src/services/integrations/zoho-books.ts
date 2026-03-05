/**
 * Zoho Books Integration Service
 *
 * Reads OAuth credentials from the `mcp_servers` table (catalog_id = 'zoho-books'),
 * refreshes access tokens automatically, and provides methods for syncing
 * invoices, bills, contacts, chart of accounts, and pulling financial reports.
 */

import { supabaseAdmin } from '../../utils/supabase.js';
import { logger } from '../../utils/logger.js';

// ── Types ──────────────────────────────────────────────────────────

interface ZohoCredentials {
  client_id: string;
  client_secret: string;
  refresh_token: string;
  organization_id: string;
  domain: string; // 'com' | 'eu' | 'in'
}

interface ZohoTokenCache {
  accessToken: string;
  expiresAt: number;
}

interface ZohoInvoice {
  invoice_id: string;
  invoice_number: string;
  customer_name: string;
  customer_id: string;
  email: string;
  status: string;
  date: string;
  due_date: string;
  total: number;
  balance: number;
  currency_code: string;
}

interface ZohoBill {
  bill_id: string;
  bill_number: string;
  vendor_name: string;
  vendor_id: string;
  status: string;
  date: string;
  due_date: string;
  total: number;
  balance: number;
  currency_code: string;
}

interface ZohoContact {
  contact_id: string;
  contact_name: string;
  company_name: string;
  email: string;
  contact_type: string; // 'customer' | 'vendor'
}

interface ZohoAccount {
  account_id: string;
  account_name: string;
  account_type: string;
  account_code: string;
  description: string;
  current_balance: number;
}

export interface ZohoReportRow {
  [key: string]: string | number;
}

export interface ZohoReport {
  report_name: string;
  start_date: string;
  end_date: string;
  rows: ZohoReportRow[];
  total?: Record<string, number>;
}

// ── Token cache per user ───────────────────────────────────────────
const tokenCache = new Map<string, ZohoTokenCache>();

// ── Helpers ────────────────────────────────────────────────────────

async function getCredentials(userId: string): Promise<ZohoCredentials | null> {
  const { data } = await supabaseAdmin
    .from('mcp_servers')
    .select('config')
    .eq('user_id', userId)
    .eq('catalog_id', 'zoho-books')
    .single();

  if (!data?.config) return null;

  const cfg = data.config as Record<string, string>;
  if (!cfg.client_id || !cfg.client_secret || !cfg.refresh_token || !cfg.organization_id) return null;

  return {
    client_id: cfg.client_id,
    client_secret: cfg.client_secret,
    refresh_token: cfg.refresh_token,
    organization_id: cfg.organization_id,
    domain: cfg.domain || 'com',
  };
}

async function getAccessToken(userId: string): Promise<string> {
  const cached = tokenCache.get(userId);
  if (cached && cached.expiresAt > Date.now() + 60_000) {
    return cached.accessToken;
  }

  const creds = await getCredentials(userId);
  if (!creds) throw new Error('Zoho Books is not configured');

  const res = await fetch(`https://accounts.zoho.${creds.domain}/oauth/v2/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      client_id: creds.client_id,
      client_secret: creds.client_secret,
      refresh_token: creds.refresh_token,
    }),
  });

  const json = await res.json() as { access_token?: string; expires_in?: number; error?: string };
  if (!json.access_token) {
    throw new Error(`Zoho token refresh failed: ${json.error ?? 'unknown error'}`);
  }

  tokenCache.set(userId, {
    accessToken: json.access_token,
    expiresAt: Date.now() + (json.expires_in ?? 3600) * 1000,
  });

  return json.access_token;
}

async function zohoGet<T>(userId: string, path: string, params?: Record<string, string>): Promise<T> {
  const creds = await getCredentials(userId);
  if (!creds) throw new Error('Zoho Books is not configured');

  const token = await getAccessToken(userId);
  const url = new URL(`https://www.zohoapis.${creds.domain}/books/v3${path}`);
  url.searchParams.set('organization_id', creds.organization_id);
  if (params) {
    for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  }

  const res = await fetch(url.toString(), {
    headers: { Authorization: `Zoho-oauthtoken ${token}` },
  });

  const json = await res.json() as Record<string, unknown>;
  if (json.code !== 0) {
    throw new Error(`Zoho API error: ${(json.message as string) ?? JSON.stringify(json)}`);
  }
  return json as T;
}

// ── Public API ─────────────────────────────────────────────────────

export async function isConfigured(userId: string): Promise<boolean> {
  const creds = await getCredentials(userId);
  return creds !== null;
}

// Contacts
export async function listContacts(userId: string): Promise<ZohoContact[]> {
  const res = await zohoGet<{ contacts: ZohoContact[] }>(userId, '/contacts');
  return res.contacts ?? [];
}

// Invoices
export async function listInvoices(userId: string, page = 1): Promise<ZohoInvoice[]> {
  const res = await zohoGet<{ invoices: ZohoInvoice[] }>(userId, '/invoices', {
    page: String(page),
    per_page: '200',
  });
  return res.invoices ?? [];
}

// Bills
export async function listBills(userId: string, page = 1): Promise<ZohoBill[]> {
  const res = await zohoGet<{ bills: ZohoBill[] }>(userId, '/bills', {
    page: String(page),
    per_page: '200',
  });
  return res.bills ?? [];
}

// Chart of Accounts
export async function listChartOfAccounts(userId: string): Promise<ZohoAccount[]> {
  const res = await zohoGet<{ chartofaccounts: ZohoAccount[] }>(userId, '/chartofaccounts');
  return res.chartofaccounts ?? [];
}

// ── Reports ────────────────────────────────────────────────────────

export async function getProfitAndLoss(
  userId: string,
  startDate: string,
  endDate: string,
): Promise<ZohoReport> {
  const res = await zohoGet<{ profit_and_loss: unknown }>(userId, '/reports/profitandloss', {
    from_date: startDate,
    to_date: endDate,
  });
  return normalizeReport('Profit & Loss', startDate, endDate, res.profit_and_loss);
}

export async function getBalanceSheet(
  userId: string,
  date: string,
): Promise<ZohoReport> {
  const res = await zohoGet<{ balance_sheet: unknown }>(userId, '/reports/balancesheet', {
    date,
  });
  return normalizeReport('Balance Sheet', date, date, res.balance_sheet);
}

export async function getCashFlowStatement(
  userId: string,
  startDate: string,
  endDate: string,
): Promise<ZohoReport> {
  const res = await zohoGet<{ cash_flow_statement: unknown }>(userId, '/reports/cashflowstatement', {
    from_date: startDate,
    to_date: endDate,
  });
  return normalizeReport('Cash Flow Statement', startDate, endDate, res.cash_flow_statement);
}

function normalizeReport(name: string, start: string, end: string, raw: unknown): ZohoReport {
  // Zoho reports have varying structures — flatten into rows
  const report: ZohoReport = { report_name: name, start_date: start, end_date: end, rows: [] };
  if (raw && typeof raw === 'object') {
    report.rows = Array.isArray(raw) ? raw : [raw as ZohoReportRow];
  }
  return report;
}

// ── Sync operations ────────────────────────────────────────────────

export async function syncInvoicesToAR(userId: string): Promise<number> {
  const invoices = await listInvoices(userId);
  let synced = 0;

  for (const inv of invoices) {
    // Check if AR record already exists for this Zoho invoice
    const { data: existing } = await supabaseAdmin
      .from('accounts_receivable')
      .select('id')
      .eq('user_id', userId)
      .eq('zoho_invoice_id', inv.invoice_id)
      .maybeSingle();

    const status = mapZohoInvoiceStatus(inv.status);
    const record = {
      user_id: userId,
      zoho_invoice_id: inv.invoice_id,
      client_name: inv.customer_name,
      client_email: inv.email || null,
      invoice_number: inv.invoice_number,
      amount: inv.total,
      amount_received: inv.total - inv.balance,
      due_date: inv.due_date,
      issue_date: inv.date,
      status,
    };

    if (existing) {
      await supabaseAdmin
        .from('accounts_receivable')
        .update({ ...record, updated_at: new Date().toISOString() })
        .eq('id', existing.id);
    } else {
      await supabaseAdmin.from('accounts_receivable').insert(record);
    }
    synced++;
  }

  return synced;
}

export async function syncBillsToAP(userId: string): Promise<number> {
  const bills = await listBills(userId);
  let synced = 0;

  for (const bill of bills) {
    const { data: existing } = await supabaseAdmin
      .from('accounts_payable')
      .select('id')
      .eq('user_id', userId)
      .eq('zoho_bill_id', bill.bill_id)
      .maybeSingle();

    const status = mapZohoBillStatus(bill.status);
    const record = {
      user_id: userId,
      zoho_bill_id: bill.bill_id,
      vendor_name: bill.vendor_name,
      invoice_number: bill.bill_number,
      amount: bill.total,
      amount_paid: bill.total - bill.balance,
      due_date: bill.due_date,
      issue_date: bill.date,
      status,
    };

    if (existing) {
      await supabaseAdmin
        .from('accounts_payable')
        .update({ ...record, updated_at: new Date().toISOString() })
        .eq('id', existing.id);
    } else {
      await supabaseAdmin.from('accounts_payable').insert(record);
    }
    synced++;
  }

  return synced;
}

export async function fullSync(userId: string): Promise<{ invoices: number; bills: number }> {
  const [invoices, bills] = await Promise.all([
    syncInvoicesToAR(userId),
    syncBillsToAP(userId),
  ]);
  return { invoices, bills };
}

// ── Status mapping ─────────────────────────────────────────────────

function mapZohoInvoiceStatus(zohoStatus: string): string {
  switch (zohoStatus.toLowerCase()) {
    case 'paid': return 'paid';
    case 'partially_paid': return 'partial';
    case 'overdue': return 'open';
    case 'void': return 'written_off';
    case 'draft': return 'draft';
    default: return 'open';
  }
}

function mapZohoBillStatus(zohoStatus: string): string {
  switch (zohoStatus.toLowerCase()) {
    case 'paid': return 'paid';
    case 'partially_paid': return 'partial';
    case 'overdue': return 'open';
    case 'void': return 'voided';
    case 'open': return 'open';
    default: return 'open';
  }
}

logger.info('Zoho Books service loaded');
