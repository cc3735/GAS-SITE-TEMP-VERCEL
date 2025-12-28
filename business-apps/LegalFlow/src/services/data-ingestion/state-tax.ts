/**
 * State Tax Data Ingestion Service
 * 
 * Comprehensive tax data for all 50 US states including:
 * - State income tax brackets
 * - Tax type (graduated, flat, none)
 * - Filing requirements
 * - Deadlines and resources
 */

import { supabaseAdmin } from '../../utils/supabase.js';
import { logger } from '../../utils/logger.js';
import type { IngestionResult, StateTaxInfo, TaxBracket } from './types.js';

export class StateTaxDataIngestion {
  private taxYear: number;

  constructor(taxYear: number = 2024) {
    this.taxYear = taxYear;
  }

  async ingestAll(): Promise<IngestionResult> {
    const startTime = Date.now();
    let totalProcessed = 0;
    let totalCreated = 0;
    let totalFailed = 0;

    // Ingest state tax info
    const stateInfoResult = await this.ingestStateTaxInfo();
    totalProcessed += stateInfoResult.recordsProcessed;
    totalCreated += stateInfoResult.recordsCreated;
    totalFailed += stateInfoResult.recordsFailed;

    // Ingest state tax brackets
    const bracketsResult = await this.ingestStateTaxBrackets();
    totalProcessed += bracketsResult.recordsProcessed;
    totalCreated += bracketsResult.recordsCreated;
    totalFailed += bracketsResult.recordsFailed;

    logger.info(`State tax data ingestion completed for ${this.taxYear}`);

    return {
      success: totalFailed === 0,
      recordsProcessed: totalProcessed,
      recordsCreated: totalCreated,
      recordsUpdated: 0,
      recordsFailed: totalFailed,
      errors: [],
      duration: Date.now() - startTime,
    };
  }

