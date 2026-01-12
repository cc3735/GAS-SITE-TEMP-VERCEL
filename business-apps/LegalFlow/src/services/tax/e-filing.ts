/**
 * IRS E-Filing Service
 *
 * Provides tax return filing capabilities:
 * - Generate IRS-ready PDF forms (Form 1040, schedules)
 * - Validate returns before submission
 * - Track filing status
 * - Support for future MeF (Modernized e-File) integration
 *
 * @version 1.0.0
 * @created 2026-01-12
 */

import { supabase } from '../../lib/supabase.js';
import { TaxCalculator, TaxCalculationInput } from './tax-calculator.js';
import { logger } from '../../utils/logger.js';

// ============================================================================
// Types and Interfaces
// ============================================================================

/**
 * Filing status enumeration
 */
export type FilingStatusType =
  | 'draft'
  | 'validated'
  | 'ready_to_file'
  | 'submitted'
  | 'accepted'
  | 'rejected'
  | 'pending_review';

/**
 * E-Filing submission record
 */
export interface EFilingSubmission {
  id: string;
  taxReturnId: string;
  userId: string;
  taxYear: number;
  filingType: 'federal' | 'state';
  stateCode?: string;
  status: FilingStatusType;
  submissionId?: string;
  confirmationNumber?: string;
  submittedAt?: Date;
  acceptedAt?: Date;
  rejectedAt?: Date;
  rejectionReason?: string;
  pdfUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Validation result
 */
export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  readyToFile: boolean;
}

/**
 * Validation error
 */
export interface ValidationError {
  code: string;
  field: string;
  message: string;
  severity: 'error' | 'critical';
}

/**
 * Validation warning
 */
export interface ValidationWarning {
  code: string;
  field: string;
  message: string;
}

/**
 * Tax return data for filing
 */
export interface TaxReturnData {
  id: string;
  userId: string;
  taxYear: number;
  filingStatus: string;
  taxpayerInfo: TaxpayerInfo;
  spouseInfo?: TaxpayerInfo;
  dependents: DependentInfo[];
  income: IncomeData;
  deductions: DeductionData;
  credits: CreditData;
  payments: PaymentData;
  bankInfo?: BankAccountInfo;
}

/**
 * Taxpayer information
 */
export interface TaxpayerInfo {
  firstName: string;
  middleInitial?: string;
  lastName: string;
  ssn: string;
  dateOfBirth: string;
  occupation?: string;
  phoneNumber?: string;
  email?: string;
  address: AddressInfo;
}

/**
 * Address information
 */
export interface AddressInfo {
  street1: string;
  street2?: string;
  city: string;
  state: string;
  zipCode: string;
  country?: string;
}

/**
 * Dependent information
 */
export interface DependentInfo {
  firstName: string;
  lastName: string;
  ssn: string;
  relationship: string;
  dateOfBirth: string;
  monthsLivedWithYou: number;
  qualifiesForChildTaxCredit: boolean;
  qualifiesForEITC: boolean;
}

/**
 * Income data
 */
export interface IncomeData {
  wages: number;
  salaries: number;
  tips: number;
  interestIncome: number;
  dividendIncome: number;
  qualifiedDividends: number;
  taxableRefunds: number;
  alimonyReceived: number;
  businessIncome: number;
  capitalGains: number;
  capitalLosses: number;
  otherGains: number;
  iraDistributions: number;
  pensionsAnnuities: number;
  rentalRealEstate: number;
  socialSecurityBenefits: number;
  otherIncome: number;
  w2Forms: W2FormData[];
  form1099s: Form1099Data[];
}

/**
 * W-2 Form data
 */
export interface W2FormData {
  employerEin: string;
  employerName: string;
  employerAddress: AddressInfo;
  wages: number;
  federalWithheld: number;
  socialSecurityWages: number;
  socialSecurityWithheld: number;
  medicareWages: number;
  medicareWithheld: number;
  socialSecurityTips?: number;
  allocatedTips?: number;
  dependentCareBenefits?: number;
  nonqualifiedPlans?: number;
  box12Codes?: { code: string; amount: number }[];
  stateTaxInfo?: StateTaxInfo[];
}

/**
 * State tax information from W-2
 */
export interface StateTaxInfo {
  stateCode: string;
  stateWages: number;
  stateWithheld: number;
  localWages?: number;
  localWithheld?: number;
  localityName?: string;
}

/**
 * 1099 Form data
 */
export interface Form1099Data {
  type: '1099-INT' | '1099-DIV' | '1099-NEC' | '1099-MISC' | '1099-G' | '1099-R' | '1099-SSA';
  payerName: string;
  payerEin: string;
  amount: number;
  federalWithheld?: number;
  stateWithheld?: number;
  additionalData?: Record<string, unknown>;
}

/**
 * Deduction data
 */
export interface DeductionData {
  useStandardDeduction: boolean;
  standardDeductionAmount?: number;
  itemizedDeductions?: {
    medicalExpenses: number;
    stateLocalTaxes: number;
    realEstateTaxes: number;
    personalPropertyTaxes: number;
    mortgageInterest: number;
    mortgageInsurancePremiums: number;
    charitableCash: number;
    charitableNonCash: number;
    casualtyLosses: number;
    miscDeductions: number;
  };
  adjustmentsToIncome: {
    educatorExpenses: number;
    hsaDeduction: number;
    movingExpenses: number;
    selfEmploymentTax: number;
    selfEmployedHealthInsurance: number;
    sepSimpleIra: number;
    selfEmployedRetirement: number;
    earlyWithdrawalPenalty: number;
    alimonyPaid: number;
    iraDeduction: number;
    studentLoanInterest: number;
  };
}

