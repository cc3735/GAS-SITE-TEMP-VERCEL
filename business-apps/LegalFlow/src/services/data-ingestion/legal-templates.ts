/**
 * Legal Templates Data Ingestion Service
 * 
 * Comprehensive legal document templates including:
 * - Business documents (Operating Agreements, Bylaws, etc.)
 * - Estate planning (Wills, Trusts, POA)
 * - Family law (Parenting Plans, Divorce Agreements)
 * - Contracts (NDAs, Service Agreements, Leases)
 */

import { supabaseAdmin } from '../../utils/supabase.js';
import { logger } from '../../utils/logger.js';
import type { IngestionResult } from './types.js';

interface LegalTemplate {
  templateKey: string;
  name: string;
  category: string;
  subcategory?: string;
  description: string;
  templateSchema: Record<string, unknown>;
  stateSpecific: boolean;
  applicableStates?: string[];
  requiredFields: string[];
  optionalFields: string[];
  premiumOnly: boolean;
  basePrice: number;
  estimatedCompletionMinutes: number;
}

export class LegalTemplatesIngestion {
  async ingestAll(): Promise<IngestionResult> {
    const startTime = Date.now();
    const templates = this.getAllTemplates();

    let created = 0;
    let failed = 0;

    for (const template of templates) {
      try {
        const { error } = await supabaseAdmin
          .from('lf_legal_templates')
          .upsert({
            template_key: template.templateKey,
            name: template.name,
            category: template.category,
            subcategory: template.subcategory,
            description: template.description,
            template_schema: template.templateSchema,
            state_specific: template.stateSpecific,
            applicable_states: template.applicableStates,
            required_fields: template.requiredFields,
            optional_fields: template.optionalFields,
            premium_only: template.premiumOnly,
            base_price: template.basePrice,
            estimated_completion_minutes: template.estimatedCompletionMinutes,
          }, {
            onConflict: 'template_key',
          });

        if (error) throw error;
        created++;
      } catch (error) {
        logger.error('Failed to upsert template', { key: template.templateKey, error });
        failed++;
      }
    }

    logger.info(`Legal templates ingestion completed: ${created} created, ${failed} failed`);

    return {
      success: failed === 0,
      recordsProcessed: templates.length,
      recordsCreated: created,
      recordsUpdated: 0,
      recordsFailed: failed,
      errors: [],
      duration: Date.now() - startTime,
    };
  }

