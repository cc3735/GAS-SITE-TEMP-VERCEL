/**
 * Federal Tax Data Ingestion Service
 * 
 * Handles ingestion of IRS federal tax data including:
 * - Tax brackets
 * - Standard deductions
 * - Tax credits
 * - Form definitions
 */

import { supabaseAdmin } from '../../utils/supabase.js';
import { logger } from '../../utils/logger.js';
import type { IngestionResult, TaxBracket, TaxDeduction, TaxCredit } from './types.js';

export class FederalTaxDataIngestion {
  private taxYear: number;

  constructor(taxYear: number = 2024) {
    this.taxYear = taxYear;
  }

  async ingestAll(): Promise<IngestionResult> {
    const startTime = Date.now();
    let totalProcessed = 0;
    let totalCreated = 0;
    let totalUpdated = 0;
    let totalFailed = 0;
    const errors: { record: string; error: string }[] = [];

    try {
      // Ingest tax brackets
      const bracketsResult = await this.ingestTaxBrackets();
      totalProcessed += bracketsResult.recordsProcessed;
      totalCreated += bracketsResult.recordsCreated;
      totalUpdated += bracketsResult.recordsUpdated;
      totalFailed += bracketsResult.recordsFailed;

      // Ingest standard deductions
      const deductionsResult = await this.ingestStandardDeductions();
      totalProcessed += deductionsResult.recordsProcessed;
      totalCreated += deductionsResult.recordsCreated;
      totalUpdated += deductionsResult.recordsUpdated;
      totalFailed += deductionsResult.recordsFailed;

      // Ingest tax credits
      const creditsResult = await this.ingestTaxCredits();
      totalProcessed += creditsResult.recordsProcessed;
      totalCreated += creditsResult.recordsCreated;
      totalUpdated += creditsResult.recordsUpdated;
      totalFailed += creditsResult.recordsFailed;

      logger.info(`Federal tax data ingestion completed for ${this.taxYear}`);

      return {
        success: true,
        recordsProcessed: totalProcessed,
        recordsCreated: totalCreated,
        recordsUpdated: totalUpdated,
        recordsFailed: totalFailed,
        errors,
        duration: Date.now() - startTime,
      };
    } catch (error) {
      logger.error('Federal tax data ingestion failed', { error });
      return {
        success: false,
        recordsProcessed: totalProcessed,
        recordsCreated: totalCreated,
        recordsUpdated: totalUpdated,
        recordsFailed: totalFailed + 1,
        errors: [...errors, { record: 'overall', error: String(error) }],
        duration: Date.now() - startTime,
      };
    }
  }

