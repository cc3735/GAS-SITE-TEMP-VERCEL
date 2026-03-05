/**
 * Prior Year Data Import Service
 *
 * Handles importing tax data from previous years:
 * - Copy prior year return data
 * - Compare year-over-year changes
 * - Carry forward eligible items
 * - Import from other tax software (TurboTax, H&R Block)
 *
 * @version 1.0.0
 * @created 2026-01-12
 */

import { supabase } from '../../lib/supabase.js';
import { logger } from '../../utils/logger.js';

// ============================================================================
// Types and Interfaces
// ============================================================================

/**
 * Prior year import source
 */
export type ImportSource =
  | 'legalflow'
  | 'turbotax'
  | 'hrblock'
  | 'taxact'
  | 'freetaxusa'
  | 'manual';

/**
 * Carryforward item types
 */
export type CarryforwardType =
  | 'capital_loss'
  | 'nol'
  | 'charitable_contribution'
  | 'depreciation'
  | 'passive_loss'
  | 'foreign_tax_credit'
  | 'general_business_credit'
  | 'amt_credit';

/**
 * Prior year return data
 */
export interface PriorYearData {
  taxYear: number;
  filingStatus: string;
  taxpayerInfo: {
    firstName: string;
    lastName: string;
    ssn?: string;
    dateOfBirth?: string;
    occupation?: string;
  };
  spouseInfo?: {
    firstName: string;
    lastName: string;
    ssn?: string;
    dateOfBirth?: string;
    occupation?: string;
  };
  address?: {
    street1: string;
    street2?: string;
    city: string;
    state: string;
    zipCode: string;
  };
  income: {
    wages: number;
    interest: number;
    dividends: number;
    businessIncome: number;
    capitalGains: number;
    rentalIncome: number;
    otherIncome: number;
    totalIncome: number;
  };
  adjustments: {
    hsaDeduction: number;
    iraDeduction: number;
    studentLoanInterest: number;
    selfEmploymentTax: number;
    otherAdjustments: number;
    totalAdjustments: number;
  };
  deductions: {
    type: 'standard' | 'itemized';
    amount: number;
    itemizedDetails?: {
      medical: number;
      stateLocalTaxes: number;
      mortgageInterest: number;
      charitable: number;
      other: number;
    };
  };
  credits: {
    childTaxCredit: number;
    childCareCredit: number;
    educationCredits: number;
    earnedIncomeCredit: number;
    otherCredits: number;
    totalCredits: number;
  };
  payments: {
    federalWithholding: number;
    estimatedPayments: number;
    otherPayments: number;
    totalPayments: number;
  };
  summary: {
    agi: number;
    taxableIncome: number;
    totalTax: number;
    refundOrOwed: number;
    isRefund: boolean;
  };
  carryforwards?: CarryforwardItem[];
}

/**
 * Carryforward item
 */
export interface CarryforwardItem {
  type: CarryforwardType;
  originalYear: number;
  originalAmount: number;
  usedAmount: number;
  remainingAmount: number;
  expirationYear?: number;
  description?: string;
}

/**
 * Year-over-year comparison
 */
export interface YearComparison {
  priorYear: number;
  currentYear: number;
  changes: ComparisonItem[];
  summary: {
    incomeChange: number;
    incomeChangePercent: number;
    taxChange: number;
    taxChangePercent: number;
    refundChange: number;
    recommendations: string[];
  };
}

/**
 * Comparison item
 */
export interface ComparisonItem {
  category: string;
  field: string;
  priorValue: number;
  currentValue: number;
  change: number;
  changePercent: number;
  significance: 'high' | 'medium' | 'low';
}

/**
 * Import result
 */
export interface ImportResult {
  success: boolean;
  source: ImportSource;
  taxYear: number;
  importedFields: string[];
  skippedFields: string[];
  warnings: string[];
  errors: string[];
  data?: PriorYearData;
}

/**
 * External tax file format
 */
export interface ExternalTaxFile {
  format: 'tax' | 'pdf' | 'xml' | 'json';
  source: ImportSource;
  content: string; // Base64 encoded
  filename: string;
}

// ============================================================================
// Prior Year Import Service
// ============================================================================

/**
 * Prior Year Import Service
 */
export class PriorYearImportService {
  // ==========================================================================
  // Internal Import (from LegalFlow)
  // ==========================================================================

