import { Router } from 'express';
import Stripe from 'stripe';
import { supabaseAdmin } from '../utils/supabase.js';
import { asyncHandler } from '../middleware/error-handler.js';
import { authenticate } from '../middleware/auth.js';
import { config } from '../config/index.js';
import { ValidationError, NotFoundError } from '../utils/errors.js';

const router = Router();

// Initialize Stripe
const stripe = new Stripe(config.stripe.secretKey, {
  apiVersion: '2023-10-16',
});

// All routes require authentication
router.use(authenticate);

// Get current subscription
router.get('/current', asyncHandler(async (req, res) => {
  const { data: subscription } = await supabaseAdmin
    .from('subscriptions')
    .select('*')
    .eq('user_id', req.user!.id)
    .single();

  if (!subscription) {
    res.json({
      success: true,
      data: {
        tier: 'free',
        status: 'active',
        features: config.pricing.tiers.free,
      },
    });
    return;
  }

  // Get Stripe subscription details if exists
  let stripeSubscription: Stripe.Subscription | null = null;
  if (subscription.stripe_subscription_id) {
    try {
      stripeSubscription = await stripe.subscriptions.retrieve(subscription.stripe_subscription_id);
    } catch {
      // Subscription might not exist in Stripe
    }
  }

  const tierConfig = config.pricing.tiers[subscription.tier as keyof typeof config.pricing.tiers];

  res.json({
    success: true,
    data: {
      id: subscription.id,
      tier: subscription.tier,
      status: subscription.status,
      currentPeriodStart: subscription.current_period_start,
      currentPeriodEnd: subscription.current_period_end,
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      features: tierConfig,
      stripeStatus: stripeSubscription?.status,
    },
  });
}));

// Get available plans
router.get('/plans', asyncHandler(async (_req, res) => {
  const plans = [
    {
      id: 'free',
      name: 'Free',
      description: 'Basic features for getting started',
      price: 0,
      interval: 'month',
      features: [
        'Simple tax returns (< $100k income)',
        'View legal templates',
        '5 child support calculations/month',
        'Basic support',
      ],
      limitations: [
        'No itemized deductions',
        'No legal document creation',
        'Limited AI features',
      ],
    },
    {
      id: 'basic',
      name: 'Basic',
      description: 'Essential features for individuals',
      price: 19,
      interval: 'month',
      perReturnPrice: 29,
      features: [
        'All tax forms and schedules',
        '5 legal documents/month',
        'Unlimited child support calculations',
        'Basic AI assistance',
        'Email support',
      ],
      popular: false,
    },
    {
      id: 'premium',
      name: 'Premium',
      description: 'Advanced features for comprehensive needs',
      price: 49,
      interval: 'month',
      perReturnPrice: 79,
      features: [
        'Everything in Basic',
        'Unlimited legal documents',
        'Advanced AI features',
        'Audit protection',
        'Priority support',
        'Legal filing automation',
        'Expert document review',
      ],
      popular: true,
    },
    {
      id: 'pro',
      name: 'Pro',
      description: 'Complete solution for complex needs',
      price: 99,
      interval: 'one-time',
      features: [
        'Everything in Premium',
        'Business tax returns',
        'Complex legal filings',
        '1 hour attorney consultation',
        'Dedicated support',
        'White-glove onboarding',
      ],
      popular: false,
    },
  ];

  res.json({
    success: true,
    data: { plans },
  });
}));

// Cancel subscription
router.post('/cancel', asyncHandler(async (req, res) => {
  const { data: subscription } = await supabaseAdmin
    .from('subscriptions')
    .select('*')
    .eq('user_id', req.user!.id)
    .single();

  if (!subscription || !subscription.stripe_subscription_id) {
    throw new NotFoundError('Active subscription');
  }

  // Cancel at period end (not immediately)
  const stripeSubscription = await stripe.subscriptions.update(
    subscription.stripe_subscription_id,
    { cancel_at_period_end: true }
  );

  // Update local record
  await supabaseAdmin
    .from('subscriptions')
    .update({
      cancel_at_period_end: true,
      updated_at: new Date().toISOString(),
    })
    .eq('id', subscription.id);

  res.json({
    success: true,
    message: 'Subscription will be canceled at the end of the current billing period',
    data: {
      cancelAt: new Date(stripeSubscription.current_period_end * 1000).toISOString(),
    },
  });
}));

// Resume canceled subscription
router.post('/resume', asyncHandler(async (req, res) => {
  const { data: subscription } = await supabaseAdmin
    .from('subscriptions')
    .select('*')
    .eq('user_id', req.user!.id)
    .single();

  if (!subscription || !subscription.stripe_subscription_id) {
    throw new NotFoundError('Subscription');
  }

  if (!subscription.cancel_at_period_end) {
    throw new ValidationError('Subscription is not scheduled for cancellation');
  }

  // Resume subscription
  await stripe.subscriptions.update(
    subscription.stripe_subscription_id,
    { cancel_at_period_end: false }
  );

  // Update local record
  await supabaseAdmin
    .from('subscriptions')
    .update({
      cancel_at_period_end: false,
      updated_at: new Date().toISOString(),
    })
    .eq('id', subscription.id);

  res.json({
    success: true,
    message: 'Subscription resumed successfully',
  });
}));

