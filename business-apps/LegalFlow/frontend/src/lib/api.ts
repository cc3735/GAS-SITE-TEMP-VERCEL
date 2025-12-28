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
  
  listTemplates: (params?: { category?: string; search?: string }) => {
    const query = params ? `?${new URLSearchParams(params as Record<string, string>)}` : '';
    return api.get<{ templates: LegalTemplate[] }>(`/legal/templates${query}`);
  },
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

