/**
 * Business Tax Service
 *
 * Handles business tax calculations and forms:
 * - Schedule C (Sole Proprietor)
 * - Form 1065 (Partnership)
 * - Form 1120-S (S-Corporation)
 * - Quarterly estimated tax calculations
 * - Self-employment tax
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
 * Business entity types
 */
export type BusinessEntityType =
  | 'sole_proprietorship'
  | 'single_member_llc'
  | 'partnership'
  | 'multi_member_llc'
  | 's_corporation'
  | 'c_corporation';

/**
 * Business tax form types
 */
export type BusinessFormType =
  | 'schedule_c'
  | 'form_1065'
  | 'form_1120s'
  | 'form_1120';

/**
 * Schedule C (Sole Proprietor) Data
 */
export interface ScheduleCData {
  // Business Information
  businessName: string;
  businessAddress?: BusinessAddress;
  principalBusinessCode: string; // NAICS code
  businessDescription: string;
  accountingMethod: 'cash' | 'accrual' | 'other';
  employerIdNumber?: string;

  // Income
  grossReceipts: number;
  returns: number;
  otherIncome: number;
  costOfGoodsSold?: CostOfGoodsSold;

  // Expenses
  expenses: ScheduleCExpenses;

  // Vehicle Information
  vehicleInfo?: VehicleExpenseInfo;

  // Home Office
  homeOffice?: HomeOfficeDeduction;

  // Calculated Fields
  netProfit?: number;
  selfEmploymentTax?: number;
}

/**
 * Business address
 */
export interface BusinessAddress {
  street: string;
  city: string;
  state: string;
  zipCode: string;
}

/**
 * Cost of Goods Sold
 */
export interface CostOfGoodsSold {
  inventoryAtBeginning: number;
  purchases: number;
  costOfLabor: number;
  materials: number;
  otherCosts: number;
  inventoryAtEnd: number;
}

/**
 * Schedule C Expenses
 */
export interface ScheduleCExpenses {
  advertising: number;
  carAndTruck: number;
  commissions: number;
  contractLabor: number;
  depletion: number;
  depreciation: number;
  employeeBenefits: number;
  insurance: number;
  interestMortgage: number;
  interestOther: number;
  legal: number;
  officeExpense: number;
  pensionPlans: number;
  rentVehicles: number;
  rentOther: number;
  repairs: number;
  supplies: number;
  taxes: number;
  travel: number;
  deductibleMeals: number;
  utilities: number;
  wages: number;
  otherExpenses: OtherExpense[];
}

/**
 * Other expense item
 */
export interface OtherExpense {
  description: string;
  amount: number;
}

/**
 * Vehicle expense information
 */
export interface VehicleExpenseInfo {
  dateInService: string;
  businessMiles: number;
  commutingMiles: number;
  otherMiles: number;
  totalMiles: number;
  availableForPersonalUse: boolean;
  anotherVehicleForPersonal: boolean;
  writtenEvidence: boolean;
  expenseMethod: 'standard_mileage' | 'actual_expenses';
  actualExpenses?: {
    gas: number;
    repairs: number;
    insurance: number;
    registration: number;
    depreciation: number;
    interest: number;
    other: number;
  };
}

/**
 * Home office deduction
 */
export interface HomeOfficeDeduction {
  method: 'simplified' | 'regular';
  squareFeet: number;
  totalHomeSquareFeet: number;
  daysUsed: number;
  // For regular method
  mortgageInterest?: number;
  realEstateTaxes?: number;
  insurance?: number;
  repairs?: number;
  utilities?: number;
  depreciation?: number;
}

/**
 * Partnership (Form 1065) Data
 */
export interface Form1065Data {
  // Entity Information
  partnershipName: string;
  ein: string;
  address: BusinessAddress;
  businessCode: string;
  dateBusinessStarted: string;
  accountingMethod: 'cash' | 'accrual' | 'other';
  numberOfScheduleK1s: number;

  // Income
  grossReceipts: number;
  returns: number;
  costOfGoodsSold?: number;
  ordinaryIncome: number;
  netRentalIncome: number;
  otherIncome: number;