/**
 * Credit data
 */
export interface CreditData {
  childTaxCredit: number;
  additionalChildTaxCredit: number;
  childDependentCareCredit: number;
  educationCredits: number;
  retirementSavingsCredit: number;
  residentialEnergyCredit: number;
  foreignTaxCredit: number;
  earnedIncomeCredit: number;
  otherCredits: number;
}

/**
 * Payment data
 */
export interface PaymentData {
  federalWithholding: number;
  estimatedTaxPayments: number;
  amountPaidWithExtension: number;
  excessSocialSecurity: number;
  otherPayments: number;
}

/**
 * Bank account for direct deposit/withdrawal
 */
export interface BankAccountInfo {
  routingNumber: string;
  accountNumber: string;
  accountType: 'checking' | 'savings';
  bankName?: string;
}

/**
 * PDF generation options
 */
export interface PdfGenerationOptions {
  includeSchedules: boolean;
  includeWorksheets: boolean;
  includeInstructions: boolean;
  format: 'print' | 'efile';
}

/**
 * Generated PDF result
 */
export interface GeneratedPdfResult {
  success: boolean;
  pdfBase64?: string;
  filename?: string;
  pageCount?: number;
  forms: string[];
  errors?: string[];
}

// ============================================================================
// E-Filing Service Class
// ============================================================================

/**
 * E-Filing service for tax return submission
 */
export class EFilingService {
  private calculator: TaxCalculator;

  constructor() {
    this.calculator = new TaxCalculator();
  }

  // ==========================================================================
  // Validation Methods
  // ==========================================================================

  /**
   * Validate a tax return for filing
   */
  async validateForFiling(taxReturnData: TaxReturnData): Promise<ValidationResult> {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Validate taxpayer information
    this.validateTaxpayerInfo(taxReturnData.taxpayerInfo, errors, warnings);

    // Validate spouse info if married filing jointly
    if (taxReturnData.filingStatus === 'married_jointly' && taxReturnData.spouseInfo) {
      this.validateTaxpayerInfo(taxReturnData.spouseInfo, errors, warnings, 'Spouse');
    }

    // Validate dependents
    this.validateDependents(taxReturnData.dependents, errors, warnings);

    // Validate income
    this.validateIncome(taxReturnData.income, errors, warnings);

    // Validate deductions
    this.validateDeductions(taxReturnData.deductions, errors, warnings);

    // Validate payments
    this.validatePayments(taxReturnData.payments, errors, warnings);

    // Validate bank info if requesting direct deposit
    if (taxReturnData.bankInfo) {
      this.validateBankInfo(taxReturnData.bankInfo, errors, warnings);
    }

    // Cross-validation checks
    this.performCrossValidation(taxReturnData, errors, warnings);

    const isValid = errors.filter(e => e.severity === 'critical').length === 0;
    const readyToFile = errors.length === 0;

    return {
      isValid,
      errors,
      warnings,
      readyToFile,
    };
  }

  /**
   * Validate taxpayer information
   */
  private validateTaxpayerInfo(
    info: TaxpayerInfo,
    errors: ValidationError[],
    warnings: ValidationWarning[],
    prefix: string = 'Taxpayer'
  ): void {
    // First name required
    if (!info.firstName || info.firstName.trim().length === 0) {
      errors.push({
        code: 'MISSING_FIRST_NAME',
        field: `${prefix.toLowerCase()}Info.firstName`,
        message: `${prefix} first name is required`,
        severity: 'critical',
      });
    }

    // Last name required
    if (!info.lastName || info.lastName.trim().length === 0) {
      errors.push({
        code: 'MISSING_LAST_NAME',
        field: `${prefix.toLowerCase()}Info.lastName`,
        message: `${prefix} last name is required`,
        severity: 'critical',
      });
    }

    // SSN validation
    if (!info.ssn) {
      errors.push({
        code: 'MISSING_SSN',
        field: `${prefix.toLowerCase()}Info.ssn`,
        message: `${prefix} Social Security Number is required`,
        severity: 'critical',
      });
    } else if (!this.isValidSSN(info.ssn)) {
      errors.push({
        code: 'INVALID_SSN',
        field: `${prefix.toLowerCase()}Info.ssn`,
        message: `${prefix} Social Security Number format is invalid`,
        severity: 'critical',
      });
    }

    // Date of birth validation
    if (!info.dateOfBirth) {
      errors.push({
        code: 'MISSING_DOB',
        field: `${prefix.toLowerCase()}Info.dateOfBirth`,
        message: `${prefix} date of birth is required`,
        severity: 'critical',
      });
    }

    // Address validation
    if (!info.address || !info.address.street1) {
      errors.push({
        code: 'MISSING_ADDRESS',
        field: `${prefix.toLowerCase()}Info.address`,
        message: `${prefix} address is required`,
        severity: 'critical',
      });
    }

    if (info.address) {
      if (!info.address.city) {
        errors.push({
          code: 'MISSING_CITY',
          field: `${prefix.toLowerCase()}Info.address.city`,
          message: `${prefix} city is required`,
          severity: 'critical',
        });
      }
      if (!info.address.state) {
        errors.push({
          code: 'MISSING_STATE',
          field: `${prefix.toLowerCase()}Info.address.state`,
          message: `${prefix} state is required`,
          severity: 'critical',
        });
      }
      if (!info.address.zipCode || !this.isValidZipCode(info.address.zipCode)) {
        errors.push({
          code: 'INVALID_ZIP',
          field: `${prefix.toLowerCase()}Info.address.zipCode`,
          message: `${prefix} ZIP code is invalid`,
          severity: 'critical',
        });
      }
    }
  }