  async ingestTaxBrackets(): Promise<IngestionResult> {
    const startTime = Date.now();
    
    // 2024 Federal Tax Brackets (IRS Revenue Procedure 2023-34)
    const brackets: TaxBracket[] = [
      // Single
      { taxYear: this.taxYear, jurisdiction: 'US', filingStatus: 'single', bracketMin: 0, bracketMax: 11600, rate: 0.10, sourceUrl: 'https://www.irs.gov/newsroom/irs-provides-tax-inflation-adjustments-for-tax-year-2024' },
      { taxYear: this.taxYear, jurisdiction: 'US', filingStatus: 'single', bracketMin: 11600, bracketMax: 47150, rate: 0.12, sourceUrl: 'https://www.irs.gov/newsroom/irs-provides-tax-inflation-adjustments-for-tax-year-2024' },
      { taxYear: this.taxYear, jurisdiction: 'US', filingStatus: 'single', bracketMin: 47150, bracketMax: 100525, rate: 0.22, sourceUrl: 'https://www.irs.gov/newsroom/irs-provides-tax-inflation-adjustments-for-tax-year-2024' },
      { taxYear: this.taxYear, jurisdiction: 'US', filingStatus: 'single', bracketMin: 100525, bracketMax: 191950, rate: 0.24, sourceUrl: 'https://www.irs.gov/newsroom/irs-provides-tax-inflation-adjustments-for-tax-year-2024' },
      { taxYear: this.taxYear, jurisdiction: 'US', filingStatus: 'single', bracketMin: 191950, bracketMax: 243725, rate: 0.32, sourceUrl: 'https://www.irs.gov/newsroom/irs-provides-tax-inflation-adjustments-for-tax-year-2024' },
      { taxYear: this.taxYear, jurisdiction: 'US', filingStatus: 'single', bracketMin: 243725, bracketMax: 609350, rate: 0.35, sourceUrl: 'https://www.irs.gov/newsroom/irs-provides-tax-inflation-adjustments-for-tax-year-2024' },
      { taxYear: this.taxYear, jurisdiction: 'US', filingStatus: 'single', bracketMin: 609350, bracketMax: null, rate: 0.37, sourceUrl: 'https://www.irs.gov/newsroom/irs-provides-tax-inflation-adjustments-for-tax-year-2024' },
      
      // Married Filing Jointly
      { taxYear: this.taxYear, jurisdiction: 'US', filingStatus: 'married_joint', bracketMin: 0, bracketMax: 23200, rate: 0.10, sourceUrl: 'https://www.irs.gov/newsroom/irs-provides-tax-inflation-adjustments-for-tax-year-2024' },
      { taxYear: this.taxYear, jurisdiction: 'US', filingStatus: 'married_joint', bracketMin: 23200, bracketMax: 94300, rate: 0.12, sourceUrl: 'https://www.irs.gov/newsroom/irs-provides-tax-inflation-adjustments-for-tax-year-2024' },
      { taxYear: this.taxYear, jurisdiction: 'US', filingStatus: 'married_joint', bracketMin: 94300, bracketMax: 201050, rate: 0.22, sourceUrl: 'https://www.irs.gov/newsroom/irs-provides-tax-inflation-adjustments-for-tax-year-2024' },
      { taxYear: this.taxYear, jurisdiction: 'US', filingStatus: 'married_joint', bracketMin: 201050, bracketMax: 383900, rate: 0.24, sourceUrl: 'https://www.irs.gov/newsroom/irs-provides-tax-inflation-adjustments-for-tax-year-2024' },
      { taxYear: this.taxYear, jurisdiction: 'US', filingStatus: 'married_joint', bracketMin: 383900, bracketMax: 487450, rate: 0.32, sourceUrl: 'https://www.irs.gov/newsroom/irs-provides-tax-inflation-adjustments-for-tax-year-2024' },
      { taxYear: this.taxYear, jurisdiction: 'US', filingStatus: 'married_joint', bracketMin: 487450, bracketMax: 731200, rate: 0.35, sourceUrl: 'https://www.irs.gov/newsroom/irs-provides-tax-inflation-adjustments-for-tax-year-2024' },
      { taxYear: this.taxYear, jurisdiction: 'US', filingStatus: 'married_joint', bracketMin: 731200, bracketMax: null, rate: 0.37, sourceUrl: 'https://www.irs.gov/newsroom/irs-provides-tax-inflation-adjustments-for-tax-year-2024' },
      
      // Married Filing Separately
      { taxYear: this.taxYear, jurisdiction: 'US', filingStatus: 'married_separate', bracketMin: 0, bracketMax: 11600, rate: 0.10, sourceUrl: 'https://www.irs.gov/newsroom/irs-provides-tax-inflation-adjustments-for-tax-year-2024' },
      { taxYear: this.taxYear, jurisdiction: 'US', filingStatus: 'married_separate', bracketMin: 11600, bracketMax: 47150, rate: 0.12, sourceUrl: 'https://www.irs.gov/newsroom/irs-provides-tax-inflation-adjustments-for-tax-year-2024' },
      { taxYear: this.taxYear, jurisdiction: 'US', filingStatus: 'married_separate', bracketMin: 47150, bracketMax: 100525, rate: 0.22, sourceUrl: 'https://www.irs.gov/newsroom/irs-provides-tax-inflation-adjustments-for-tax-year-2024' },
      { taxYear: this.taxYear, jurisdiction: 'US', filingStatus: 'married_separate', bracketMin: 100525, bracketMax: 191950, rate: 0.24, sourceUrl: 'https://www.irs.gov/newsroom/irs-provides-tax-inflation-adjustments-for-tax-year-2024' },
      { taxYear: this.taxYear, jurisdiction: 'US', filingStatus: 'married_separate', bracketMin: 191950, bracketMax: 243725, rate: 0.32, sourceUrl: 'https://www.irs.gov/newsroom/irs-provides-tax-inflation-adjustments-for-tax-year-2024' },
      { taxYear: this.taxYear, jurisdiction: 'US', filingStatus: 'married_separate', bracketMin: 243725, bracketMax: 365600, rate: 0.35, sourceUrl: 'https://www.irs.gov/newsroom/irs-provides-tax-inflation-adjustments-for-tax-year-2024' },
      { taxYear: this.taxYear, jurisdiction: 'US', filingStatus: 'married_separate', bracketMin: 365600, bracketMax: null, rate: 0.37, sourceUrl: 'https://www.irs.gov/newsroom/irs-provides-tax-inflation-adjustments-for-tax-year-2024' },
      
      // Head of Household
      { taxYear: this.taxYear, jurisdiction: 'US', filingStatus: 'head_of_household', bracketMin: 0, bracketMax: 16550, rate: 0.10, sourceUrl: 'https://www.irs.gov/newsroom/irs-provides-tax-inflation-adjustments-for-tax-year-2024' },
      { taxYear: this.taxYear, jurisdiction: 'US', filingStatus: 'head_of_household', bracketMin: 16550, bracketMax: 63100, rate: 0.12, sourceUrl: 'https://www.irs.gov/newsroom/irs-provides-tax-inflation-adjustments-for-tax-year-2024' },
      { taxYear: this.taxYear, jurisdiction: 'US', filingStatus: 'head_of_household', bracketMin: 63100, bracketMax: 100500, rate: 0.22, sourceUrl: 'https://www.irs.gov/newsroom/irs-provides-tax-inflation-adjustments-for-tax-year-2024' },
      { taxYear: this.taxYear, jurisdiction: 'US', filingStatus: 'head_of_household', bracketMin: 100500, bracketMax: 191950, rate: 0.24, sourceUrl: 'https://www.irs.gov/newsroom/irs-provides-tax-inflation-adjustments-for-tax-year-2024' },
      { taxYear: this.taxYear, jurisdiction: 'US', filingStatus: 'head_of_household', bracketMin: 191950, bracketMax: 243700, rate: 0.32, sourceUrl: 'https://www.irs.gov/newsroom/irs-provides-tax-inflation-adjustments-for-tax-year-2024' },
      { taxYear: this.taxYear, jurisdiction: 'US', filingStatus: 'head_of_household', bracketMin: 243700, bracketMax: 609350, rate: 0.35, sourceUrl: 'https://www.irs.gov/newsroom/irs-provides-tax-inflation-adjustments-for-tax-year-2024' },
      { taxYear: this.taxYear, jurisdiction: 'US', filingStatus: 'head_of_household', bracketMin: 609350, bracketMax: null, rate: 0.37, sourceUrl: 'https://www.irs.gov/newsroom/irs-provides-tax-inflation-adjustments-for-tax-year-2024' },
      
      // Qualifying Surviving Spouse
      { taxYear: this.taxYear, jurisdiction: 'US', filingStatus: 'qualifying_widow', bracketMin: 0, bracketMax: 23200, rate: 0.10, sourceUrl: 'https://www.irs.gov/newsroom/irs-provides-tax-inflation-adjustments-for-tax-year-2024' },
      { taxYear: this.taxYear, jurisdiction: 'US', filingStatus: 'qualifying_widow', bracketMin: 23200, bracketMax: 94300, rate: 0.12, sourceUrl: 'https://www.irs.gov/newsroom/irs-provides-tax-inflation-adjustments-for-tax-year-2024' },
      { taxYear: this.taxYear, jurisdiction: 'US', filingStatus: 'qualifying_widow', bracketMin: 94300, bracketMax: 201050, rate: 0.22, sourceUrl: 'https://www.irs.gov/newsroom/irs-provides-tax-inflation-adjustments-for-tax-year-2024' },
      { taxYear: this.taxYear, jurisdiction: 'US', filingStatus: 'qualifying_widow', bracketMin: 201050, bracketMax: 383900, rate: 0.24, sourceUrl: 'https://www.irs.gov/newsroom/irs-provides-tax-inflation-adjustments-for-tax-year-2024' },
      { taxYear: this.taxYear, jurisdiction: 'US', filingStatus: 'qualifying_widow', bracketMin: 383900, bracketMax: 487450, rate: 0.32, sourceUrl: 'https://www.irs.gov/newsroom/irs-provides-tax-inflation-adjustments-for-tax-year-2024' },
      { taxYear: this.taxYear, jurisdiction: 'US', filingStatus: 'qualifying_widow', bracketMin: 487450, bracketMax: 731200, rate: 0.35, sourceUrl: 'https://www.irs.gov/newsroom/irs-provides-tax-inflation-adjustments-for-tax-year-2024' },
      { taxYear: this.taxYear, jurisdiction: 'US', filingStatus: 'qualifying_widow', bracketMin: 731200, bracketMax: null, rate: 0.37, sourceUrl: 'https://www.irs.gov/newsroom/irs-provides-tax-inflation-adjustments-for-tax-year-2024' },
    ];

    let created = 0;
    let updated = 0;
    let failed = 0;

    for (const bracket of brackets) {
      try {
        const { error } = await supabaseAdmin
          .from('lf_tax_brackets')
          .upsert({
            tax_year: bracket.taxYear,
            jurisdiction: bracket.jurisdiction,
            filing_status: bracket.filingStatus,
            bracket_min: bracket.bracketMin,
            bracket_max: bracket.bracketMax,
            rate: bracket.rate,
            flat_amount: bracket.flatAmount,
            source_url: bracket.sourceUrl,
            effective_date: `${bracket.taxYear}-01-01`,
          }, {
            onConflict: 'tax_year,jurisdiction,filing_status,bracket_min',
          });

        if (error) throw error;
        created++;
      } catch (error) {
        logger.error('Failed to upsert tax bracket', { bracket, error });
        failed++;
      }
    }

    return {
      success: failed === 0,
      recordsProcessed: brackets.length,
      recordsCreated: created,
      recordsUpdated: updated,
      recordsFailed: failed,
      errors: [],
      duration: Date.now() - startTime,
    };
  }

