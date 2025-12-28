// Database types - These would typically be auto-generated from Supabase
// Run: npm run db:generate to update from Supabase schema

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      user_profiles: {
        Row: {
          id: string;
          email: string;
          first_name: string | null;
          last_name: string | null;
          phone: string | null;
          date_of_birth: string | null;
          ssn_encrypted: string | null;
          address: Json | null;
          subscription_tier: string;
          subscription_status: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          first_name?: string | null;
          last_name?: string | null;
          phone?: string | null;
          date_of_birth?: string | null;
          ssn_encrypted?: string | null;
          address?: Json | null;
          subscription_tier?: string;
          subscription_status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          first_name?: string | null;
          last_name?: string | null;
          phone?: string | null;
          date_of_birth?: string | null;
          ssn_encrypted?: string | null;
          address?: Json | null;
          subscription_tier?: string;
          subscription_status?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      tax_returns: {
        Row: {
          id: string;
          user_id: string;
          tax_year: number;
          filing_status: string | null;
          status: string;
          federal_return_id: string | null;
          state_return_ids: Json | null;
          total_income: number | null;
          adjusted_gross_income: number | null;
          taxable_income: number | null;
          total_tax: number | null;
          refund_amount: number | null;
          payment_amount: number | null;
          forms_data: Json | null;
          ai_suggestions: Json | null;
          created_at: string;
          updated_at: string;
          filed_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          tax_year: number;
          filing_status?: string | null;
          status?: string;
          federal_return_id?: string | null;
          state_return_ids?: Json | null;
          total_income?: number | null;
          adjusted_gross_income?: number | null;
          taxable_income?: number | null;
          total_tax?: number | null;
          refund_amount?: number | null;
          payment_amount?: number | null;
          forms_data?: Json | null;
          ai_suggestions?: Json | null;
          created_at?: string;
          updated_at?: string;
          filed_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          tax_year?: number;
          filing_status?: string | null;
          status?: string;
          federal_return_id?: string | null;
          state_return_ids?: Json | null;
          total_income?: number | null;
          adjusted_gross_income?: number | null;
          taxable_income?: number | null;
          total_tax?: number | null;
          refund_amount?: number | null;
          payment_amount?: number | null;
          forms_data?: Json | null;
          ai_suggestions?: Json | null;
          created_at?: string;
          updated_at?: string;
          filed_at?: string | null;
        };
      };
      tax_documents: {
        Row: {
          id: string;
          tax_return_id: string;
          document_type: string | null;
          document_data: Json | null;
          file_url: string | null;
          verified: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          tax_return_id: string;
          document_type?: string | null;
          document_data?: Json | null;
          file_url?: string | null;
          verified?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          tax_return_id?: string;
          document_type?: string | null;
          document_data?: Json | null;
          file_url?: string | null;
          verified?: boolean;
          created_at?: string;
        };
      };
      legal_documents: {
        Row: {
          id: string;
          user_id: string;
          document_type: string;
          document_category: string;
          title: string;
          status: string;
          template_id: string | null;
          document_data: Json | null;
          ai_generated_content: string | null;
          pdf_url: string | null;
          signature_status: string | null;
          docu_sign_envelope_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          document_type: string;
          document_category: string;
          title: string;
          status?: string;
          template_id?: string | null;
          document_data?: Json | null;
          ai_generated_content?: string | null;
          pdf_url?: string | null;
          signature_status?: string | null;
          docu_sign_envelope_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          document_type?: string;
          document_category?: string;
          title?: string;
          status?: string;
          template_id?: string | null;
          document_data?: Json | null;
          ai_generated_content?: string | null;
          pdf_url?: string | null;
          signature_status?: string | null;
          docu_sign_envelope_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      legal_templates: {
        Row: {
          id: string;
          name: string;
          category: string | null;
          description: string | null;
          template_schema: Json | null;
          ai_prompt_template: string | null;
          state_specific: boolean;
          applicable_states: string[] | null;
          premium_only: boolean;
          base_price: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          category?: string | null;
          description?: string | null;
          template_schema?: Json | null;
          ai_prompt_template?: string | null;
          state_specific?: boolean;
          applicable_states?: string[] | null;
          premium_only?: boolean;
          base_price?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          category?: string | null;
          description?: string | null;
          template_schema?: Json | null;
          ai_prompt_template?: string | null;
          state_specific?: boolean;
          applicable_states?: string[] | null;
          premium_only?: boolean;
          base_price?: number | null;
          created_at?: string;
        };
      };
      legal_filings: {
        Row: {
          id: string;
          user_id: string;
          filing_type: string;
          jurisdiction_state: string;
          jurisdiction_county: string | null;
          court_name: string | null;
          case_number: string | null;
          status: string;
          interview_data: Json | null;
          generated_forms: Json | null;
          filing_checklist: Json | null;
          court_filing_id: string | null;
          filing_fee: number | null;
          fee_waiver_applied: boolean;
          next_deadline: string | null;
          reminders_sent: Json | null;
          created_at: string;
          updated_at: string;
          filed_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          filing_type: string;
          jurisdiction_state: string;
          jurisdiction_county?: string | null;
          court_name?: string | null;
          case_number?: string | null;
          status?: string;
          interview_data?: Json | null;
          generated_forms?: Json | null;
          filing_checklist?: Json | null;
          court_filing_id?: string | null;
          filing_fee?: number | null;
          fee_waiver_applied?: boolean;
          next_deadline?: string | null;
          reminders_sent?: Json | null;
          created_at?: string;
          updated_at?: string;
          filed_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          filing_type?: string;
          jurisdiction_state?: string;
          jurisdiction_county?: string | null;
          court_name?: string | null;
          case_number?: string | null;
          status?: string;
          interview_data?: Json | null;
          generated_forms?: Json | null;
          filing_checklist?: Json | null;
          court_filing_id?: string | null;
          filing_fee?: number | null;
          fee_waiver_applied?: boolean;
          next_deadline?: string | null;
          reminders_sent?: Json | null;
          created_at?: string;
          updated_at?: string;
          filed_at?: string | null;
        };
      };
      court_forms: {
        Row: {
          id: string;
          legal_filing_id: string;
          form_name: string | null;
          form_type: string | null;
          jurisdiction_state: string | null;
          jurisdiction_county: string | null;
          form_data: Json | null;
          pdf_url: string | null;
          filing_sequence: number | null;
          required: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          legal_filing_id: string;
          form_name?: string | null;
          form_type?: string | null;
          jurisdiction_state?: string | null;
          jurisdiction_county?: string | null;
          form_data?: Json | null;
          pdf_url?: string | null;
          filing_sequence?: number | null;
          required?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          legal_filing_id?: string;
          form_name?: string | null;
          form_type?: string | null;
          jurisdiction_state?: string | null;
          jurisdiction_county?: string | null;
          form_data?: Json | null;
          pdf_url?: string | null;
          filing_sequence?: number | null;
          required?: boolean;
          created_at?: string;
        };
      };
      jurisdiction_rules: {
        Row: {
          id: string;
          state_code: string;
          county: string | null;
          filing_type: string | null;
          rule_key: string | null;
          rule_value: Json | null;
          description: string | null;
          source_url: string | null;
          last_updated: string | null;
        };
        Insert: {
          id?: string;
          state_code: string;
          county?: string | null;
          filing_type?: string | null;
          rule_key?: string | null;
          rule_value?: Json | null;
          description?: string | null;
          source_url?: string | null;
          last_updated?: string | null;
        };
        Update: {
          id?: string;
          state_code?: string;
          county?: string | null;
          filing_type?: string | null;
          rule_key?: string | null;
          rule_value?: Json | null;
          description?: string | null;
          source_url?: string | null;
          last_updated?: string | null;
        };
      };
      child_support_calculations: {
        Row: {
          id: string;
          user_id: string;
          legal_filing_id: string | null;
          state_code: string;
          calculation_type: string | null;
          parent1_data: Json | null;
          parent2_data: Json | null;
          children_data: Json | null;
          calculation_result: Json | null;
          guidelines_version: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          legal_filing_id?: string | null;
          state_code: string;
          calculation_type?: string | null;
          parent1_data?: Json | null;
          parent2_data?: Json | null;
          children_data?: Json | null;
          calculation_result?: Json | null;
          guidelines_version?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          legal_filing_id?: string | null;
          state_code?: string;
          calculation_type?: string | null;
          parent1_data?: Json | null;
          parent2_data?: Json | null;
          children_data?: Json | null;
          calculation_result?: Json | null;
          guidelines_version?: string | null;
          created_at?: string;
        };
      };
      subscriptions: {
        Row: {
          id: string;
          user_id: string;
          stripe_subscription_id: string | null;
          tier: string;
          status: string;
          current_period_start: string | null;
          current_period_end: string | null;
          cancel_at_period_end: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          stripe_subscription_id?: string | null;
          tier: string;
          status?: string;
          current_period_start?: string | null;
          current_period_end?: string | null;
          cancel_at_period_end?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          stripe_subscription_id?: string | null;
          tier?: string;
          status?: string;
          current_period_start?: string | null;
          current_period_end?: string | null;
          cancel_at_period_end?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      transactions: {
        Row: {
          id: string;
          user_id: string;
          stripe_payment_intent_id: string | null;
          amount: number;
          currency: string;
          service_type: string | null;
          service_id: string | null;
          status: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          stripe_payment_intent_id?: string | null;
          amount: number;
          currency?: string;
          service_type?: string | null;
          service_id?: string | null;
          status?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          stripe_payment_intent_id?: string | null;
          amount?: number;
          currency?: string;
          service_type?: string | null;
          service_id?: string | null;
          status?: string;
          created_at?: string;
        };
      };
      ai_usage_logs: {
        Row: {
          id: string;
          user_id: string;
          service_type: string | null;
          service_id: string | null;
          ai_model: string | null;
          prompt_tokens: number | null;
          completion_tokens: number | null;
          total_cost: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          service_type?: string | null;
          service_id?: string | null;
          ai_model?: string | null;
          prompt_tokens?: number | null;
          completion_tokens?: number | null;
          total_cost?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          service_type?: string | null;
          service_id?: string | null;
          ai_model?: string | null;
          prompt_tokens?: number | null;
          completion_tokens?: number | null;
          total_cost?: number | null;
          created_at?: string;
        };
      };
    };
    Views: {};
    Functions: {};
    Enums: {};
  };
}

// Convenience types
export type UserProfile = Database['public']['Tables']['user_profiles']['Row'];
export type TaxReturn = Database['public']['Tables']['tax_returns']['Row'];
export type TaxDocument = Database['public']['Tables']['tax_documents']['Row'];
export type LegalDocument = Database['public']['Tables']['legal_documents']['Row'];
export type LegalTemplate = Database['public']['Tables']['legal_templates']['Row'];
export type LegalFiling = Database['public']['Tables']['legal_filings']['Row'];
export type CourtForm = Database['public']['Tables']['court_forms']['Row'];
export type JurisdictionRule = Database['public']['Tables']['jurisdiction_rules']['Row'];
export type ChildSupportCalculation = Database['public']['Tables']['child_support_calculations']['Row'];
export type Subscription = Database['public']['Tables']['subscriptions']['Row'];
export type Transaction = Database['public']['Tables']['transactions']['Row'];
export type AIUsageLog = Database['public']['Tables']['ai_usage_logs']['Row'];