  // Deductions
  salariesAndWages: number;
  guaranteedPayments: number;
  repairs: number;
  badDebts: number;
  rent: number;
  taxes: number;
  interest: number;
  depreciation: number;
  depletion: number;
  retirement: number;
  employeeBenefits: number;
  otherDeductions: number;

  // Partners
  partners: PartnerInfo[];

  // Schedule K Items
  scheduleK: ScheduleKItems;
}

/**
 * Partner information
 */
export interface PartnerInfo {
  name: string;
  ssn?: string;
  ein?: string;
  address: BusinessAddress;
  partnerType: 'general' | 'limited' | 'llc_member';
  profitSharePercent: number;
  lossSharePercent: number;
  capitalSharePercent: number;
  capitalContribution: number;
  distributionsThisYear: number;
}

/**
 * Schedule K items (partnership income allocation)
 */
export interface ScheduleKItems {
  ordinaryBusinessIncome: number;
  netRentalRealEstateIncome: number;
  otherNetRentalIncome: number;
  guaranteedPayments: number;
  interestIncome: number;
  dividendIncome: number;
  royalties: number;
  netShortTermCapitalGain: number;
  netLongTermCapitalGain: number;
  section1231Gain: number;
  otherIncome: number;
  charitableContributions: number;
  section179Deduction: number;
  otherDeductions: number;
  selfEmploymentEarnings: number;
}

/**
 * S-Corporation (Form 1120-S) Data
 */
export interface Form1120SData {
  // Entity Information
  corporationName: string;
  ein: string;
  address: BusinessAddress;
  businessCode: string;
  dateIncorporated: string;
  dateElectedSCorp: string;
  accountingMethod: 'cash' | 'accrual' | 'other';
  numberOfShareholders: number;

  // Income
  grossReceipts: number;
  returns: number;
  costOfGoodsSold?: number;
  grossProfit: number;
  netGainFromForm4797: number;
  otherIncome: number;

  // Deductions
  compensation: number;
  salariesAndWages: number;
  repairs: number;
  badDebts: number;
  rents: number;
  taxes: number;
  interest: number;
  depreciation: number;
  depletion: number;
  advertising: number;
  pension: number;
  employeeBenefits: number;
  otherDeductions: number;

  // Tax and Payments
  excessNetPassiveIncome: number;
  taxFromScheduleD: number;
  builtInGainsTax: number;
  estimatedTaxPayments: number;
  taxDepositedWithExtension: number;

  // Shareholders
  shareholders: ShareholderInfo[];

  // Schedule K Items
  scheduleK: ScheduleKItems;
}

/**
 * Shareholder information
 */
export interface ShareholderInfo {
  name: string;
  ssn?: string;
  ein?: string;
  address: BusinessAddress;
  sharePercent: number;
  stockOwned: number;
  distributionsThisYear: number;
  loanFromShareholder: number;
}

/**
 * Quarterly estimated tax data
 */
export interface QuarterlyEstimatedTax {
  taxYear: number;
  quarter: 1 | 2 | 3 | 4;
  dueDate: Date;
  estimatedIncome: number;
  estimatedTax: number;
  selfEmploymentTax: number;
  amountPaid: number;
  paidDate?: Date;
  confirmationNumber?: string;
}

/**
 * Business tax calculation result
 */
export interface BusinessTaxResult {
  entityType: BusinessEntityType;
  formType: BusinessFormType;
  grossIncome: number;
  totalExpenses: number;
  netIncome: number;
  selfEmploymentTax: number;
  selfEmploymentTaxDeduction: number;
  quarterlyEstimates: QuarterlyEstimate[];
  qbiDeduction: number;
  totalTaxLiability: number;
}

/**
 * Quarterly estimate
 */
export interface QuarterlyEstimate {
  quarter: number;
  dueDate: string;
  amount: number;
  isPast: boolean;
}

// ============================================================================
// Business Tax Calculator Class
// ============================================================================

/**
 * Business Tax Calculator
 */