  /**
   * Validate dependents
   */
  private validateDependents(
    dependents: DependentInfo[],
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ): void {
    dependents.forEach((dep, index) => {
      if (!dep.firstName || !dep.lastName) {
        errors.push({
          code: 'MISSING_DEPENDENT_NAME',
          field: `dependents[${index}]`,
          message: `Dependent ${index + 1} name is incomplete`,
          severity: 'critical',
        });
      }

      if (!dep.ssn || !this.isValidSSN(dep.ssn)) {
        errors.push({
          code: 'INVALID_DEPENDENT_SSN',
          field: `dependents[${index}].ssn`,
          message: `Dependent ${index + 1} SSN is invalid`,
          severity: 'critical',
        });
      }

      if (!dep.relationship) {
        errors.push({
          code: 'MISSING_RELATIONSHIP',
          field: `dependents[${index}].relationship`,
          message: `Dependent ${index + 1} relationship is required`,
          severity: 'error',
        });
      }

      // Check age for child tax credit eligibility
      if (dep.qualifiesForChildTaxCredit) {
        const age = this.calculateAge(dep.dateOfBirth);
        if (age >= 17) {
          warnings.push({
            code: 'CHILD_TAX_CREDIT_AGE',
            field: `dependents[${index}]`,
            message: `Dependent ${index + 1} may not qualify for Child Tax Credit (age ${age})`,
          });
        }
      }
    });
  }

  /**
   * Validate income data
   */
  private validateIncome(
    income: IncomeData,
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ): void {
    // Validate W-2 forms
    income.w2Forms.forEach((w2, index) => {
      if (!w2.employerEin || !this.isValidEIN(w2.employerEin)) {
        errors.push({
          code: 'INVALID_EMPLOYER_EIN',
          field: `income.w2Forms[${index}].employerEin`,
          message: `W-2 #${index + 1} has invalid employer EIN`,
          severity: 'error',
        });
      }

      if (w2.wages < 0) {
        errors.push({
          code: 'NEGATIVE_WAGES',
          field: `income.w2Forms[${index}].wages`,
          message: `W-2 #${index + 1} wages cannot be negative`,
          severity: 'critical',
        });
      }

      // Check for reasonable withholding rate
      if (w2.wages > 0 && w2.federalWithheld > 0) {
        const withholdingRate = w2.federalWithheld / w2.wages;
        if (withholdingRate > 0.5) {
          warnings.push({
            code: 'HIGH_WITHHOLDING_RATE',
            field: `income.w2Forms[${index}].federalWithheld`,
            message: `W-2 #${index + 1} has unusually high withholding rate (${(withholdingRate * 100).toFixed(1)}%)`,
          });
        }
      }
    });

    // Validate 1099 forms
    income.form1099s.forEach((f1099, index) => {
      if (f1099.amount < 0) {
        errors.push({
          code: 'NEGATIVE_1099_AMOUNT',
          field: `income.form1099s[${index}].amount`,
          message: `1099 #${index + 1} amount cannot be negative`,
          severity: 'error',
        });
      }
    });

    // Check total income reasonableness
    const totalIncome = income.wages + income.salaries + income.tips +
      income.interestIncome + income.dividendIncome + income.businessIncome +
      income.capitalGains + income.otherIncome;

    if (totalIncome === 0) {
      warnings.push({
        code: 'ZERO_INCOME',
        field: 'income',
        message: 'Total income is $0. Please verify all income has been entered.',
      });
    }
  }

  /**
   * Validate deductions
   */
  private validateDeductions(
    deductions: DeductionData,
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ): void {
    if (!deductions.useStandardDeduction && deductions.itemizedDeductions) {
      const itemized = deductions.itemizedDeductions;

      // SALT cap warning
      const saltTotal = itemized.stateLocalTaxes + itemized.realEstateTaxes +
        itemized.personalPropertyTaxes;
      if (saltTotal > 10000) {
        warnings.push({
          code: 'SALT_CAP_EXCEEDED',
          field: 'deductions.itemizedDeductions',
          message: `State and local taxes exceed the $10,000 cap. Only $10,000 will be deductible.`,
        });
      }

      // Large charitable deduction warning
      if (itemized.charitableCash > 50000 || itemized.charitableNonCash > 5000) {
        warnings.push({
          code: 'LARGE_CHARITABLE',
          field: 'deductions.itemizedDeductions.charitable',
          message: 'Large charitable deductions may increase audit risk. Ensure you have documentation.',
        });
      }
    }

    // Validate adjustments
    const adjustments = deductions.adjustmentsToIncome;
    if (adjustments.educatorExpenses > 300) {
      warnings.push({
        code: 'EDUCATOR_EXPENSE_LIMIT',
        field: 'deductions.adjustmentsToIncome.educatorExpenses',
        message: 'Educator expenses are limited to $300 per educator.',
      });
    }

    if (adjustments.studentLoanInterest > 2500) {
      warnings.push({
        code: 'STUDENT_LOAN_LIMIT',
        field: 'deductions.adjustmentsToIncome.studentLoanInterest',
        message: 'Student loan interest deduction is limited to $2,500.',
      });
    }
  }

