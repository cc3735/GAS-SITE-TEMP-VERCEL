/**
 * FinanceFlow API Client
 *
 * Service layer for calling the FinanceFlow backend API.
 * Uses the Supabase session access_token for authentication.
 *
 * Backend: business-apps/FinanceFlow (Express, port 3003)
 * Endpoints: /api/tax/*, /api/bookkeeping/*, /api/accounting/*, /api/plaid/*
 *
 * @module lib/financeFlowApi
 */

import { supabase } from './supabase';

const API_BASE =
  import.meta.env.VITE_FINANCEFLOW_API_URL || '/api/financeflow';

/* ------------------------------------------------------------------ */
/*  Generic helpers                                                    */
/* ------------------------------------------------------------------ */

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: { code: string; message: string; details?: unknown };
}

async function getToken(): Promise<string | null> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session?.access_token ?? null;
}

async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<ApiResponse<T>> {
  const token = await getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  try {
    const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
    const json = await res.json();
    if (!res.ok) {
      return {
        success: false,
        error: json.error ?? { code: 'UNKNOWN', message: res.statusText },
      };
    }
    return json;
  } catch (err) {
    return {
      success: false,
      error: {
        code: 'NETWORK_ERROR',
        message: err instanceof Error ? err.message : 'Network error',
      },
    };
  }
}

function get<T>(path: string) {
  return request<T>(path, { method: 'GET' });
}
function post<T>(path: string, body?: unknown) {
  return request<T>(path, { method: 'POST', body: JSON.stringify(body) });
}
function put<T>(path: string, body?: unknown) {
  return request<T>(path, { method: 'PUT', body: JSON.stringify(body) });
}
function del<T>(path: string) {
  return request<T>(path, { method: 'DELETE' });
}

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface TaxReturn {
  id: string;
  taxYear: number;
  filingStatus: string;
  status: 'draft' | 'in_progress' | 'ready_to_file' | 'filed' | 'accepted' | 'rejected';
  totalIncome?: number;
  adjustedGrossIncome?: number;
  taxableIncome?: number;
  totalTax?: number;
  refundAmount?: number;
  paymentAmount?: number;
  createdAt: string;
  updatedAt: string;
  filedAt?: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  account_id?: string;
  date: string;
  description: string;
  amount: number;
  category?: string;
  type: 'income' | 'expense';
  status: string;
  business_id?: string;
  created_at: string;
}

export interface LinkedAccount {
  id: string;
  institutionName: string;
  institutionId: string;
  accounts: unknown[];
  status: string;
  lastSync: string;
  createdAt: string;
}

export interface Payable {
  id: string;
  vendor_name: string;
  amount: number;
  amount_paid: number;
  due_date: string;
  status: string;
  computedStatus: string;
  balanceDue: number;
  business_id?: string;
}

export interface Receivable {
  id: string;
  client_name: string;
  amount: number;
  amount_paid: number;
  due_date: string;
  status: string;
  invoice_number?: string;
  business_id?: string;
  payment_link_url?: string;
  stripe_payment_intent_id?: string;
  stripe_checkout_session_id?: string;
}

export interface ChartOfAccount {
  id: string;
  business_id: string;
  name: string;
  type: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';
  account_number?: string;
  description?: string;
  balance: number;
}

/* ------------------------------------------------------------------ */
/*  Tax Returns API                                                    */
/* ------------------------------------------------------------------ */

export const taxReturns = {
  list: () => get<TaxReturn[]>('/tax/returns'),

  get: (id: string) => get<TaxReturn>(`/tax/returns/${id}`),

  create: (data: { taxYear: number; filingStatus?: string }) =>
    post<TaxReturn>('/tax/returns', data),

  update: (id: string, data: Partial<TaxReturn>) =>
    put<TaxReturn>(`/tax/returns/${id}`, data),

  delete: (id: string) => del<void>(`/tax/returns/${id}`),
};

/* ------------------------------------------------------------------ */
/*  Tax Interview API                                                  */
/* ------------------------------------------------------------------ */

export const taxInterview = {
  start: (returnId: string) =>
    post<{ sessionId: string; question: string }>(`/tax/interview/${returnId}/start`),

  answer: (returnId: string, answer: unknown) =>
    post<{ nextQuestion: string; progress: number }>(`/tax/interview/${returnId}/answer`, { answer }),

  status: (returnId: string) =>
    get<{ progress: number; currentSection: string }>(`/tax/interview/${returnId}/status`),
};

/* ------------------------------------------------------------------ */
/*  Tax Calculations API                                               */
/* ------------------------------------------------------------------ */