export class BusinessTaxCalculator {
  // 2024 Tax Constants
  private readonly SELF_EMPLOYMENT_TAX_RATE = 0.153; // 15.3%
  private readonly SOCIAL_SECURITY_RATE = 0.124; // 12.4%
  private readonly MEDICARE_RATE = 0.029; // 2.9%
  private readonly ADDITIONAL_MEDICARE_RATE = 0.009; // 0.9% over $200k
  private readonly SOCIAL_SECURITY_WAGE_BASE = 168600; // 2024
  private readonly SE_TAX_MULTIPLIER = 0.9235; // 92.35% of net SE income
  private readonly QBI_DEDUCTION_RATE = 0.20; // 20% QBI deduction
  private readonly STANDARD_MILEAGE_RATE = 0.67; // 2024 rate
  private readonly SIMPLIFIED_HOME_OFFICE_RATE = 5; // $5 per sq ft
  private readonly MAX_SIMPLIFIED_HOME_OFFICE_SF = 300;

  // ==========================================================================
  // Schedule C Calculations
  // ==========================================================================

  /**
   * Calculate Schedule C (Sole Proprietor/Single-Member LLC)
   */
  calculateScheduleC(data: ScheduleCData): BusinessTaxResult {
    // Calculate gross income
    const grossReceipts = data.grossReceipts - data.returns + data.otherIncome;

    // Calculate cost of goods sold
    const cogs = data.costOfGoodsSold
      ? this.calculateCostOfGoodsSold(data.costOfGoodsSold)
      : 0;

    const grossProfit = grossReceipts - cogs;

    // Calculate total expenses
    const totalExpenses = this.calculateScheduleCExpenses(data.expenses);

    // Calculate vehicle expenses
    const vehicleExpense = data.vehicleInfo
      ? this.calculateVehicleExpense(data.vehicleInfo)
      : 0;

    // Calculate home office deduction
    const homeOfficeDeduction = data.homeOffice
      ? this.calculateHomeOfficeDeduction(data.homeOffice)
      : 0;

    // Calculate net profit
    const netProfit = grossProfit - totalExpenses - vehicleExpense - homeOfficeDeduction;

    // Calculate self-employment tax
    const seTax = this.calculateSelfEmploymentTax(netProfit);

    // Calculate SE tax deduction (half of SE tax)
    const seTaxDeduction = seTax / 2;

    // Calculate QBI deduction (simplified - 20% of qualified business income)
    const qbiDeduction = this.calculateQBIDeduction(netProfit, 'sole_proprietorship');

    // Calculate quarterly estimates
    const quarterlyEstimates = this.calculateQuarterlyEstimates(netProfit, seTax);

    return {
      entityType: 'sole_proprietorship',
      formType: 'schedule_c',
      grossIncome: grossReceipts,
      totalExpenses: totalExpenses + cogs + vehicleExpense + homeOfficeDeduction,
      netIncome: netProfit,
      selfEmploymentTax: seTax,
      selfEmploymentTaxDeduction: seTaxDeduction,
      quarterlyEstimates,
      qbiDeduction,
      totalTaxLiability: seTax, // Base SE tax, income tax calculated separately
    };
  }

  /**
   * Calculate cost of goods sold
   */
  private calculateCostOfGoodsSold(cogs: CostOfGoodsSold): number {
    const totalCosts = cogs.inventoryAtBeginning +
      cogs.purchases +
      cogs.costOfLabor +
      cogs.materials +
      cogs.otherCosts;

    return totalCosts - cogs.inventoryAtEnd;
  }

  /**
   * Calculate Schedule C expenses
   */
  private calculateScheduleCExpenses(expenses: ScheduleCExpenses): number {
    const otherExpensesTotal = expenses.otherExpenses.reduce(
      (sum, exp) => sum + exp.amount, 0
    );

    return (
      expenses.advertising +
      expenses.carAndTruck +
      expenses.commissions +
      expenses.contractLabor +
      expenses.depletion +
      expenses.depreciation +
      expenses.employeeBenefits +
      expenses.insurance +
      expenses.interestMortgage +
      expenses.interestOther +
      expenses.legal +
      expenses.officeExpense +
      expenses.pensionPlans +
      expenses.rentVehicles +
      expenses.rentOther +
      expenses.repairs +
      expenses.supplies +
      expenses.taxes +
      expenses.travel +
      expenses.deductibleMeals +
      expenses.utilities +
      expenses.wages +
      otherExpensesTotal
    );
  }