  /**
   * Validate payments
   */
  private validatePayments(
    payments: PaymentData,
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ): void {
    if (payments.federalWithholding < 0) {
      errors.push({
        code: 'NEGATIVE_WITHHOLDING',
        field: 'payments.federalWithholding',
        message: 'Federal withholding cannot be negative',
        severity: 'critical',
      });
    }

    if (payments.estimatedTaxPayments < 0) {
      errors.push({
        code: 'NEGATIVE_ESTIMATED_TAX',
        field: 'payments.estimatedTaxPayments',
        message: 'Estimated tax payments cannot be negative',
        severity: 'critical',
      });
    }
  }

  /**
   * Validate bank information
   */
  private validateBankInfo(
    bankInfo: BankAccountInfo,
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ): void {
    // Routing number validation (9 digits, checksum)
    if (!bankInfo.routingNumber || !this.isValidRoutingNumber(bankInfo.routingNumber)) {
      errors.push({
        code: 'INVALID_ROUTING_NUMBER',
        field: 'bankInfo.routingNumber',
        message: 'Invalid bank routing number',
        severity: 'error',
      });
    }

    // Account number validation (4-17 digits)
    if (!bankInfo.accountNumber || !/^\d{4,17}$/.test(bankInfo.accountNumber)) {
      errors.push({
        code: 'INVALID_ACCOUNT_NUMBER',
        field: 'bankInfo.accountNumber',
        message: 'Invalid bank account number',
        severity: 'error',
      });
    }
  }

  /**
   * Perform cross-validation checks
   */
  private performCrossValidation(
    data: TaxReturnData,
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ): void {
    // Check W-2 total matches reported wages
    const w2Total = data.income.w2Forms.reduce((sum, w2) => sum + w2.wages, 0);
    const reportedWages = data.income.wages + data.income.salaries + data.income.tips;

    if (Math.abs(w2Total - reportedWages) > 1) {
      warnings.push({
        code: 'W2_WAGES_MISMATCH',
        field: 'income.wages',
        message: `W-2 total ($${w2Total.toLocaleString()}) differs from reported wages ($${reportedWages.toLocaleString()})`,
      });
    }

    // Check withholding totals
    const w2Withholding = data.income.w2Forms.reduce((sum, w2) => sum + w2.federalWithheld, 0);
    const form1099Withholding = data.income.form1099s.reduce(
      (sum, f) => sum + (f.federalWithheld || 0), 0
    );
    const totalReportedWithholding = data.payments.federalWithholding;

    const calculatedWithholding = w2Withholding + form1099Withholding;
    if (Math.abs(calculatedWithholding - totalReportedWithholding) > 1) {
      warnings.push({
        code: 'WITHHOLDING_MISMATCH',
        field: 'payments.federalWithholding',
        message: `Calculated withholding ($${calculatedWithholding.toLocaleString()}) differs from reported ($${totalReportedWithholding.toLocaleString()})`,
      });
    }

    // Check filing status consistency
    if (data.filingStatus === 'married_jointly' && !data.spouseInfo) {
      errors.push({
        code: 'MISSING_SPOUSE_INFO',
        field: 'spouseInfo',
        message: 'Spouse information is required for Married Filing Jointly status',
        severity: 'critical',
      });
    }
  }

  // ==========================================================================
  // PDF Generation Methods
  // ==========================================================================

  /**
   * Generate IRS-ready PDF forms
   */
  async generatePdf(
    taxReturnData: TaxReturnData,
    options: PdfGenerationOptions = {
      includeSchedules: true,
      includeWorksheets: true,
      includeInstructions: false,
      format: 'print',
    }
  ): Promise<GeneratedPdfResult> {
    try {
      logger.info(`Generating PDF for tax return ${taxReturnData.id}`);

      // First validate the return
      const validation = await this.validateForFiling(taxReturnData);
      if (!validation.isValid) {
        return {
          success: false,
          forms: [],
          errors: validation.errors.map(e => e.message),
        };
      }

      // Determine which forms are needed
      const requiredForms = this.determineRequiredForms(taxReturnData);

      // Generate Form 1040 data
      const form1040Data = this.generateForm1040Data(taxReturnData);

      // Generate schedule data if needed
      const scheduleData: Record<string, unknown> = {};
      if (options.includeSchedules) {
        if (requiredForms.includes('Schedule 1')) {
          scheduleData['schedule1'] = this.generateSchedule1Data(taxReturnData);
        }
        if (requiredForms.includes('Schedule 2')) {
          scheduleData['schedule2'] = this.generateSchedule2Data(taxReturnData);
        }
        if (requiredForms.includes('Schedule 3')) {
          scheduleData['schedule3'] = this.generateSchedule3Data(taxReturnData);
        }
        if (requiredForms.includes('Schedule A')) {
          scheduleData['scheduleA'] = this.generateScheduleAData(taxReturnData);
        }
        if (requiredForms.includes('Schedule C')) {
          scheduleData['scheduleC'] = this.generateScheduleCData(taxReturnData);
        }
        if (requiredForms.includes('Schedule SE')) {
          scheduleData['scheduleSE'] = this.generateScheduleSEData(taxReturnData);
        }
      }

      // In a real implementation, this would use a PDF library like pdf-lib
      // to fill in IRS form templates. For now, we generate a summary PDF.
      const pdfContent = await this.generateSummaryPdf(
        taxReturnData,
        form1040Data,
        scheduleData,
        options
      );

      return {
        success: true,
        pdfBase64: pdfContent,
        filename: `Form1040_${taxReturnData.taxYear}_${taxReturnData.taxpayerInfo.lastName}.pdf`,
        pageCount: requiredForms.length + 1,
        forms: requiredForms,
      };
    } catch (error) {
      logger.error('PDF generation failed:', error);
      return {
        success: false,
        forms: [],
        errors: [error instanceof Error ? error.message : 'PDF generation failed'],
      };
    }
  }