// Change subscription tier
router.post('/change-tier', asyncHandler(async (req, res) => {
  const { newTier } = req.body;

  if (!newTier || !['basic', 'premium'].includes(newTier)) {
    throw new ValidationError('Invalid tier. Must be "basic" or "premium"');
  }

  const { data: subscription } = await supabaseAdmin
    .from('subscriptions')
    .select('*')
    .eq('user_id', req.user!.id)
    .single();

  if (!subscription || !subscription.stripe_subscription_id) {
    throw new NotFoundError('Active subscription. Please subscribe first.');
  }

  // Get current subscription from Stripe
  const stripeSubscription = await stripe.subscriptions.retrieve(subscription.stripe_subscription_id);
  
  // Get new price ID
  const PRICE_IDS = {
    basic: process.env.STRIPE_PRICE_BASIC_MONTHLY || 'price_basic_monthly',
    premium: process.env.STRIPE_PRICE_PREMIUM_MONTHLY || 'price_premium_monthly',
  };

  const newPriceId = PRICE_IDS[newTier as keyof typeof PRICE_IDS];

  // Update subscription
  await stripe.subscriptions.update(subscription.stripe_subscription_id, {
    items: [
      {
        id: stripeSubscription.items.data[0].id,
        price: newPriceId,
      },
    ],
    proration_behavior: 'create_prorations',
  });

  // Update local records
  await supabaseAdmin
    .from('subscriptions')
    .update({
      tier: newTier,
      updated_at: new Date().toISOString(),
    })
    .eq('id', subscription.id);

  await supabaseAdmin
    .from('user_profiles')
    .update({
      subscription_tier: newTier,
      updated_at: new Date().toISOString(),
    })
    .eq('id', req.user!.id);

  res.json({
    success: true,
    message: `Subscription changed to ${newTier} tier`,
    data: {
      newTier,
    },
  });
}));

// Get billing portal link
router.get('/billing-portal', asyncHandler(async (req, res) => {
  const { returnUrl } = req.query;

  if (!returnUrl) {
    throw new ValidationError('Return URL is required');
  }

  const { data: subscription } = await supabaseAdmin
    .from('subscriptions')
    .select('stripe_subscription_id')
    .eq('user_id', req.user!.id)
    .single();

  if (!subscription?.stripe_subscription_id) {
    throw new NotFoundError('Active subscription');
  }

  // Get customer ID from subscription
  const stripeSubscription = await stripe.subscriptions.retrieve(subscription.stripe_subscription_id);

  // Create billing portal session
  const session = await stripe.billingPortal.sessions.create({
    customer: stripeSubscription.customer as string,
    return_url: returnUrl as string,
  });

  res.json({
    success: true,
    data: {
      url: session.url,
    },
  });
}));

// Get usage statistics
router.get('/usage', asyncHandler(async (req, res) => {
  const userId = req.user!.id;
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  // Get various usage counts
  const [taxReturns, legalDocs, childSupportCalcs, aiUsage] = await Promise.all([
    supabaseAdmin
      .from('tax_returns')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('created_at', startOfMonth.toISOString()),
    
    supabaseAdmin
      .from('legal_documents')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('created_at', startOfMonth.toISOString()),
    
    supabaseAdmin
      .from('child_support_calculations')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('created_at', startOfMonth.toISOString()),
    
    supabaseAdmin
      .from('ai_usage_logs')
      .select('total_cost')
      .eq('user_id', userId)
      .gte('created_at', startOfMonth.toISOString()),
  ]);

  const tier = req.user!.subscriptionTier;
  const tierConfig = config.pricing.tiers[tier as keyof typeof config.pricing.tiers];

  const totalAICost = aiUsage.data?.reduce((sum, log) => sum + (log.total_cost || 0), 0) || 0;

  res.json({
    success: true,
    data: {
      period: {
        start: startOfMonth.toISOString(),
        end: new Date().toISOString(),
      },
      usage: {
        taxReturns: {
          used: taxReturns.count || 0,
          limit: tierConfig && 'taxReturnsPerYear' in tierConfig ? tierConfig.taxReturnsPerYear : 1,
          unlimited: tierConfig && 'taxReturnsPerYear' in tierConfig ? tierConfig.taxReturnsPerYear === -1 : false,
        },
        legalDocuments: {
          used: legalDocs.count || 0,
          limit: tierConfig && 'legalDocsPerMonth' in tierConfig ? tierConfig.legalDocsPerMonth : 0,
          unlimited: tierConfig && 'legalDocsPerMonth' in tierConfig ? tierConfig.legalDocsPerMonth === -1 : false,
        },
        childSupportCalculations: {
          used: childSupportCalcs.count || 0,
          limit: tierConfig && 'childSupportCalcsPerMonth' in tierConfig ? tierConfig.childSupportCalcsPerMonth : 5,
          unlimited: tierConfig && 'childSupportCalcsPerMonth' in tierConfig ? tierConfig.childSupportCalcsPerMonth === -1 : false,
        },
        aiUsage: {
          totalCost: totalAICost,
          formattedCost: `$${totalAICost.toFixed(4)}`,
        },
      },
      tier,
    },
  });
}));

export default router;