export const taxCalculations = {
  calculate: (returnId: string) =>
    post<{ totalTax: number; refund: number }>(`/tax/calculations/${returnId}`),

  estimate: (data: { income: number; filingStatus: string; deductions?: number }) =>
    post<{ estimatedTax: number; estimatedRefund: number }>('/tax/estimate', data),
};

/* ------------------------------------------------------------------ */
/*  E-Filing API                                                       */
/* ------------------------------------------------------------------ */

export const eFiling = {
  submit: (returnId: string) =>
    post<{ confirmationNumber: string }>(`/tax/e-filing/${returnId}/submit`),

  status: (returnId: string) =>
    get<{ status: string; lastUpdated: string }>(`/tax/e-filing/${returnId}/status`),

  stateSubmit: (returnId: string, state: string) =>
    post<{ confirmationNumber: string }>(`/tax/state/${returnId}/submit`, { state }),
};

/* ------------------------------------------------------------------ */
/*  AI Tax Advisor API                                                 */
/* ------------------------------------------------------------------ */

export const taxAdvisor = {
  ask: (question: string, context?: unknown) =>
    post<{ answer: string; sources?: string[] }>('/ai/tax-advisor/ask', { question, context }),

  suggestions: (returnId: string) =>
    get<{ suggestions: string[] }>(`/ai/tax-advisor/suggestions/${returnId}`),
};

/* ------------------------------------------------------------------ */
/*  Bookkeeping API                                                    */
/* ------------------------------------------------------------------ */

export const bookkeeping = {
  // Transactions
  listTransactions: (params?: { category?: string; startDate?: string; endDate?: string }) => {
    const qs = new URLSearchParams();
    if (params?.category) qs.set('category', params.category);
    if (params?.startDate) qs.set('startDate', params.startDate);
    if (params?.endDate) qs.set('endDate', params.endDate);
    const q = qs.toString();
    return get<{ transactions: Transaction[]; total: number }>(
      `/bookkeeping/transactions${q ? `?${q}` : ''}`,
    );
  },

  createTransaction: (data: Partial<Transaction>) =>
    post<Transaction>('/bookkeeping/transactions', data),

  categorize: (transactionId: string, category: string) =>
    put<Transaction>(`/bookkeeping/transactions/${transactionId}`, { category }),

  summary: (params?: { startDate?: string; endDate?: string }) => {
    const qs = new URLSearchParams();
    if (params?.startDate) qs.set('startDate', params.startDate);
    if (params?.endDate) qs.set('endDate', params.endDate);
    const q = qs.toString();
    return get<{ income: number; expenses: number; net: number }>(
      `/bookkeeping/summary${q ? `?${q}` : ''}`,
    );
  },

  // Linked bank accounts
  listAccounts: () => get<LinkedAccount[]>('/bookkeeping/accounts'),

  syncAccount: (accountId: string) =>
    post<{ transactionsAdded: number }>(`/bookkeeping/accounts/${accountId}/sync`),

  // Bank statements
  importStatement: (file: File) => {
    const formData = new FormData();
    formData.append('statement', file);
    return request<{ transactionsImported: number }>(
      '/bookkeeping/statements/import',
      { method: 'POST', body: formData, headers: {} },
    );
  },
};

/* ------------------------------------------------------------------ */
/*  Accounts Payable / Receivable API                                  */
/* ------------------------------------------------------------------ */

export const accountsPayable = {
  list: (params?: { status?: string; businessId?: string }) => {
    const qs = new URLSearchParams();
    if (params?.status) qs.set('status', params.status);
    if (params?.businessId) qs.set('businessId', params.businessId);
    const q = qs.toString();
    return get<{ payables: Payable[]; total: number }>(
      `/bookkeeping/ap${q ? `?${q}` : ''}`,
    );
  },

  create: (data: Partial<Payable>) =>
    post<Payable>('/bookkeeping/ap', data),

  update: (id: string, data: Partial<Payable>) =>
    put<Payable>(`/bookkeeping/ap/${id}`, data),

  markPaid: (id: string, data: { amount: number; notes?: string }) =>
    post<Payable>(`/bookkeeping/ap/${id}/pay`, data),
};

export const accountsReceivable = {
  list: (params?: { status?: string; businessId?: string }) => {
    const qs = new URLSearchParams();
    if (params?.status) qs.set('status', params.status);
    if (params?.businessId) qs.set('businessId', params.businessId);
    const q = qs.toString();
    return get<{ receivables: Receivable[]; total: number }>(
      `/bookkeeping/ar${q ? `?${q}` : ''}`,
    );
  },

  create: (data: Partial<Receivable>) =>
    post<Receivable>('/bookkeeping/ar', data),

  update: (id: string, data: Partial<Receivable>) =>
    put<Receivable>(`/bookkeeping/ar/${id}`, data),

  recordPayment: (id: string, data: { amount: number; notes?: string; paymentMethod?: string }) =>
    post<Receivable>(`/bookkeeping/ar/${id}/payment`, data),
};

