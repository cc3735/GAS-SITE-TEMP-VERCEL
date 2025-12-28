import { Router } from 'express';
import { supabaseAdmin } from '../../utils/supabase.js';
import { asyncHandler } from '../../middleware/error-handler.js';
import { authenticate, requirePremium } from '../../middleware/auth.js';
import { aiLimiter } from '../../middleware/rate-limit.js';
import { ValidationError, NotFoundError } from '../../utils/errors.js';
import { generate, generateJSON, isAIAvailable } from '../../services/ai/openai-client.js';
import { stateCodeSchema } from '../../utils/validation.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Entity type recommendation based on interview
router.post('/recommend-entity', aiLimiter, asyncHandler(async (req, res) => {
  const { 
    businessType,
    numberOfOwners,
    expectedRevenue,
    needsInvestors,
    liabilityProtection,
    taxPreference,
    state,
  } = req.body;

  // Validate state
  if (state) {
    const validation = stateCodeSchema.safeParse(state);
    if (!validation.success) {
      throw new ValidationError('Invalid state code');
    }
  }

  // Simple rule-based recommendation (can be enhanced with AI)
  let recommendation: string;
  let reasoning: string[];

  if (numberOfOwners === 1 && expectedRevenue < 100000 && !liabilityProtection) {
    recommendation = 'sole_proprietorship';
    reasoning = [
      'Simplest and least expensive to set up',
      'No separate tax filing required',
      'Full control over business decisions',
      'Note: No liability protection',
    ];
  } else if (numberOfOwners <= 2 && !needsInvestors && liabilityProtection) {
    recommendation = 'llc';
    reasoning = [
      'Personal liability protection for owners',
      'Flexible tax options (pass-through or corporate)',
      'Less paperwork than a corporation',
      'Good for small businesses with liability concerns',
    ];
  } else if (needsInvestors || numberOfOwners > 5) {
    recommendation = taxPreference === 'corporate' ? 'corporation' : 's_corp';
    reasoning = [
      'Can issue stock to raise capital',
      'Attractive to investors',
      'Clear ownership structure',
      taxPreference === 'corporate' 
        ? 'Corporate tax rates may be beneficial at higher revenue'
        : 'S-Corp status allows pass-through taxation',
    ];
  } else {
    recommendation = 'llc';
    reasoning = [
      'Most versatile option for small to medium businesses',
      'Liability protection with tax flexibility',
      'Can be taxed as sole prop, partnership, or corporation',
    ];
  }

  // If AI is available and user has premium, get enhanced recommendation
  if (isAIAvailable() && (req.user!.subscriptionTier === 'premium' || req.user!.subscriptionTier === 'pro')) {
    try {
      const aiRecommendation = await generateJSON<{
        recommendation: string;
        reasoning: string[];
        considerations: string[];
      }>(
        `Given: Business type: ${businessType}, Owners: ${numberOfOwners}, Expected revenue: $${expectedRevenue}, 
         Needs investors: ${needsInvestors}, Wants liability protection: ${liabilityProtection}, 
         Tax preference: ${taxPreference}, State: ${state || 'Not specified'}
         
         Recommend the best business entity type and explain why.`,
        `You are a business formation expert. Analyze the user's needs and recommend the best entity type.
         Return JSON with: recommendation (sole_proprietorship, llc, s_corp, corporation, partnership), 
         reasoning (array of bullet points), and considerations (things to think about).`,
        { userId: req.user!.id, serviceType: 'legal', maxTokens: 500 }
      );

      res.json({
        success: true,
        data: {
          ...aiRecommendation,
          aiEnhanced: true,
        },
      });
      return;
    } catch {
      // Fall back to rule-based
    }
  }

  res.json({
    success: true,
    data: {
      recommendation,
      reasoning,
      considerations: [
        'Consult with a tax professional for personalized advice',
        'State laws vary - check specific requirements for ' + (state || 'your state'),
        'Consider future growth plans when choosing entity type',
      ],
      aiEnhanced: false,
    },
  });
}));

