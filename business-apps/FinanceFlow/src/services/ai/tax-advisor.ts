/**
 * AI Tax Advisor Service
 *
 * Provides intelligent tax optimization suggestions, deduction discovery,
 * audit risk assessment, year-round tax planning, and natural language Q&A.
 *
 * @module services/ai/tax-advisor
 */

import OpenAI from 'openai';
import { config } from '../../config/index.js';
import { logger } from '../../utils/logger.js';
import { supabase } from '../../lib/supabase.js';

// ============================================================================
// TYPES
// ============================================================================

export interface TaxSituation {
  filingStatus: 'single' | 'married_filing_jointly' | 'married_filing_separately' | 'head_of_household' | 'qualifying_widow';
  taxYear: number;
  income: {
    wages?: number;
    selfEmploymentIncome?: number;
    interestIncome?: number;
    dividendIncome?: number;
    capitalGains?: number;
    rentalIncome?: number;
    socialSecurity?: number;
    retirement?: number;
    other?: number;
  };
  deductions?: {
    mortgageInterest?: number;
    propertyTaxes?: number;
    stateTaxes?: number;
    charitableContributions?: number;
    medicalExpenses?: number;
    studentLoanInterest?: number;
    educatorExpenses?: number;
  };
  credits?: {
    childrenUnder17?: number;
    childrenInCollege?: number;
    childCareExpenses?: number;
    retirementContributions?: number;
    energyImprovements?: boolean;
    electricVehicle?: boolean;
  };
  businessInfo?: {
    entityType?: string;
    grossReceipts?: number;
    expenses?: number;
    homeOffice?: boolean;
    vehicleExpenses?: boolean;
    employees?: number;
  };
  state?: string;
  age?: number;
  spouseAge?: number;
  hasHSA?: boolean;
  has401k?: boolean;
  hasIRA?: boolean;
}

export interface OptimizationSuggestion {
  id: string;
  category: 'deduction' | 'credit' | 'timing' | 'investment' | 'retirement' | 'structure' | 'compliance';
  title: string;
  description: string;
  potentialSavings: number | null;
  confidence: 'high' | 'medium' | 'low';
  priority: 'high' | 'medium' | 'low';
  actionItems: string[];
  deadline?: string;
  relatedForms?: string[];
  legalCitations?: string[];
}

export interface DeductionOpportunity {
  id: string;
  name: string;
  type: 'above_the_line' | 'itemized' | 'business';
  estimatedAmount: number;
  requirements: string[];
  isEligible: boolean;
  eligibilityReason?: string;
  howToClaim: string;
}

export interface AuditRiskAssessment {
  overallRisk: 'low' | 'medium' | 'high';
  riskScore: number; // 0-100
  factors: AuditRiskFactor[];
  recommendations: string[];
  industryComparison?: {
    category: string;
    averageAuditRate: number;
  };
}

export interface AuditRiskFactor {
  factor: string;
  riskLevel: 'low' | 'medium' | 'high';
  description: string;
  mitigation?: string;
}

export interface TaxPlanningAdvice {
  id: string;
  category: string;
  timeframe: 'immediate' | 'this_quarter' | 'this_year' | 'next_year' | 'long_term';
  title: string;
  description: string;
  impact: string;
  steps: string[];
}

export interface ConversationMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

export interface ConversationContext {
  id: string;
  userId: string;
  taxSituation?: TaxSituation;
  messages: ConversationMessage[];
  createdAt: Date;
  updatedAt: Date;
}

export interface TaxQuestion {
  question: string;
  context?: TaxSituation;
  conversationId?: string;
}

export interface TaxAnswer {
  answer: string;
  confidence: 'high' | 'medium' | 'low';
  sources?: string[];
  followUpQuestions?: string[];
  relatedTopics?: string[];
  disclaimer: string;
}

// ============================================================================
// AI TAX ADVISOR SERVICE
// ============================================================================