  async ingestStandardDeductions(): Promise<IngestionResult> {
    const startTime = Date.now();
    
    // 2024 Standard Deductions
    const deductions: TaxDeduction[] = [
      { taxYear: this.taxYear, jurisdiction: 'US', deductionType: 'standard', deductionName: 'Standard Deduction', filingStatus: 'single', baseAmount: 14600, additionalAmount: 1950, sourceUrl: 'https://www.irs.gov/newsroom/irs-provides-tax-inflation-adjustments-for-tax-year-2024' },
      { taxYear: this.taxYear, jurisdiction: 'US', deductionType: 'standard', deductionName: 'Standard Deduction', filingStatus: 'married_joint', baseAmount: 29200, additionalAmount: 1550, sourceUrl: 'https://www.irs.gov/newsroom/irs-provides-tax-inflation-adjustments-for-tax-year-2024' },
      { taxYear: this.taxYear, jurisdiction: 'US', deductionType: 'standard', deductionName: 'Standard Deduction', filingStatus: 'married_separate', baseAmount: 14600, additionalAmount: 1550, sourceUrl: 'https://www.irs.gov/newsroom/irs-provides-tax-inflation-adjustments-for-tax-year-2024' },
      { taxYear: this.taxYear, jurisdiction: 'US', deductionType: 'standard', deductionName: 'Standard Deduction', filingStatus: 'head_of_household', baseAmount: 21900, additionalAmount: 1950, sourceUrl: 'https://www.irs.gov/newsroom/irs-provides-tax-inflation-adjustments-for-tax-year-2024' },
      { taxYear: this.taxYear, jurisdiction: 'US', deductionType: 'standard', deductionName: 'Standard Deduction', filingStatus: 'qualifying_widow', baseAmount: 29200, additionalAmount: 1550, sourceUrl: 'https://www.irs.gov/newsroom/irs-provides-tax-inflation-adjustments-for-tax-year-2024' },
    ];

    let created = 0;
    let failed = 0;

    for (const deduction of deductions) {
      try {
        const { error } = await supabaseAdmin
          .from('lf_tax_deductions')
          .upsert({
            tax_year: deduction.taxYear,
            jurisdiction: deduction.jurisdiction,
            deduction_type: deduction.deductionType,
            deduction_name: deduction.deductionName,
            filing_status: deduction.filingStatus,
            base_amount: deduction.baseAmount,
            additional_amount: deduction.additionalAmount,
            phase_out_start: deduction.phaseOutStart,
            phase_out_end: deduction.phaseOutEnd,
            phase_out_rate: deduction.phaseOutRate,
            max_amount: deduction.maxAmount,
            eligibility_rules: deduction.eligibilityRules,
            source_url: deduction.sourceUrl,
          }, {
            onConflict: 'tax_year,jurisdiction,deduction_type,deduction_name,filing_status',
          });

        if (error) throw error;
        created++;
      } catch (error) {
        logger.error('Failed to upsert deduction', { deduction, error });
        failed++;
      }
    }

    return {
      success: failed === 0,
      recordsProcessed: deductions.length,
      recordsCreated: created,
      recordsUpdated: 0,
      recordsFailed: failed,
      errors: [],
      duration: Date.now() - startTime,
    };
  }