// Start LLC formation
router.post('/llc', asyncHandler(async (req, res) => {
  const {
    businessName,
    state,
    purpose,
    members,
    registeredAgent,
  } = req.body;

  // Validate required fields
  if (!businessName || !state) {
    throw new ValidationError('Business name and state are required');
  }

  const stateValidation = stateCodeSchema.safeParse(state);
  if (!stateValidation.success) {
    throw new ValidationError('Invalid state code');
  }

  // Create legal document for LLC
  const { data: document, error } = await supabaseAdmin
    .from('legal_documents')
    .insert({
      user_id: req.user!.id,
      document_type: 'llc_formation',
      document_category: 'business',
      title: `${businessName} LLC - Formation Documents`,
      status: 'draft',
      document_data: {
        businessName,
        state,
        purpose: purpose || 'General business purposes',
        members: members || [],
        registeredAgent: registeredAgent || null,
        entityType: 'llc',
      },
    })
    .select()
    .single();

  if (error) {
    throw new ValidationError('Failed to create LLC formation documents');
  }

  // Generate checklist
  const checklist = [
    { step: 1, task: 'Choose and reserve business name', status: 'completed' },
    { step: 2, task: 'Designate registered agent', status: members?.length > 0 ? 'completed' : 'pending' },
    { step: 3, task: 'File Articles of Organization', status: 'pending' },
    { step: 4, task: 'Create Operating Agreement', status: 'pending' },
    { step: 5, task: 'Obtain EIN from IRS', status: 'pending' },
    { step: 6, task: 'Open business bank account', status: 'pending' },
    { step: 7, task: 'Register for state taxes', status: 'pending' },
    { step: 8, task: 'Obtain business licenses/permits', status: 'pending' },
  ];

  // Get state-specific filing fee (simplified)
  const filingFees: Record<string, number> = {
    CA: 70,
    TX: 300,
    FL: 125,
    NY: 200,
    DE: 90,
    DEFAULT: 150,
  };

  const filingFee = filingFees[state] || filingFees.DEFAULT;

  res.status(201).json({
    success: true,
    data: {
      documentId: document.id,
      businessName,
      state,
      entityType: 'LLC',
      checklist,
      estimatedFilingFee: filingFee,
      estimatedTimeline: '1-2 weeks after filing',
      nextSteps: [
        'Complete member information',
        'Designate a registered agent',
        'Review and customize Operating Agreement',
        'File Articles of Organization with the state',
      ],
    },
  });
}));

// Start corporation formation
router.post('/corporation', asyncHandler(async (req, res) => {
  const {
    corporationName,
    state,
    corporationType, // c_corp or s_corp
    purpose,
    directors,
    authorizedShares,
    parValue,
    registeredAgent,
  } = req.body;

  if (!corporationName || !state) {
    throw new ValidationError('Corporation name and state are required');
  }

  const stateValidation = stateCodeSchema.safeParse(state);
  if (!stateValidation.success) {
    throw new ValidationError('Invalid state code');
  }

  // Create legal document
  const { data: document, error } = await supabaseAdmin
    .from('legal_documents')
    .insert({
      user_id: req.user!.id,
      document_type: 'corporation_formation',
      document_category: 'business',
      title: `${corporationName} Inc. - Formation Documents`,
      status: 'draft',
      document_data: {
        corporationName,
        state,
        corporationType: corporationType || 'c_corp',
        purpose: purpose || 'General business purposes',
        directors: directors || [],
        authorizedShares: authorizedShares || 10000000,
        parValue: parValue || 0.001,
        registeredAgent: registeredAgent || null,
        entityType: 'corporation',
      },
    })
    .select()
    .single();

  if (error) {
    throw new ValidationError('Failed to create corporation formation documents');
  }

  const checklist = [
    { step: 1, task: 'Choose and verify corporate name', status: 'completed' },
    { step: 2, task: 'Appoint initial directors', status: directors?.length > 0 ? 'completed' : 'pending' },
    { step: 3, task: 'Designate registered agent', status: 'pending' },
    { step: 4, task: 'File Articles of Incorporation', status: 'pending' },
    { step: 5, task: 'Create corporate bylaws', status: 'pending' },
    { step: 6, task: 'Hold organizational meeting', status: 'pending' },
    { step: 7, task: 'Issue stock certificates', status: 'pending' },
    { step: 8, task: 'Obtain EIN from IRS', status: 'pending' },
    { step: 9, task: 'File S-Corp election (if applicable)', status: corporationType === 's_corp' ? 'pending' : 'not_applicable' },
    { step: 10, task: 'Register for state taxes', status: 'pending' },
  ];

  const filingFees: Record<string, number> = {
    CA: 100,
    TX: 300,
    FL: 35,
    NY: 125,
    DE: 89,
    DEFAULT: 125,
  };

  res.status(201).json({
    success: true,
    data: {
      documentId: document.id,
      corporationName,
      state,
      corporationType: corporationType || 'c_corp',
      entityType: 'Corporation',
      checklist,
      estimatedFilingFee: filingFees[state] || filingFees.DEFAULT,
      estimatedTimeline: '1-3 weeks after filing',
      nextSteps: [
        'Appoint initial board of directors',
        'Designate a registered agent',
        'Review Articles of Incorporation',
        'Prepare corporate bylaws',
      ],
    },
  });
}));