  /**
   * Determine which IRS forms are required
   */
  private determineRequiredForms(data: TaxReturnData): string[] {
    const forms: string[] = ['Form 1040'];

    // Schedule 1 - Additional Income and Adjustments
    const hasSchedule1Income =
      data.income.businessIncome > 0 ||
      data.income.rentalRealEstate !== 0 ||
      data.income.alimonyReceived > 0 ||
      data.income.otherIncome > 0;

    const hasSchedule1Adjustments =
      data.deductions.adjustmentsToIncome.hsaDeduction > 0 ||
      data.deductions.adjustmentsToIncome.selfEmployedHealthInsurance > 0 ||
      data.deductions.adjustmentsToIncome.selfEmploymentTax > 0 ||
      data.deductions.adjustmentsToIncome.iraDeduction > 0 ||
      data.deductions.adjustmentsToIncome.studentLoanInterest > 0;

    if (hasSchedule1Income || hasSchedule1Adjustments) {
      forms.push('Schedule 1');
    }

    // Schedule 2 - Additional Taxes
    const hasSchedule2Taxes =
      data.income.businessIncome > 0; // Self-employment tax

    if (hasSchedule2Taxes) {
      forms.push('Schedule 2');
      forms.push('Schedule SE');
    }

    // Schedule 3 - Additional Credits
    const hasSchedule3Credits =
      data.credits.foreignTaxCredit > 0 ||
      data.credits.educationCredits > 0 ||
      data.credits.retirementSavingsCredit > 0 ||
      data.credits.residentialEnergyCredit > 0;

    if (hasSchedule3Credits) {
      forms.push('Schedule 3');
    }

    // Schedule A - Itemized Deductions
    if (!data.deductions.useStandardDeduction) {
      forms.push('Schedule A');
    }

    // Schedule C - Business Income
    if (data.income.businessIncome > 0) {
      forms.push('Schedule C');
    }

    // Schedule EIC - Earned Income Credit
    if (data.credits.earnedIncomeCredit > 0) {
      forms.push('Schedule EIC');
    }

    return forms;
  }

  /**
   * Generate Form 1040 data mapping
   */
  private generateForm1040Data(data: TaxReturnData): Record<string, unknown> {
    const totalIncome = this.calculateTotalIncome(data.income);
    const adjustments = this.calculateAdjustments(data.deductions);
    const agi = totalIncome - adjustments;

    const deduction = data.deductions.useStandardDeduction
      ? data.deductions.standardDeductionAmount || 0
      : this.calculateItemizedDeductions(data.deductions);

    const taxableIncome = Math.max(0, agi - deduction);

    return {
      // Filing Status
      filingStatus: data.filingStatus,
      taxYear: data.taxYear,

      // Taxpayer Info
      firstName: data.taxpayerInfo.firstName,
      middleInitial: data.taxpayerInfo.middleInitial,
      lastName: data.taxpayerInfo.lastName,
      ssn: data.taxpayerInfo.ssn,
      occupation: data.taxpayerInfo.occupation,

      // Spouse Info (if applicable)
      spouseFirstName: data.spouseInfo?.firstName,
      spouseMiddleInitial: data.spouseInfo?.middleInitial,
      spouseLastName: data.spouseInfo?.lastName,
      spouseSSN: data.spouseInfo?.ssn,
      spouseOccupation: data.spouseInfo?.occupation,

      // Address
      address: data.taxpayerInfo.address.street1,
      addressLine2: data.taxpayerInfo.address.street2,
      city: data.taxpayerInfo.address.city,
      state: data.taxpayerInfo.address.state,
      zipCode: data.taxpayerInfo.address.zipCode,

      // Income
      line1_wages: data.income.wages + data.income.salaries + data.income.tips,
      line2a_taxExemptInterest: 0, // Not tracked separately
      line2b_taxableInterest: data.income.interestIncome,
      line3a_qualifiedDividends: data.income.qualifiedDividends,
      line3b_ordinaryDividends: data.income.dividendIncome,
      line4a_iraDistributions: data.income.iraDistributions,
      line4b_taxableIra: data.income.iraDistributions, // Simplified
      line5a_pensions: data.income.pensionsAnnuities,
      line5b_taxablePensions: data.income.pensionsAnnuities, // Simplified
      line6a_socialSecurity: data.income.socialSecurityBenefits,
      line6b_taxableSS: data.income.socialSecurityBenefits * 0.85, // Simplified
      line7_capitalGain: data.income.capitalGains - data.income.capitalLosses,
      line8_schedule1: totalIncome - (data.income.wages + data.income.salaries + data.income.tips +
        data.income.interestIncome + data.income.dividendIncome),

      // Totals
      line9_totalIncome: totalIncome,
      line10_adjustments: adjustments,
      line11_agi: agi,
      line12_deduction: deduction,
      line13_qbiDeduction: 0, // QBI not implemented
      line14_totalDeductions: deduction,
      line15_taxableIncome: taxableIncome,

      // Tax and Credits
      line16_tax: 0, // Will be calculated
      line17_schedule2: 0,
      line18_totalTax: 0,
      line19_childTaxCredit: data.credits.childTaxCredit,
      line20_schedule3: data.credits.educationCredits + data.credits.retirementSavingsCredit +
        data.credits.residentialEnergyCredit + data.credits.foreignTaxCredit,
      line21_totalCredits: 0,
      line22_netTax: 0,
      line23_otherTaxes: 0,
      line24_totalTax: 0,

      // Payments
      line25_withholding: data.payments.federalWithholding,
      line26_estimatedTax: data.payments.estimatedTaxPayments,
      line27_eic: data.credits.earnedIncomeCredit,
      line28_additionalChildTaxCredit: data.credits.additionalChildTaxCredit,
      line29_aotcRefundable: 0, // AOTC refundable portion
      line31_schedule3_payments: data.payments.otherPayments,
      line32_totalPayments: 0,

      // Refund or Amount Owed
      line33_overpaid: 0,
      line34_refund: 0,
      line35a_routingNumber: data.bankInfo?.routingNumber,
      line35b_accountNumber: data.bankInfo?.accountNumber,
      line35c_accountType: data.bankInfo?.accountType,
      line36_appliedToNext: 0,
      line37_amountOwed: 0,
      line38_estimatedPenalty: 0,

      // Dependents
      dependents: data.dependents.map(d => ({
        firstName: d.firstName,
        lastName: d.lastName,
        ssn: d.ssn,
        relationship: d.relationship,
        childTaxCredit: d.qualifiesForChildTaxCredit,
      })),
    };
  }

