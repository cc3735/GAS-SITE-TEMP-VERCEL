import { Router } from 'express';
import { supabaseAdmin } from '../../utils/supabase.js';
import { asyncHandler } from '../../middleware/error-handler.js';
import { authenticate, optionalAuth } from '../../middleware/auth.js';
import { NotFoundError } from '../../utils/errors.js';

const router = Router();

// Public template listing (shows what's available)
router.get('/', optionalAuth, asyncHandler(async (req, res) => {
  const { category, search, limit = 50 } = req.query;
  const userTier = req.user?.subscriptionTier || 'free';

  let query = supabaseAdmin
    .from('legal_templates')
    .select('id, name, category, description, state_specific, applicable_states, premium_only, base_price')
    .order('name');

  if (category) {
    query = query.eq('category', category);
  }

  if (search) {
    query = query.ilike('name', `%${search}%`);
  }

  query = query.limit(Number(limit));

  const { data: templates, error } = await query;

  if (error) {
    throw error;
  }

  // Mark templates as accessible based on user tier
  const templatesWithAccess = templates.map((t) => ({
    ...t,
    accessible: !t.premium_only || userTier === 'premium' || userTier === 'pro',
    requiresUpgrade: t.premium_only && userTier !== 'premium' && userTier !== 'pro',
  }));

  res.json({
    success: true,
    data: {
      templates: templatesWithAccess,
      categories: [
        { id: 'business', name: 'Business & Corporate' },
        { id: 'estate', name: 'Estate Planning' },
        { id: 'trademark', name: 'Trademarks & IP' },
        { id: 'contract', name: 'Contracts & Agreements' },
      ],
    },
  });
}));

// Get template details
router.get('/:id', optionalAuth, asyncHandler(async (req, res) => {
  const { id } = req.params;

  const { data: template, error } = await supabaseAdmin
    .from('legal_templates')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !template) {
    throw new NotFoundError('Template');
  }

  const userTier = req.user?.subscriptionTier || 'free';
  const accessible = !template.premium_only || userTier === 'premium' || userTier === 'pro';

  res.json({
    success: true,
    data: {
      id: template.id,
      name: template.name,
      category: template.category,
      description: template.description,
      stateSpecific: template.state_specific,
      applicableStates: template.applicable_states,
      premiumOnly: template.premium_only,
      basePrice: template.base_price,
      accessible,
      requiresUpgrade: !accessible,
      // Only show schema if user has access
      schema: accessible ? template.template_schema : null,
    },
  });
}));