// EIN application assistance
router.post('/ein', asyncHandler(async (req, res) => {
  const { documentId, businessInfo } = req.body;

  if (!documentId) {
    throw new ValidationError('Document ID is required');
  }

  // Verify document ownership
  const { data: document } = await supabaseAdmin
    .from('legal_documents')
    .select('*')
    .eq('id', documentId)
    .eq('user_id', req.user!.id)
    .single();

  if (!document) {
    throw new NotFoundError('Document');
  }

  // EIN application guidance (cannot actually file - must be done on IRS website)
  res.json({
    success: true,
    data: {
      einApplicationUrl: 'https://www.irs.gov/businesses/small-businesses-self-employed/apply-for-an-employer-identification-number-ein-online',
      requirements: [
        'Must have a valid Taxpayer Identification Number (SSN or ITIN)',
        'Must be located in the United States or U.S. Territories',
        'The responsible party must have a valid SSN or ITIN',
      ],
      informationNeeded: [
        'Legal name of entity',
        'Trade name (DBA) if applicable',
        'Mailing address',
        'County and state',
        'Type of entity',
        'Reason for applying',
        'Date business started or acquired',
        'Principal business activity',
        'Responsible party information (name, SSN)',
      ],
      steps: [
        '1. Go to IRS EIN Online Application',
        '2. Verify you meet the requirements',
        '3. Complete the online application',
        '4. Submit and receive EIN immediately',
        '5. Save confirmation letter',
      ],
      notes: [
        'Online application is available Monday-Friday, 7am-10pm ET',
        'EIN is issued immediately upon completion',
        'Service is free - do not pay third parties',
        'You can only apply for one EIN per responsible party per day',
      ],
      documentData: document.document_data,
    },
  });
}));

// Get state-specific business formation requirements
router.get('/requirements/:state', asyncHandler(async (req, res) => {
  const { state } = req.params;
  const { entityType = 'llc' } = req.query;

  const stateValidation = stateCodeSchema.safeParse(state.toUpperCase());
  if (!stateValidation.success) {
    throw new ValidationError('Invalid state code');
  }

  // State-specific requirements (simplified - would be from database in production)
  const requirements: Record<string, Record<string, unknown>> = {
    CA: {
      llc: {
        filingFee: 70,
        annualFee: 800,
        filingOffice: 'California Secretary of State',
        publicationRequired: false,
        operatingAgreementRequired: false,
        notes: ['$800 annual franchise tax minimum', 'Additional LLC fee based on income'],
      },
      corporation: {
        filingFee: 100,
        annualFee: 800,
        filingOffice: 'California Secretary of State',
        minDirectors: 1,
        notes: ['$800 annual franchise tax minimum'],
      },
    },
    TX: {
      llc: {
        filingFee: 300,
        annualFee: 0,
        filingOffice: 'Texas Secretary of State',
        publicationRequired: false,
        operatingAgreementRequired: false,
        notes: ['No state income tax', 'Annual report required (no fee)'],
      },
      corporation: {
        filingFee: 300,
        annualFee: 0,
        filingOffice: 'Texas Secretary of State',
        minDirectors: 1,
        notes: ['No state income tax', 'Franchise tax may apply based on revenue'],
      },
    },
    DE: {
      llc: {
        filingFee: 90,
        annualFee: 300,
        filingOffice: 'Delaware Division of Corporations',
        publicationRequired: false,
        operatingAgreementRequired: false,
        notes: ['Popular for flexibility', 'Strong LLC statute', 'Court of Chancery for business disputes'],
      },
      corporation: {
        filingFee: 89,
        annualFee: 225,
        filingOffice: 'Delaware Division of Corporations',
        minDirectors: 1,
        notes: ['Most popular state for incorporation', 'Well-established corporate law'],
      },
    },
    FL: {
      llc: {
        filingFee: 125,
        annualFee: 138.75,
        filingOffice: 'Florida Division of Corporations',
        publicationRequired: false,
        operatingAgreementRequired: false,
        notes: ['No state income tax', 'Annual report required'],
      },
      corporation: {
        filingFee: 35,
        annualFee: 150,
        filingOffice: 'Florida Division of Corporations',
        minDirectors: 1,
        notes: ['Low initial filing fee', 'No state income tax'],
      },
    },
    NY: {
      llc: {
        filingFee: 200,
        annualFee: 9,
        filingOffice: 'New York Department of State',
        publicationRequired: true,
        publicationCost: '500-2000',
        operatingAgreementRequired: true,
        notes: ['Publication requirement is expensive', 'Must publish in 2 newspapers for 6 weeks'],
      },
      corporation: {
        filingFee: 125,
        annualFee: 9,
        filingOffice: 'New York Department of State',
        minDirectors: 1,
        notes: ['Biennial statement required'],
      },
    },
  };

  const stateReqs = requirements[state.toUpperCase()]?.[entityType as string] || {
    filingFee: 150,
    annualFee: 50,
    notes: ['Contact your Secretary of State for specific requirements'],
  };

  res.json({
    success: true,
    data: {
      state: state.toUpperCase(),
      entityType,
      requirements: stateReqs,
      generalSteps: [
        'Choose and verify business name availability',
        'Designate a registered agent',
        'Prepare and file formation documents',
        'Create operating agreement/bylaws',
        'Obtain EIN from IRS',
        'Register for state and local taxes',
        'Obtain necessary licenses and permits',
      ],
    },
  });
}));

export default router;