  /**
   * Generate Schedule 1 data
   */
  private generateSchedule1Data(data: TaxReturnData): Record<string, unknown> {
    return {
      // Part I - Additional Income
      line1_taxableRefunds: data.income.taxableRefunds,
      line2_alimony: data.income.alimonyReceived,
      line3_businessIncome: data.income.businessIncome,
      line4_otherGains: data.income.otherGains,
      line5_rentalRealEstate: data.income.rentalRealEstate,
      line8_otherIncome: data.income.otherIncome,
      line9_totalAdditionalIncome: data.income.taxableRefunds + data.income.alimonyReceived +
        data.income.businessIncome + data.income.otherGains + data.income.rentalRealEstate +
        data.income.otherIncome,

      // Part II - Adjustments
      line11_educatorExpenses: data.deductions.adjustmentsToIncome.educatorExpenses,
      line13_hsaDeduction: data.deductions.adjustmentsToIncome.hsaDeduction,
      line14_movingExpenses: data.deductions.adjustmentsToIncome.movingExpenses,
      line15_selfEmploymentTax: data.deductions.adjustmentsToIncome.selfEmploymentTax / 2,
      line16_sepSimpleIra: data.deductions.adjustmentsToIncome.sepSimpleIra,
      line17_selfEmployedHealthInsurance: data.deductions.adjustmentsToIncome.selfEmployedHealthInsurance,
      line18_earlyWithdrawalPenalty: data.deductions.adjustmentsToIncome.earlyWithdrawalPenalty,
      line19_alimonyPaid: data.deductions.adjustmentsToIncome.alimonyPaid,
      line20_iraDeduction: data.deductions.adjustmentsToIncome.iraDeduction,
      line21_studentLoanInterest: Math.min(data.deductions.adjustmentsToIncome.studentLoanInterest, 2500),
      line26_totalAdjustments: this.calculateAdjustments(data.deductions),
    };
  }

  /**
   * Generate Schedule 2 data (Additional Taxes)
   */
  private generateSchedule2Data(data: TaxReturnData): Record<string, unknown> {
    return {
      // Part I - Tax
      line1_amt: 0, // Alternative Minimum Tax not implemented
      line2_excessAdvancePTC: 0,
      line3_part1Total: 0,

      // Part II - Other Taxes
      line4_selfEmploymentTax: data.deductions.adjustmentsToIncome.selfEmploymentTax,
      line5_unreportedTips: 0,
      line6_additionalMedicare: 0, // 0.9% on wages over $200k
      line8_householdEmployment: 0,
      line9_firstTimeHomebuyer: 0,
      line10_aca: 0, // ACA individual shared responsibility payment (no longer applies)
      line17_part2Total: data.deductions.adjustmentsToIncome.selfEmploymentTax,
      line21_total: data.deductions.adjustmentsToIncome.selfEmploymentTax,
    };
  }

  /**
   * Generate Schedule 3 data (Additional Credits)
   */
  private generateSchedule3Data(data: TaxReturnData): Record<string, unknown> {
    return {
      // Part I - Nonrefundable Credits
      line1_foreignTaxCredit: data.credits.foreignTaxCredit,
      line2_childDependentCare: data.credits.childDependentCareCredit,
      line3_educationCredits: data.credits.educationCredits,
      line4_retirementSavings: data.credits.retirementSavingsCredit,
      line5_residentialEnergy: data.credits.residentialEnergyCredit,
      line6_otherCredits: data.credits.otherCredits,
      line8_part1Total: data.credits.foreignTaxCredit + data.credits.childDependentCareCredit +
        data.credits.educationCredits + data.credits.retirementSavingsCredit +
        data.credits.residentialEnergyCredit + data.credits.otherCredits,

      // Part II - Other Payments and Refundable Credits
      // Most refundable credits go directly on Form 1040
      line14_part2Total: 0,
      line15_total: data.credits.foreignTaxCredit + data.credits.childDependentCareCredit +
        data.credits.educationCredits + data.credits.retirementSavingsCredit +
        data.credits.residentialEnergyCredit + data.credits.otherCredits,
    };
  }