export class AITaxAdvisorService {
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({
      apiKey: config.openai.apiKey,
    });
  }

  // ============================================================================
  // TAX OPTIMIZATION
  // ============================================================================

  /**
   * Generate tax optimization suggestions based on user's situation
   */
  async getOptimizationSuggestions(situation: TaxSituation): Promise<OptimizationSuggestion[]> {
    logger.info('Generating tax optimization suggestions', { taxYear: situation.taxYear });

    const prompt = this.buildOptimizationPrompt(situation);

    const response = await this.openai.chat.completions.create({
      model: config.openai.model,
      messages: [
        {
          role: 'system',
          content: `You are an expert tax advisor AI. Analyze the user's tax situation and provide specific, actionable optimization suggestions. Focus on legitimate tax strategies that could save money or reduce audit risk. Always be accurate and cite relevant IRS forms or publications when applicable. Return your response as a JSON array of suggestions.`,
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3,
    });

    const content = response.choices[0]?.message?.content || '{"suggestions":[]}';
    const parsed = JSON.parse(content);

    return (parsed.suggestions || []).map((s: any, index: number) => ({
      id: `opt-${Date.now()}-${index}`,
      category: s.category || 'deduction',
      title: s.title,
      description: s.description,
      potentialSavings: s.potentialSavings || null,
      confidence: s.confidence || 'medium',
      priority: s.priority || 'medium',
      actionItems: s.actionItems || [],
      deadline: s.deadline,
      relatedForms: s.relatedForms || [],
      legalCitations: s.legalCitations || [],
    }));
  }

  private buildOptimizationPrompt(situation: TaxSituation): string {
    return `Analyze this tax situation and provide optimization suggestions:

Tax Year: ${situation.taxYear}
Filing Status: ${situation.filingStatus}
State: ${situation.state || 'Not specified'}
Age: ${situation.age || 'Not specified'}

INCOME:
- Wages: $${situation.income.wages || 0}
- Self-Employment: $${situation.income.selfEmploymentIncome || 0}
- Interest: $${situation.income.interestIncome || 0}
- Dividends: $${situation.income.dividendIncome || 0}
- Capital Gains: $${situation.income.capitalGains || 0}
- Rental Income: $${situation.income.rentalIncome || 0}
- Social Security: $${situation.income.socialSecurity || 0}
- Retirement Distributions: $${situation.income.retirement || 0}

CURRENT DEDUCTIONS:
${JSON.stringify(situation.deductions || {}, null, 2)}

CREDITS SITUATION:
- Children under 17: ${situation.credits?.childrenUnder17 || 0}
- Children in college: ${situation.credits?.childrenInCollege || 0}
- Child care expenses: $${situation.credits?.childCareExpenses || 0}
- Retirement contributions: $${situation.credits?.retirementContributions || 0}
- Energy improvements: ${situation.credits?.energyImprovements ? 'Yes' : 'No'}
- Electric vehicle: ${situation.credits?.electricVehicle ? 'Yes' : 'No'}

RETIREMENT ACCOUNTS:
- Has HSA: ${situation.hasHSA ? 'Yes' : 'No'}
- Has 401(k): ${situation.has401k ? 'Yes' : 'No'}
- Has IRA: ${situation.hasIRA ? 'Yes' : 'No'}

${situation.businessInfo ? `BUSINESS INFO:
- Entity Type: ${situation.businessInfo.entityType}
- Gross Receipts: $${situation.businessInfo.grossReceipts}
- Expenses: $${situation.businessInfo.expenses}
- Home Office: ${situation.businessInfo.homeOffice ? 'Yes' : 'No'}
- Vehicle Expenses: ${situation.businessInfo.vehicleExpenses ? 'Yes' : 'No'}
- Employees: ${situation.businessInfo.employees || 0}` : ''}

Provide a JSON response with this structure:
{
  "suggestions": [
    {
      "category": "deduction|credit|timing|investment|retirement|structure|compliance",
      "title": "Brief title",
      "description": "Detailed explanation",
      "potentialSavings": 1000,
      "confidence": "high|medium|low",
      "priority": "high|medium|low",
      "actionItems": ["Step 1", "Step 2"],
      "deadline": "April 15, 2024",
      "relatedForms": ["Form 8889", "Schedule A"],
      "legalCitations": ["IRC Section 223", "IRS Publication 969"]
    }
  ]
}`;
  }

  // ============================================================================
  // DEDUCTION DISCOVERY
  // ============================================================================

  /**
   * Discover potential deductions the user may have missed
   */
  async discoverDeductions(situation: TaxSituation): Promise<DeductionOpportunity[]> {
    logger.info('Discovering deduction opportunities', { taxYear: situation.taxYear });

    const allDeductions = this.getAllPossibleDeductions(situation);
    const eligibleDeductions: DeductionOpportunity[] = [];

    for (const deduction of allDeductions) {
      const eligibility = this.checkDeductionEligibility(deduction, situation);
      eligibleDeductions.push({
        ...deduction,
        isEligible: eligibility.isEligible,
        eligibilityReason: eligibility.reason,
      });
    }

    // Sort by estimated amount for eligible deductions
    return eligibleDeductions.sort((a, b) => {
      if (a.isEligible && !b.isEligible) return -1;
      if (!a.isEligible && b.isEligible) return 1;
      return b.estimatedAmount - a.estimatedAmount;
    });
  }

  private getAllPossibleDeductions(situation: TaxSituation): Omit<DeductionOpportunity, 'isEligible' | 'eligibilityReason'>[] {
    const totalIncome = Object.values(situation.income).reduce((sum, val) => sum + (val || 0), 0);

    return [
      // Above-the-line deductions
      {
        id: 'hsa',
        name: 'Health Savings Account (HSA) Contribution',
        type: 'above_the_line' as const,
        estimatedAmount: situation.filingStatus === 'married_filing_jointly' ? 8300 : 4150,
        requirements: ['Have a High Deductible Health Plan (HDHP)', 'Not enrolled in Medicare', 'Not claimed as dependent'],
        howToClaim: 'Contribute to HSA and report on Form 8889',
      },
      {
        id: 'traditional_ira',
        name: 'Traditional IRA Contribution',
        type: 'above_the_line' as const,
        estimatedAmount: (situation.age || 0) >= 50 ? 8000 : 7000,
        requirements: ['Have earned income', 'Under age 73', 'Income limits may apply if covered by employer plan'],
        howToClaim: 'Contribute to Traditional IRA by April 15, report on Form 1040 Line 20',
      },
      {
        id: 'student_loan_interest',
        name: 'Student Loan Interest Deduction',
        type: 'above_the_line' as const,
        estimatedAmount: 2500,
        requirements: ['Paid interest on qualified student loan', 'MAGI under $90,000 single / $185,000 MFJ'],
        howToClaim: 'Report on Form 1040 Schedule 1 Line 21',
      },
      {
        id: 'educator_expenses',
        name: 'Educator Expense Deduction',
        type: 'above_the_line' as const,
        estimatedAmount: 300,
        requirements: ['K-12 teacher, instructor, counselor, principal, or aide', 'Work at least 900 hours in school year'],
        howToClaim: 'Report on Form 1040 Schedule 1 Line 11',
      },
      {
        id: 'self_employment_tax',
        name: 'Self-Employment Tax Deduction',
        type: 'above_the_line' as const,
        estimatedAmount: (situation.income.selfEmploymentIncome || 0) * 0.0765,
        requirements: ['Have self-employment income'],
        howToClaim: 'Automatically calculated on Schedule SE, deduct 50% on Form 1040',
      },
      {
        id: 'self_employed_health',
        name: 'Self-Employed Health Insurance',
        type: 'above_the_line' as const,
        estimatedAmount: 12000, // Estimate
        requirements: ['Self-employed with net profit', 'Not eligible for employer health plan'],
        howToClaim: 'Report on Form 1040 Schedule 1 Line 17',
      },
      // Itemized deductions
      {
        id: 'mortgage_interest',
        name: 'Mortgage Interest Deduction',
        type: 'itemized' as const,
        estimatedAmount: situation.deductions?.mortgageInterest || 0,
        requirements: ['Itemize deductions', 'Mortgage on primary or secondary residence', 'Loan up to $750,000'],
        howToClaim: 'Report on Schedule A Line 8',
      },
      {
        id: 'salt',
        name: 'State and Local Taxes (SALT)',
        type: 'itemized' as const,
        estimatedAmount: Math.min(10000, (situation.deductions?.stateTaxes || 0) + (situation.deductions?.propertyTaxes || 0)),
        requirements: ['Itemize deductions', 'Limited to $10,000 total'],
        howToClaim: 'Report on Schedule A Line 5',
      },
      {
        id: 'charitable',
        name: 'Charitable Contributions',
        type: 'itemized' as const,
        estimatedAmount: situation.deductions?.charitableContributions || 0,
        requirements: ['Itemize deductions', 'Donations to qualified 501(c)(3) organizations', 'Keep receipts'],
        howToClaim: 'Report on Schedule A Line 11-14',
      },
      {
        id: 'medical',
        name: 'Medical and Dental Expenses',
        type: 'itemized' as const,
        estimatedAmount: Math.max(0, (situation.deductions?.medicalExpenses || 0) - totalIncome * 0.075),
        requirements: ['Itemize deductions', 'Expenses exceed 7.5% of AGI'],
        howToClaim: 'Report on Schedule A Line 1-4',
      },
      // Business deductions
      {
        id: 'home_office',
        name: 'Home Office Deduction',
        type: 'business' as const,
        estimatedAmount: 1500, // Simplified method max
        requirements: ['Regular and exclusive use for business', 'Principal place of business'],
        howToClaim: 'Report on Form 8829 or use simplified method ($5/sq ft up to 300 sq ft)',
      },
      {
        id: 'business_vehicle',
        name: 'Business Vehicle Expenses',
        type: 'business' as const,
        estimatedAmount: 10000, // Estimate based on typical usage
        requirements: ['Use vehicle for business', 'Keep mileage log'],
        howToClaim: 'Standard mileage ($0.67/mile 2024) or actual expenses on Schedule C',
      },
      {
        id: 'qbi',
        name: 'Qualified Business Income (QBI) Deduction',
        type: 'business' as const,
        estimatedAmount: (situation.income.selfEmploymentIncome || 0) * 0.2,
        requirements: ['Have qualified business income', 'Income limits may apply'],
        howToClaim: 'Calculate on Form 8995 or 8995-A',
      },
    ];
  }

  private checkDeductionEligibility(
    deduction: Omit<DeductionOpportunity, 'isEligible' | 'eligibilityReason'>,
    situation: TaxSituation
  ): { isEligible: boolean; reason?: string } {
    const totalIncome = Object.values(situation.income).reduce((sum, val) => sum + (val || 0), 0);

    switch (deduction.id) {
      case 'hsa':
        if (!situation.hasHSA && (situation.age || 0) < 65) {
          return { isEligible: true, reason: 'You may be eligible if you have a high-deductible health plan' };
        }
        if ((situation.age || 0) >= 65) {
          return { isEligible: false, reason: 'Must not be enrolled in Medicare (typically age 65+)' };
        }
        return { isEligible: situation.hasHSA === true };

      case 'traditional_ira':
        if (!situation.hasIRA && situation.income.wages) {
          return { isEligible: true, reason: 'You have earned income and may contribute to a Traditional IRA' };
        }
        return { isEligible: !!situation.income.wages };

      case 'student_loan_interest':
        if (situation.deductions?.studentLoanInterest && situation.deductions.studentLoanInterest > 0) {
          const limit = situation.filingStatus === 'married_filing_jointly' ? 185000 : 90000;
          if (totalIncome > limit) {
            return { isEligible: false, reason: `Income exceeds limit of $${limit.toLocaleString()}` };
          }
          return { isEligible: true };
        }
        return { isEligible: false, reason: 'No student loan interest reported' };

      case 'self_employment_tax':
      case 'self_employed_health':
      case 'qbi':
        return {
          isEligible: (situation.income.selfEmploymentIncome || 0) > 0,
          reason: situation.income.selfEmploymentIncome ? undefined : 'Requires self-employment income',
        };

      case 'home_office':
      case 'business_vehicle':
        return {
          isEligible: !!situation.businessInfo,
          reason: situation.businessInfo ? undefined : 'Requires business activity',
        };

      case 'medical':
        const threshold = totalIncome * 0.075;
        const excess = (situation.deductions?.medicalExpenses || 0) - threshold;
        if (excess > 0) {
          return { isEligible: true, reason: `$${excess.toFixed(0)} exceeds 7.5% AGI threshold` };
        }
        return { isEligible: false, reason: 'Medical expenses do not exceed 7.5% of AGI' };

      default:
        return { isEligible: deduction.estimatedAmount > 0 };
    }
  }

  // ============================================================================
  // AUDIT RISK ASSESSMENT
  // ============================================================================

  /**
   * Assess audit risk based on tax return data
   */
  async assessAuditRisk(situation: TaxSituation): Promise<AuditRiskAssessment> {
    logger.info('Assessing audit risk', { taxYear: situation.taxYear });

    const factors: AuditRiskFactor[] = [];
    let totalRiskScore = 0;

    // Factor 1: High income
    const totalIncome = Object.values(situation.income).reduce((sum, val) => sum + (val || 0), 0);
    if (totalIncome > 500000) {
      factors.push({
        factor: 'High Income',
        riskLevel: 'high',
        description: `Income over $500,000 increases audit rate to ~1.5%`,
        mitigation: 'Ensure all deductions are well-documented with receipts',
      });
      totalRiskScore += 30;
    } else if (totalIncome > 200000) {
      factors.push({
        factor: 'Above Average Income',
        riskLevel: 'medium',
        description: 'Higher incomes receive more IRS scrutiny',
        mitigation: 'Keep detailed records of all income and deductions',
      });
      totalRiskScore += 15;
    }

    // Factor 2: Self-employment income
    if (situation.income.selfEmploymentIncome && situation.income.selfEmploymentIncome > 0) {
      const expenseRatio = situation.businessInfo?.expenses
        ? situation.businessInfo.expenses / (situation.businessInfo.grossReceipts || 1)
        : 0;

      if (expenseRatio > 0.8) {
        factors.push({
          factor: 'High Business Expense Ratio',
          riskLevel: 'high',
          description: `Business expenses are ${(expenseRatio * 100).toFixed(0)}% of gross receipts`,
          mitigation: 'Ensure all expenses are ordinary and necessary for business. Keep detailed receipts.',
        });
        totalRiskScore += 25;
      } else {
        factors.push({
          factor: 'Self-Employment Income',
          riskLevel: 'medium',
          description: 'Self-employment income receives additional scrutiny',
          mitigation: 'Keep mileage logs, receipt records, and document business purpose',
        });
        totalRiskScore += 10;
      }
    }

    // Factor 3: Large charitable deductions
    if (situation.deductions?.charitableContributions) {
      const charitableRate = situation.deductions.charitableContributions / Math.max(totalIncome, 1);
      if (charitableRate > 0.2) {
        factors.push({
          factor: 'Large Charitable Deductions',
          riskLevel: 'high',
          description: `Charitable deductions are ${(charitableRate * 100).toFixed(0)}% of income`,
          mitigation: 'Get written acknowledgment for donations over $250. Appraisals for non-cash over $5,000.',
        });
        totalRiskScore += 20;
      }
    }

    // Factor 4: Home office deduction
    if (situation.businessInfo?.homeOffice) {
      factors.push({
        factor: 'Home Office Deduction',
        riskLevel: 'medium',
        description: 'Home office deductions are frequently audited',
        mitigation: 'Ensure space is used regularly and exclusively for business. Consider simplified method.',
      });
      totalRiskScore += 10;
    }

    // Factor 5: Cash business
    if (situation.businessInfo && !situation.income.wages) {
      factors.push({
        factor: 'Cash-Based Business',
        riskLevel: 'medium',
        description: 'Businesses with cash transactions face more scrutiny',
        mitigation: 'Maintain detailed records of all transactions. Use separate business bank account.',
      });
      totalRiskScore += 15;
    }

    // Factor 6: Rental losses
    if (situation.income.rentalIncome && situation.income.rentalIncome < 0) {
      factors.push({
        factor: 'Rental Property Losses',
        riskLevel: 'medium',
        description: 'Rental losses may be subject to passive activity loss limits',
        mitigation: 'Ensure you meet material participation requirements or income limits for $25,000 allowance',
      });
      totalRiskScore += 10;
    }

    // Factor 7: Round numbers
    // This would typically be checked against actual return data

    // Determine overall risk
    let overallRisk: 'low' | 'medium' | 'high';
    if (totalRiskScore >= 50) {
      overallRisk = 'high';
    } else if (totalRiskScore >= 25) {
      overallRisk = 'medium';
    } else {
      overallRisk = 'low';
    }

    // Add positive factors
    if (factors.length === 0) {
      factors.push({
        factor: 'Standard Tax Situation',
        riskLevel: 'low',
        description: 'Your tax situation does not have common audit triggers',
      });
    }

    // Generate recommendations
    const recommendations = this.generateAuditRecommendations(factors, overallRisk);

    return {
      overallRisk,
      riskScore: Math.min(100, totalRiskScore),
      factors,
      recommendations,
      industryComparison: situation.businessInfo
        ? {
            category: situation.businessInfo.entityType || 'Self-Employed',
            averageAuditRate: 0.8,
          }
        : undefined,
    };
  }

  private generateAuditRecommendations(factors: AuditRiskFactor[], risk: 'low' | 'medium' | 'high'): string[] {
    const recommendations: string[] = [];

    recommendations.push('Keep all tax records for at least 3 years (7 years if you claim losses)');

    if (risk === 'high' || risk === 'medium') {
      recommendations.push('Consider having your return reviewed by a tax professional');
      recommendations.push('Maintain organized documentation for all deductions');
    }

    const hasHighRiskFactor = factors.some((f) => f.riskLevel === 'high');
    if (hasHighRiskFactor) {
      recommendations.push('Consider purchasing audit defense protection');
      recommendations.push('Document the business purpose for all expenses');
    }

    if (factors.some((f) => f.factor.includes('Charitable'))) {
      recommendations.push('Get written acknowledgment for all charitable donations over $250');
    }

    if (factors.some((f) => f.factor.includes('Home Office'))) {
      recommendations.push('Take photos of your home office setup and keep measurements on file');
    }

    return recommendations;
  }

  // ============================================================================
  // TAX PLANNING ADVICE
  // ============================================================================

  /**
   * Generate year-round tax planning advice
   */
  async getTaxPlanningAdvice(situation: TaxSituation): Promise<TaxPlanningAdvice[]> {
    logger.info('Generating tax planning advice', { taxYear: situation.taxYear });

    const currentMonth = new Date().getMonth(); // 0-11
    const advice: TaxPlanningAdvice[] = [];

    // Retirement contributions
    if (situation.income.wages || situation.income.selfEmploymentIncome) {
      if (!situation.has401k || !situation.hasIRA) {
        advice.push({
          id: 'retirement-contribution',
          category: 'Retirement',
          timeframe: 'this_year',
          title: 'Maximize Retirement Contributions',
          description: 'Contributing to retirement accounts reduces your taxable income and builds wealth tax-deferred.',
          impact: `Potential tax savings of $${Math.round(7000 * 0.22)} to $${Math.round(7000 * 0.37)} from IRA contribution`,
          steps: [
            'Open a Traditional IRA if you don\'t have one',
            'Contribute up to $7,000 ($8,000 if 50+) by April 15',
            'Consider Roth IRA if expecting higher future tax rates',
            'If self-employed, consider SEP-IRA (up to $69,000)',
          ],
        });
      }
    }

    // HSA contributions
    if (!situation.hasHSA && (situation.age || 0) < 65) {
      advice.push({
        id: 'hsa-contribution',
        category: 'Healthcare',
        timeframe: 'this_year',
        title: 'Consider Health Savings Account (HSA)',
        description: 'HSAs offer triple tax advantages: tax-deductible contributions, tax-free growth, and tax-free withdrawals for medical expenses.',
        impact: `Potential tax savings of $${Math.round(4150 * 0.24)} to $${Math.round(8300 * 0.24)} annually`,
        steps: [
          'Enroll in a High Deductible Health Plan (HDHP)',
          'Open an HSA with a provider of your choice',
          'Contribute up to $4,150 individual / $8,300 family',
          'Invest HSA funds for long-term growth',
        ],
      });
    }

    // Tax-loss harvesting (if capital gains)
    if (situation.income.capitalGains && situation.income.capitalGains > 3000) {
      advice.push({
        id: 'tax-loss-harvest',
        category: 'Investments',
        timeframe: currentMonth >= 9 ? 'immediate' : 'this_quarter',
        title: 'Review Tax-Loss Harvesting Opportunities',
        description: 'Selling investments at a loss can offset capital gains and reduce your tax liability.',
        impact: `Could offset $${situation.income.capitalGains.toLocaleString()} in capital gains`,
        steps: [
          'Review portfolio for positions with unrealized losses',
          'Sell losing positions before year-end',
          'Wait 31 days before repurchasing (wash sale rule)',
          'Consider similar but not identical replacement investments',
        ],
      });
    }

    // Quarterly estimated taxes for self-employed
    if (situation.income.selfEmploymentIncome && situation.income.selfEmploymentIncome > 10000) {
      const nextQuarter = this.getNextQuarterlyDeadline();
      advice.push({
        id: 'quarterly-estimates',
        category: 'Compliance',
        timeframe: 'this_quarter',
        title: 'Pay Quarterly Estimated Taxes',
        description: 'Self-employed individuals must pay estimated taxes quarterly to avoid penalties.',
        impact: 'Avoid underpayment penalties of up to 8% annually',
        steps: [
          `Next payment due: ${nextQuarter.date}`,
          'Calculate estimated tax using Form 1040-ES',
          'Pay via IRS Direct Pay or EFTPS',
          'Consider safe harbor (100% of prior year tax)',
        ],
      });
    }

    // Charitable giving strategy
    if ((situation.deductions?.charitableContributions || 0) > 0) {
      advice.push({
        id: 'charitable-strategy',
        category: 'Charitable',
        timeframe: 'this_year',
        title: 'Optimize Charitable Giving Strategy',
        description: 'Bunching charitable donations or using a donor-advised fund can maximize tax benefits.',
        impact: 'Could increase deduction value by timing contributions strategically',
        steps: [
          'Consider "bunching" donations in alternating years',
          'Open a donor-advised fund for flexibility',
          'Donate appreciated securities to avoid capital gains',
          'Get proper documentation for all donations',
        ],
      });
    }

    // Business entity structure
    if (situation.businessInfo && situation.income.selfEmploymentIncome && situation.income.selfEmploymentIncome > 50000) {
      advice.push({
        id: 'entity-structure',
        category: 'Business',
        timeframe: 'next_year',
        title: 'Evaluate Business Entity Structure',
        description: 'The right business entity can significantly reduce self-employment taxes.',
        impact: `Potential SE tax savings of $${Math.round((situation.income.selfEmploymentIncome - 50000) * 0.0765)} with S-Corp election`,
        steps: [
          'Compare sole proprietorship vs LLC vs S-Corp',
          'Calculate reasonable salary vs distributions',
          'Consider state tax implications',
          'Consult with a tax professional before making changes',
        ],
      });
    }

    // Year-end planning
    if (currentMonth >= 9) {
      advice.push({
        id: 'year-end-planning',
        category: 'Planning',
        timeframe: 'immediate',
        title: 'Year-End Tax Planning Review',
        description: 'Review your tax situation before year-end to maximize savings opportunities.',
        impact: 'Last chance to make changes affecting this year\'s taxes',
        steps: [
          'Review year-to-date income and withholding',
          'Accelerate deductions or defer income if beneficial',
          'Make retirement contributions before deadlines',
          'Complete any planned charitable giving',
          'Review investment portfolio for tax-loss harvesting',
        ],
      });
    }

    return advice;
  }

  private getNextQuarterlyDeadline(): { quarter: number; date: string } {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();

    if (month < 3) return { quarter: 1, date: `April 15, ${year}` };
    if (month < 5) return { quarter: 2, date: `June 15, ${year}` };
    if (month < 8) return { quarter: 3, date: `September 15, ${year}` };
    return { quarter: 4, date: `January 15, ${year + 1}` };
  }

  // ============================================================================
  // NATURAL LANGUAGE Q&A
  // ============================================================================

  /**
   * Answer tax questions in natural language
   */
  async answerQuestion(question: TaxQuestion): Promise<TaxAnswer> {
    logger.info('Processing tax question', { hasContext: !!question.context });

    // Load or create conversation context
    let context: ConversationContext | null = null;
    if (question.conversationId) {
      context = await this.loadConversation(question.conversationId);
    }

    const systemPrompt = `You are an expert tax advisor AI assistant for LegalFlow. Your role is to:
1. Answer tax questions accurately and clearly
2. Cite relevant IRS publications, forms, and code sections when applicable
3. Provide practical, actionable advice
4. Acknowledge limitations and recommend professional help for complex situations
5. Always include appropriate disclaimers about not providing legal or tax advice

Current tax year information:
- Standard deduction 2024: $14,600 single, $29,200 MFJ
- Tax brackets range from 10% to 37%
- IRA contribution limit: $7,000 ($8,000 if 50+)
- 401(k) limit: $23,000 ($30,500 if 50+)

${question.context ? `User's tax situation:
- Filing Status: ${question.context.filingStatus}
- Income: $${Object.values(question.context.income).reduce((a, b) => a + (b || 0), 0)}
- State: ${question.context.state || 'Not specified'}` : ''}`;

    const messages: any[] = [
      { role: 'system', content: systemPrompt },
    ];

    // Add conversation history if exists
    if (context?.messages) {
      for (const msg of context.messages.slice(-10)) {
        messages.push({
          role: msg.role,
          content: msg.content,
        });
      }
    }

    messages.push({ role: 'user', content: question.question });

    const response = await this.openai.chat.completions.create({
      model: config.openai.model,
      messages,
      temperature: 0.5,
      max_tokens: 1000,
    });

    const answer = response.choices[0]?.message?.content || 'I apologize, but I was unable to generate a response.';

    // Save conversation
    if (question.conversationId) {
      await this.saveConversationMessage(question.conversationId, 'user', question.question);
      await this.saveConversationMessage(question.conversationId, 'assistant', answer);
    }

    // Generate follow-up questions
    const followUpQuestions = this.generateFollowUpQuestions(question.question, answer);

    return {
      answer,
      confidence: this.assessAnswerConfidence(answer),
      sources: this.extractSources(answer),
      followUpQuestions,
      relatedTopics: this.getRelatedTopics(question.question),
      disclaimer: 'This information is for educational purposes only and does not constitute tax, legal, or financial advice. Please consult with a qualified tax professional for advice specific to your situation.',
    };
  }

  /**
   * Start a new conversation
   */
  async startConversation(userId: string, initialContext?: TaxSituation): Promise<string> {
    const conversationId = `conv-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const { error } = await supabase.from('ai_conversations').insert({
      id: conversationId,
      user_id: userId,
      tax_situation: initialContext,
      messages: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    if (error) {
      logger.error('Error creating conversation', { error });
      throw new Error('Failed to create conversation');
    }

    return conversationId;
  }

  private async loadConversation(conversationId: string): Promise<ConversationContext | null> {
    const { data, error } = await supabase
      .from('ai_conversations')
      .select('*')
      .eq('id', conversationId)
      .single();

    if (error || !data) return null;

    return {
      id: data.id,
      userId: data.user_id,
      taxSituation: data.tax_situation,
      messages: data.messages || [],
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    };
  }

  private async saveConversationMessage(
    conversationId: string,
    role: 'user' | 'assistant',
    content: string
  ): Promise<void> {
    const { data: existing } = await supabase
      .from('ai_conversations')
      .select('messages')
      .eq('id', conversationId)
      .single();

    const messages = existing?.messages || [];
    messages.push({
      role,
      content,
      timestamp: new Date().toISOString(),
    });

    await supabase
      .from('ai_conversations')
      .update({
        messages,
        updated_at: new Date().toISOString(),
      })
      .eq('id', conversationId);
  }

  private assessAnswerConfidence(answer: string): 'high' | 'medium' | 'low' {
    // Higher confidence if answer includes specific citations
    if (answer.includes('IRS Publication') || answer.includes('Form ') || answer.includes('Section')) {
      return 'high';
    }
    if (answer.includes('generally') || answer.includes('typically') || answer.includes('may')) {
      return 'medium';
    }
    return 'medium';
  }

  private extractSources(answer: string): string[] {
    const sources: string[] = [];
    const patterns = [
      /IRS Publication \d+/g,
      /Form \d+[-\w]*/g,
      /IRC Section \d+/g,
      /26 U\.S\.C\. § \d+/g,
    ];

    for (const pattern of patterns) {
      const matches = answer.match(pattern);
      if (matches) {
        sources.push(...matches);
      }
    }

    return [...new Set(sources)];
  }

  private generateFollowUpQuestions(question: string, answer: string): string[] {
    const followUps: string[] = [];
    const lowerQuestion = question.toLowerCase();

    if (lowerQuestion.includes('deduct')) {
      followUps.push('What documentation do I need to claim this deduction?');
      followUps.push('Are there income limits for this deduction?');
    }

    if (lowerQuestion.includes('credit')) {
      followUps.push('Is this credit refundable?');
      followUps.push('Can I claim this credit if I take the standard deduction?');
    }

    if (lowerQuestion.includes('self-employ') || lowerQuestion.includes('business')) {
      followUps.push('What business expenses can I deduct?');
      followUps.push('Do I need to pay quarterly estimated taxes?');
    }

    if (lowerQuestion.includes('ira') || lowerQuestion.includes('401k') || lowerQuestion.includes('retirement')) {
      followUps.push('What are the contribution limits for this year?');
      followUps.push('Should I choose Traditional or Roth?');
    }

    return followUps.slice(0, 3);
  }

  private getRelatedTopics(question: string): string[] {
    const topics: string[] = [];
    const lowerQuestion = question.toLowerCase();

    const topicMap: Record<string, string[]> = {
      deduct: ['Standard vs Itemized Deductions', 'Above-the-Line Deductions', 'Business Expenses'],
      credit: ['Child Tax Credit', 'Earned Income Credit', 'Education Credits'],
      'self-employ': ['Self-Employment Tax', 'Quarterly Estimates', 'Business Deductions'],
      retire: ['IRA Contributions', '401(k) Rules', 'Required Minimum Distributions'],
      invest: ['Capital Gains Tax', 'Dividend Taxation', 'Tax-Loss Harvesting'],
      home: ['Mortgage Interest Deduction', 'Property Tax Deduction', 'Home Office'],
    };

    for (const [keyword, relatedTopics] of Object.entries(topicMap)) {
      if (lowerQuestion.includes(keyword)) {
        topics.push(...relatedTopics);
      }
    }

    return [...new Set(topics)].slice(0, 5);
  }
}

// Export singleton instance
export const aiTaxAdvisor = new AITaxAdvisorService();