  private getAllTemplates(): LegalTemplate[] {
    return [
      // BUSINESS FORMATION DOCUMENTS
      {
        templateKey: 'llc_operating_agreement_single',
        name: 'Single-Member LLC Operating Agreement',
        category: 'business',
        subcategory: 'llc',
        description: 'Operating agreement for a single-member LLC. Establishes ownership, management structure, and operating procedures.',
        templateSchema: {
          sections: ['company_info', 'member_info', 'management', 'capital_contributions', 'distributions', 'dissolution'],
          fields: {
            company_name: { type: 'text', required: true },
            state_of_formation: { type: 'select', required: true },
            member_name: { type: 'text', required: true },
            member_address: { type: 'address', required: true },
            initial_capital: { type: 'currency', required: false },
            effective_date: { type: 'date', required: true },
          },
        },
        stateSpecific: true,
        requiredFields: ['company_name', 'state_of_formation', 'member_name', 'effective_date'],
        optionalFields: ['initial_capital', 'member_address', 'purpose'],
        premiumOnly: false,
        basePrice: 39,
        estimatedCompletionMinutes: 15,
      },
      {
        templateKey: 'llc_operating_agreement_multi',
        name: 'Multi-Member LLC Operating Agreement',
        category: 'business',
        subcategory: 'llc',
        description: 'Comprehensive operating agreement for multi-member LLCs. Covers ownership percentages, voting rights, profit sharing, and dispute resolution.',
        templateSchema: {
          sections: ['company_info', 'members', 'management_structure', 'capital', 'allocations', 'voting', 'transfers', 'dissolution'],
          fields: {
            company_name: { type: 'text', required: true },
            state_of_formation: { type: 'select', required: true },
            members: { type: 'array', required: true, itemSchema: { name: 'text', ownership: 'percentage', capital: 'currency' } },
            management_type: { type: 'select', options: ['member_managed', 'manager_managed'] },
          },
        },
        stateSpecific: true,
        requiredFields: ['company_name', 'state_of_formation', 'members', 'management_type'],
        optionalFields: ['buyout_provisions', 'non_compete', 'arbitration'],
        premiumOnly: false,
        basePrice: 79,
        estimatedCompletionMinutes: 30,
      },
      {
        templateKey: 'corporate_bylaws',
        name: 'Corporate Bylaws',
        category: 'business',
        subcategory: 'corporation',
        description: 'Standard corporate bylaws governing board meetings, officer duties, shareholder rights, and corporate procedures.',
        templateSchema: {
          sections: ['general', 'shareholders', 'board_of_directors', 'officers', 'shares', 'indemnification', 'amendments'],
        },
        stateSpecific: true,
        requiredFields: ['corporation_name', 'state', 'fiscal_year_end', 'board_size'],
        optionalFields: ['quorum_requirements', 'special_provisions'],
        premiumOnly: false,
        basePrice: 99,
        estimatedCompletionMinutes: 45,
      },
      {
        templateKey: 'articles_of_incorporation',
        name: 'Articles of Incorporation',
        category: 'business',
        subcategory: 'corporation',
        description: 'Formation document for incorporating a business. Includes authorized shares, registered agent, and purpose.',
        templateSchema: {
          sections: ['corporation_name', 'purpose', 'shares', 'registered_agent', 'incorporator', 'directors'],
        },
        stateSpecific: true,
        requiredFields: ['corporation_name', 'state', 'authorized_shares', 'registered_agent'],
        optionalFields: ['par_value', 'share_classes', 'initial_directors'],
        premiumOnly: false,
        basePrice: 49,
        estimatedCompletionMinutes: 20,
      },
      {
        templateKey: 'shareholder_agreement',
        name: 'Shareholder Agreement',
        category: 'business',
        subcategory: 'corporation',
        description: 'Agreement among shareholders covering transfer restrictions, buyout provisions, and voting agreements.',
        templateSchema: {
          sections: ['parties', 'shares', 'transfers', 'buyout', 'voting', 'drag_along', 'tag_along', 'dispute_resolution'],
        },
        stateSpecific: false,
        requiredFields: ['corporation_name', 'shareholders', 'effective_date'],
        optionalFields: ['right_of_first_refusal', 'buyout_formula', 'non_compete'],
        premiumOnly: true,
        basePrice: 149,
        estimatedCompletionMinutes: 45,
      },

      // ESTATE PLANNING DOCUMENTS
      {
        templateKey: 'simple_will',
        name: 'Simple Will',
        category: 'estate',
        subcategory: 'will',
        description: 'Basic last will and testament for straightforward estates. Includes executor appointment and asset distribution.',
        templateSchema: {
          sections: ['testator_info', 'family', 'executor', 'bequests', 'residuary', 'guardianship', 'signatures'],
        },
        stateSpecific: true,
        requiredFields: ['testator_name', 'state', 'executor', 'beneficiaries'],
        optionalFields: ['specific_bequests', 'guardian', 'alternate_executor'],
        premiumOnly: false,
        basePrice: 49,
        estimatedCompletionMinutes: 30,
      },
      {
        templateKey: 'comprehensive_will',
        name: 'Comprehensive Will with Trust Provisions',
        category: 'estate',
        subcategory: 'will',
        description: 'Detailed will with provisions for minor children, trusts, and complex asset distribution.',
        templateSchema: {
          sections: ['testator_info', 'family', 'executor', 'specific_gifts', 'trusts', 'guardianship', 'residuary', 'tax_provisions'],
        },
        stateSpecific: true,
        requiredFields: ['testator_name', 'state', 'executor', 'beneficiaries'],
        optionalFields: ['trusts', 'guardian', 'tax_provisions', 'charitable_gifts'],
        premiumOnly: true,
        basePrice: 149,
        estimatedCompletionMinutes: 60,
      },
      {
        templateKey: 'revocable_living_trust',
        name: 'Revocable Living Trust',
        category: 'estate',
        subcategory: 'trust',
        description: 'Living trust that avoids probate and provides for asset management during incapacity.',
        templateSchema: {
          sections: ['grantor_info', 'trustee', 'beneficiaries', 'trust_property', 'distribution', 'incapacity', 'successor_trustee'],
        },
        stateSpecific: true,
        requiredFields: ['grantor_name', 'state', 'trustee', 'successor_trustee', 'beneficiaries'],
        optionalFields: ['trust_property', 'special_instructions', 'pour_over_will'],
        premiumOnly: true,
        basePrice: 299,
        estimatedCompletionMinutes: 90,
      },
      {
        templateKey: 'financial_poa',
        name: 'Financial Power of Attorney',
        category: 'estate',
        subcategory: 'poa',
        description: 'Durable power of attorney for financial matters. Agent can handle banking, investments, and property.',
        templateSchema: {
          sections: ['principal_info', 'agent', 'powers', 'limitations', 'durability', 'effective_date'],
        },
        stateSpecific: true,
        requiredFields: ['principal_name', 'state', 'agent_name', 'powers_granted'],
        optionalFields: ['limitations', 'successor_agent', 'effective_date_type'],
        premiumOnly: false,
        basePrice: 39,
        estimatedCompletionMinutes: 20,
      },
      {
        templateKey: 'healthcare_poa',
        name: 'Healthcare Power of Attorney / Healthcare Proxy',
        category: 'estate',
        subcategory: 'poa',
        description: 'Appoints an agent to make medical decisions if you become incapacitated.',
        templateSchema: {
          sections: ['principal_info', 'agent', 'healthcare_powers', 'end_of_life', 'organ_donation', 'hipaa_authorization'],
        },
        stateSpecific: true,
        requiredFields: ['principal_name', 'state', 'agent_name'],
        optionalFields: ['end_of_life_wishes', 'organ_donation', 'alternate_agent'],
        premiumOnly: false,
        basePrice: 29,
        estimatedCompletionMinutes: 15,
      },
      {
        templateKey: 'living_will',
        name: 'Living Will / Advance Directive',
        category: 'estate',
        subcategory: 'directive',
        description: 'Specifies your wishes for end-of-life medical care and life-sustaining treatment.',
        templateSchema: {
          sections: ['declarant_info', 'life_sustaining_treatment', 'comfort_care', 'specific_instructions'],
        },
        stateSpecific: true,
        requiredFields: ['declarant_name', 'state', 'treatment_preferences'],
        optionalFields: ['specific_conditions', 'religious_considerations'],
        premiumOnly: false,
        basePrice: 19,
        estimatedCompletionMinutes: 15,
      },

      // FAMILY LAW DOCUMENTS
      {
        templateKey: 'parenting_plan',
        name: 'Parenting Plan',
        category: 'family',
        subcategory: 'custody',
        description: 'Comprehensive co-parenting agreement covering custody schedule, decision-making, and communication.',
        templateSchema: {
          sections: ['parents_info', 'children', 'legal_custody', 'physical_custody', 'schedule', 'holidays', 'communication', 'dispute_resolution'],
        },
        stateSpecific: true,
        requiredFields: ['parent1_name', 'parent2_name', 'children', 'state', 'custody_type'],
        optionalFields: ['holiday_schedule', 'travel_provisions', 'relocation_notice'],
        premiumOnly: false,
        basePrice: 79,
        estimatedCompletionMinutes: 45,
      },
      {
        templateKey: 'child_support_agreement',
        name: 'Child Support Agreement',
        category: 'family',
        subcategory: 'support',
        description: 'Agreement for child support payments including amount, payment method, and modifications.',
        templateSchema: {
          sections: ['parties', 'children', 'support_amount', 'payment_terms', 'health_insurance', 'extraordinary_expenses', 'modifications'],
        },
        stateSpecific: true,
        requiredFields: ['obligor_name', 'obligee_name', 'children', 'support_amount', 'state'],
        optionalFields: ['payment_method', 'insurance_responsibility', 'college_expenses'],
        premiumOnly: false,
        basePrice: 49,
        estimatedCompletionMinutes: 30,
      },
      {
        templateKey: 'marital_settlement_agreement',
        name: 'Marital Settlement Agreement',
        category: 'family',
        subcategory: 'divorce',
        description: 'Comprehensive divorce settlement covering property division, support, and custody.',
        templateSchema: {
          sections: ['parties', 'property_division', 'debts', 'spousal_support', 'child_custody', 'child_support', 'insurance', 'taxes'],
        },
        stateSpecific: true,
        requiredFields: ['spouse1_name', 'spouse2_name', 'state', 'marriage_date'],
        optionalFields: ['real_property', 'retirement_accounts', 'business_interests'],
        premiumOnly: true,
        basePrice: 199,
        estimatedCompletionMinutes: 90,
      },
      {
        templateKey: 'prenuptial_agreement',
        name: 'Prenuptial Agreement',
        category: 'family',
        subcategory: 'marriage',
        description: 'Pre-marriage agreement covering property rights, spousal support, and asset protection.',
        templateSchema: {
          sections: ['parties', 'financial_disclosure', 'separate_property', 'marital_property', 'spousal_support', 'death', 'general'],
        },
        stateSpecific: true,
        requiredFields: ['party1_name', 'party2_name', 'state', 'wedding_date'],
        optionalFields: ['separate_property_list', 'support_waiver', 'sunset_clause'],
        premiumOnly: true,
        basePrice: 249,
        estimatedCompletionMinutes: 60,
      },

      // CONTRACTS
      {
        templateKey: 'nda_mutual',
        name: 'Mutual Non-Disclosure Agreement (NDA)',
        category: 'contract',
        subcategory: 'confidentiality',
        description: 'Two-way NDA protecting confidential information shared between both parties.',
        templateSchema: {
          sections: ['parties', 'definition', 'obligations', 'exclusions', 'term', 'return_of_information', 'remedies'],
        },
        stateSpecific: false,
        requiredFields: ['party1_name', 'party2_name', 'effective_date', 'term'],
        optionalFields: ['specific_information', 'jurisdiction', 'non_solicitation'],
        premiumOnly: false,
        basePrice: 29,
        estimatedCompletionMinutes: 15,
      },
      {
        templateKey: 'nda_unilateral',
        name: 'One-Way Non-Disclosure Agreement',
        category: 'contract',
        subcategory: 'confidentiality',
        description: 'One-way NDA where only one party discloses confidential information.',
        templateSchema: {
          sections: ['parties', 'definition', 'obligations', 'exclusions', 'term', 'remedies'],
        },
        stateSpecific: false,
        requiredFields: ['disclosing_party', 'receiving_party', 'effective_date'],
        optionalFields: ['specific_information', 'term', 'return_provisions'],
        premiumOnly: false,
        basePrice: 19,
        estimatedCompletionMinutes: 10,
      },
      {
        templateKey: 'independent_contractor',
        name: 'Independent Contractor Agreement',
        category: 'contract',
        subcategory: 'services',
        description: 'Agreement for hiring independent contractors including scope of work, payment, and IP rights.',
        templateSchema: {
          sections: ['parties', 'services', 'compensation', 'term', 'independent_contractor_status', 'confidentiality', 'intellectual_property', 'termination'],
        },
        stateSpecific: false,
        requiredFields: ['company_name', 'contractor_name', 'services', 'compensation'],
        optionalFields: ['deliverables', 'milestones', 'expenses', 'non_compete'],
        premiumOnly: false,
        basePrice: 49,
        estimatedCompletionMinutes: 25,
      },
      {
        templateKey: 'consulting_agreement',
        name: 'Consulting Agreement',
        category: 'contract',
        subcategory: 'services',
        description: 'Professional consulting services agreement with detailed scope and payment terms.',
        templateSchema: {
          sections: ['parties', 'services', 'fees', 'expenses', 'term', 'confidentiality', 'work_product', 'indemnification'],
        },
        stateSpecific: false,
        requiredFields: ['client_name', 'consultant_name', 'services', 'fee_structure'],
        optionalFields: ['retainer', 'expense_cap', 'termination_notice'],
        premiumOnly: false,
        basePrice: 59,
        estimatedCompletionMinutes: 30,
      },
      {
        templateKey: 'residential_lease',
        name: 'Residential Lease Agreement',
        category: 'contract',
        subcategory: 'real_estate',
        description: 'Standard residential lease for landlords and tenants.',
        templateSchema: {
          sections: ['parties', 'property', 'term', 'rent', 'security_deposit', 'utilities', 'maintenance', 'rules', 'termination'],
        },
        stateSpecific: true,
        requiredFields: ['landlord_name', 'tenant_name', 'property_address', 'rent_amount', 'term'],
        optionalFields: ['pets', 'parking', 'appliances', 'late_fees'],
        premiumOnly: false,
        basePrice: 49,
        estimatedCompletionMinutes: 30,
      },
      {
        templateKey: 'commercial_lease',
        name: 'Commercial Lease Agreement',
        category: 'contract',
        subcategory: 'real_estate',
        description: 'Commercial property lease with provisions for business use.',
        templateSchema: {
          sections: ['parties', 'premises', 'use', 'term', 'rent', 'cam_charges', 'improvements', 'insurance', 'default'],
        },
        stateSpecific: true,
        requiredFields: ['landlord_name', 'tenant_name', 'premises', 'permitted_use', 'rent'],
        optionalFields: ['cam_estimate', 'tenant_improvements', 'exclusivity', 'signage'],
        premiumOnly: true,
        basePrice: 149,
        estimatedCompletionMinutes: 60,
      },
      {
        templateKey: 'employment_agreement',
        name: 'Employment Agreement',
        category: 'contract',
        subcategory: 'employment',
        description: 'Comprehensive employment contract for hiring employees.',
        templateSchema: {
          sections: ['parties', 'position', 'compensation', 'benefits', 'term', 'duties', 'confidentiality', 'non_compete', 'termination'],
        },
        stateSpecific: true,
        requiredFields: ['employer_name', 'employee_name', 'position', 'salary', 'start_date'],
        optionalFields: ['bonus', 'equity', 'non_compete_terms', 'severance'],
        premiumOnly: true,
        basePrice: 129,
        estimatedCompletionMinutes: 45,
      },
      {
        templateKey: 'bill_of_sale',
        name: 'Bill of Sale',
        category: 'contract',
        subcategory: 'sale',
        description: 'Document transferring ownership of personal property.',
        templateSchema: {
          sections: ['parties', 'property_description', 'purchase_price', 'warranties', 'transfer'],
        },
        stateSpecific: false,
        requiredFields: ['seller_name', 'buyer_name', 'property_description', 'purchase_price'],
        optionalFields: ['warranty_type', 'condition', 'serial_numbers'],
        premiumOnly: false,
        basePrice: 19,
        estimatedCompletionMinutes: 10,
      },
      {
        templateKey: 'promissory_note',
        name: 'Promissory Note',
        category: 'contract',
        subcategory: 'finance',
        description: 'Written promise to repay a loan with specified terms.',
        templateSchema: {
          sections: ['parties', 'principal', 'interest', 'payment_schedule', 'collateral', 'default'],
        },
        stateSpecific: false,
        requiredFields: ['lender_name', 'borrower_name', 'principal_amount', 'interest_rate', 'payment_terms'],
        optionalFields: ['collateral', 'prepayment', 'late_fees'],
        premiumOnly: false,
        basePrice: 29,
        estimatedCompletionMinutes: 15,
      },
      {
        templateKey: 'service_agreement',
        name: 'General Service Agreement',
        category: 'contract',
        subcategory: 'services',
        description: 'Agreement for providing professional services to clients.',
        templateSchema: {
          sections: ['parties', 'services', 'fees', 'term', 'warranties', 'liability', 'termination'],
        },
        stateSpecific: false,
        requiredFields: ['provider_name', 'client_name', 'services', 'fees'],
        optionalFields: ['deliverables', 'timeline', 'expenses'],
        premiumOnly: false,
        basePrice: 39,
        estimatedCompletionMinutes: 20,
      },

      // COURT FILING TEMPLATES
      {
        templateKey: 'divorce_petition_uncontested',
        name: 'Petition for Dissolution of Marriage (Uncontested)',
        category: 'filing',
        subcategory: 'divorce',
        description: 'Initial divorce petition for uncontested cases where both parties agree.',
        templateSchema: {
          sections: ['parties', 'marriage_info', 'grounds', 'children', 'property', 'relief_requested'],
        },
        stateSpecific: true,
        requiredFields: ['petitioner_name', 'respondent_name', 'state', 'marriage_date', 'separation_date'],
        optionalFields: ['children', 'property_division', 'support'],
        premiumOnly: false,
        basePrice: 99,
        estimatedCompletionMinutes: 45,
      },
      {
        templateKey: 'child_support_modification',
        name: 'Motion to Modify Child Support',
        category: 'filing',
        subcategory: 'support',
        description: 'Court motion to increase or decrease child support based on changed circumstances.',
        templateSchema: {
          sections: ['parties', 'current_order', 'changed_circumstances', 'proposed_amount', 'supporting_facts'],
        },
        stateSpecific: true,
        requiredFields: ['movant_name', 'respondent_name', 'state', 'current_order_date', 'changed_circumstances'],
        optionalFields: ['income_documentation', 'proposed_amount'],
        premiumOnly: false,
        basePrice: 79,
        estimatedCompletionMinutes: 30,
      },
      {
        templateKey: 'custody_modification',
        name: 'Motion to Modify Custody/Parenting Time',
        category: 'filing',
        subcategory: 'custody',
        description: 'Court motion to change custody arrangement or parenting time schedule.',
        templateSchema: {
          sections: ['parties', 'children', 'current_order', 'changed_circumstances', 'proposed_changes', 'best_interests'],
        },
        stateSpecific: true,
        requiredFields: ['movant_name', 'respondent_name', 'children', 'state', 'changed_circumstances'],
        optionalFields: ['proposed_schedule', 'supporting_documentation'],
        premiumOnly: false,
        basePrice: 89,
        estimatedCompletionMinutes: 40,
      },
      {
        templateKey: 'name_change_adult',
        name: 'Petition for Adult Name Change',
        category: 'filing',
        subcategory: 'name_change',
        description: 'Court petition to legally change an adult name.',
        templateSchema: {
          sections: ['petitioner_info', 'current_name', 'proposed_name', 'reason', 'background_check', 'publication'],
        },
        stateSpecific: true,
        requiredFields: ['current_name', 'proposed_name', 'state', 'reason'],
        optionalFields: ['criminal_history', 'debts'],
        premiumOnly: false,
        basePrice: 49,
        estimatedCompletionMinutes: 20,
      },
      {
        templateKey: 'fee_waiver_application',
        name: 'Application for Fee Waiver (In Forma Pauperis)',
        category: 'filing',
        subcategory: 'fee_waiver',
        description: 'Application to waive court filing fees based on financial hardship.',
        templateSchema: {
          sections: ['applicant_info', 'income', 'expenses', 'assets', 'public_benefits', 'declaration'],
        },
        stateSpecific: true,
        requiredFields: ['applicant_name', 'state', 'monthly_income', 'monthly_expenses'],
        optionalFields: ['public_benefits', 'assets', 'dependents'],
        premiumOnly: false,
        basePrice: 0,
        estimatedCompletionMinutes: 20,
      },

      // TRADEMARK DOCUMENTS
      {
        templateKey: 'trademark_application',
        name: 'Trademark Application Worksheet',
        category: 'trademark',
        subcategory: 'registration',
        description: 'Preparation worksheet for USPTO trademark application.',
        templateSchema: {
          sections: ['applicant_info', 'mark', 'goods_services', 'use_basis', 'specimens'],
        },
        stateSpecific: false,
        requiredFields: ['applicant_name', 'mark_type', 'goods_services', 'use_basis'],
        optionalFields: ['first_use_date', 'specimen_description'],
        premiumOnly: true,
        basePrice: 199,
        estimatedCompletionMinutes: 45,
      },
      {
        templateKey: 'trademark_assignment',
        name: 'Trademark Assignment Agreement',
        category: 'trademark',
        subcategory: 'transfer',
        description: 'Agreement to transfer ownership of a trademark.',
        templateSchema: {
          sections: ['parties', 'trademark', 'consideration', 'warranties', 'recordation'],
        },
        stateSpecific: false,
        requiredFields: ['assignor_name', 'assignee_name', 'trademark', 'consideration'],
        optionalFields: ['registration_number', 'goodwill'],
        premiumOnly: true,
        basePrice: 79,
        estimatedCompletionMinutes: 20,
      },
    ];
  }
}