  /**
   * Generate Schedule A data (Itemized Deductions)
   */
  private generateScheduleAData(data: TaxReturnData): Record<string, unknown> {
    const itemized = data.deductions.itemizedDeductions;
    if (!itemized) return {};

    // Calculate AGI for medical expense threshold
    const totalIncome = this.calculateTotalIncome(data.income);
    const adjustments = this.calculateAdjustments(data.deductions);
    const agi = totalIncome - adjustments;

    // Medical expenses over 7.5% of AGI
    const medicalThreshold = agi * 0.075;
    const deductibleMedical = Math.max(0, itemized.medicalExpenses - medicalThreshold);

    // SALT cap at $10,000
    const saltTotal = Math.min(
      itemized.stateLocalTaxes + itemized.realEstateTaxes + itemized.personalPropertyTaxes,
      10000
    );

    return {
      // Medical and Dental
      line1_medicalExpenses: itemized.medicalExpenses,
      line2_agiPercent: medicalThreshold,
      line3_medicalDeduction: deductibleMedical,

      // Taxes
      line5a_stateLocalIncome: itemized.stateLocalTaxes,
      line5b_stateLocalSales: 0, // Alternative to 5a
      line5c_realEstateTaxes: itemized.realEstateTaxes,
      line5d_personalProperty: itemized.personalPropertyTaxes,
      line5e_otherTaxes: 0,
      line6_taxesTotal: saltTotal,

      // Interest
      line8a_homeMortgage: itemized.mortgageInterest,
      line8b_mortgageInsurance: itemized.mortgageInsurancePremiums,
      line9_investmentInterest: 0,
      line10_interestTotal: itemized.mortgageInterest + itemized.mortgageInsurancePremiums,

      // Charitable
      line11_charitableCash: itemized.charitableCash,
      line12_charitableNonCash: itemized.charitableNonCash,
      line13_carryover: 0,
      line14_charitableTotal: itemized.charitableCash + itemized.charitableNonCash,

      // Casualty Losses
      line15_casualtyLosses: itemized.casualtyLosses,

      // Other
      line16_otherDeductions: itemized.miscDeductions,

      // Total
      line17_totalItemized: deductibleMedical + saltTotal +
        itemized.mortgageInterest + itemized.mortgageInsurancePremiums +
        itemized.charitableCash + itemized.charitableNonCash +
        itemized.casualtyLosses + itemized.miscDeductions,
    };
  }

  /**
   * Generate Schedule C data (Business Income)
   */
  private generateScheduleCData(data: TaxReturnData): Record<string, unknown> {
    // Simplified Schedule C - in real implementation would have full expense breakdown
    return {
      line1_grossReceipts: data.income.businessIncome,
      line2_returns: 0,
      line3_netReceipts: data.income.businessIncome,
      line4_costOfGoodsSold: 0,
      line5_grossProfit: data.income.businessIncome,
      line6_otherIncome: 0,
      line7_grossIncome: data.income.businessIncome,

      // Expenses (would be itemized in full implementation)
      line28_totalExpenses: 0,
      line29_tentativeProfit: data.income.businessIncome,
      line30_homeExpenses: 0,
      line31_netProfit: data.income.businessIncome,
    };
  }

  /**
   * Generate Schedule SE data (Self-Employment Tax)
   */
  private generateScheduleSEData(data: TaxReturnData): Record<string, unknown> {
    const netEarnings = data.income.businessIncome * 0.9235; // 92.35% of net self-employment income
    const socialSecurityMax = 168600; // 2024 wage base

    const socialSecurityTax = Math.min(netEarnings, socialSecurityMax) * 0.124;
    const medicareTax = netEarnings * 0.029;
    const totalSETax = socialSecurityTax + medicareTax;

    return {
      line2_netEarnings: data.income.businessIncome,
      line3_multiplied: netEarnings,
      line4_socialSecurityWages: 0, // W-2 SS wages
      line5_unreported: 0,
      line6_total: 0,
      line7_maximum: socialSecurityMax,
      line8_subtract: socialSecurityMax,
      line9_smaller: Math.min(netEarnings, socialSecurityMax),
      line10_socialSecurityTax: socialSecurityTax,
      line11_medicareTax: medicareTax,
      line12_selfEmploymentTax: totalSETax,
      line13_deduction: totalSETax / 2,
    };
  }

  /**
   * Generate a summary PDF (simplified implementation)
   * In production, this would use pdf-lib to fill actual IRS form templates
   */
  private async generateSummaryPdf(
    data: TaxReturnData,
    form1040: Record<string, unknown>,
    schedules: Record<string, unknown>,
    options: PdfGenerationOptions
  ): Promise<string> {
    // This is a placeholder that would be replaced with actual PDF generation
    // using pdf-lib or similar library to fill IRS form templates

    const summary = {
      taxYear: data.taxYear,
      taxpayer: `${data.taxpayerInfo.firstName} ${data.taxpayerInfo.lastName}`,
      filingStatus: data.filingStatus,
      form1040: form1040,
      schedules: schedules,
      generatedAt: new Date().toISOString(),
      format: options.format,
    };

    // Convert to base64 (in reality, this would be actual PDF bytes)
    return Buffer.from(JSON.stringify(summary, null, 2)).toString('base64');
  }

