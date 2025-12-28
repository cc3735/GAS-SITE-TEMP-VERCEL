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