  /**
   * Calculate vehicle expenses
   */
  private calculateVehicleExpense(vehicle: VehicleExpenseInfo): number {
    if (vehicle.expenseMethod === 'standard_mileage') {
      return vehicle.businessMiles * this.STANDARD_MILEAGE_RATE;
    }

    if (vehicle.actualExpenses) {
      const totalActual =
        vehicle.actualExpenses.gas +
        vehicle.actualExpenses.repairs +
        vehicle.actualExpenses.insurance +
        vehicle.actualExpenses.registration +
        vehicle.actualExpenses.depreciation +
        vehicle.actualExpenses.interest +
        vehicle.actualExpenses.other;

      // Business use percentage
      const businessPercent = vehicle.businessMiles / vehicle.totalMiles;
      return totalActual * businessPercent;
    }

    return 0;
  }

  /**
   * Calculate home office deduction
   */
  private calculateHomeOfficeDeduction(homeOffice: HomeOfficeDeduction): number {
    if (homeOffice.method === 'simplified') {
      const sqFt = Math.min(homeOffice.squareFeet, this.MAX_SIMPLIFIED_HOME_OFFICE_SF);
      return sqFt * this.SIMPLIFIED_HOME_OFFICE_RATE;
    }

    // Regular method
    const businessPercent = homeOffice.squareFeet / homeOffice.totalHomeSquareFeet;

    const totalExpenses =
      (homeOffice.mortgageInterest || 0) +
      (homeOffice.realEstateTaxes || 0) +
      (homeOffice.insurance || 0) +
      (homeOffice.repairs || 0) +
      (homeOffice.utilities || 0) +
      (homeOffice.depreciation || 0);

    return totalExpenses * businessPercent;
  }

  // ==========================================================================
  // Self-Employment Tax Calculations
  // ==========================================================================

  /**
   * Calculate self-employment tax
   */
  calculateSelfEmploymentTax(netSelfEmploymentIncome: number): number {
    if (netSelfEmploymentIncome <= 0) return 0;

    // Only 92.35% of net SE income is subject to SE tax
    const taxableAmount = netSelfEmploymentIncome * this.SE_TAX_MULTIPLIER;

    // Social Security tax (capped)
    const ssTaxableAmount = Math.min(taxableAmount, this.SOCIAL_SECURITY_WAGE_BASE);
    const socialSecurityTax = ssTaxableAmount * this.SOCIAL_SECURITY_RATE;

    // Medicare tax (no cap)
    const medicareTax = taxableAmount * this.MEDICARE_RATE;

    // Additional Medicare tax on amounts over $200k
    const additionalMedicare = Math.max(0, taxableAmount - 200000) * this.ADDITIONAL_MEDICARE_RATE;

    return socialSecurityTax + medicareTax + additionalMedicare;
  }

  // ==========================================================================
  // QBI Deduction
  // ==========================================================================

  /**
   * Calculate Qualified Business Income (QBI) deduction
   * Simplified calculation - full implementation would include wage/asset tests
   */
  calculateQBIDeduction(
    qualifiedBusinessIncome: number,
    entityType: BusinessEntityType,
    taxableIncomeBeforeQBI?: number
  ): number {
    if (qualifiedBusinessIncome <= 0) return 0;

    // Basic QBI deduction is 20% of qualified business income
    const basicQBI = qualifiedBusinessIncome * this.QBI_DEDUCTION_RATE;

    // QBI is limited to 20% of taxable income (before QBI) minus net capital gains
    if (taxableIncomeBeforeQBI) {
      const taxableIncomeLimit = taxableIncomeBeforeQBI * this.QBI_DEDUCTION_RATE;
      return Math.min(basicQBI, taxableIncomeLimit);
    }

    return basicQBI;
  }

  // ==========================================================================
  // Quarterly Estimated Tax
  // ==========================================================================