  async ingestTaxCredits(): Promise<IngestionResult> {
    const startTime = Date.now();
    
    // 2024 Major Tax Credits
    const credits: TaxCredit[] = [
      // Child Tax Credit
      {
        taxYear: this.taxYear,
        jurisdiction: 'US',
        creditName: 'Child Tax Credit',
        creditType: 'partially_refundable',
        maxAmount: 2000,
        amountPerQualifier: 2000,
        incomeLimitSingle: 200000,
        incomeLimitJoint: 400000,
        phaseOutStartSingle: 200000,
        phaseOutStartJoint: 400000,
        phaseOutRate: 0.05,
        eligibilityRules: {
          childAge: 'Under 17',
          relationship: 'Son, daughter, stepchild, foster child, sibling, step-sibling, or descendant',
          citizenshipRequired: true,
          ssnRequired: true,
        },
        sourceUrl: 'https://www.irs.gov/credits-deductions/individuals/child-tax-credit',
      },
      // Earned Income Tax Credit (EITC)
      {
        taxYear: this.taxYear,
        jurisdiction: 'US',
        creditName: 'Earned Income Tax Credit (EITC)',
        creditType: 'refundable',
        maxAmount: 7830, // Max with 3+ children
        incomeLimitSingle: 63398,
        incomeLimitJoint: 70496,
        eligibilityRules: {
          earnedIncomeRequired: true,
          investmentIncomeLimited: true,
          investmentIncomeLimit: 11600,
          maxAmounts: {
            noChildren: 632,
            oneChild: 4213,
            twoChildren: 6960,
            threeOrMore: 7830,
          },
        },
        sourceUrl: 'https://www.irs.gov/credits-deductions/individuals/earned-income-tax-credit-eitc',
      },
      // Child and Dependent Care Credit
      {
        taxYear: this.taxYear,
        jurisdiction: 'US',
        creditName: 'Child and Dependent Care Credit',
        creditType: 'nonrefundable',
        maxAmount: 2100, // 35% of $6,000 for 2 or more
        eligibilityRules: {
          maxExpenseOneQualifying: 3000,
          maxExpenseTwoOrMore: 6000,
          percentageRange: '20%-35%',
          agiPhaseDown: true,
        },
        sourceUrl: 'https://www.irs.gov/taxtopics/tc602',
      },
      // American Opportunity Tax Credit (AOTC)
      {
        taxYear: this.taxYear,
        jurisdiction: 'US',
        creditName: 'American Opportunity Tax Credit',
        creditType: 'partially_refundable',
        maxAmount: 2500,
        incomeLimitSingle: 90000,
        incomeLimitJoint: 180000,
        phaseOutStartSingle: 80000,
        phaseOutStartJoint: 160000,
        eligibilityRules: {
          enrollmentStatus: 'At least half-time',
          yearLimit: 4,
          felonyDrugConviction: false,
          refundableAmount: 1000,
        },
        sourceUrl: 'https://www.irs.gov/credits-deductions/individuals/aotc',
      },
      // Lifetime Learning Credit
      {
        taxYear: this.taxYear,
        jurisdiction: 'US',
        creditName: 'Lifetime Learning Credit',
        creditType: 'nonrefundable',
        maxAmount: 2000,
        incomeLimitSingle: 90000,
        incomeLimitJoint: 180000,
        phaseOutStartSingle: 80000,
        phaseOutStartJoint: 160000,
        calculationFormula: '20% of first $10,000 in qualified expenses',
        sourceUrl: 'https://www.irs.gov/credits-deductions/individuals/llc',
      },
      // Saver's Credit
      {
        taxYear: this.taxYear,
        jurisdiction: 'US',
        creditName: "Saver's Credit (Retirement Savings Contribution Credit)",
        creditType: 'nonrefundable',
        maxAmount: 2000,
        eligibilityRules: {
          ageLimitMin: 18,
          notFullTimeStudent: true,
          notClaimedAsDependent: true,
          contributionRequired: true,
          incomeLimits2024: {
            single: { rate50: 23000, rate20: 25000, rate10: 38250 },
            headOfHousehold: { rate50: 34500, rate20: 37500, rate10: 57375 },
            marriedJoint: { rate50: 46000, rate20: 50000, rate10: 76500 },
          },
        },
        sourceUrl: 'https://www.irs.gov/retirement-plans/plan-participant-employee/retirement-savings-contributions-savers-credit',
      },
      // Premium Tax Credit
      {
        taxYear: this.taxYear,
        jurisdiction: 'US',
        creditName: 'Premium Tax Credit',
        creditType: 'refundable',
        eligibilityRules: {
          marketplaceCoverageRequired: true,
          incomeRange: '100%-400% FPL',
          notEligibleForOtherCoverage: true,
        },
        sourceUrl: 'https://www.irs.gov/affordable-care-act/individuals-and-families/premium-tax-credit',
      },
      // Adoption Credit
      {
        taxYear: this.taxYear,
        jurisdiction: 'US',
        creditName: 'Adoption Credit',
        creditType: 'nonrefundable',
        maxAmount: 16810,
        phaseOutStartSingle: 252150,
        phaseOutStartJoint: 252150,
        eligibilityRules: {
          qualifiedExpensesIncluded: ['adoption fees', 'court costs', 'attorney fees', 'traveling expenses'],
          carryForward: '5 years',
        },
        sourceUrl: 'https://www.irs.gov/taxtopics/tc607',
      },
      // Residential Clean Energy Credit
      {
        taxYear: this.taxYear,
        jurisdiction: 'US',
        creditName: 'Residential Clean Energy Credit',
        creditType: 'nonrefundable',
        eligibilityRules: {
          creditRate: 0.30,
          qualifyingEquipment: ['solar electric', 'solar water heating', 'wind energy', 'geothermal heat pump', 'fuel cells', 'battery storage'],
          carryForward: true,
        },
        sourceUrl: 'https://www.irs.gov/credits-deductions/residential-clean-energy-credit',
      },
      // Electric Vehicle Credit (New)
      {
        taxYear: this.taxYear,
        jurisdiction: 'US',
        creditName: 'Clean Vehicle Credit (New)',
        creditType: 'nonrefundable',
        maxAmount: 7500,
        incomeLimitSingle: 150000,
        incomeLimitJoint: 300000,
        incomeLimitHoh: 225000,
        eligibilityRules: {
          msrpLimitCar: 55000,
          msrpLimitSuvTruckVan: 80000,
          finalAssemblyNorthAmerica: true,
          batteryRequirements: true,
        },
        sourceUrl: 'https://www.irs.gov/credits-deductions/credits-for-new-clean-vehicles-purchased-in-2023-or-after',
      },
    ];

    let created = 0;
    let failed = 0;

    for (const credit of credits) {
      try {
        const { error } = await supabaseAdmin
          .from('lf_tax_credits')
          .upsert({
            tax_year: credit.taxYear,
            jurisdiction: credit.jurisdiction,
            credit_name: credit.creditName,
            credit_type: credit.creditType,
            max_amount: credit.maxAmount,
            amount_per_qualifier: credit.amountPerQualifier,
            income_limit_single: credit.incomeLimitSingle,
            income_limit_joint: credit.incomeLimitJoint,
            income_limit_hoh: credit.incomeLimitHoh,
            phase_out_start_single: credit.phaseOutStartSingle,
            phase_out_start_joint: credit.phaseOutStartJoint,
            phase_out_rate: credit.phaseOutRate,
            eligibility_rules: credit.eligibilityRules,
            calculation_formula: credit.calculationFormula,
            source_url: credit.sourceUrl,
          }, {
            onConflict: 'tax_year,jurisdiction,credit_name',
          });

        if (error) throw error;
        created++;
      } catch (error) {
        logger.error('Failed to upsert credit', { credit, error });
        failed++;
      }
    }

    return {
      success: failed === 0,
      recordsProcessed: credits.length,
      recordsCreated: created,
      recordsUpdated: 0,
      recordsFailed: failed,
      errors: [],
      duration: Date.now() - startTime,
    };
  }
}

