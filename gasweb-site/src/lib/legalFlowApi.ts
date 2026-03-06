/**
 * LegalFlow API Client
 *
 * Service layer for calling the LegalFlow backend API.
 * Uses the Supabase session access_token for authentication.
 *
 * Backend: business-apps/LegalFlow (Express, port 3002)
 * Endpoints: /api/legal/*, /api/filing/*, /api/child-support/*
 *
 * @module lib/legalFlowApi
 */

import { supabase } from './supabase';

const API_BASE =
  import.meta.env.VITE_LEGALFLOW_API_URL || '/api/legalflow';

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

export interface LegalTemplate {
  id: string;
  name: string;
  category: string;
  description?: string;
  template_schema?: unknown;
  ai_prompt_template?: string;
  state_specific?: boolean;
  premium_only?: boolean;
  base_price?: number;
}

export interface LegalDocument {
  id: string;
  documentType: string;
  documentCategory: string;
  title: string;
  status: 'draft' | 'generated' | 'signed' | 'filed';
  documentData?: unknown;
  aiGeneratedContent?: string;
  pdfUrl?: string;
  signatureStatus?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TrademarkApplication {
  id: string;
  user_id: string;
  markName: string;
  markType?: string;
  markImageUrl?: string;
  goodsServices?: string;
  filingBasis?: string;
  jurisdiction: string;
  jurisdictionType?: string;
  status: 'draft' | 'pending' | 'filed' | 'approved' | 'refused' | 'abandoned';
  niceClasses?: number[];
  interviewProgress?: number;
  nextActionDate?: string;
  nextActionType?: string;
  createdAt: string;
}

export interface TrademarkSearchResult {
  id: string;
  searchTerm: string;
  resultCount: number;
  riskScore?: number;
  recommendations?: string[];
  results?: unknown[];
  createdAt: string;
}

export interface NiceClass {
  classNumber: number;
  title: string;
  description: string;
}

/* ------------------------------------------------------------------ */
/*  Legal Documents API                                                */
/* ------------------------------------------------------------------ */

export const legalDocuments = {
  list: (params?: { category?: string; status?: string }) => {
    const qs = new URLSearchParams();
    if (params?.category) qs.set('category', params.category);
    if (params?.status) qs.set('status', params.status);
    const q = qs.toString();
    return get<{ documents: LegalDocument[] }>(
      `/legal/documents${q ? `?${q}` : ''}`,
    );
  },

  get: (id: string) => get<LegalDocument>(`/legal/documents/${id}`),

  create: (data: {
    documentType: string;
    documentCategory: string;
    title: string;
    templateId?: string;
    documentData?: unknown;
  }) => post<LegalDocument>('/legal/documents', data),

  update: (id: string, data: Partial<LegalDocument>) =>
    put<LegalDocument>(`/legal/documents/${id}`, data),

  delete: (id: string) => del<void>(`/legal/documents/${id}`),

  generatePdf: (id: string) =>
    post<{ pdf_url: string }>(`/legal/documents/${id}/generate-pdf`),

  aiCustomize: (id: string, prompt: string) =>
    post<LegalDocument>(`/legal/documents/${id}/ai-customize`, { prompt }),
};

/* ------------------------------------------------------------------ */
/*  Legal Templates API                                                */
/* ------------------------------------------------------------------ */

export const legalTemplates = {
  list: (params?: { category?: string }) => {
    const qs = params?.category ? `?category=${params.category}` : '';
    return get<{ templates: LegalTemplate[] }>(`/legal/templates${qs}`);
  },

  get: (id: string) => get<LegalTemplate>(`/legal/templates/${id}`),
};

/* ------------------------------------------------------------------ */
/*  Trademark API                                                      */
/* ------------------------------------------------------------------ */

export const trademark = {
  search: (term: string, jurisdictionType?: string) =>
    post<TrademarkSearchResult>('/legal/trademark/search', {
      searchTerm: term,
      jurisdictionType: jurisdictionType ?? 'federal',
    }),

  getSearchReport: (id: string) =>
    get<TrademarkSearchResult>(`/legal/trademark/search/${id}`),

  aiAnalysis: (searchId: string) =>
    post<{ analysis: string }>(`/legal/trademark/search/${searchId}/ai-analysis`),

  searchHistory: () =>
    get<{ searches: TrademarkSearchResult[] }>('/legal/trademark/search/history'),

  listApplications: () =>
    get<{ applications: TrademarkApplication[] }>(
      '/legal/trademark/applications',
    ),

  createApplication: (data: { markName: string; [key: string]: unknown }) =>
    post<TrademarkApplication>('/legal/trademark/applications', data),

  getApplication: (id: string) =>
    get<TrademarkApplication>(`/legal/trademark/applications/${id}`),

  updateApplication: (id: string, data: Partial<TrademarkApplication>) =>
    put<TrademarkApplication>(`/legal/trademark/applications/${id}`, data),

  deleteApplication: (id: string) =>
    del<void>(`/legal/trademark/applications/${id}`),

  // Interview flow
  getInterview: (id: string) =>
    get<{ step: number; question: string; progress: number }>(
      `/legal/trademark/applications/${id}/interview`,
    ),

  answerInterview: (id: string, answer: unknown) =>
    post<{ nextStep: number }>(`/legal/trademark/applications/${id}/interview/answer`, { answer }),

  nextStep: (id: string) =>
    post<{ step: number }>(`/legal/trademark/applications/${id}/interview/next`),

  previousStep: (id: string) =>
    post<{ step: number }>(`/legal/trademark/applications/${id}/interview/previous`),

  completeInterview: (id: string) =>
    post<TrademarkApplication>(`/legal/trademark/applications/${id}/interview/complete`),

  // Document generation
  generateDocuments: (id: string) =>
    post<{ documents: unknown[] }>(`/legal/trademark/applications/${id}/generate-documents`),

  generatePdf: (id: string) =>
    post<{ pdf_url: string }>(`/legal/trademark/applications/${id}/generate-pdf`),

  aiEnhance: (id: string) =>
    post<{ suggestions: unknown }>(`/legal/trademark/applications/${id}/ai-enhance`),

  // Specimens
  uploadSpecimen: (id: string, file: File) => {
    const formData = new FormData();
    formData.append('specimen', file);
    return request<{ url: string }>(
      `/legal/trademark/applications/${id}/specimens`,
      { method: 'POST', body: formData, headers: {} },
    );
  },

  analyzeSpecimen: (id: string) =>
    post<{ analysis: string }>(`/legal/trademark/applications/${id}/analyze-specimen`),

  filingChecklist: (id: string) =>
    get<{ checklist: unknown[] }>(`/legal/trademark/applications/${id}/filing-checklist`),

  submit: (id: string) =>
    post<TrademarkApplication>(`/legal/trademark/applications/${id}/submit`),

  // Reference data
  niceClasses: () =>
    get<{ classes: NiceClass[] }>('/legal/trademark/nice-classes'),

  classify: (description: string) =>
    post<{ classes: number[] }>('/legal/trademark/classify', { description }),

  describeGoods: (classes: number[]) =>
    post<{ description: string }>('/legal/trademark/describe-goods', { classes }),

  analyzeMark: (markName: string) =>
    post<{ strength: string; analysis: string }>('/legal/trademark/analyze-mark', { markName }),

  // State trademark
  stateRequirements: () =>
    get<{ states: unknown[] }>('/legal/trademark/states'),

  stateSearch: (state: string, term: string) =>
    post<TrademarkSearchResult>(`/legal/trademark/states/${state}/search`, { searchTerm: term }),

  calculateStateFees: (states: string[]) =>
    post<{ fees: unknown }>('/legal/trademark/states/calculate-fees', { states }),
};

/* ------------------------------------------------------------------ */
/*  Business Formation API                                             */
/* ------------------------------------------------------------------ */

export const businessFormation = {
  create: (data: {
    entity_type: string;
    state: string;
    business_name: string;
    [key: string]: unknown;
  }) => post<unknown>('/legal/business', data),
};

/* ------------------------------------------------------------------ */
/*  Legal Filing API                                                   */
/* ------------------------------------------------------------------ */

export const filing = {
  list: () => get<{ filings: unknown[] }>('/filing'),

  start: (data: { filing_type: string; jurisdiction_state: string }) =>
    post<unknown>('/filing/start', data),

  get: (id: string) => get<unknown>(`/filing/${id}`),

  types: () => get<{ types: unknown[] }>('/filing/types'),

  // Interview
  startInterview: (id: string) =>
    get<unknown>(`/filing/interview/${id}/start`),

  answerInterview: (id: string, answer: unknown) =>
    post<unknown>(`/filing/interview/${id}/answer`, { answer }),
};

/* ------------------------------------------------------------------ */
/*  Child Support API                                                  */
/* ------------------------------------------------------------------ */

export const childSupport = {
  calculate: (data: {
    state: string;
    incomes: number[];
    children: number;
    [key: string]: unknown;
  }) => post<unknown>('/child-support/calculate', data),

  history: () => get<{ calculations: unknown[] }>('/child-support/calculations'),

  guidelines: (state: string) =>
    get<unknown>(`/child-support/guidelines/${state}`),

  states: () => get<{ states: string[] }>('/child-support/states'),
};

/* ------------------------------------------------------------------ */
/*  Consolidated export                                                */
/* ------------------------------------------------------------------ */

const legalFlowApi = {
  documents: legalDocuments,
  templates: legalTemplates,
  trademark,
  businessFormation,
  filing,
  childSupport,
};

export default legalFlowApi;
