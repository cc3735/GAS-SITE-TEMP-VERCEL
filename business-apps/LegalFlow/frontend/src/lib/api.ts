const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
}

class ApiClient {
  private baseUrl: string;
  private token: string | null = null;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
    // Load token from localStorage on init
    this.token = localStorage.getItem('auth_token');
  }

  setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('auth_token', token);
    } else {
      localStorage.removeItem('auth_token');
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.token) {
      (headers as Record<string, string>)['Authorization'] = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.error || {
            code: 'UNKNOWN_ERROR',
            message: 'An error occurred',
          },
        };
      }

      return data;
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: error instanceof Error ? error.message : 'Network error',
        },
      };
    }
  }

  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  async post<T>(endpoint: string, body?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async put<T>(endpoint: string, body?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

export const api = new ApiClient(API_BASE_URL);

// Auth API
export const authApi = {
  signup: (data: { email: string; password: string; firstName?: string; lastName?: string }) =>
    api.post<{ user: User; token: string }>('/auth/signup', data),

  signin: (data: { email: string; password: string }) =>
    api.post<{ user: User; token: string }>('/auth/signin', data),

  signout: () => api.post('/auth/signout'),

  getMe: () => api.get<User>('/auth/me'),
};

// Tax API
export const taxApi = {
  listReturns: () => api.get<{ returns: TaxReturn[] }>('/tax/returns'),

  getReturn: (id: string) => api.get<TaxReturn>(`/tax/returns/${id}`),

  createReturn: (data: { taxYear: number; filingStatus?: string }) =>
    api.post<TaxReturn>('/tax/returns', data),

  updateReturn: (id: string, data: Partial<TaxReturn>) =>
    api.put<TaxReturn>(`/tax/returns/${id}`, data),

  deleteReturn: (id: string) => api.delete(`/tax/returns/${id}`),

  startInterview: (taxReturnId: string) =>
    api.post<InterviewState>('/tax/interview/start', { taxReturnId }),

  submitAnswer: (taxReturnId: string, questionId: string, value: unknown) =>
    api.post<{ nextQuestion: InterviewQuestion; isComplete: boolean }>(
      '/tax/interview/answer',
      { taxReturnId, questionId, value }
    ),

  getRefundEstimate: (id: string) =>
    api.get<{ estimate: RefundEstimate; calculation: TaxCalculation }>(`/tax/returns/${id}/refund-estimate`),

  /** Get real-time tax estimate for dashboard */
  getEstimate: (data: TaxEstimateInput) =>
    api.post<TaxEstimateResponse>('/tax/estimate', data),

  /** Compare what-if scenarios */
  getWhatIfComparison: (data: { current: TaxEstimateInput; comparison: TaxEstimateInput }) =>
    api.post<WhatIfComparison>('/tax/estimate/what-if', data),

  /** Get quarterly estimated tax requirements */
  getQuarterlyEstimates: (data: { taxYear: number; filingStatus: string; estimatedIncome: number; estimatedWithholdings: number }) =>
    api.post<QuarterlyEstimates>('/tax/estimate/quarterly', data),

  /** Scan a tax document using OCR */
  scanDocument: (data: { taxReturnId: string; fileBase64: string; mimeType: string; autoSave?: boolean }) =>
    api.post<DocumentScanResult>('/tax/documents/scan', data),

  /** Check OCR service status */
  getOcrStatus: () =>
    api.get<OcrStatus>('/tax/documents/scan/status'),
};

// Legal API
export const legalApi = {
  listDocuments: (params?: { category?: string; status?: string }) => {
    const query = params ? `?${new URLSearchParams(params as Record<string, string>)}` : '';
    return api.get<{ documents: LegalDocument[] }>(`/legal/documents${query}`);
  },

  getDocument: (id: string) => api.get<LegalDocument>(`/legal/documents/${id}`),

  createDocument: (data: { documentType: string; documentCategory: string; title: string; templateId?: string }) =>
    api.post<LegalDocument>('/legal/documents', data),

  updateDocument: (id: string, data: Partial<LegalDocument>) =>
    api.put<LegalDocument>(`/legal/documents/${id}`, data),

  deleteDocument: (id: string) => api.delete(`/legal/documents/${id}`),

  generatePdf: (id: string) =>
    api.post<{ pdfBase64: string; filename: string }>(`/legal/documents/${id}/generate-pdf`),

  aiCustomize: (id: string, customizations?: string) =>
    api.post<{ content: string; message: string }>(`/legal/documents/${id}/ai-customize`, { customizations }),

  listTemplates: (params?: { category?: string; search?: string }) => {
    const query = params ? `?${new URLSearchParams(params as Record<string, string>)}` : '';
    return api.get<{ templates: LegalTemplate[]; categories: Array<{id: string; name: string}> }>(`/legal/templates${query}`);
  },

  getTemplate: (id: string) =>
    api.get<LegalTemplateDetail>(`/legal/templates/${id}`),
};

// Filing API
export const filingApi = {
  listFilings: () => api.get<{ filings: LegalFiling[] }>('/filing'),

  getFilingTypes: () => api.get<{ filingTypes: FilingType[] }>('/filing/types'),

  startFiling: (data: { filingType: string; jurisdictionState: string; jurisdictionCounty?: string }) =>
    api.post<LegalFiling>('/filing/start', data),

  getFiling: (id: string) => api.get<LegalFiling>(`/filing/${id}`),

  startInterview: (filingId: string) =>
    api.get<FilingInterviewState>(`/filing/interview/${filingId}/start`),

  submitAnswer: (filingId: string, questionId: string, value: unknown) =>
    api.post<{ nextQuestion: FilingQuestion; isComplete: boolean }>(
      `/filing/interview/${filingId}/answer`,
      { questionId, value }
    ),
};

// Child Support API
export const childSupportApi = {
  calculate: (data: ChildSupportInput) =>
    api.post<{ result: ChildSupportResult; guidelines: StateGuidelines }>('/child-support/calculate', data),

  getCalculations: () =>
    api.get<{ calculations: ChildSupportCalculation[] }>('/child-support/calculations'),

  getGuidelines: (state: string) =>
    api.get<StateGuidelines>(`/child-support/guidelines/${state}`),

  getSupportedStates: () =>
    api.get<{ states: SupportedState[] }>('/child-support/states'),
};

// Accounts Payable / Receivable API
export const apArApi = {
  // Payables
  listPayables: (params?: { status?: string; businessId?: string }) => {
    const q = params ? `?${new URLSearchParams(params as Record<string, string>)}` : '';
    return api.get<{ payables: Payable[]; total: number }>(`/bookkeeping/ap${q}`);
  },
  createPayable: (data: Omit<Payable, 'id' | 'computedStatus' | 'balanceDue' | 'createdAt' | 'updatedAt'>) =>
    api.post<Payable>('/bookkeeping/ap', data),
  updatePayable: (id: string, data: Partial<Payable>) =>
    api.put<Payable>(`/bookkeeping/ap/${id}`, data),
  deletePayable: (id: string) =>
    api.delete(`/bookkeeping/ap/${id}`),

  // Receivables
  listReceivables: (params?: { status?: string; businessId?: string }) => {
    const q = params ? `?${new URLSearchParams(params as Record<string, string>)}` : '';
    return api.get<{ receivables: Receivable[]; total: number }>(`/bookkeeping/ar${q}`);
  },
  createReceivable: (data: Omit<Receivable, 'id' | 'computedStatus' | 'balanceOwed' | 'createdAt' | 'updatedAt'>) =>
    api.post<Receivable>('/bookkeeping/ar', data),
  updateReceivable: (id: string, data: Partial<Receivable>) =>
    api.put<Receivable>(`/bookkeeping/ar/${id}`, data),
  deleteReceivable: (id: string) =>
    api.delete(`/bookkeeping/ar/${id}`),
};

export interface Payable {
  id: string;
  vendor_name: string;
  vendor_email?: string;
  invoice_number?: string;
  description?: string;
  amount: number;
  amount_paid: number;
  due_date?: string;
  issue_date: string;
  paid_date?: string;
  status: 'open' | 'partial' | 'paid' | 'overdue' | 'voided';
  computedStatus?: string;
  balanceDue?: number;
  category?: string;
  tax_deductible?: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Receivable {
  id: string;
  client_name: string;
  client_email?: string;
  invoice_number?: string;
  description?: string;
  amount: number;
  amount_received: number;
  due_date?: string;
  issue_date: string;
  received_date?: string;
  status: 'draft' | 'sent' | 'partial' | 'paid' | 'overdue' | 'written_off';
  computedStatus?: string;
  balanceOwed?: number;
  category?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// Trademark API
export const trademarkApi = {
  // Search
  search: (data: { markName: string; goodsServices?: string; niceClassIds?: number[] }) =>
    api.post<{ searchId: string; results: TrademarkSearchResult[]; report: TrademarkReport }>(
      '/legal/trademark/search',
      data
    ),

  getSearchHistory: () =>
    api.get<{ searches: TrademarkSearch[] }>('/legal/trademark/search/history'),

  getSearchReport: (id: string) =>
    api.get<TrademarkReport>(`/legal/trademark/search/${id}`),

  analyzeConflicts: (searchId: string, data: { markName: string; goodsServices: string }) =>
    api.post<{ analysis: TrademarkConflictAnalysis }>(
      `/legal/trademark/search/${searchId}/ai-analysis`,
      data
    ),

  // Applications
  listApplications: () =>
    api.get<{ applications: TrademarkApplication[] }>('/legal/trademark/applications'),

  getApplication: (id: string) =>
    api.get<TrademarkApplication>(`/legal/trademark/applications/${id}`),

  createApplication: (data: { markName: string; markType?: string }) =>
    api.post<TrademarkApplication>('/legal/trademark/applications', data),

  updateApplication: (id: string, data: Partial<TrademarkApplication>) =>
    api.put<TrademarkApplication>(`/legal/trademark/applications/${id}`, data),

  deleteApplication: (id: string) =>
    api.delete(`/legal/trademark/applications/${id}`),

  // Interview workflow
  getInterview: (id: string) =>
    api.get<TrademarkInterviewState>(`/legal/trademark/applications/${id}/interview`),

  answerInterview: (id: string, data: { stepId: string; answers: Record<string, unknown> }) =>
    api.post<TrademarkInterviewState>(
      `/legal/trademark/applications/${id}/interview/answer`,
      data
    ),

  nextStep: (id: string) =>
    api.post<TrademarkInterviewState>(`/legal/trademark/applications/${id}/interview/next`),

  previousStep: (id: string) =>
    api.post<TrademarkInterviewState>(`/legal/trademark/applications/${id}/interview/previous`),

  completeInterview: (id: string) =>
    api.post<TrademarkApplication>(`/legal/trademark/applications/${id}/interview/complete`),

  generateDocuments: (id: string, data: { documentType: string }) =>
    api.post<{ pdfBase64: string; totalFee: number; feeBreakdown: FeeBreakdownItem[]; warnings: string[]; readyToFile: boolean }>(
      `/legal/trademark/applications/${id}/generate-documents`,
      data
    ),

  // Classification & AI
  getNiceClasses: () =>
    api.get<{ classes: NiceClass[] }>('/legal/trademark/nice-classes'),

  analyzeMark: (data: { markName: string; goodsServices: string }) =>
    api.post<{ analysis: MarkStrengthAnalysis }>('/legal/trademark/analyze-mark', data),

  classifyGoods: (data: { description: string }) =>
    api.post<{ suggestions: NiceClassSuggestion[] }>('/legal/trademark/classify', data),

  describeGoods: (data: { niceClassIds: number[]; businessDescription: string }) =>
    api.post<{ description: string }>('/legal/trademark/describe-goods', data),

  // States
  getStates: () =>
    api.get<{ states: TrademarkState[] }>('/legal/trademark/states'),
};

export interface TrademarkSearchResult {
  markName: string;
  serialNumber?: string;
  registrationNumber?: string;
  status: string;
  owner: string;
  goodsServices: string;
  similarity?: number;
  riskLevel?: 'low' | 'medium' | 'high';
}

export interface TrademarkSearch {
  id: string;
  markName: string;
  searchDate: string;
  resultsCount: number;
  status: string;
}

export interface TrademarkReport {
  id: string;
  markName: string;
  searchDate: string;
  results: TrademarkSearchResult[];
  overallRisk: 'low' | 'medium' | 'high';
  recommendations: string[];
}

export interface TrademarkConflictAnalysis {
  overallRisk: 'low' | 'medium' | 'high';
  riskScore: number;
  conflictingMarks: Array<{ markName: string; reason: string; severity: string }>;
  recommendations: string[];
  summary: string;
}

export interface TrademarkApplication {
  id: string;
  markName: string;
  markType: string;
  status: 'draft' | 'pending' | 'filed' | 'approved' | 'refused' | 'abandoned';
  jurisdiction: 'federal' | 'state';
  niceClasses?: number[];
  filingDate?: string;
  nextActionDate?: string;
  nextActionType?: string;
  goodsServices?: string;
  ownerName?: string;
  ownerAddress?: string;
  createdAt: string;
  updatedAt: string;
  interviewProgress?: number;
  totalFee?: number;
}

export interface TrademarkInterviewState {
  applicationId: string;
  currentStep: number;
  totalSteps: number;
  stepName: string;
  isComplete: boolean;
  progress: number;
  currentStepData: {
    stepId: string;
    title: string;
    description: string;
    questions: InterviewQuestion[];
  };
  answers: Record<string, unknown>;
}

export interface NiceClass {
  classNumber: number;
  title: string;
  description: string;
}

export interface NiceClassSuggestion {
  classNumber: number;
  title: string;
  confidence: number;
  reasoning: string;
}

export interface MarkStrengthAnalysis {
  distinctiveness: 'generic' | 'descriptive' | 'suggestive' | 'arbitrary' | 'fanciful';
  score: number;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  registrabilityLikelihood: 'low' | 'medium' | 'high';
}

export interface FeeBreakdownItem {
  description: string;
  amount: number;
}

export interface TrademarkState {
  code: string;
  name: string;
  filingMethod: string;
  filingFee: number;
  processingTime: string;
}

// Subscription API
export const subscriptionApi = {
  getCurrent: () => api.get<Subscription>('/subscriptions/current'),

  getPlans: () => api.get<{ plans: Plan[] }>('/subscriptions/plans'),

  getUsage: () => api.get<UsageStats>('/subscriptions/usage'),

  cancel: () => api.post('/subscriptions/cancel'),

  resume: () => api.post('/subscriptions/resume'),
};

// Types
export interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  subscriptionTier: string;
  subscriptionStatus: string;
}

export interface TaxReturn {
  id: string;
  taxYear: number;
  filingStatus?: string;
  status: string;
  totalIncome?: number;
  refundAmount?: number;
  federalForms?: string[];
  stateReturns?: Record<string, any>;
  createdAt: string;
}

export interface InterviewState {
  currentSection: string;
  currentQuestionIndex: number;
  progress: number;
  isComplete: boolean;
}

export interface InterviewQuestion {
  id: string;
  section: string;
  questionText: string;
  helpText?: string;
  inputType: string;
  options?: { value: string; label: string }[];
}

export interface RefundEstimate {
  federalRefund: number;
  totalRefund: number;
  confidence: string;
}

export interface TaxCalculation {
  totalIncome: number;
  taxableIncome: number;
  totalTax: number;
  refundOrOwed: number;
  isRefund: boolean;
}

export interface LegalDocument {
  id: string;
  documentType: string;
  documentCategory: string;
  title: string;
  status: string;
  createdAt: string;
}

export interface LegalTemplate {
  id: string;
  name: string;
  category: string;
  description: string;
  premiumOnly: boolean;
  basePrice: number;
  accessible: boolean;
  requiresUpgrade?: boolean;
}

export interface TemplateSchemaField {
  id: string;
  label: string;
  type: 'text' | 'textarea' | 'date' | 'select' | 'multiselect' | 'checkbox';
  required?: boolean;
  placeholder?: string;
  options?: Array<{ value: string; label: string }>;
}

export interface LegalTemplateDetail extends LegalTemplate {
  requiresUpgrade: boolean;
  schema: {
    fields?: TemplateSchemaField[];
    sections?: Array<{
      id: string;
      title: string;
      fields: string[];
    }>;
  } | null;
}

export interface LegalFiling {
  id: string;
  filingType: string;
  filingTypeName: string;
  jurisdictionState: string;
  status: string;
  createdAt: string;
}

export interface FilingType {
  type: string;
  name: string;
  description: string;
  basePrice: number;
}

export interface FilingInterviewState {
  filingId: string;
  progress: number;
  isComplete: boolean;
  currentQuestion: FilingQuestion | null;
}

export interface FilingQuestion {
  id: string;
  category: string;
  questionText: string;
  helpText?: string;
  inputType: string;
  options?: { value: string; label: string }[];
}

export interface ChildSupportInput {
  stateCode: string;
  calculationType: string;
  parent1Data: ParentData;
  parent2Data: ParentData;
  childrenData: ChildData[];
}

export interface ParentData {
  grossMonthlyIncome: number;
  otherIncome: number;
  healthInsuranceCost: number;
  childCareCost: number;
  otherChildSupport: number;
  overnightsPerYear: number;
  deductions: Array<{ type: string; amount: number }>;
}

export interface ChildData {
  dateOfBirth: string;
  specialNeeds: boolean;
  healthInsuranceCoveredBy: string;
}

export interface ChildSupportResult {
  netSupportAmount: number;
  payingParent: string;
  combinedIncome: number;
  perChildBreakdown: Array<{
    childAge: number;
    totalForChild: number;
  }>;
}

export interface StateGuidelines {
  state: string;
  model: string;
  guidelinesUrl: string;
}

export interface ChildSupportCalculation {
  id: string;
  stateCode: string;
  result: ChildSupportResult;
  createdAt: string;
}

export interface SupportedState {
  code: string;
  name: string;
  model: string;
}

export interface Subscription {
  tier: string;
  status: string;
  features: Record<string, unknown>;
}

export interface Plan {
  id: string;
  name: string;
  price: number;
  interval: string;
  features: string[];
  popular?: boolean;
}

export interface UsageStats {
  usage: {
    taxReturns: { used: number; limit: number; unlimited: boolean };
    legalDocuments: { used: number; limit: number; unlimited: boolean };
    childSupportCalculations: { used: number; limit: number; unlimited: boolean };
  };
}

// Tax Estimate Types
export interface TaxEstimateInput {
  taxYear: number;
  filingStatus: string;
  grossIncome: number;
  wages?: number;
  federalWithholding?: number;
  stateWithholding?: number;
  dependents?: number;
  qualifyingChildren?: number;
  childrenUnder6?: number;
  children6to17?: number;
  standardDeduction?: boolean;
  itemizedDeductions?: number;
  stateCode?: string;
  selfEmploymentIncome?: number;
  earnedIncome?: number;
  investmentIncome?: number;
  childCareCosts?: number;
  retirementContributions?: number;
  educationExpenses?: number;
  aotcEligibleStudents?: number;
  tuitionPerStudent?: number;
  residentialCleanEnergyExpenses?: number;
  energyEfficientImprovements?: number;
  evPurchasePrice?: number;
  evVehicleType?: 'new' | 'used';
}

export interface TaxEstimateResponse {
  estimate: {
    federalTax: number;
    stateTax: number;
    totalTax: number;
    effectiveRate: number;
    marginalBracket: number;
    federalRefundOrOwed: number;
    stateRefundOrOwed: number;
    totalRefundOrOwed: number;
    isRefund: boolean;
  };
  breakdown: {
    grossIncome: number;
    adjustedGrossIncome: number;
    taxableIncome: number;
    deductionType: string;
    deductionAmount: number;
    credits: Array<{ name: string; amount: number; refundable: boolean }>;
    totalCredits: number;
  };
  suggestions: string[];
  confidence: 'low' | 'medium' | 'high';
  disclaimers: string[];
}

export interface WhatIfComparison {
  current: TaxEstimateResponse;
  comparison: TaxEstimateResponse;
  difference: {
    taxDifference: number;
    refundDifference: number;
    effectiveRateDifference: number;
    recommendation: string;
  };
}

export interface QuarterlyEstimates {
  annualEstimate: {
    totalTax: number;
    totalWithholdings: number;
    remainingTax: number;
    safeHarborAmount: number;
  };
  quarters: Array<{
    quarter: number;
    dueDate: string;
    amount: number;
    isPast: boolean;
    isOverdue: boolean;
  }>;
  recommendations: string[];
}

export interface DocumentScanResult {
  formType: string;
  formTypeConfidence: number;
  extractedData: Record<string, unknown>;
  overallConfidence: number;
  fieldsNeedingReview: string[];
  suggestions: string[];
  fieldConfidences: Array<{
    field: string;
    value: unknown;
    confidence: number;
    needsReview: boolean;
  }>;
  metadata: {
    processingTimeMs: number;
    documentLanguage: string;
    pageCount: number;
  };
  documentId?: string;
  autoSaved?: boolean;
}

export interface OcrStatus {
  ocrAvailable: boolean;
  supportedFormats: string[];
  supportedDocumentTypes: string[];
  message: string;
}

// Tax Deadline Types
export interface TaxDeadline {
  name: string;
  date: Date;
  description: string;
  type: 'federal' | 'state' | 'quarterly';
  urgent: boolean;
}

export interface TaxRecommendation {
  id: string;
  title: string;
  description: string;
  potentialSavings?: number;
  action?: string;
  actionUrl?: string;
  priority: 'high' | 'medium' | 'low';
}