  async ingestStateTaxInfo(): Promise<IngestionResult> {
    const startTime = Date.now();

    // Comprehensive state tax information for all 50 states (2024)
    const stateTaxInfo: StateTaxInfo[] = [
      // States with NO income tax
      { stateCode: 'AK', stateName: 'Alaska', taxYear: this.taxYear, hasIncomeTax: false, taxType: 'none', localTaxesApply: false, revenueDeptUrl: 'https://tax.alaska.gov/', revenueDeptPhone: '907-465-2320' },
      { stateCode: 'FL', stateName: 'Florida', taxYear: this.taxYear, hasIncomeTax: false, taxType: 'none', localTaxesApply: false, revenueDeptUrl: 'https://floridarevenue.com/', revenueDeptPhone: '850-488-6800' },
      { stateCode: 'NV', stateName: 'Nevada', taxYear: this.taxYear, hasIncomeTax: false, taxType: 'none', localTaxesApply: false, revenueDeptUrl: 'https://tax.nv.gov/', revenueDeptPhone: '866-962-3707' },
      { stateCode: 'SD', stateName: 'South Dakota', taxYear: this.taxYear, hasIncomeTax: false, taxType: 'none', localTaxesApply: false, revenueDeptUrl: 'https://dor.sd.gov/', revenueDeptPhone: '800-829-9188' },
      { stateCode: 'TX', stateName: 'Texas', taxYear: this.taxYear, hasIncomeTax: false, taxType: 'none', localTaxesApply: false, revenueDeptUrl: 'https://comptroller.texas.gov/', revenueDeptPhone: '800-252-5555' },
      { stateCode: 'WA', stateName: 'Washington', taxYear: this.taxYear, hasIncomeTax: false, taxType: 'none', localTaxesApply: false, revenueDeptUrl: 'https://dor.wa.gov/', revenueDeptPhone: '360-705-6705' },
      { stateCode: 'WY', stateName: 'Wyoming', taxYear: this.taxYear, hasIncomeTax: false, taxType: 'none', localTaxesApply: false, revenueDeptUrl: 'https://revenue.wyo.gov/', revenueDeptPhone: '307-777-5200' },
      
      // States with interest/dividend only tax (effectively no wage income tax)
      { stateCode: 'NH', stateName: 'New Hampshire', taxYear: this.taxYear, hasIncomeTax: true, taxType: 'flat', flatRate: 0.04, localTaxesApply: false, revenueDeptUrl: 'https://www.revenue.nh.gov/', revenueDeptPhone: '603-230-5000', partYearRules: 'Interest and dividends tax only - being phased out' },
      { stateCode: 'TN', stateName: 'Tennessee', taxYear: this.taxYear, hasIncomeTax: false, taxType: 'none', localTaxesApply: false, revenueDeptUrl: 'https://www.tn.gov/revenue.html', revenueDeptPhone: '800-342-1003', partYearRules: 'Hall Tax on interest/dividends fully phased out as of 2021' },
      
      // FLAT TAX STATES
      { stateCode: 'AZ', stateName: 'Arizona', taxYear: this.taxYear, hasIncomeTax: true, taxType: 'flat', flatRate: 0.025, localTaxesApply: false, filingDeadline: '2025-04-15', efilingUrl: 'https://azdor.gov/e-file', formsUrl: 'https://azdor.gov/forms/individual', revenueDeptUrl: 'https://azdor.gov/', revenueDeptPhone: '602-255-3381' },
      { stateCode: 'CO', stateName: 'Colorado', taxYear: this.taxYear, hasIncomeTax: true, taxType: 'flat', flatRate: 0.044, localTaxesApply: true, filingDeadline: '2025-04-15', efilingUrl: 'https://tax.colorado.gov/', formsUrl: 'https://tax.colorado.gov/individual-income-tax-forms', revenueDeptUrl: 'https://tax.colorado.gov/', revenueDeptPhone: '303-238-7378' },
      { stateCode: 'IL', stateName: 'Illinois', taxYear: this.taxYear, hasIncomeTax: true, taxType: 'flat', flatRate: 0.0495, localTaxesApply: false, filingDeadline: '2025-04-15', efilingUrl: 'https://mytax.illinois.gov/', formsUrl: 'https://www2.illinois.gov/rev/forms/incometax', revenueDeptUrl: 'https://www2.illinois.gov/rev', revenueDeptPhone: '800-732-8866' },
      { stateCode: 'IN', stateName: 'Indiana', taxYear: this.taxYear, hasIncomeTax: true, taxType: 'flat', flatRate: 0.0305, localTaxesApply: true, filingDeadline: '2025-04-15', efilingUrl: 'https://www.in.gov/dor/individual-income-taxes/', formsUrl: 'https://www.in.gov/dor/tax-forms/2023-individual-income-tax-forms/', revenueDeptUrl: 'https://www.in.gov/dor/', revenueDeptPhone: '317-232-2240' },
      { stateCode: 'KY', stateName: 'Kentucky', taxYear: this.taxYear, hasIncomeTax: true, taxType: 'flat', flatRate: 0.04, localTaxesApply: true, filingDeadline: '2025-04-15', efilingUrl: 'https://revenue.ky.gov/', formsUrl: 'https://revenue.ky.gov/Individual/Pages/Forms-and-Instructions.aspx', revenueDeptUrl: 'https://revenue.ky.gov/', revenueDeptPhone: '502-564-4581' },
      { stateCode: 'MA', stateName: 'Massachusetts', taxYear: this.taxYear, hasIncomeTax: true, taxType: 'flat', flatRate: 0.05, localTaxesApply: false, filingDeadline: '2025-04-15', efilingUrl: 'https://www.mass.gov/efile', formsUrl: 'https://www.mass.gov/personal-income-tax-forms-and-instructions', revenueDeptUrl: 'https://www.mass.gov/orgs/massachusetts-department-of-revenue', revenueDeptPhone: '617-887-6367' },
      { stateCode: 'MI', stateName: 'Michigan', taxYear: this.taxYear, hasIncomeTax: true, taxType: 'flat', flatRate: 0.0405, localTaxesApply: true, filingDeadline: '2025-04-15', efilingUrl: 'https://www.michigan.gov/taxes/', formsUrl: 'https://www.michigan.gov/taxes/iit/forms', revenueDeptUrl: 'https://www.michigan.gov/taxes/', revenueDeptPhone: '517-636-4486' },
      { stateCode: 'NC', stateName: 'North Carolina', taxYear: this.taxYear, hasIncomeTax: true, taxType: 'flat', flatRate: 0.0475, localTaxesApply: false, filingDeadline: '2025-04-15', efilingUrl: 'https://www.ncdor.gov/file-pay', formsUrl: 'https://www.ncdor.gov/taxes-forms/individual-income-tax/individual-income-tax-forms-instructions', revenueDeptUrl: 'https://www.ncdor.gov/', revenueDeptPhone: '877-252-3052' },
      { stateCode: 'PA', stateName: 'Pennsylvania', taxYear: this.taxYear, hasIncomeTax: true, taxType: 'flat', flatRate: 0.0307, localTaxesApply: true, filingDeadline: '2025-04-15', efilingUrl: 'https://www.revenue.pa.gov/OnlineServices', formsUrl: 'https://www.revenue.pa.gov/FormsandPublications/PersonalIncomeTaxForms', revenueDeptUrl: 'https://www.revenue.pa.gov/', revenueDeptPhone: '717-787-8201' },
      { stateCode: 'UT', stateName: 'Utah', taxYear: this.taxYear, hasIncomeTax: true, taxType: 'flat', flatRate: 0.0465, localTaxesApply: false, filingDeadline: '2025-04-15', efilingUrl: 'https://tax.utah.gov/ecourt/', formsUrl: 'https://tax.utah.gov/forms/current/', revenueDeptUrl: 'https://tax.utah.gov/', revenueDeptPhone: '801-297-2200' },
      
      // GRADUATED TAX STATES
      { stateCode: 'AL', stateName: 'Alabama', taxYear: this.taxYear, hasIncomeTax: true, taxType: 'graduated', localTaxesApply: true, filingDeadline: '2025-04-15', efilingUrl: 'https://myalabamataxes.alabama.gov/', formsUrl: 'https://revenue.alabama.gov/individual-corporate/forms/', revenueDeptUrl: 'https://revenue.alabama.gov/', revenueDeptPhone: '334-242-1170' },
      { stateCode: 'AR', stateName: 'Arkansas', taxYear: this.taxYear, hasIncomeTax: true, taxType: 'graduated', localTaxesApply: false, filingDeadline: '2025-04-15', efilingUrl: 'https://www.dfa.arkansas.gov/office/taxes/', formsUrl: 'https://www.dfa.arkansas.gov/income-tax/individual-income-tax/', revenueDeptUrl: 'https://www.dfa.arkansas.gov/', revenueDeptPhone: '501-682-1100' },
      { stateCode: 'CA', stateName: 'California', taxYear: this.taxYear, hasIncomeTax: true, taxType: 'graduated', localTaxesApply: false, filingDeadline: '2025-04-15', efilingUrl: 'https://www.ftb.ca.gov/file/', formsUrl: 'https://www.ftb.ca.gov/forms/', revenueDeptUrl: 'https://www.ftb.ca.gov/', revenueDeptPhone: '800-852-5711' },
      { stateCode: 'CT', stateName: 'Connecticut', taxYear: this.taxYear, hasIncomeTax: true, taxType: 'graduated', localTaxesApply: false, filingDeadline: '2025-04-15', efilingUrl: 'https://portal.ct.gov/DRS/myconneCT', formsUrl: 'https://portal.ct.gov/DRS/DRS-Forms', revenueDeptUrl: 'https://portal.ct.gov/DRS', revenueDeptPhone: '860-297-5962' },
      { stateCode: 'DE', stateName: 'Delaware', taxYear: this.taxYear, hasIncomeTax: true, taxType: 'graduated', localTaxesApply: true, filingDeadline: '2025-04-30', efilingUrl: 'https://revenue.delaware.gov/', formsUrl: 'https://revenue.delaware.gov/pit/', revenueDeptUrl: 'https://revenue.delaware.gov/', revenueDeptPhone: '302-577-8200' },
      { stateCode: 'GA', stateName: 'Georgia', taxYear: this.taxYear, hasIncomeTax: true, taxType: 'graduated', localTaxesApply: false, filingDeadline: '2025-04-15', efilingUrl: 'https://dor.georgia.gov/filing-options', formsUrl: 'https://dor.georgia.gov/individual-income-tax-forms', revenueDeptUrl: 'https://dor.georgia.gov/', revenueDeptPhone: '877-423-6711' },
      { stateCode: 'HI', stateName: 'Hawaii', taxYear: this.taxYear, hasIncomeTax: true, taxType: 'graduated', localTaxesApply: false, filingDeadline: '2025-04-20', efilingUrl: 'https://tax.hawaii.gov/eservices/', formsUrl: 'https://tax.hawaii.gov/forms/', revenueDeptUrl: 'https://tax.hawaii.gov/', revenueDeptPhone: '808-587-4242' },
      { stateCode: 'ID', stateName: 'Idaho', taxYear: this.taxYear, hasIncomeTax: true, taxType: 'flat', flatRate: 0.058, localTaxesApply: false, filingDeadline: '2025-04-15', efilingUrl: 'https://tax.idaho.gov/i-1097.cfm', formsUrl: 'https://tax.idaho.gov/forms/EFO00089_01-01-2024.pdf', revenueDeptUrl: 'https://tax.idaho.gov/', revenueDeptPhone: '208-334-7660' },
      { stateCode: 'IA', stateName: 'Iowa', taxYear: this.taxYear, hasIncomeTax: true, taxType: 'flat', flatRate: 0.038, localTaxesApply: true, filingDeadline: '2025-04-30', efilingUrl: 'https://tax.iowa.gov/', formsUrl: 'https://tax.iowa.gov/individual-income-tax', revenueDeptUrl: 'https://tax.iowa.gov/', revenueDeptPhone: '515-281-3114' },
      { stateCode: 'KS', stateName: 'Kansas', taxYear: this.taxYear, hasIncomeTax: true, taxType: 'graduated', localTaxesApply: false, filingDeadline: '2025-04-15', efilingUrl: 'https://www.kdor.ks.gov/Apps/kcsc/login.aspx', formsUrl: 'https://www.ksrevenue.gov/forms-inctax.html', revenueDeptUrl: 'https://www.ksrevenue.gov/', revenueDeptPhone: '785-368-8222' },
      { stateCode: 'LA', stateName: 'Louisiana', taxYear: this.taxYear, hasIncomeTax: true, taxType: 'graduated', localTaxesApply: false, filingDeadline: '2025-05-15', efilingUrl: 'https://revenue.louisiana.gov/EServices', formsUrl: 'https://revenue.louisiana.gov/TaxForms/IndividualIncomeTax', revenueDeptUrl: 'https://revenue.louisiana.gov/', revenueDeptPhone: '225-219-0102' },
      { stateCode: 'ME', stateName: 'Maine', taxYear: this.taxYear, hasIncomeTax: true, taxType: 'graduated', localTaxesApply: false, filingDeadline: '2025-04-15', efilingUrl: 'https://www.maine.gov/revenue/taxes/income-estate-tax/file-return', formsUrl: 'https://www.maine.gov/revenue/tax-return-forms', revenueDeptUrl: 'https://www.maine.gov/revenue/', revenueDeptPhone: '207-624-9670' },
      { stateCode: 'MD', stateName: 'Maryland', taxYear: this.taxYear, hasIncomeTax: true, taxType: 'graduated', localTaxesApply: true, filingDeadline: '2025-04-15', efilingUrl: 'https://interactive.marylandtaxes.gov/', formsUrl: 'https://www.marylandtaxes.gov/individual/income/forms.php', revenueDeptUrl: 'https://www.marylandtaxes.gov/', revenueDeptPhone: '800-638-2937' },
      { stateCode: 'MN', stateName: 'Minnesota', taxYear: this.taxYear, hasIncomeTax: true, taxType: 'graduated', localTaxesApply: false, filingDeadline: '2025-04-15', efilingUrl: 'https://www.revenue.state.mn.us/e-file', formsUrl: 'https://www.revenue.state.mn.us/individual-income-tax-forms-instructions', revenueDeptUrl: 'https://www.revenue.state.mn.us/', revenueDeptPhone: '651-296-3781' },
      { stateCode: 'MS', stateName: 'Mississippi', taxYear: this.taxYear, hasIncomeTax: true, taxType: 'flat', flatRate: 0.05, localTaxesApply: false, filingDeadline: '2025-04-15', efilingUrl: 'https://www.dor.ms.gov/individual/efile', formsUrl: 'https://www.dor.ms.gov/individual/individual-tax-forms', revenueDeptUrl: 'https://www.dor.ms.gov/', revenueDeptPhone: '601-923-7000' },
      { stateCode: 'MO', stateName: 'Missouri', taxYear: this.taxYear, hasIncomeTax: true, taxType: 'graduated', localTaxesApply: true, filingDeadline: '2025-04-15', efilingUrl: 'https://dor.mo.gov/personal/', formsUrl: 'https://dor.mo.gov/forms/', revenueDeptUrl: 'https://dor.mo.gov/', revenueDeptPhone: '573-751-3505' },
      { stateCode: 'MT', stateName: 'Montana', taxYear: this.taxYear, hasIncomeTax: true, taxType: 'graduated', localTaxesApply: false, filingDeadline: '2025-04-15', efilingUrl: 'https://mtrevenue.gov/', formsUrl: 'https://mtrevenue.gov/taxes/individual-income-tax/', revenueDeptUrl: 'https://mtrevenue.gov/', revenueDeptPhone: '406-444-6900' },
      { stateCode: 'NE', stateName: 'Nebraska', taxYear: this.taxYear, hasIncomeTax: true, taxType: 'graduated', localTaxesApply: false, filingDeadline: '2025-04-15', efilingUrl: 'https://revenue.nebraska.gov/individuals/free-file', formsUrl: 'https://revenue.nebraska.gov/individuals/individual-income-tax-forms', revenueDeptUrl: 'https://revenue.nebraska.gov/', revenueDeptPhone: '800-742-7474' },
      { stateCode: 'NJ', stateName: 'New Jersey', taxYear: this.taxYear, hasIncomeTax: true, taxType: 'graduated', localTaxesApply: false, filingDeadline: '2025-04-15', efilingUrl: 'https://www.state.nj.us/treasury/taxation/ot13.shtml', formsUrl: 'https://www.state.nj.us/treasury/taxation/prntgit.shtml', revenueDeptUrl: 'https://www.state.nj.us/treasury/taxation/', revenueDeptPhone: '609-292-6400' },
      { stateCode: 'NM', stateName: 'New Mexico', taxYear: this.taxYear, hasIncomeTax: true, taxType: 'graduated', localTaxesApply: false, filingDeadline: '2025-04-15', efilingUrl: 'https://tap.state.nm.us/', formsUrl: 'https://www.tax.newmexico.gov/individuals/file-your-taxes-overview/filing-options/', revenueDeptUrl: 'https://www.tax.newmexico.gov/', revenueDeptPhone: '866-285-2996' },
      { stateCode: 'NY', stateName: 'New York', taxYear: this.taxYear, hasIncomeTax: true, taxType: 'graduated', localTaxesApply: true, filingDeadline: '2025-04-15', efilingUrl: 'https://www.tax.ny.gov/pit/', formsUrl: 'https://www.tax.ny.gov/forms/income_cur_forms.htm', revenueDeptUrl: 'https://www.tax.ny.gov/', revenueDeptPhone: '518-457-5181' },
      { stateCode: 'ND', stateName: 'North Dakota', taxYear: this.taxYear, hasIncomeTax: true, taxType: 'flat', flatRate: 0.0195, localTaxesApply: false, filingDeadline: '2025-04-15', efilingUrl: 'https://www.tax.nd.gov/individual-income-tax', formsUrl: 'https://www.tax.nd.gov/forms', revenueDeptUrl: 'https://www.tax.nd.gov/', revenueDeptPhone: '701-328-7088' },
      { stateCode: 'OH', stateName: 'Ohio', taxYear: this.taxYear, hasIncomeTax: true, taxType: 'graduated', localTaxesApply: true, filingDeadline: '2025-04-15', efilingUrl: 'https://tax.ohio.gov/individual', formsUrl: 'https://tax.ohio.gov/individual/resources/forms', revenueDeptUrl: 'https://tax.ohio.gov/', revenueDeptPhone: '800-282-1780' },
      { stateCode: 'OK', stateName: 'Oklahoma', taxYear: this.taxYear, hasIncomeTax: true, taxType: 'graduated', localTaxesApply: false, filingDeadline: '2025-04-15', efilingUrl: 'https://oktap.tax.ok.gov/', formsUrl: 'https://oklahoma.gov/tax/forms.html', revenueDeptUrl: 'https://oklahoma.gov/tax.html', revenueDeptPhone: '405-521-3160' },
      { stateCode: 'OR', stateName: 'Oregon', taxYear: this.taxYear, hasIncomeTax: true, taxType: 'graduated', localTaxesApply: true, filingDeadline: '2025-04-15', efilingUrl: 'https://www.oregon.gov/dor/programs/individuals/pages/efile.aspx', formsUrl: 'https://www.oregon.gov/dor/forms/Pages/default.aspx', revenueDeptUrl: 'https://www.oregon.gov/dor/', revenueDeptPhone: '800-356-4222' },
      { stateCode: 'RI', stateName: 'Rhode Island', taxYear: this.taxYear, hasIncomeTax: true, taxType: 'graduated', localTaxesApply: false, filingDeadline: '2025-04-15', efilingUrl: 'https://www.ri.gov/taxation/', formsUrl: 'https://tax.ri.gov/tax-sections/personal-income-tax/forms', revenueDeptUrl: 'https://tax.ri.gov/', revenueDeptPhone: '401-574-8829' },
      { stateCode: 'SC', stateName: 'South Carolina', taxYear: this.taxYear, hasIncomeTax: true, taxType: 'graduated', localTaxesApply: false, filingDeadline: '2025-04-15', efilingUrl: 'https://dor.sc.gov/tax/individual-income', formsUrl: 'https://dor.sc.gov/forms-by-tax-type', revenueDeptUrl: 'https://dor.sc.gov/', revenueDeptPhone: '844-898-8542' },
      { stateCode: 'VT', stateName: 'Vermont', taxYear: this.taxYear, hasIncomeTax: true, taxType: 'graduated', localTaxesApply: false, filingDeadline: '2025-04-15', efilingUrl: 'https://tax.vermont.gov/individuals', formsUrl: 'https://tax.vermont.gov/tax-forms-and-publications', revenueDeptUrl: 'https://tax.vermont.gov/', revenueDeptPhone: '802-828-2505' },
      { stateCode: 'VA', stateName: 'Virginia', taxYear: this.taxYear, hasIncomeTax: true, taxType: 'graduated', localTaxesApply: false, filingDeadline: '2025-05-01', efilingUrl: 'https://www.tax.virginia.gov/', formsUrl: 'https://www.tax.virginia.gov/forms', revenueDeptUrl: 'https://www.tax.virginia.gov/', revenueDeptPhone: '804-367-8031' },
      { stateCode: 'WV', stateName: 'West Virginia', taxYear: this.taxYear, hasIncomeTax: true, taxType: 'graduated', localTaxesApply: false, filingDeadline: '2025-04-15', efilingUrl: 'https://tax.wv.gov/Individuals/Pages/default.aspx', formsUrl: 'https://tax.wv.gov/Individuals/TaxForms/Pages/IncomeTax.aspx', revenueDeptUrl: 'https://tax.wv.gov/', revenueDeptPhone: '800-982-8297' },
      { stateCode: 'WI', stateName: 'Wisconsin', taxYear: this.taxYear, hasIncomeTax: true, taxType: 'graduated', localTaxesApply: false, filingDeadline: '2025-04-15', efilingUrl: 'https://www.revenue.wi.gov/pages/efile/home.aspx', formsUrl: 'https://www.revenue.wi.gov/Pages/Form/individual-home.aspx', revenueDeptUrl: 'https://www.revenue.wi.gov/', revenueDeptPhone: '608-266-2772' },
    ];

    let created = 0;
    let failed = 0;

    for (const info of stateTaxInfo) {
      try {
        const { error } = await supabaseAdmin
          .from('lf_state_tax_info')
          .upsert({
            state_code: info.stateCode,
            state_name: info.stateName,
            tax_year: info.taxYear,
            has_income_tax: info.hasIncomeTax,
            tax_type: info.taxType,
            flat_rate: info.flatRate,
            local_taxes_apply: info.localTaxesApply,
            reciprocity_states: info.reciprocityStates,
            filing_deadline: info.filingDeadline,
            extension_deadline: info.extensionDeadline,
            minimum_filing_requirement: info.minimumFilingRequirement,
            resident_definition: info.residentDefinition,
            part_year_rules: info.partYearRules,
            nonresident_rules: info.nonresidentRules,
            efiling_url: info.efilingUrl,
            forms_url: info.formsUrl,
            revenue_dept_url: info.revenueDeptUrl,
            revenue_dept_phone: info.revenueDeptPhone,
            source_url: info.sourceUrl,
            last_updated: new Date().toISOString().split('T')[0],
          }, {
            onConflict: 'state_code,tax_year',
          });

        if (error) throw error;
        created++;
      } catch (error) {
        logger.error('Failed to upsert state tax info', { state: info.stateCode, error });
        failed++;
      }
    }

    return {
      success: failed === 0,
      recordsProcessed: stateTaxInfo.length,
      recordsCreated: created,
      recordsUpdated: 0,
      recordsFailed: failed,
      errors: [],
      duration: Date.now() - startTime,
    };
  }