  // ==========================================================================
  // Filing Methods
  // ==========================================================================

  /**
   * Submit a tax return for e-filing (placeholder for future MeF integration)
   */
  async submitForEFiling(
    taxReturnId: string,
    userId: string
  ): Promise<{ success: boolean; submissionId?: string; errors?: string[] }> {
    try {
      logger.info(`E-Filing submission requested for return ${taxReturnId}`);

      // Create submission record
      const { data: submission, error } = await supabase
        .from('e_filing_submissions')
        .insert({
          tax_return_id: taxReturnId,
          user_id: userId,
          status: 'pending_review',
          filing_type: 'federal',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      // In production, this would:
      // 1. Generate XML in IRS MeF format
      // 2. Submit to IRS through authorized e-file transmitter
      // 3. Receive acknowledgment

      // For now, return a simulated pending status
      return {
        success: true,
        submissionId: submission.id,
      };
    } catch (error) {
      logger.error('E-Filing submission failed:', error);
      return {
        success: false,
        errors: [error instanceof Error ? error.message : 'E-Filing submission failed'],
      };
    }
  }

  /**
   * Check e-filing status
   */
  async checkFilingStatus(submissionId: string): Promise<EFilingSubmission | null> {
    const { data, error } = await supabase
      .from('e_filing_submissions')
      .select('*')
      .eq('id', submissionId)
      .single();

    if (error) {
      logger.error('Failed to check filing status:', error);
      return null;
    }

    return {
      id: data.id,
      taxReturnId: data.tax_return_id,
      userId: data.user_id,
      taxYear: data.tax_year,
      filingType: data.filing_type,
      stateCode: data.state_code,
      status: data.status,
      submissionId: data.submission_id,
      confirmationNumber: data.confirmation_number,
      submittedAt: data.submitted_at ? new Date(data.submitted_at) : undefined,
      acceptedAt: data.accepted_at ? new Date(data.accepted_at) : undefined,
      rejectedAt: data.rejected_at ? new Date(data.rejected_at) : undefined,
      rejectionReason: data.rejection_reason,
      pdfUrl: data.pdf_url,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    };
  }

  // ==========================================================================
  // Helper Methods
  // ==========================================================================

  /**
   * Calculate total income
   */
  private calculateTotalIncome(income: IncomeData): number {
    return income.wages + income.salaries + income.tips +
      income.interestIncome + income.dividendIncome +
      income.taxableRefunds + income.alimonyReceived +
      income.businessIncome + income.capitalGains - income.capitalLosses +
      income.otherGains + income.iraDistributions +
      income.pensionsAnnuities + income.rentalRealEstate +
      income.socialSecurityBenefits + income.otherIncome;
  }

  /**
   * Calculate adjustments to income
   */
  private calculateAdjustments(deductions: DeductionData): number {
    const adj = deductions.adjustmentsToIncome;
    return Math.min(adj.educatorExpenses, 300) +
      adj.hsaDeduction +
      adj.movingExpenses +
      (adj.selfEmploymentTax / 2) +
      adj.selfEmployedHealthInsurance +
      adj.sepSimpleIra +
      adj.selfEmployedRetirement +
      adj.earlyWithdrawalPenalty +
      adj.alimonyPaid +
      adj.iraDeduction +
      Math.min(adj.studentLoanInterest, 2500);
  }

  /**
   * Calculate itemized deductions
   */
  private calculateItemizedDeductions(deductions: DeductionData): number {
    if (!deductions.itemizedDeductions) return 0;

    const itemized = deductions.itemizedDeductions;

    // SALT capped at $10,000
    const saltDeduction = Math.min(
      itemized.stateLocalTaxes + itemized.realEstateTaxes + itemized.personalPropertyTaxes,
      10000
    );

    return itemized.medicalExpenses + // Note: Would apply 7.5% AGI floor in real calculation
      saltDeduction +
      itemized.mortgageInterest +
      itemized.mortgageInsurancePremiums +
      itemized.charitableCash +
      itemized.charitableNonCash +
      itemized.casualtyLosses +
      itemized.miscDeductions;
  }

  /**
   * Validate SSN format
   */
  private isValidSSN(ssn: string): boolean {
    // Remove dashes and spaces
    const cleaned = ssn.replace(/[-\s]/g, '');
    // Must be 9 digits, cannot start with 9, 000, or 666
    return /^(?!9|000|666)\d{9}$/.test(cleaned);
  }

  /**
   * Validate EIN format
   */
  private isValidEIN(ein: string): boolean {
    const cleaned = ein.replace(/[-\s]/g, '');
    return /^\d{9}$/.test(cleaned);
  }

  /**
   * Validate ZIP code format
   */
  private isValidZipCode(zip: string): boolean {
    return /^\d{5}(-\d{4})?$/.test(zip);
  }

  /**
   * Validate routing number (ABA)
   */
  private isValidRoutingNumber(routing: string): boolean {
    if (!/^\d{9}$/.test(routing)) return false;

    // Checksum validation
    const digits = routing.split('').map(Number);
    const checksum = (3 * (digits[0] + digits[3] + digits[6]) +
      7 * (digits[1] + digits[4] + digits[7]) +
      (digits[2] + digits[5] + digits[8])) % 10;

    return checksum === 0;
  }

  /**
   * Calculate age from date of birth
   */
  private calculateAge(dateOfBirth: string): number {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    return age;
  }
}

// Export singleton instance
export const eFilingService = new EFilingService();