  /**
   * Get prior year returns for a user
   */
  async getPriorYearReturns(userId: string): Promise<{
    returns: { id: string; taxYear: number; status: string; refundAmount?: number }[];
  }> {
    const { data, error } = await supabase
      .from('tax_returns')
      .select('id, tax_year, status, refund_amount')
      .eq('user_id', userId)
      .order('tax_year', { ascending: false });

    if (error) {
      logger.error('Failed to get prior year returns:', error);
      return { returns: [] };
    }

    return {
      returns: data.map(r => ({
        id: r.id,
        taxYear: r.tax_year,
        status: r.status,
        refundAmount: r.refund_amount,
      })),
    };
  }

  /**
   * Copy data from a prior year return
   */
  async copyFromPriorYear(
    userId: string,
    priorReturnId: string,
    newTaxYear: number
  ): Promise<ImportResult> {
    try {
      // Get the prior year return
      const { data: priorReturn, error: fetchError } = await supabase
        .from('tax_returns')
        .select('*')
        .eq('id', priorReturnId)
        .eq('user_id', userId)
        .single();

      if (fetchError || !priorReturn) {
        return {
          success: false,
          source: 'legalflow',
          taxYear: newTaxYear,
          importedFields: [],
          skippedFields: [],
          warnings: [],
          errors: ['Prior year return not found'],
        };
      }

      // Determine which fields to copy
      const importedFields: string[] = [];
      const skippedFields: string[] = [];
      const warnings: string[] = [];

      // Prepare new return data
      const newReturnData: Record<string, unknown> = {
        user_id: userId,
        tax_year: newTaxYear,
        status: 'draft',
        filing_status: priorReturn.filing_status,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Copy personal information (always copy)
      if (priorReturn.filing_status) {
        importedFields.push('filingStatus');
      }

      // Copy spouse info if married
      if (priorReturn.spouse_info) {
        newReturnData.spouse_info = priorReturn.spouse_info;
        importedFields.push('spouseInfo');
      }

      // Copy dependents (need to verify they still qualify)
      // Note: We'll copy but flag for review
      const { data: dependents } = await supabase
        .from('tax_dependents')
        .select('*')
        .eq('tax_return_id', priorReturnId);

      if (dependents && dependents.length > 0) {
        warnings.push(`${dependents.length} dependent(s) copied. Please verify they still qualify.`);
        importedFields.push('dependents');
      }

      // Copy recurring income sources (W-2 employers, etc.)
      const { data: w2Forms } = await supabase
        .from('tax_w2_forms')
        .select('*')
        .eq('tax_return_id', priorReturnId);

      if (w2Forms && w2Forms.length > 0) {
        importedFields.push('w2Employers');
        warnings.push(`${w2Forms.length} W-2 employer(s) copied. Update with new year amounts.`);
      }

      // Copy deduction preferences
      newReturnData.use_standard_deduction = priorReturn.use_standard_deduction;
      importedFields.push('deductionMethod');

      // Copy bank info for direct deposit
      if (priorReturn.bank_info) {
        newReturnData.bank_info = priorReturn.bank_info;
        importedFields.push('bankInfo');
      }

      // Amounts should NOT be copied - they change each year
      skippedFields.push(
        'incomeAmounts',
        'withholding',
        'estimatedPayments',
        'creditAmounts'
      );

      // Calculate carryforwards
      const carryforwards = await this.calculateCarryforwards(priorReturn);
      if (carryforwards.length > 0) {
        newReturnData.carryforwards = carryforwards;
        importedFields.push('carryforwards');
      }

      // Create the new return
      const { data: newReturn, error: createError } = await supabase
        .from('tax_returns')
        .insert(newReturnData)
        .select()
        .single();

      if (createError) {
        throw createError;
      }

      // Copy dependents to new return
      if (dependents && dependents.length > 0) {
        const newDependents = dependents.map(d => ({
          tax_return_id: newReturn.id,
          first_name: d.first_name,
          last_name: d.last_name,
          ssn: d.ssn,
          relationship: d.relationship,
          date_of_birth: d.date_of_birth,
          months_lived: d.months_lived,
          qualifies_ctc: d.qualifies_ctc,
          qualifies_eitc: d.qualifies_eitc,
          created_at: new Date().toISOString(),
        }));

        await supabase.from('tax_dependents').insert(newDependents);
      }

      // Copy W-2 employer info (without amounts)
      if (w2Forms && w2Forms.length > 0) {
        const newW2s = w2Forms.map(w => ({
          tax_return_id: newReturn.id,
          employer_ein: w.employer_ein,
          employer_name: w.employer_name,
          employer_address: w.employer_address,
          employer_city: w.employer_city,
          employer_state: w.employer_state,
          employer_zip: w.employer_zip,
          // Amounts set to 0 - user must enter new values
          wages: 0,
          federal_withheld: 0,
          ss_wages: 0,
          ss_withheld: 0,
          medicare_wages: 0,
          medicare_withheld: 0,
          created_at: new Date().toISOString(),
        }));

        await supabase.from('tax_w2_forms').insert(newW2s);
      }

      return {
        success: true,
        source: 'legalflow',
        taxYear: newTaxYear,
        importedFields,
        skippedFields,
        warnings,
        errors: [],
        data: this.convertReturnToPriorYearData(priorReturn),
      };
    } catch (error) {
      logger.error('Failed to copy from prior year:', error);
      return {
        success: false,
        source: 'legalflow',
        taxYear: newTaxYear,
        importedFields: [],
        skippedFields: [],
        warnings: [],
        errors: [error instanceof Error ? error.message : 'Import failed'],
      };
    }
  }

  // ==========================================================================
  // External Import
  // ==========================================================================

  /**
   * Import from external tax software
   */
  async importFromExternal(
    userId: string,
    file: ExternalTaxFile,
    targetTaxYear: number
  ): Promise<ImportResult> {
    try {
      let extractedData: PriorYearData | null = null;

      switch (file.source) {
        case 'turbotax':
          extractedData = await this.parseTurboTaxFile(file);
          break;
        case 'hrblock':
          extractedData = await this.parseHRBlockFile(file);
          break;
        case 'taxact':
          extractedData = await this.parseTaxActFile(file);
          break;
        default:
          return {
            success: false,
            source: file.source,
            taxYear: targetTaxYear,
            importedFields: [],
            skippedFields: [],
            warnings: [],
            errors: [`Unsupported import source: ${file.source}`],
          };
      }

      if (!extractedData) {
        return {
          success: false,
          source: file.source,
          taxYear: targetTaxYear,
          importedFields: [],
          skippedFields: [],
          warnings: [],
          errors: ['Failed to parse tax file'],
        };
      }

      // Create a new return with the extracted data
      return await this.createReturnFromExternal(userId, extractedData, targetTaxYear);
    } catch (error) {
      logger.error('External import failed:', error);
      return {
        success: false,
        source: file.source,
        taxYear: targetTaxYear,
        importedFields: [],
        skippedFields: [],
        warnings: [],
        errors: [error instanceof Error ? error.message : 'Import failed'],
      };
    }
  }

  /**
   * Parse TurboTax .tax file
   * Note: This is a simplified implementation. Real implementation would need
   * to reverse-engineer or use official APIs if available.
   */
  private async parseTurboTaxFile(file: ExternalTaxFile): Promise<PriorYearData | null> {
    try {
      // TurboTax .tax files are encrypted/proprietary format
      // This would require official integration or user-exported data
      logger.info('Parsing TurboTax file...');

      // For now, return null - would need official TurboTax API
      // Real implementation would parse the XML or use Intuit APIs
      return null;
    } catch (error) {
      logger.error('TurboTax parsing error:', error);
      return null;
    }
  }

  /**
   * Parse H&R Block file
   */
  private async parseHRBlockFile(file: ExternalTaxFile): Promise<PriorYearData | null> {
    try {
      // H&R Block files are also proprietary
      // Would need official integration
      logger.info('Parsing H&R Block file...');
      return null;
    } catch (error) {
      logger.error('H&R Block parsing error:', error);
      return null;
    }
  }

  /**
   * Parse TaxAct file
   */
  private async parseTaxActFile(file: ExternalTaxFile): Promise<PriorYearData | null> {
    try {
      logger.info('Parsing TaxAct file...');
      return null;
    } catch (error) {
      logger.error('TaxAct parsing error:', error);
      return null;
    }
  }

  /**
   * Import from user-provided JSON data
   */
  async importFromManualEntry(
    userId: string,
    data: Partial<PriorYearData>,
    targetTaxYear: number
  ): Promise<ImportResult> {
    const importedFields: string[] = [];
    const warnings: string[] = [];

    // Create new return
    const newReturnData: Record<string, unknown> = {
      user_id: userId,
      tax_year: targetTaxYear,
      status: 'draft',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Import filing status
    if (data.filingStatus) {
      newReturnData.filing_status = data.filingStatus;
      importedFields.push('filingStatus');
    }

    // Import prior year AGI (needed for e-filing identity verification)
    if (data.summary?.agi) {
      newReturnData.prior_year_agi = data.summary.agi;
      importedFields.push('priorYearAGI');
    }

    // Import carryforwards
    if (data.carryforwards && data.carryforwards.length > 0) {
      newReturnData.carryforwards = data.carryforwards;
      importedFields.push('carryforwards');
      warnings.push(`${data.carryforwards.length} carryforward item(s) imported. Please verify amounts.`);
    }

    try {
      const { data: newReturn, error } = await supabase
        .from('tax_returns')
        .insert(newReturnData)
        .select()
        .single();

      if (error) throw error;

      return {
        success: true,
        source: 'manual',
        taxYear: targetTaxYear,
        importedFields,
        skippedFields: [],
        warnings,
        errors: [],
        data: data as PriorYearData,
      };
    } catch (error) {
      return {
        success: false,
        source: 'manual',
        taxYear: targetTaxYear,
        importedFields: [],
        skippedFields: [],
        warnings: [],
        errors: [error instanceof Error ? error.message : 'Import failed'],
      };
    }
  }

  /**
   * Create return from external data
   */
  private async createReturnFromExternal(
    userId: string,
    data: PriorYearData,
    targetTaxYear: number
  ): Promise<ImportResult> {
    // Similar to copyFromPriorYear but from external data
    const importedFields: string[] = [];
    const warnings: string[] = [];

    try {
      const newReturnData: Record<string, unknown> = {
        user_id: userId,
        tax_year: targetTaxYear,
        status: 'draft',
        filing_status: data.filingStatus,
        prior_year_agi: data.summary.agi,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      importedFields.push('filingStatus', 'priorYearAGI');

      if (data.carryforwards) {
        newReturnData.carryforwards = data.carryforwards;
        importedFields.push('carryforwards');
      }

      const { error } = await supabase
        .from('tax_returns')
        .insert(newReturnData);

      if (error) throw error;

      return {
        success: true,
        source: 'turbotax', // Would be set based on actual source
        taxYear: targetTaxYear,
        importedFields,
        skippedFields: ['incomeAmounts', 'withholdingAmounts'],
        warnings,
        errors: [],
        data,
      };
    } catch (error) {
      return {
        success: false,
        source: 'manual',
        taxYear: targetTaxYear,
        importedFields: [],
        skippedFields: [],
        warnings: [],
        errors: [error instanceof Error ? error.message : 'Import failed'],
      };
    }
  }

  // ==========================================================================
  // Carryforward Calculations
  // ==========================================================================

  /**
   * Calculate carryforward items from a prior return
   */
  private async calculateCarryforwards(
    priorReturn: Record<string, unknown>
  ): Promise<CarryforwardItem[]> {
    const carryforwards: CarryforwardItem[] = [];
    const priorYear = priorReturn.tax_year as number;

    // Capital loss carryforward (up to $3,000 deducted per year, rest carries forward)
    const capitalLoss = (priorReturn.capital_loss_carryforward as number) || 0;
    if (capitalLoss > 0) {
      carryforwards.push({
        type: 'capital_loss',
        originalYear: priorYear,
        originalAmount: capitalLoss,
        usedAmount: 0,
        remainingAmount: capitalLoss,
        description: 'Net capital loss from prior year',
      });
    }

    // Net Operating Loss (NOL)
    const nol = (priorReturn.nol_carryforward as number) || 0;
    if (nol > 0) {
      carryforwards.push({
        type: 'nol',
        originalYear: priorYear,
        originalAmount: nol,
        usedAmount: 0,
        remainingAmount: nol,
        expirationYear: priorYear + 20, // NOLs from 2018+ can be carried forward indefinitely
        description: 'Net operating loss carryforward',
      });
    }

    // Charitable contribution carryforward (5 year limit)
    const charitableCarryforward = (priorReturn.charitable_carryforward as number) || 0;
    if (charitableCarryforward > 0) {
      carryforwards.push({
        type: 'charitable_contribution',
        originalYear: priorYear,
        originalAmount: charitableCarryforward,
        usedAmount: 0,
        remainingAmount: charitableCarryforward,
        expirationYear: priorYear + 5,
        description: 'Excess charitable contributions',
      });
    }

    // Passive activity loss carryforward
    const passiveLoss = (priorReturn.passive_loss_carryforward as number) || 0;
    if (passiveLoss > 0) {
      carryforwards.push({
        type: 'passive_loss',
        originalYear: priorYear,
        originalAmount: passiveLoss,
        usedAmount: 0,
        remainingAmount: passiveLoss,
        description: 'Suspended passive activity losses',
      });
    }

    // Foreign tax credit carryforward (10 year limit)
    const foreignTaxCredit = (priorReturn.foreign_tax_credit_carryforward as number) || 0;
    if (foreignTaxCredit > 0) {
      carryforwards.push({
        type: 'foreign_tax_credit',
        originalYear: priorYear,
        originalAmount: foreignTaxCredit,
        usedAmount: 0,
        remainingAmount: foreignTaxCredit,
        expirationYear: priorYear + 10,
        description: 'Unused foreign tax credit',
      });
    }

    return carryforwards;
  }

  // ==========================================================================
  // Year-Over-Year Comparison
  // ==========================================================================

  /**
   * Compare two tax years
   */
  async compareYears(
    userId: string,
    priorReturnId: string,
    currentReturnId: string
  ): Promise<YearComparison | null> {
    try {
      // Get both returns
      const { data: returns, error } = await supabase
        .from('tax_returns')
        .select('*')
        .eq('user_id', userId)
        .in('id', [priorReturnId, currentReturnId]);

      if (error || !returns || returns.length !== 2) {
        return null;
      }

      const priorReturn = returns.find(r => r.id === priorReturnId)!;
      const currentReturn = returns.find(r => r.id === currentReturnId)!;

      const changes: ComparisonItem[] = [];
      const recommendations: string[] = [];

      // Compare income
      this.addComparison(changes, 'Income', 'Wages',
        priorReturn.income_wages || 0,
        currentReturn.income_wages || 0
      );

      this.addComparison(changes, 'Income', 'Interest',
        priorReturn.income_interest || 0,
        currentReturn.income_interest || 0
      );

      this.addComparison(changes, 'Income', 'Dividends',
        priorReturn.income_dividends || 0,
        currentReturn.income_dividends || 0
      );

      this.addComparison(changes, 'Income', 'Business Income',
        priorReturn.income_business || 0,
        currentReturn.income_business || 0
      );

      // Compare total income
      const priorTotalIncome = (priorReturn.total_income || 0) as number;
      const currentTotalIncome = (currentReturn.total_income || 0) as number;

      this.addComparison(changes, 'Summary', 'Total Income',
        priorTotalIncome,
        currentTotalIncome
      );

      // Compare deductions
      this.addComparison(changes, 'Deductions', 'Total Deductions',
        priorReturn.total_deductions || 0,
        currentReturn.total_deductions || 0
      );

      // Compare credits
      this.addComparison(changes, 'Credits', 'Total Credits',
        priorReturn.total_credits || 0,
        currentReturn.total_credits || 0
      );

      // Compare tax
      const priorTax = (priorReturn.total_tax || 0) as number;
      const currentTax = (currentReturn.total_tax || 0) as number;

      this.addComparison(changes, 'Tax', 'Total Tax',
        priorTax,
        currentTax
      );

      // Compare refund/owed
      this.addComparison(changes, 'Result', 'Refund/Owed',
        priorReturn.refund_amount || 0,
        currentReturn.refund_amount || 0
      );

      // Generate recommendations
      const incomeChange = currentTotalIncome - priorTotalIncome;
      const taxChange = currentTax - priorTax;

      if (incomeChange > 10000 && taxChange > 5000) {
        recommendations.push(
          'Your income increased significantly. Consider increasing retirement contributions to reduce taxable income.'
        );
      }

      if (currentReturn.use_standard_deduction && currentTotalIncome > 100000) {
        recommendations.push(
          'With your income level, review whether itemizing deductions could provide more benefit.'
        );
      }

      return {
        priorYear: priorReturn.tax_year,
        currentYear: currentReturn.tax_year,
        changes,
        summary: {
          incomeChange,
          incomeChangePercent: priorTotalIncome > 0
            ? (incomeChange / priorTotalIncome) * 100
            : 0,
          taxChange,
          taxChangePercent: priorTax > 0
            ? (taxChange / priorTax) * 100
            : 0,
          refundChange: (currentReturn.refund_amount || 0) - (priorReturn.refund_amount || 0),
          recommendations,
        },
      };
    } catch (error) {
      logger.error('Year comparison failed:', error);
      return null;
    }
  }

  /**
   * Add a comparison item
   */
  private addComparison(
    changes: ComparisonItem[],
    category: string,
    field: string,
    priorValue: number,
    currentValue: number
  ): void {
    const change = currentValue - priorValue;
    const changePercent = priorValue !== 0 ? (change / priorValue) * 100 : 0;

    let significance: 'high' | 'medium' | 'low' = 'low';
    if (Math.abs(changePercent) > 25 || Math.abs(change) > 10000) {
      significance = 'high';
    } else if (Math.abs(changePercent) > 10 || Math.abs(change) > 2500) {
      significance = 'medium';
    }

    changes.push({
      category,
      field,
      priorValue,
      currentValue,
      change,
      changePercent,
      significance,
    });
  }

  // ==========================================================================
  // Helper Methods
  // ==========================================================================

  /**
   * Convert database return to PriorYearData format
   */
  private convertReturnToPriorYearData(
    dbReturn: Record<string, unknown>
  ): PriorYearData {
    return {
      taxYear: dbReturn.tax_year as number,
      filingStatus: dbReturn.filing_status as string,
      taxpayerInfo: {
        firstName: '',
        lastName: '',
      },
      income: {
        wages: (dbReturn.income_wages as number) || 0,
        interest: (dbReturn.income_interest as number) || 0,
        dividends: (dbReturn.income_dividends as number) || 0,
        businessIncome: (dbReturn.income_business as number) || 0,
        capitalGains: (dbReturn.income_capital_gains as number) || 0,
        rentalIncome: (dbReturn.income_rental as number) || 0,
        otherIncome: (dbReturn.income_other as number) || 0,
        totalIncome: (dbReturn.total_income as number) || 0,
      },
      adjustments: {
        hsaDeduction: 0,
        iraDeduction: 0,
        studentLoanInterest: 0,
        selfEmploymentTax: 0,
        otherAdjustments: 0,
        totalAdjustments: (dbReturn.total_adjustments as number) || 0,
      },
      deductions: {
        type: dbReturn.use_standard_deduction ? 'standard' : 'itemized',
        amount: (dbReturn.total_deductions as number) || 0,
      },
      credits: {
        childTaxCredit: 0,
        childCareCredit: 0,
        educationCredits: 0,
        earnedIncomeCredit: 0,
        otherCredits: 0,
        totalCredits: (dbReturn.total_credits as number) || 0,
      },
      payments: {
        federalWithholding: (dbReturn.payments_federal_withheld as number) || 0,
        estimatedPayments: (dbReturn.payments_estimated as number) || 0,
        otherPayments: 0,
        totalPayments: 0,
      },
      summary: {
        agi: (dbReturn.agi as number) || 0,
        taxableIncome: (dbReturn.taxable_income as number) || 0,
        totalTax: (dbReturn.total_tax as number) || 0,
        refundOrOwed: (dbReturn.refund_amount as number) || 0,
        isRefund: ((dbReturn.refund_amount as number) || 0) > 0,
      },
      carryforwards: dbReturn.carryforwards as CarryforwardItem[] | undefined,
    };
  }

  /**
   * Get supported import formats
   */
  getSupportedFormats(): {
    source: ImportSource;
    name: string;
    formats: string[];
    status: 'available' | 'coming_soon';
  }[] {
    return [
      {
        source: 'legalflow',
        name: 'LegalFlow',
        formats: ['Internal copy'],
        status: 'available',
      },
      {
        source: 'manual',
        name: 'Manual Entry',
        formats: ['Prior year summary'],
        status: 'available',
      },
      {
        source: 'turbotax',
        name: 'TurboTax',
        formats: ['.tax'],
        status: 'coming_soon',
      },
      {
        source: 'hrblock',
        name: 'H&R Block',
        formats: ['.hrb'],
        status: 'coming_soon',
      },
      {
        source: 'taxact',
        name: 'TaxAct',
        formats: ['.ta'],
        status: 'coming_soon',
      },
    ];
  }
}

// Export singleton
export const priorYearImportService = new PriorYearImportService();