  async ingestStateTaxBrackets(): Promise<IngestionResult> {
    const startTime = Date.now();

    // State tax brackets for graduated states (2024)
    const stateBrackets: TaxBracket[] = [
      // Alabama (2-5%)
      { taxYear: this.taxYear, jurisdiction: 'AL', filingStatus: 'single', bracketMin: 0, bracketMax: 500, rate: 0.02 },
      { taxYear: this.taxYear, jurisdiction: 'AL', filingStatus: 'single', bracketMin: 500, bracketMax: 3000, rate: 0.04 },
      { taxYear: this.taxYear, jurisdiction: 'AL', filingStatus: 'single', bracketMin: 3000, bracketMax: null, rate: 0.05 },
      { taxYear: this.taxYear, jurisdiction: 'AL', filingStatus: 'married_joint', bracketMin: 0, bracketMax: 1000, rate: 0.02 },
      { taxYear: this.taxYear, jurisdiction: 'AL', filingStatus: 'married_joint', bracketMin: 1000, bracketMax: 6000, rate: 0.04 },
      { taxYear: this.taxYear, jurisdiction: 'AL', filingStatus: 'married_joint', bracketMin: 6000, bracketMax: null, rate: 0.05 },

      // Arkansas (2-4.7%)
      { taxYear: this.taxYear, jurisdiction: 'AR', filingStatus: 'single', bracketMin: 0, bracketMax: 5099, rate: 0.02 },
      { taxYear: this.taxYear, jurisdiction: 'AR', filingStatus: 'single', bracketMin: 5099, bracketMax: 10299, rate: 0.04 },
      { taxYear: this.taxYear, jurisdiction: 'AR', filingStatus: 'single', bracketMin: 10299, bracketMax: null, rate: 0.047 },

      // California (1-13.3%)
      { taxYear: this.taxYear, jurisdiction: 'CA', filingStatus: 'single', bracketMin: 0, bracketMax: 10412, rate: 0.01 },
      { taxYear: this.taxYear, jurisdiction: 'CA', filingStatus: 'single', bracketMin: 10412, bracketMax: 24684, rate: 0.02 },
      { taxYear: this.taxYear, jurisdiction: 'CA', filingStatus: 'single', bracketMin: 24684, bracketMax: 38959, rate: 0.04 },
      { taxYear: this.taxYear, jurisdiction: 'CA', filingStatus: 'single', bracketMin: 38959, bracketMax: 54081, rate: 0.06 },
      { taxYear: this.taxYear, jurisdiction: 'CA', filingStatus: 'single', bracketMin: 54081, bracketMax: 68350, rate: 0.08 },
      { taxYear: this.taxYear, jurisdiction: 'CA', filingStatus: 'single', bracketMin: 68350, bracketMax: 349137, rate: 0.093 },
      { taxYear: this.taxYear, jurisdiction: 'CA', filingStatus: 'single', bracketMin: 349137, bracketMax: 418961, rate: 0.103 },
      { taxYear: this.taxYear, jurisdiction: 'CA', filingStatus: 'single', bracketMin: 418961, bracketMax: 698271, rate: 0.113 },
      { taxYear: this.taxYear, jurisdiction: 'CA', filingStatus: 'single', bracketMin: 698271, bracketMax: 1000000, rate: 0.123 },
      { taxYear: this.taxYear, jurisdiction: 'CA', filingStatus: 'single', bracketMin: 1000000, bracketMax: null, rate: 0.133 },
      
      { taxYear: this.taxYear, jurisdiction: 'CA', filingStatus: 'married_joint', bracketMin: 0, bracketMax: 20824, rate: 0.01 },
      { taxYear: this.taxYear, jurisdiction: 'CA', filingStatus: 'married_joint', bracketMin: 20824, bracketMax: 49368, rate: 0.02 },
      { taxYear: this.taxYear, jurisdiction: 'CA', filingStatus: 'married_joint', bracketMin: 49368, bracketMax: 77918, rate: 0.04 },
      { taxYear: this.taxYear, jurisdiction: 'CA', filingStatus: 'married_joint', bracketMin: 77918, bracketMax: 108162, rate: 0.06 },
      { taxYear: this.taxYear, jurisdiction: 'CA', filingStatus: 'married_joint', bracketMin: 108162, bracketMax: 136700, rate: 0.08 },
      { taxYear: this.taxYear, jurisdiction: 'CA', filingStatus: 'married_joint', bracketMin: 136700, bracketMax: 698274, rate: 0.093 },
      { taxYear: this.taxYear, jurisdiction: 'CA', filingStatus: 'married_joint', bracketMin: 698274, bracketMax: 837922, rate: 0.103 },
      { taxYear: this.taxYear, jurisdiction: 'CA', filingStatus: 'married_joint', bracketMin: 837922, bracketMax: 1396542, rate: 0.113 },
      { taxYear: this.taxYear, jurisdiction: 'CA', filingStatus: 'married_joint', bracketMin: 1396542, bracketMax: 2000000, rate: 0.123 },
      { taxYear: this.taxYear, jurisdiction: 'CA', filingStatus: 'married_joint', bracketMin: 2000000, bracketMax: null, rate: 0.133 },

      // Connecticut (3-6.99%)
      { taxYear: this.taxYear, jurisdiction: 'CT', filingStatus: 'single', bracketMin: 0, bracketMax: 10000, rate: 0.03 },
      { taxYear: this.taxYear, jurisdiction: 'CT', filingStatus: 'single', bracketMin: 10000, bracketMax: 50000, rate: 0.05 },
      { taxYear: this.taxYear, jurisdiction: 'CT', filingStatus: 'single', bracketMin: 50000, bracketMax: 100000, rate: 0.055 },
      { taxYear: this.taxYear, jurisdiction: 'CT', filingStatus: 'single', bracketMin: 100000, bracketMax: 200000, rate: 0.06 },
      { taxYear: this.taxYear, jurisdiction: 'CT', filingStatus: 'single', bracketMin: 200000, bracketMax: 250000, rate: 0.065 },
      { taxYear: this.taxYear, jurisdiction: 'CT', filingStatus: 'single', bracketMin: 250000, bracketMax: 500000, rate: 0.069 },
      { taxYear: this.taxYear, jurisdiction: 'CT', filingStatus: 'single', bracketMin: 500000, bracketMax: null, rate: 0.0699 },

      // Delaware (2.2-6.6%)
      { taxYear: this.taxYear, jurisdiction: 'DE', filingStatus: 'single', bracketMin: 0, bracketMax: 2000, rate: 0 },
      { taxYear: this.taxYear, jurisdiction: 'DE', filingStatus: 'single', bracketMin: 2000, bracketMax: 5000, rate: 0.022 },
      { taxYear: this.taxYear, jurisdiction: 'DE', filingStatus: 'single', bracketMin: 5000, bracketMax: 10000, rate: 0.039 },
      { taxYear: this.taxYear, jurisdiction: 'DE', filingStatus: 'single', bracketMin: 10000, bracketMax: 20000, rate: 0.048 },
      { taxYear: this.taxYear, jurisdiction: 'DE', filingStatus: 'single', bracketMin: 20000, bracketMax: 25000, rate: 0.052 },
      { taxYear: this.taxYear, jurisdiction: 'DE', filingStatus: 'single', bracketMin: 25000, bracketMax: 60000, rate: 0.0555 },
      { taxYear: this.taxYear, jurisdiction: 'DE', filingStatus: 'single', bracketMin: 60000, bracketMax: null, rate: 0.066 },

      // Georgia (1-5.75%)
      { taxYear: this.taxYear, jurisdiction: 'GA', filingStatus: 'single', bracketMin: 0, bracketMax: 750, rate: 0.01 },
      { taxYear: this.taxYear, jurisdiction: 'GA', filingStatus: 'single', bracketMin: 750, bracketMax: 2250, rate: 0.02 },
      { taxYear: this.taxYear, jurisdiction: 'GA', filingStatus: 'single', bracketMin: 2250, bracketMax: 3750, rate: 0.03 },
      { taxYear: this.taxYear, jurisdiction: 'GA', filingStatus: 'single', bracketMin: 3750, bracketMax: 5250, rate: 0.04 },
      { taxYear: this.taxYear, jurisdiction: 'GA', filingStatus: 'single', bracketMin: 5250, bracketMax: 7000, rate: 0.05 },
      { taxYear: this.taxYear, jurisdiction: 'GA', filingStatus: 'single', bracketMin: 7000, bracketMax: null, rate: 0.0575 },

      // Hawaii (1.4-11%)
      { taxYear: this.taxYear, jurisdiction: 'HI', filingStatus: 'single', bracketMin: 0, bracketMax: 2400, rate: 0.014 },
      { taxYear: this.taxYear, jurisdiction: 'HI', filingStatus: 'single', bracketMin: 2400, bracketMax: 4800, rate: 0.032 },
      { taxYear: this.taxYear, jurisdiction: 'HI', filingStatus: 'single', bracketMin: 4800, bracketMax: 9600, rate: 0.055 },
      { taxYear: this.taxYear, jurisdiction: 'HI', filingStatus: 'single', bracketMin: 9600, bracketMax: 14400, rate: 0.064 },
      { taxYear: this.taxYear, jurisdiction: 'HI', filingStatus: 'single', bracketMin: 14400, bracketMax: 19200, rate: 0.068 },
      { taxYear: this.taxYear, jurisdiction: 'HI', filingStatus: 'single', bracketMin: 19200, bracketMax: 24000, rate: 0.072 },
      { taxYear: this.taxYear, jurisdiction: 'HI', filingStatus: 'single', bracketMin: 24000, bracketMax: 36000, rate: 0.076 },
      { taxYear: this.taxYear, jurisdiction: 'HI', filingStatus: 'single', bracketMin: 36000, bracketMax: 48000, rate: 0.079 },
      { taxYear: this.taxYear, jurisdiction: 'HI', filingStatus: 'single', bracketMin: 48000, bracketMax: 150000, rate: 0.0825 },
      { taxYear: this.taxYear, jurisdiction: 'HI', filingStatus: 'single', bracketMin: 150000, bracketMax: 175000, rate: 0.09 },
      { taxYear: this.taxYear, jurisdiction: 'HI', filingStatus: 'single', bracketMin: 175000, bracketMax: 200000, rate: 0.10 },
      { taxYear: this.taxYear, jurisdiction: 'HI', filingStatus: 'single', bracketMin: 200000, bracketMax: null, rate: 0.11 },

      // Kansas (3.1-5.7%)
      { taxYear: this.taxYear, jurisdiction: 'KS', filingStatus: 'single', bracketMin: 0, bracketMax: 15000, rate: 0.031 },
      { taxYear: this.taxYear, jurisdiction: 'KS', filingStatus: 'single', bracketMin: 15000, bracketMax: 30000, rate: 0.0525 },
      { taxYear: this.taxYear, jurisdiction: 'KS', filingStatus: 'single', bracketMin: 30000, bracketMax: null, rate: 0.057 },
      { taxYear: this.taxYear, jurisdiction: 'KS', filingStatus: 'married_joint', bracketMin: 0, bracketMax: 30000, rate: 0.031 },
      { taxYear: this.taxYear, jurisdiction: 'KS', filingStatus: 'married_joint', bracketMin: 30000, bracketMax: 60000, rate: 0.0525 },
      { taxYear: this.taxYear, jurisdiction: 'KS', filingStatus: 'married_joint', bracketMin: 60000, bracketMax: null, rate: 0.057 },

      // Louisiana (1.85-4.25%)
      { taxYear: this.taxYear, jurisdiction: 'LA', filingStatus: 'single', bracketMin: 0, bracketMax: 12500, rate: 0.0185 },
      { taxYear: this.taxYear, jurisdiction: 'LA', filingStatus: 'single', bracketMin: 12500, bracketMax: 50000, rate: 0.035 },
      { taxYear: this.taxYear, jurisdiction: 'LA', filingStatus: 'single', bracketMin: 50000, bracketMax: null, rate: 0.0425 },

      // Maine (5.8-7.15%)
      { taxYear: this.taxYear, jurisdiction: 'ME', filingStatus: 'single', bracketMin: 0, bracketMax: 24500, rate: 0.058 },
      { taxYear: this.taxYear, jurisdiction: 'ME', filingStatus: 'single', bracketMin: 24500, bracketMax: 58050, rate: 0.0675 },
      { taxYear: this.taxYear, jurisdiction: 'ME', filingStatus: 'single', bracketMin: 58050, bracketMax: null, rate: 0.0715 },

      // Maryland (2-5.75%)
      { taxYear: this.taxYear, jurisdiction: 'MD', filingStatus: 'single', bracketMin: 0, bracketMax: 1000, rate: 0.02 },
      { taxYear: this.taxYear, jurisdiction: 'MD', filingStatus: 'single', bracketMin: 1000, bracketMax: 2000, rate: 0.03 },
      { taxYear: this.taxYear, jurisdiction: 'MD', filingStatus: 'single', bracketMin: 2000, bracketMax: 3000, rate: 0.04 },
      { taxYear: this.taxYear, jurisdiction: 'MD', filingStatus: 'single', bracketMin: 3000, bracketMax: 100000, rate: 0.0475 },
      { taxYear: this.taxYear, jurisdiction: 'MD', filingStatus: 'single', bracketMin: 100000, bracketMax: 125000, rate: 0.05 },
      { taxYear: this.taxYear, jurisdiction: 'MD', filingStatus: 'single', bracketMin: 125000, bracketMax: 150000, rate: 0.0525 },
      { taxYear: this.taxYear, jurisdiction: 'MD', filingStatus: 'single', bracketMin: 150000, bracketMax: 250000, rate: 0.055 },
      { taxYear: this.taxYear, jurisdiction: 'MD', filingStatus: 'single', bracketMin: 250000, bracketMax: null, rate: 0.0575 },

      // Minnesota (5.35-9.85%)
      { taxYear: this.taxYear, jurisdiction: 'MN', filingStatus: 'single', bracketMin: 0, bracketMax: 30070, rate: 0.0535 },
      { taxYear: this.taxYear, jurisdiction: 'MN', filingStatus: 'single', bracketMin: 30070, bracketMax: 98760, rate: 0.068 },
      { taxYear: this.taxYear, jurisdiction: 'MN', filingStatus: 'single', bracketMin: 98760, bracketMax: 183340, rate: 0.0785 },
      { taxYear: this.taxYear, jurisdiction: 'MN', filingStatus: 'single', bracketMin: 183340, bracketMax: null, rate: 0.0985 },

      // Missouri (2-4.95%)
      { taxYear: this.taxYear, jurisdiction: 'MO', filingStatus: 'single', bracketMin: 0, bracketMax: 1207, rate: 0.02 },
      { taxYear: this.taxYear, jurisdiction: 'MO', filingStatus: 'single', bracketMin: 1207, bracketMax: 2414, rate: 0.025 },
      { taxYear: this.taxYear, jurisdiction: 'MO', filingStatus: 'single', bracketMin: 2414, bracketMax: 3621, rate: 0.03 },
      { taxYear: this.taxYear, jurisdiction: 'MO', filingStatus: 'single', bracketMin: 3621, bracketMax: 4828, rate: 0.035 },
      { taxYear: this.taxYear, jurisdiction: 'MO', filingStatus: 'single', bracketMin: 4828, bracketMax: 6035, rate: 0.04 },
      { taxYear: this.taxYear, jurisdiction: 'MO', filingStatus: 'single', bracketMin: 6035, bracketMax: 7242, rate: 0.045 },
      { taxYear: this.taxYear, jurisdiction: 'MO', filingStatus: 'single', bracketMin: 7242, bracketMax: null, rate: 0.0495 },

      // Montana (4.7-5.9%)  
      { taxYear: this.taxYear, jurisdiction: 'MT', filingStatus: 'single', bracketMin: 0, bracketMax: 20500, rate: 0.047 },
      { taxYear: this.taxYear, jurisdiction: 'MT', filingStatus: 'single', bracketMin: 20500, bracketMax: null, rate: 0.059 },

      // Nebraska (2.46-5.84%)
      { taxYear: this.taxYear, jurisdiction: 'NE', filingStatus: 'single', bracketMin: 0, bracketMax: 3700, rate: 0.0246 },
      { taxYear: this.taxYear, jurisdiction: 'NE', filingStatus: 'single', bracketMin: 3700, bracketMax: 22170, rate: 0.0351 },
      { taxYear: this.taxYear, jurisdiction: 'NE', filingStatus: 'single', bracketMin: 22170, bracketMax: 35730, rate: 0.0501 },
      { taxYear: this.taxYear, jurisdiction: 'NE', filingStatus: 'single', bracketMin: 35730, bracketMax: null, rate: 0.0584 },

      // New Jersey (1.4-10.75%)
      { taxYear: this.taxYear, jurisdiction: 'NJ', filingStatus: 'single', bracketMin: 0, bracketMax: 20000, rate: 0.014 },
      { taxYear: this.taxYear, jurisdiction: 'NJ', filingStatus: 'single', bracketMin: 20000, bracketMax: 35000, rate: 0.0175 },
      { taxYear: this.taxYear, jurisdiction: 'NJ', filingStatus: 'single', bracketMin: 35000, bracketMax: 40000, rate: 0.035 },
      { taxYear: this.taxYear, jurisdiction: 'NJ', filingStatus: 'single', bracketMin: 40000, bracketMax: 75000, rate: 0.05525 },
      { taxYear: this.taxYear, jurisdiction: 'NJ', filingStatus: 'single', bracketMin: 75000, bracketMax: 500000, rate: 0.0637 },
      { taxYear: this.taxYear, jurisdiction: 'NJ', filingStatus: 'single', bracketMin: 500000, bracketMax: 1000000, rate: 0.0897 },
      { taxYear: this.taxYear, jurisdiction: 'NJ', filingStatus: 'single', bracketMin: 1000000, bracketMax: null, rate: 0.1075 },

      // New Mexico (1.7-5.9%)
      { taxYear: this.taxYear, jurisdiction: 'NM', filingStatus: 'single', bracketMin: 0, bracketMax: 5500, rate: 0.017 },
      { taxYear: this.taxYear, jurisdiction: 'NM', filingStatus: 'single', bracketMin: 5500, bracketMax: 11000, rate: 0.032 },
      { taxYear: this.taxYear, jurisdiction: 'NM', filingStatus: 'single', bracketMin: 11000, bracketMax: 16000, rate: 0.047 },
      { taxYear: this.taxYear, jurisdiction: 'NM', filingStatus: 'single', bracketMin: 16000, bracketMax: 210000, rate: 0.049 },
      { taxYear: this.taxYear, jurisdiction: 'NM', filingStatus: 'single', bracketMin: 210000, bracketMax: null, rate: 0.059 },

      // New York (4-10.9%)
      { taxYear: this.taxYear, jurisdiction: 'NY', filingStatus: 'single', bracketMin: 0, bracketMax: 8500, rate: 0.04 },
      { taxYear: this.taxYear, jurisdiction: 'NY', filingStatus: 'single', bracketMin: 8500, bracketMax: 11700, rate: 0.045 },
      { taxYear: this.taxYear, jurisdiction: 'NY', filingStatus: 'single', bracketMin: 11700, bracketMax: 13900, rate: 0.0525 },
      { taxYear: this.taxYear, jurisdiction: 'NY', filingStatus: 'single', bracketMin: 13900, bracketMax: 80650, rate: 0.055 },
      { taxYear: this.taxYear, jurisdiction: 'NY', filingStatus: 'single', bracketMin: 80650, bracketMax: 215400, rate: 0.06 },
      { taxYear: this.taxYear, jurisdiction: 'NY', filingStatus: 'single', bracketMin: 215400, bracketMax: 1077550, rate: 0.0685 },
      { taxYear: this.taxYear, jurisdiction: 'NY', filingStatus: 'single', bracketMin: 1077550, bracketMax: 5000000, rate: 0.0965 },
      { taxYear: this.taxYear, jurisdiction: 'NY', filingStatus: 'single', bracketMin: 5000000, bracketMax: 25000000, rate: 0.103 },
      { taxYear: this.taxYear, jurisdiction: 'NY', filingStatus: 'single', bracketMin: 25000000, bracketMax: null, rate: 0.109 },

      // Ohio (0-3.75%) - rates vary by income
      { taxYear: this.taxYear, jurisdiction: 'OH', filingStatus: 'single', bracketMin: 0, bracketMax: 26050, rate: 0 },
      { taxYear: this.taxYear, jurisdiction: 'OH', filingStatus: 'single', bracketMin: 26050, bracketMax: 100000, rate: 0.02765 },
      { taxYear: this.taxYear, jurisdiction: 'OH', filingStatus: 'single', bracketMin: 100000, bracketMax: null, rate: 0.0375 },

      // Oklahoma (0.25-4.75%)
      { taxYear: this.taxYear, jurisdiction: 'OK', filingStatus: 'single', bracketMin: 0, bracketMax: 1000, rate: 0.0025 },
      { taxYear: this.taxYear, jurisdiction: 'OK', filingStatus: 'single', bracketMin: 1000, bracketMax: 2500, rate: 0.0075 },
      { taxYear: this.taxYear, jurisdiction: 'OK', filingStatus: 'single', bracketMin: 2500, bracketMax: 3750, rate: 0.0175 },
      { taxYear: this.taxYear, jurisdiction: 'OK', filingStatus: 'single', bracketMin: 3750, bracketMax: 4900, rate: 0.0275 },
      { taxYear: this.taxYear, jurisdiction: 'OK', filingStatus: 'single', bracketMin: 4900, bracketMax: 7200, rate: 0.0375 },
      { taxYear: this.taxYear, jurisdiction: 'OK', filingStatus: 'single', bracketMin: 7200, bracketMax: null, rate: 0.0475 },

      // Oregon (4.75-9.9%)
      { taxYear: this.taxYear, jurisdiction: 'OR', filingStatus: 'single', bracketMin: 0, bracketMax: 4300, rate: 0.0475 },
      { taxYear: this.taxYear, jurisdiction: 'OR', filingStatus: 'single', bracketMin: 4300, bracketMax: 10750, rate: 0.0675 },
      { taxYear: this.taxYear, jurisdiction: 'OR', filingStatus: 'single', bracketMin: 10750, bracketMax: 125000, rate: 0.0875 },
      { taxYear: this.taxYear, jurisdiction: 'OR', filingStatus: 'single', bracketMin: 125000, bracketMax: null, rate: 0.099 },

      // Rhode Island (3.75-5.99%)
      { taxYear: this.taxYear, jurisdiction: 'RI', filingStatus: 'single', bracketMin: 0, bracketMax: 73450, rate: 0.0375 },
      { taxYear: this.taxYear, jurisdiction: 'RI', filingStatus: 'single', bracketMin: 73450, bracketMax: 166950, rate: 0.0475 },
      { taxYear: this.taxYear, jurisdiction: 'RI', filingStatus: 'single', bracketMin: 166950, bracketMax: null, rate: 0.0599 },

      // South Carolina (0-6.4%)
      { taxYear: this.taxYear, jurisdiction: 'SC', filingStatus: 'single', bracketMin: 0, bracketMax: 3460, rate: 0 },
      { taxYear: this.taxYear, jurisdiction: 'SC', filingStatus: 'single', bracketMin: 3460, bracketMax: 17330, rate: 0.03 },
      { taxYear: this.taxYear, jurisdiction: 'SC', filingStatus: 'single', bracketMin: 17330, bracketMax: null, rate: 0.064 },

      // Vermont (3.35-8.75%)
      { taxYear: this.taxYear, jurisdiction: 'VT', filingStatus: 'single', bracketMin: 0, bracketMax: 45400, rate: 0.0335 },
      { taxYear: this.taxYear, jurisdiction: 'VT', filingStatus: 'single', bracketMin: 45400, bracketMax: 110050, rate: 0.066 },
      { taxYear: this.taxYear, jurisdiction: 'VT', filingStatus: 'single', bracketMin: 110050, bracketMax: 229550, rate: 0.076 },
      { taxYear: this.taxYear, jurisdiction: 'VT', filingStatus: 'single', bracketMin: 229550, bracketMax: null, rate: 0.0875 },

      // Virginia (2-5.75%)
      { taxYear: this.taxYear, jurisdiction: 'VA', filingStatus: 'single', bracketMin: 0, bracketMax: 3000, rate: 0.02 },
      { taxYear: this.taxYear, jurisdiction: 'VA', filingStatus: 'single', bracketMin: 3000, bracketMax: 5000, rate: 0.03 },
      { taxYear: this.taxYear, jurisdiction: 'VA', filingStatus: 'single', bracketMin: 5000, bracketMax: 17000, rate: 0.05 },
      { taxYear: this.taxYear, jurisdiction: 'VA', filingStatus: 'single', bracketMin: 17000, bracketMax: null, rate: 0.0575 },

      // West Virginia (2.36-5.12%)
      { taxYear: this.taxYear, jurisdiction: 'WV', filingStatus: 'single', bracketMin: 0, bracketMax: 10000, rate: 0.0236 },
      { taxYear: this.taxYear, jurisdiction: 'WV', filingStatus: 'single', bracketMin: 10000, bracketMax: 25000, rate: 0.0315 },
      { taxYear: this.taxYear, jurisdiction: 'WV', filingStatus: 'single', bracketMin: 25000, bracketMax: 40000, rate: 0.0354 },
      { taxYear: this.taxYear, jurisdiction: 'WV', filingStatus: 'single', bracketMin: 40000, bracketMax: 60000, rate: 0.0472 },
      { taxYear: this.taxYear, jurisdiction: 'WV', filingStatus: 'single', bracketMin: 60000, bracketMax: null, rate: 0.0512 },

      // Wisconsin (3.5-7.65%)
      { taxYear: this.taxYear, jurisdiction: 'WI', filingStatus: 'single', bracketMin: 0, bracketMax: 14320, rate: 0.035 },
      { taxYear: this.taxYear, jurisdiction: 'WI', filingStatus: 'single', bracketMin: 14320, bracketMax: 28640, rate: 0.044 },
      { taxYear: this.taxYear, jurisdiction: 'WI', filingStatus: 'single', bracketMin: 28640, bracketMax: 315310, rate: 0.053 },
      { taxYear: this.taxYear, jurisdiction: 'WI', filingStatus: 'single', bracketMin: 315310, bracketMax: null, rate: 0.0765 },
    ];

    let created = 0;
    let failed = 0;

    for (const bracket of stateBrackets) {
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
            effective_date: `${bracket.taxYear}-01-01`,
          }, {
            onConflict: 'tax_year,jurisdiction,filing_status,bracket_min',
          });

        if (error) throw error;
        created++;
      } catch (error) {
        logger.error('Failed to upsert state bracket', { bracket, error });
        failed++;
      }
    }

    return {
      success: failed === 0,
      recordsProcessed: stateBrackets.length,
      recordsCreated: created,
      recordsUpdated: 0,
      recordsFailed: failed,
      errors: [],
      duration: Date.now() - startTime,
    };
  }
}