  /**
   * Calculate quarterly estimated tax payments
   */
  calculateQuarterlyEstimates(
    estimatedNetIncome: number,
    estimatedSETax: number,
    estimatedIncomeTax?: number
  ): QuarterlyEstimate[] {
    const currentYear = new Date().getFullYear();
    const now = new Date();

    // Total tax = SE tax + estimated income tax
    const totalTax = estimatedSETax + (estimatedIncomeTax || 0);
    const quarterlyAmount = Math.ceil(totalTax / 4);

    const quarters: QuarterlyEstimate[] = [
      {
        quarter: 1,
        dueDate: `${currentYear}-04-15`,
        amount: quarterlyAmount,
        isPast: new Date(`${currentYear}-04-15`) < now,
      },
      {
        quarter: 2,
        dueDate: `${currentYear}-06-15`,
        amount: quarterlyAmount,
        isPast: new Date(`${currentYear}-06-15`) < now,
      },
      {
        quarter: 3,
        dueDate: `${currentYear}-09-15`,
        amount: quarterlyAmount,
        isPast: new Date(`${currentYear}-09-15`) < now,
      },
      {
        quarter: 4,
        dueDate: `${currentYear + 1}-01-15`,
        amount: quarterlyAmount,
        isPast: new Date(`${currentYear + 1}-01-15`) < now,
      },
    ];

    return quarters;
  }

  // ==========================================================================
  // Partnership (Form 1065) Calculations
  // ==========================================================================

  /**
   * Calculate Form 1065 (Partnership Return)
   */
  calculateForm1065(data: Form1065Data): {
    partnershipIncome: number;
    partnerAllocations: PartnerAllocation[];
    scheduleK: ScheduleKItems;
  } {
    // Calculate partnership ordinary income
    const grossIncome = data.grossReceipts - data.returns - (data.costOfGoodsSold || 0);

    const totalDeductions =
      data.salariesAndWages +
      data.guaranteedPayments +
      data.repairs +
      data.badDebts +
      data.rent +
      data.taxes +
      data.interest +
      data.depreciation +
      data.depletion +
      data.retirement +
      data.employeeBenefits +
      data.otherDeductions;

    const ordinaryIncome = grossIncome + data.netRentalIncome + data.otherIncome - totalDeductions;

    // Allocate income to partners based on their percentage
    const partnerAllocations = data.partners.map(partner => ({
      partnerName: partner.name,
      profitShare: ordinaryIncome * (partner.profitSharePercent / 100),
      guaranteedPayment: data.guaranteedPayments * (partner.profitSharePercent / 100),
      selfEmploymentIncome: this.calculatePartnerSEIncome(
        ordinaryIncome * (partner.profitSharePercent / 100),
        partner.partnerType
      ),
      distribution: partner.distributionsThisYear,
    }));

    return {
      partnershipIncome: ordinaryIncome,
      partnerAllocations,
      scheduleK: data.scheduleK,
    };
  }

  /**
   * Calculate partner's self-employment income
   */
  private calculatePartnerSEIncome(share: number, partnerType: string): number {
    // General partners and LLC members are subject to SE tax
    if (partnerType === 'general' || partnerType === 'llc_member') {
      return share;
    }
    // Limited partners generally not subject to SE tax (with exceptions)
    return 0;
  }

  // ==========================================================================
  // S-Corporation (Form 1120-S) Calculations
  // ==========================================================================

  /**
   * Calculate Form 1120-S (S-Corporation Return)
   */
  calculateForm1120S(data: Form1120SData): {
    corporateIncome: number;
    shareholderAllocations: ShareholderAllocation[];
    scheduleK: ScheduleKItems;
    corporateTax: number;
  } {
    // Calculate corporate income
    const grossIncome = data.grossReceipts - data.returns - (data.costOfGoodsSold || 0);

    const totalDeductions =
      data.compensation +
      data.salariesAndWages +
      data.repairs +
      data.badDebts +
      data.rents +
      data.taxes +
      data.interest +
      data.depreciation +
      data.depletion +
      data.advertising +
      data.pension +
      data.employeeBenefits +
      data.otherDeductions;

    const ordinaryIncome = data.grossProfit + data.netGainFromForm4797 + data.otherIncome - totalDeductions;

    // S-Corps generally don't pay corporate tax, but there are exceptions
    const corporateTax =
      data.excessNetPassiveIncome +
      data.taxFromScheduleD +
      data.builtInGainsTax;

    // Allocate income to shareholders
    const shareholderAllocations = data.shareholders.map(shareholder => ({
      shareholderName: shareholder.name,
      shareOfIncome: ordinaryIncome * (shareholder.sharePercent / 100),
      distribution: shareholder.distributionsThisYear,
      // S-Corp shareholders don't pay SE tax on pass-through income
      // (but must take reasonable salary which is subject to payroll tax)
      selfEmploymentIncome: 0,
    }));

    return {
      corporateIncome: ordinaryIncome,
      shareholderAllocations,
      scheduleK: data.scheduleK,
      corporateTax,
    };
  }
}