/* ------------------------------------------------------------------ */
/*  Accounting (Chart of Accounts) API                                 */
/* ------------------------------------------------------------------ */

export const accounting = {
  listAccounts: (businessId: string) =>
    get<ChartOfAccount[]>(`/accounting/${businessId}/accounts`),

  createAccount: (businessId: string, data: Partial<ChartOfAccount>) =>
    post<ChartOfAccount>(`/accounting/${businessId}/accounts`, data),

  listJournalEntries: (businessId: string) =>
    get<unknown[]>(`/accounting/${businessId}/journal-entries`),

  createJournalEntry: (businessId: string, data: unknown) =>
    post<unknown>(`/accounting/${businessId}/journal-entries`, data),
};

/* ------------------------------------------------------------------ */
/*  Plaid Integration API                                              */
/* ------------------------------------------------------------------ */

export const plaid = {
  createLinkToken: () =>
    post<{ link_token: string }>('/plaid/create-link-token'),

  exchangePublicToken: (publicToken: string, institutionId: string, institutionName: string) =>
    post<{ success: boolean }>('/plaid/exchange-public-token', {
      public_token: publicToken,
      institution_id: institutionId,
      institution_name: institutionName,
    }),

  getAccounts: () =>
    get<LinkedAccount[]>('/plaid/accounts'),
};

/* ------------------------------------------------------------------ */
/*  Stripe Integration API                                             */
/* ------------------------------------------------------------------ */

export const stripe = {
  createPaymentLink: (arId: string) =>
    post<{ paymentLinkUrl: string; paymentLinkId: string }>(`/stripe/payment-link/${arId}`),

  createCheckoutSession: (arId: string, successUrl?: string, cancelUrl?: string) =>
    post<{ sessionUrl: string; sessionId: string }>(`/stripe/checkout-session/${arId}`, {
      successUrl,
      cancelUrl,
    }),

  getPaymentStatus: (arId: string) =>
    get<{ status: string; amount: number; amountReceived: number; balanceDue: number; hasPaymentLink: boolean; paymentLinkUrl?: string }>(`/stripe/payment-status/${arId}`),

  getStatus: () =>
    get<{ configured: boolean }>('/stripe/status'),
};

/* ------------------------------------------------------------------ */
/*  Zoho Books Integration API                                         */
/* ------------------------------------------------------------------ */

export interface ZohoReport {
  report_name: string;
  start_date: string;
  end_date: string;
  rows: Record<string, string | number>[];
  total?: Record<string, number>;
}

export const zohoBooks = {
  getStatus: () =>
    get<{ configured: boolean; lastSync: string | null }>('/zoho-books/status'),

  sync: (type: 'invoices' | 'bills' | 'full' = 'full') =>
    post<{ syncId: string; status: string; recordsSynced: number }>('/zoho-books/sync', { type }),

  getSyncStatus: (syncId: string) =>
    get<{ id: string; sync_type: string; status: string; records_synced: number; error_message?: string }>(`/zoho-books/sync/${syncId}`),

  profitAndLoss: (from?: string, to?: string) => {
    const qs = new URLSearchParams();
    if (from) qs.set('from', from);
    if (to) qs.set('to', to);
    const q = qs.toString();
    return get<ZohoReport>(`/zoho-books/reports/profit-loss${q ? `?${q}` : ''}`);
  },

  balanceSheet: (date?: string) => {
    const qs = date ? `?date=${date}` : '';
    return get<ZohoReport>(`/zoho-books/reports/balance-sheet${qs}`);
  },

  cashFlow: (from?: string, to?: string) => {
    const qs = new URLSearchParams();
    if (from) qs.set('from', from);
    if (to) qs.set('to', to);
    const q = qs.toString();
    return get<ZohoReport>(`/zoho-books/reports/cash-flow${q ? `?${q}` : ''}`);
  },
};

/* ------------------------------------------------------------------ */
/*  Consolidated export                                                */
/* ------------------------------------------------------------------ */

const financeFlowApi = {
  taxReturns,
  taxInterview,
  taxCalculations,
  eFiling,
  taxAdvisor,
  bookkeeping,
  accountsPayable,
  accountsReceivable,
  accounting,
  plaid,
  stripe,
  zohoBooks,
};

export default financeFlowApi;