// Seed initial templates (admin endpoint)
router.post('/seed', authenticate, asyncHandler(async (req, res) => {
  // In production, this should be admin-only
  // For now, we'll just seed some basic templates

  const templates = [
    // Business templates
    {
      name: 'LLC Operating Agreement',
      category: 'business',
      description: 'Standard operating agreement for Limited Liability Companies',
      template_schema: {
        sections: [
          { id: 'company_info', title: 'Company Information', fields: ['company_name', 'state', 'purpose'] },
          { id: 'members', title: 'Members', fields: ['member_names', 'ownership_percentages'] },
          { id: 'management', title: 'Management', fields: ['management_type', 'managers'] },
        ],
      },
      ai_prompt_template: 'Generate a comprehensive LLC Operating Agreement for the state of {state}.',
      state_specific: true,
      premium_only: false,
      base_price: 49,
    },
    {
      name: 'Articles of Incorporation',
      category: 'business',
      description: 'Formation documents for a corporation',
      template_schema: {
        sections: [
          { id: 'corp_info', title: 'Corporation Information', fields: ['corp_name', 'state', 'purpose'] },
          { id: 'stock', title: 'Stock Structure', fields: ['authorized_shares', 'par_value'] },
          { id: 'directors', title: 'Initial Directors', fields: ['director_names', 'director_addresses'] },
        ],
      },
      ai_prompt_template: 'Generate Articles of Incorporation for a {corp_type} corporation in {state}.',
      state_specific: true,
      premium_only: false,
      base_price: 99,
    },
    {
      name: 'DBA/Fictitious Name Filing',
      category: 'business',
      description: 'Register a business under a trade name',
      template_schema: {
        sections: [
          { id: 'business', title: 'Business Information', fields: ['legal_name', 'dba_name', 'address'] },
        ],
      },
      ai_prompt_template: 'Generate a DBA registration document for {state}.',
      state_specific: true,
      premium_only: false,
      base_price: 29,
    },
    // Estate templates
    {
      name: 'Last Will and Testament',
      category: 'estate',
      description: 'Simple will for distributing assets after death',
      template_schema: {
        sections: [
          { id: 'testator', title: 'Your Information', fields: ['full_name', 'address', 'marital_status'] },
          { id: 'beneficiaries', title: 'Beneficiaries', fields: ['primary_beneficiary', 'alternate_beneficiary'] },
          { id: 'executor', title: 'Executor', fields: ['executor_name', 'alternate_executor'] },
          { id: 'bequests', title: 'Specific Bequests', fields: ['specific_gifts'] },
        ],
      },
      ai_prompt_template: 'Generate a Last Will and Testament that is compliant with {state} law.',
      state_specific: true,
      premium_only: false,
      base_price: 49,
    },
    {
      name: 'Revocable Living Trust',
      category: 'estate',
      description: 'Trust that can be modified during your lifetime',
      template_schema: {
        sections: [
          { id: 'grantor', title: 'Grantor Information', fields: ['grantor_name', 'grantor_address'] },
          { id: 'trustees', title: 'Trustees', fields: ['initial_trustee', 'successor_trustees'] },
          { id: 'beneficiaries', title: 'Beneficiaries', fields: ['beneficiary_details'] },
          { id: 'assets', title: 'Trust Assets', fields: ['asset_list'] },
        ],
      },
      ai_prompt_template: 'Generate a Revocable Living Trust document compliant with {state} law.',
      state_specific: true,
      premium_only: true,
      base_price: 199,
    },
    {
      name: 'Power of Attorney - Financial',
      category: 'estate',
      description: 'Authorize someone to handle financial matters',
      template_schema: {
        sections: [
          { id: 'principal', title: 'Principal', fields: ['principal_name', 'principal_address'] },
          { id: 'agent', title: 'Agent', fields: ['agent_name', 'agent_address', 'alternate_agent'] },
          { id: 'powers', title: 'Powers Granted', fields: ['power_list'] },
        ],
      },
      ai_prompt_template: 'Generate a Durable Power of Attorney for Financial Matters compliant with {state} law.',
      state_specific: true,
      premium_only: false,
      base_price: 39,
    },
    {
      name: 'Healthcare Power of Attorney',
      category: 'estate',
      description: 'Authorize someone to make medical decisions',
      template_schema: {
        sections: [
          { id: 'principal', title: 'Principal', fields: ['principal_name'] },
          { id: 'agent', title: 'Healthcare Agent', fields: ['agent_name', 'alternate_agent'] },
          { id: 'directives', title: 'Healthcare Directives', fields: ['life_support', 'organ_donation'] },
        ],
      },
      ai_prompt_template: 'Generate a Healthcare Power of Attorney with advance directives for {state}.',
      state_specific: true,
      premium_only: false,
      base_price: 39,
    },
    // Contract templates
    {
      name: 'Non-Disclosure Agreement (NDA)',
      category: 'contract',
      description: 'Protect confidential business information',
      template_schema: {
        sections: [
          { id: 'parties', title: 'Parties', fields: ['disclosing_party', 'receiving_party'] },
          { id: 'confidential_info', title: 'Confidential Information', fields: ['definition', 'exclusions'] },
          { id: 'terms', title: 'Terms', fields: ['duration', 'return_of_materials'] },
        ],
      },
      ai_prompt_template: 'Generate a {nda_type} Non-Disclosure Agreement.',
      state_specific: false,
      premium_only: false,
      base_price: 29,
    },
    {
      name: 'Independent Contractor Agreement',
      category: 'contract',
      description: 'Contract for hiring freelancers or contractors',
      template_schema: {
        sections: [
          { id: 'parties', title: 'Parties', fields: ['company_name', 'contractor_name'] },
          { id: 'services', title: 'Services', fields: ['service_description', 'deliverables'] },
          { id: 'payment', title: 'Payment Terms', fields: ['rate', 'payment_schedule'] },
          { id: 'ip', title: 'Intellectual Property', fields: ['ownership', 'work_for_hire'] },
        ],
      },
      ai_prompt_template: 'Generate an Independent Contractor Agreement.',
      state_specific: false,
      premium_only: false,
      base_price: 49,
    },
    {
      name: 'Residential Lease Agreement',
      category: 'contract',
      description: 'Rental agreement for residential property',
      template_schema: {
        sections: [
          { id: 'parties', title: 'Landlord & Tenant', fields: ['landlord_name', 'tenant_names'] },
          { id: 'property', title: 'Property', fields: ['property_address', 'property_type'] },
          { id: 'terms', title: 'Lease Terms', fields: ['rent_amount', 'lease_duration', 'security_deposit'] },
        ],
      },
      ai_prompt_template: 'Generate a Residential Lease Agreement compliant with {state} landlord-tenant law.',
      state_specific: true,
      premium_only: false,
      base_price: 39,
    },
    // Trademark templates
    {
      name: 'Trademark Application (TEAS Plus)',
      category: 'trademark',
      description: 'USPTO TEAS Plus trademark application with lower filing fee',
      template_schema: {
        sections: [
          { id: 'mark', title: 'Mark Information', fields: ['mark_text', 'mark_type', 'mark_description'] },
          { id: 'owner', title: 'Owner Information', fields: ['owner_name', 'owner_type', 'owner_address'] },
          { id: 'goods_services', title: 'Goods & Services', fields: ['nice_classes', 'descriptions'] },
          { id: 'filing_basis', title: 'Filing Basis', fields: ['basis', 'use_dates', 'specimens'] },
        ],
      },
      ai_prompt_template: 'Generate a USPTO TEAS Plus trademark application for {mark_text}.',
      state_specific: false,
      premium_only: false,
      base_price: 99,
    },
    {
      name: 'Trademark Application (TEAS Standard)',
      category: 'trademark',
      description: 'USPTO TEAS Standard trademark application with flexible descriptions',
      template_schema: {
        sections: [
          { id: 'mark', title: 'Mark Information', fields: ['mark_text', 'mark_type', 'mark_description'] },
          { id: 'owner', title: 'Owner Information', fields: ['owner_name', 'owner_type', 'owner_address'] },
          { id: 'goods_services', title: 'Goods & Services', fields: ['nice_classes', 'descriptions'] },
          { id: 'filing_basis', title: 'Filing Basis', fields: ['basis', 'use_dates', 'specimens'] },
        ],
      },
      ai_prompt_template: 'Generate a USPTO TEAS Standard trademark application for {mark_text}.',
      state_specific: false,
      premium_only: false,
      base_price: 149,
    },
    {
      name: 'Statement of Use',
      category: 'trademark',
      description: 'Statement of Use for intent-to-use trademark applications',
      template_schema: {
        sections: [
          { id: 'application', title: 'Application Details', fields: ['serial_number', 'mark'] },
          { id: 'use', title: 'Use Information', fields: ['first_use_date', 'commerce_date', 'specimens'] },
        ],
      },
      ai_prompt_template: 'Generate a Statement of Use for trademark serial number {serial_number}.',
      state_specific: false,
      premium_only: false,
      base_price: 49,
    },
    {
      name: 'Section 8 Declaration (Continued Use)',
      category: 'trademark',
      description: 'Declaration of continued use between 5th and 6th year of registration',
      template_schema: {
        sections: [
          { id: 'registration', title: 'Registration Info', fields: ['registration_number', 'registration_date'] },
          { id: 'goods_services', title: 'Goods/Services Still in Use', fields: ['classes', 'descriptions'] },
        ],
      },
      ai_prompt_template: 'Generate a Section 8 Declaration for registration number {registration_number}.',
      state_specific: false,
      premium_only: false,
      base_price: 79,
    },
    {
      name: 'Section 9 Renewal',
      category: 'trademark',
      description: 'Trademark renewal every 10 years',
      template_schema: {
        sections: [
          { id: 'registration', title: 'Registration Info', fields: ['registration_number'] },
          { id: 'goods_services', title: 'Goods/Services for Renewal', fields: ['classes'] },
        ],
      },
      ai_prompt_template: 'Generate a Section 9 Renewal for registration number {registration_number}.',
      state_specific: false,
      premium_only: false,
      base_price: 79,
    },
    {
      name: 'Section 15 Declaration (Incontestability)',
      category: 'trademark',
      description: 'Claim incontestability after 5 years of continuous use',
      template_schema: {
        sections: [
          { id: 'registration', title: 'Registration Info', fields: ['registration_number', 'registration_date'] },
          { id: 'declaration', title: 'Declaration', fields: ['continuous_use_statement'] },
        ],
      },
      ai_prompt_template: 'Generate a Section 15 Declaration for registration number {registration_number}.',
      state_specific: false,
      premium_only: false,
      base_price: 79,
    },
    {
      name: 'Trademark Assignment Agreement',
      category: 'trademark',
      description: 'Transfer trademark ownership to another party',
      template_schema: {
        sections: [
          { id: 'parties', title: 'Parties', fields: ['assignor', 'assignee'] },
          { id: 'trademark', title: 'Trademark', fields: ['registration_number', 'mark', 'goods_services'] },
          { id: 'consideration', title: 'Consideration', fields: ['purchase_price', 'goodwill'] },
        ],
      },
      ai_prompt_template: 'Generate a Trademark Assignment Agreement.',
      state_specific: false,
      premium_only: false,
      base_price: 99,
    },
    {
      name: 'Trademark License Agreement',
      category: 'trademark',
      description: 'License trademark rights to another party',
      template_schema: {
        sections: [
          { id: 'parties', title: 'Parties', fields: ['licensor', 'licensee'] },
          { id: 'trademark', title: 'Licensed Mark', fields: ['registration_number', 'mark'] },
          { id: 'terms', title: 'License Terms', fields: ['exclusive', 'territory', 'royalties', 'quality_control'] },
        ],
      },
      ai_prompt_template: 'Generate a Trademark License Agreement.',
      state_specific: false,
      premium_only: true,
      base_price: 129,
    },
    {
      name: 'Cease and Desist Letter (Trademark)',
      category: 'trademark',
      description: 'Demand letter for trademark infringement',
      template_schema: {
        sections: [
          { id: 'sender', title: 'Sender', fields: ['owner_name', 'registration_details'] },
          { id: 'recipient', title: 'Infringer', fields: ['infringer_name', 'infringer_address'] },
          { id: 'infringement', title: 'Infringement Details', fields: ['description', 'demands'] },
        ],
      },
      ai_prompt_template: 'Generate a trademark cease and desist letter.',
      state_specific: false,
      premium_only: false,
      base_price: 79,
    },
    {
      name: 'Office Action Response',
      category: 'trademark',
      description: 'Response to USPTO office action rejections',
      template_schema: {
        sections: [
          { id: 'application', title: 'Application', fields: ['serial_number'] },
          { id: 'issues', title: 'Issues Addressed', fields: ['office_action_issues'] },
          { id: 'response', title: 'Response Arguments', fields: ['arguments', 'evidence'] },
        ],
      },
      ai_prompt_template: 'Generate an Office Action Response for trademark serial number {serial_number}.',
      state_specific: false,
      premium_only: true,
      base_price: 149,
    },
    {
      name: 'State Trademark Application',
      category: 'trademark',
      description: 'State-level trademark registration application',
      template_schema: {
        sections: [
          { id: 'mark', title: 'Mark Information', fields: ['mark_text', 'mark_type'] },
          { id: 'owner', title: 'Owner Information', fields: ['owner_name', 'owner_address'] },
          { id: 'goods_services', title: 'Goods & Services', fields: ['descriptions'] },
          { id: 'use', title: 'Use in State', fields: ['first_use_date'] },
        ],
      },
      ai_prompt_template: 'Generate a state trademark application for {state}.',
      state_specific: true,
      applicable_states: ['ALL'],
      premium_only: false,
      base_price: 49,
    },
  ];

  // Insert templates (upsert to avoid duplicates)
  for (const template of templates) {
    await supabaseAdmin
      .from('legal_templates')
      .upsert(template, { onConflict: 'name' });
  }

  res.json({
    success: true,
    message: `Seeded ${templates.length} templates`,
  });
}));

export default router;