/**
 * Partner allocation result
 */
interface PartnerAllocation {
  partnerName: string;
  profitShare: number;
  guaranteedPayment: number;
  selfEmploymentIncome: number;
  distribution: number;
}

/**
 * Shareholder allocation result
 */
interface ShareholderAllocation {
  shareholderName: string;
  shareOfIncome: number;
  distribution: number;
  selfEmploymentIncome: number;
}

// ============================================================================
// Business Tax Service (Database Operations)
// ============================================================================

/**
 * Business Tax Service for database operations
 */
export class BusinessTaxService {
  private calculator: BusinessTaxCalculator;

  constructor() {
    this.calculator = new BusinessTaxCalculator();
  }

  /**
   * Create a new business tax return
   */
  async createBusinessReturn(
    userId: string,
    entityType: BusinessEntityType,
    taxYear: number,
    businessName: string
  ): Promise<{ id: string; formType: BusinessFormType }> {
    const formType = this.getFormTypeForEntity(entityType);

    const { data, error } = await supabase
      .from('business_tax_returns')
      .insert({
        user_id: userId,
        entity_type: entityType,
        form_type: formType,
        tax_year: taxYear,
        business_name: businessName,
        status: 'draft',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      logger.error('Failed to create business return:', error);
      throw new Error('Failed to create business tax return');
    }

    return { id: data.id, formType };
  }

  /**
   * Get form type for entity type
   */
  private getFormTypeForEntity(entityType: BusinessEntityType): BusinessFormType {
    switch (entityType) {
      case 'sole_proprietorship':
      case 'single_member_llc':
        return 'schedule_c';
      case 'partnership':
      case 'multi_member_llc':
        return 'form_1065';
      case 's_corporation':
        return 'form_1120s';
      case 'c_corporation':
        return 'form_1120';
      default:
        return 'schedule_c';
    }
  }

  /**
   * Calculate Schedule C for a business
   */
  async calculateScheduleC(businessReturnId: string): Promise<BusinessTaxResult> {
    const { data, error } = await supabase
      .from('business_tax_returns')
      .select('*')
      .eq('id', businessReturnId)
      .single();

    if (error || !data) {
      throw new Error('Business return not found');
    }

    const scheduleCData: ScheduleCData = {
      businessName: data.business_name,
      businessAddress: data.business_address,
      principalBusinessCode: data.business_code || '999999',
      businessDescription: data.business_description || '',
      accountingMethod: data.accounting_method || 'cash',
      employerIdNumber: data.ein,
      grossReceipts: data.gross_receipts || 0,
      returns: data.returns_allowances || 0,
      otherIncome: data.other_income || 0,
      costOfGoodsSold: data.cogs,
      expenses: data.expenses || this.getDefaultExpenses(),
      vehicleInfo: data.vehicle_info,
      homeOffice: data.home_office,
    };

    const result = this.calculator.calculateScheduleC(scheduleCData);

    // Update the return with calculated values
    await supabase
      .from('business_tax_returns')
      .update({
        net_profit: result.netIncome,
        self_employment_tax: result.selfEmploymentTax,
        qbi_deduction: result.qbiDeduction,
        quarterly_estimates: result.quarterlyEstimates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', businessReturnId);

    return result;
  }

  /**
   * Get default empty expenses object
   */
  private getDefaultExpenses(): ScheduleCExpenses {
    return {
      advertising: 0,
      carAndTruck: 0,
      commissions: 0,
      contractLabor: 0,
      depletion: 0,
      depreciation: 0,
      employeeBenefits: 0,
      insurance: 0,
      interestMortgage: 0,
      interestOther: 0,
      legal: 0,
      officeExpense: 0,
      pensionPlans: 0,
      rentVehicles: 0,
      rentOther: 0,
      repairs: 0,
      supplies: 0,
      taxes: 0,
      travel: 0,
      deductibleMeals: 0,
      utilities: 0,
      wages: 0,
      otherExpenses: [],
    };
  }

  /**
   * Get quarterly estimated tax payments
   */
  async getQuarterlyEstimates(
    userId: string,
    taxYear: number
  ): Promise<QuarterlyEstimatedTax[]> {
    const { data, error } = await supabase
      .from('quarterly_estimated_taxes')
      .select('*')
      .eq('user_id', userId)
      .eq('tax_year', taxYear)
      .order('quarter', { ascending: true });

    if (error) {
      logger.error('Failed to get quarterly estimates:', error);
      return [];
    }

    return data.map(q => ({
      taxYear: q.tax_year,
      quarter: q.quarter,
      dueDate: new Date(q.due_date),
      estimatedIncome: q.estimated_income,
      estimatedTax: q.estimated_tax,
      selfEmploymentTax: q.self_employment_tax,
      amountPaid: q.amount_paid,
      paidDate: q.paid_date ? new Date(q.paid_date) : undefined,
      confirmationNumber: q.confirmation_number,
    }));
  }

  /**
   * Record a quarterly estimated tax payment
   */
  async recordQuarterlyPayment(
    userId: string,
    taxYear: number,
    quarter: 1 | 2 | 3 | 4,
    amountPaid: number,
    paidDate: Date,
    confirmationNumber?: string
  ): Promise<void> {
    const { error } = await supabase
      .from('quarterly_estimated_taxes')
      .upsert({
        user_id: userId,
        tax_year: taxYear,
        quarter,
        amount_paid: amountPaid,
        paid_date: paidDate.toISOString(),
        confirmation_number: confirmationNumber,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id,tax_year,quarter',
      });

    if (error) {
      logger.error('Failed to record quarterly payment:', error);
      throw new Error('Failed to record payment');
    }
  }

  /**
   * Get business tax summary for a user
   */
  async getBusinessTaxSummary(userId: string, taxYear: number): Promise<{
    businesses: BusinessSummary[];
    totalNetIncome: number;
    totalSETax: number;
    quarterlyEstimates: QuarterlyEstimate[];
  }> {
    const { data: businesses, error } = await supabase
      .from('business_tax_returns')
      .select('*')
      .eq('user_id', userId)
      .eq('tax_year', taxYear);

    if (error) {
      logger.error('Failed to get business tax summary:', error);
      return {
        businesses: [],
        totalNetIncome: 0,
        totalSETax: 0,
        quarterlyEstimates: [],
      };
    }

    const summaries: BusinessSummary[] = businesses.map(b => ({
      id: b.id,
      businessName: b.business_name,
      entityType: b.entity_type,
      formType: b.form_type,
      netIncome: b.net_profit || 0,
      selfEmploymentTax: b.self_employment_tax || 0,
      status: b.status,
    }));

    const totalNetIncome = summaries.reduce((sum, b) => sum + b.netIncome, 0);
    const totalSETax = summaries.reduce((sum, b) => sum + b.selfEmploymentTax, 0);

    const quarterlyEstimates = this.calculator.calculateQuarterlyEstimates(
      totalNetIncome,
      totalSETax
    );

    return {
      businesses: summaries,
      totalNetIncome,
      totalSETax,
      quarterlyEstimates,
    };
  }
}

/**
 * Business summary
 */
interface BusinessSummary {
  id: string;
  businessName: string;
  entityType: BusinessEntityType;
  formType: BusinessFormType;
  netIncome: number;
  selfEmploymentTax: number;
  status: string;
}

// Export instances
export const businessTaxCalculator = new BusinessTaxCalculator();
export const businessTaxService = new BusinessTaxService();
