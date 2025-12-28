/**
 * Jurisdiction Rules Data Ingestion Service
 * 
 * Court filing requirements and rules for all 50 states including:
 * - Filing fees
 * - Residency requirements
 * - E-filing availability
 * - Required forms
 * - Waiting periods
 */

import { supabaseAdmin } from '../../utils/supabase.js';
import { logger } from '../../utils/logger.js';
import type { IngestionResult, JurisdictionRule } from './types.js';

export class JurisdictionRulesIngestion {
  async ingestAll(): Promise<IngestionResult> {
    const startTime = Date.now();
    const rules = this.getAllJurisdictionRules();

    let created = 0;
    let failed = 0;

    for (const rule of rules) {
      try {
        const { error } = await supabaseAdmin
          .from('lf_jurisdiction_rules')
          .upsert({
            state_code: rule.stateCode,
            county: rule.county,
            court_type: rule.courtType,
            filing_type: rule.filingType,
            residency_requirement: rule.residencyRequirement,
            residency_duration_days: rule.residencyDurationDays,
            venue_rules: rule.venueRules,
            filing_fee: rule.filingFee,
            service_fee: rule.serviceFee,
            motion_fee: rule.motionFee,
            fee_waiver_available: rule.feeWaiverAvailable,
            fee_waiver_income_threshold: rule.feeWaiverIncomeThreshold,
            fee_waiver_form: rule.feeWaiverForm,
            required_forms: rule.requiredForms,
            optional_forms: rule.optionalForms,
            waiting_period_days: rule.waitingPeriodDays,
            mandatory_mediation: rule.mandatoryMediation,
            parenting_class_required: rule.parentingClassRequired,
            cooling_off_period_days: rule.coolingOffPeriodDays,
            efiling_available: rule.efilingAvailable,
            efiling_required: rule.efilingRequired,
            efiling_system: rule.efilingSystem,
            efiling_url: rule.efilingUrl,
            response_deadline_days: rule.responseDeadlineDays,
            service_methods: rule.serviceMethods,
            service_rules: rule.serviceRules,
            court_website: rule.courtWebsite,
            self_help_url: rule.selfHelpUrl,
            forms_url: rule.formsUrl,
            local_rules_url: rule.localRulesUrl,
            instructions: rule.instructions,
            tips: rule.tips,
            common_mistakes: rule.commonMistakes,
            source_url: rule.sourceUrl,
            last_verified: new Date().toISOString().split('T')[0],
          }, {
            onConflict: 'state_code,county,court_type,filing_type',
          });

        if (error) throw error;
        created++;
      } catch (error) {
        logger.error('Failed to upsert jurisdiction rule', { state: rule.stateCode, type: rule.filingType, error });
        failed++;
      }
    }

    logger.info(`Jurisdiction rules ingestion completed: ${created} created, ${failed} failed`);

    return {
      success: failed === 0,
      recordsProcessed: rules.length,
      recordsCreated: created,
      recordsUpdated: 0,
      recordsFailed: failed,
      errors: [],
      duration: Date.now() - startTime,
    };
  }

  private getAllJurisdictionRules(): JurisdictionRule[] {
    // Divorce filing rules for all 50 states
    const divorceRules: JurisdictionRule[] = [
      { stateCode: 'AL', courtType: 'family', filingType: 'divorce', residencyRequirement: '6 months state residency', residencyDurationDays: 180, filingFee: 350, waitingPeriodDays: 30, mandatoryMediation: false, parentingClassRequired: true, efilingAvailable: true, efilingSystem: 'Alafile', feeWaiverAvailable: true, serviceMethods: ['personal', 'certified_mail'], courtWebsite: 'https://judicial.alabama.gov/', formsUrl: 'https://judicial.alabama.gov/library/forms' },
      { stateCode: 'AK', courtType: 'family', filingType: 'divorce', residencyRequirement: 'No minimum - just state resident', residencyDurationDays: 0, filingFee: 250, waitingPeriodDays: 0, mandatoryMediation: false, parentingClassRequired: true, efilingAvailable: true, efilingSystem: 'TrueFiling', feeWaiverAvailable: true, serviceMethods: ['personal', 'certified_mail'], courtWebsite: 'https://courts.alaska.gov/', formsUrl: 'https://courts.alaska.gov/forms/' },
      { stateCode: 'AZ', courtType: 'family', filingType: 'divorce', residencyRequirement: '90 days state residency', residencyDurationDays: 90, filingFee: 349, waitingPeriodDays: 60, mandatoryMediation: true, parentingClassRequired: true, efilingAvailable: true, efilingSystem: 'AZTurboCourt', feeWaiverAvailable: true, serviceMethods: ['personal', 'certified_mail', 'acceptance'], courtWebsite: 'https://www.azcourts.gov/', formsUrl: 'https://www.azcourts.gov/selfservicecenter/Self-Service-Forms' },
      { stateCode: 'AR', courtType: 'family', filingType: 'divorce', residencyRequirement: '60 days state residency', residencyDurationDays: 60, filingFee: 165, waitingPeriodDays: 30, mandatoryMediation: false, parentingClassRequired: false, efilingAvailable: true, efilingSystem: 'eFlex', feeWaiverAvailable: true, serviceMethods: ['personal', 'certified_mail'], courtWebsite: 'https://www.arcourts.gov/', formsUrl: 'https://www.arcourts.gov/forms-and-publications' },
      { stateCode: 'CA', courtType: 'family', filingType: 'divorce', residencyRequirement: '6 months state, 3 months county', residencyDurationDays: 180, filingFee: 435, waitingPeriodDays: 180, mandatoryMediation: true, parentingClassRequired: true, efilingAvailable: true, efilingSystem: 'Various by county', feeWaiverAvailable: true, feeWaiverForm: 'FW-001', serviceMethods: ['personal', 'certified_mail', 'substituted'], courtWebsite: 'https://www.courts.ca.gov/', formsUrl: 'https://www.courts.ca.gov/forms.htm' },
      { stateCode: 'CO', courtType: 'family', filingType: 'divorce', residencyRequirement: '91 days state residency', residencyDurationDays: 91, filingFee: 230, waitingPeriodDays: 91, mandatoryMediation: true, parentingClassRequired: true, efilingAvailable: true, efilingSystem: 'Colorado Courts E-Filing', feeWaiverAvailable: true, serviceMethods: ['personal', 'certified_mail'], courtWebsite: 'https://www.courts.state.co.us/', formsUrl: 'https://www.courts.state.co.us/Forms/Index.cfm' },
      { stateCode: 'CT', courtType: 'family', filingType: 'divorce', residencyRequirement: '12 months state residency', residencyDurationDays: 365, filingFee: 350, waitingPeriodDays: 90, mandatoryMediation: true, parentingClassRequired: true, efilingAvailable: true, efilingSystem: 'CT e-Services', feeWaiverAvailable: true, serviceMethods: ['personal', 'certified_mail'], courtWebsite: 'https://jud.ct.gov/', formsUrl: 'https://jud.ct.gov/webforms/' },
      { stateCode: 'DE', courtType: 'family', filingType: 'divorce', residencyRequirement: '6 months state residency', residencyDurationDays: 180, filingFee: 150, waitingPeriodDays: 0, mandatoryMediation: true, parentingClassRequired: true, efilingAvailable: true, efilingSystem: 'File & ServeXpress', feeWaiverAvailable: true, serviceMethods: ['personal', 'certified_mail'], courtWebsite: 'https://courts.delaware.gov/', formsUrl: 'https://courts.delaware.gov/family/forms.aspx' },
      { stateCode: 'FL', courtType: 'family', filingType: 'divorce', residencyRequirement: '6 months state residency', residencyDurationDays: 180, filingFee: 408, waitingPeriodDays: 20, mandatoryMediation: true, parentingClassRequired: true, efilingAvailable: true, efilingRequired: true, efilingSystem: 'Florida Courts E-Filing Portal', feeWaiverAvailable: true, serviceMethods: ['personal', 'certified_mail'], courtWebsite: 'https://www.flcourts.org/', formsUrl: 'https://www.flcourts.org/Resources-Services/Court-Improvement/Family-Courts/Family-Law-Self-Help-Information/Family-Law-Forms' },
      { stateCode: 'GA', courtType: 'family', filingType: 'divorce', residencyRequirement: '6 months state residency', residencyDurationDays: 180, filingFee: 230, waitingPeriodDays: 30, mandatoryMediation: false, parentingClassRequired: true, efilingAvailable: true, efilingSystem: 'PeachCourt', feeWaiverAvailable: true, serviceMethods: ['personal', 'certified_mail'], courtWebsite: 'https://www.georgiacourts.gov/', formsUrl: 'https://www.georgiacourts.gov/for-self-represented-litigants' },
      { stateCode: 'HI', courtType: 'family', filingType: 'divorce', residencyRequirement: '6 months state residency', residencyDurationDays: 180, filingFee: 250, waitingPeriodDays: 0, mandatoryMediation: false, parentingClassRequired: true, efilingAvailable: true, efilingSystem: 'JEFS', feeWaiverAvailable: true, serviceMethods: ['personal', 'certified_mail'], courtWebsite: 'https://www.courts.state.hi.us/', formsUrl: 'https://www.courts.state.hi.us/self-help/courts/forms' },
      { stateCode: 'ID', courtType: 'family', filingType: 'divorce', residencyRequirement: '6 weeks state residency', residencyDurationDays: 42, filingFee: 207, waitingPeriodDays: 20, mandatoryMediation: false, parentingClassRequired: true, efilingAvailable: true, efilingSystem: 'iCourt', feeWaiverAvailable: true, serviceMethods: ['personal', 'certified_mail'], courtWebsite: 'https://isc.idaho.gov/', formsUrl: 'https://courtselfhelp.idaho.gov/' },
      { stateCode: 'IL', courtType: 'family', filingType: 'divorce', residencyRequirement: '90 days state residency', residencyDurationDays: 90, filingFee: 337, waitingPeriodDays: 0, mandatoryMediation: true, parentingClassRequired: true, efilingAvailable: true, efilingRequired: true, efilingSystem: 'Odyssey eFileIL', feeWaiverAvailable: true, serviceMethods: ['personal', 'certified_mail', 'special process server'], courtWebsite: 'https://www.illinoiscourts.gov/', formsUrl: 'https://www.illinoiscourts.gov/forms/approved-forms/' },
      { stateCode: 'IN', courtType: 'family', filingType: 'divorce', residencyRequirement: '6 months state, 3 months county', residencyDurationDays: 180, filingFee: 157, waitingPeriodDays: 60, mandatoryMediation: false, parentingClassRequired: true, efilingAvailable: true, efilingSystem: 'Odyssey', feeWaiverAvailable: true, serviceMethods: ['personal', 'certified_mail'], courtWebsite: 'https://www.in.gov/courts/', formsUrl: 'https://www.in.gov/courts/selfservice/forms/' },
      { stateCode: 'IA', courtType: 'family', filingType: 'divorce', residencyRequirement: '1 year state residency', residencyDurationDays: 365, filingFee: 185, waitingPeriodDays: 90, mandatoryMediation: true, parentingClassRequired: true, efilingAvailable: true, efilingSystem: 'EDMS', feeWaiverAvailable: true, serviceMethods: ['personal', 'certified_mail'], courtWebsite: 'https://www.iowacourts.gov/', formsUrl: 'https://www.iowacourts.gov/for-the-public/court-forms/' },
      { stateCode: 'KS', courtType: 'family', filingType: 'divorce', residencyRequirement: '60 days state residency', residencyDurationDays: 60, filingFee: 195, waitingPeriodDays: 60, mandatoryMediation: true, parentingClassRequired: true, efilingAvailable: true, efilingSystem: 'Kansas eCourt', feeWaiverAvailable: true, serviceMethods: ['personal', 'certified_mail'], courtWebsite: 'https://www.kscourts.org/', formsUrl: 'https://www.kscourts.org/Rules-Procedures-Forms/Court-Forms' },
      { stateCode: 'KY', courtType: 'family', filingType: 'divorce', residencyRequirement: '180 days state residency', residencyDurationDays: 180, filingFee: 148, waitingPeriodDays: 60, mandatoryMediation: true, parentingClassRequired: true, efilingAvailable: true, efilingSystem: 'eFiling Kentucky', feeWaiverAvailable: true, serviceMethods: ['personal', 'certified_mail'], courtWebsite: 'https://courts.ky.gov/', formsUrl: 'https://kycourts.gov/resources/legalforms/Pages/familycourt.aspx' },
      { stateCode: 'LA', courtType: 'family', filingType: 'divorce', residencyRequirement: 'State domicile', residencyDurationDays: 0, filingFee: 400, waitingPeriodDays: 180, mandatoryMediation: false, parentingClassRequired: true, efilingAvailable: true, efilingSystem: 'Various by parish', feeWaiverAvailable: true, serviceMethods: ['personal', 'certified_mail'], courtWebsite: 'https://www.lasc.org/', formsUrl: 'https://www.lasc.org/court_documents' },
      { stateCode: 'ME', courtType: 'family', filingType: 'divorce', residencyRequirement: '6 months state residency', residencyDurationDays: 180, filingFee: 120, waitingPeriodDays: 60, mandatoryMediation: true, parentingClassRequired: true, efilingAvailable: true, efilingSystem: 'Odyssey', feeWaiverAvailable: true, serviceMethods: ['personal', 'certified_mail'], courtWebsite: 'https://www.courts.maine.gov/', formsUrl: 'https://www.courts.maine.gov/fees_forms/forms/index.html' },
      { stateCode: 'MD', courtType: 'family', filingType: 'divorce', residencyRequirement: '6 months or 12 months for certain grounds', residencyDurationDays: 180, filingFee: 165, waitingPeriodDays: 0, mandatoryMediation: true, parentingClassRequired: true, efilingAvailable: true, efilingSystem: 'MDEC', feeWaiverAvailable: true, serviceMethods: ['personal', 'certified_mail'], courtWebsite: 'https://www.mdcourts.gov/', formsUrl: 'https://mdcourts.gov/family/forms' },
      { stateCode: 'MA', courtType: 'family', filingType: 'divorce', residencyRequirement: '1 year state or grounds occurred in state', residencyDurationDays: 365, filingFee: 215, waitingPeriodDays: 120, mandatoryMediation: false, parentingClassRequired: true, efilingAvailable: true, efilingSystem: 'Massachusetts Trial Court E-Filing', feeWaiverAvailable: true, serviceMethods: ['personal', 'certified_mail'], courtWebsite: 'https://www.mass.gov/orgs/trial-court', formsUrl: 'https://www.mass.gov/lists/probate-and-family-court-forms' },
      { stateCode: 'MI', courtType: 'family', filingType: 'divorce', residencyRequirement: '180 days state, 10 days county', residencyDurationDays: 180, filingFee: 175, waitingPeriodDays: 60, mandatoryMediation: true, parentingClassRequired: true, efilingAvailable: true, efilingSystem: 'MiFILE', feeWaiverAvailable: true, serviceMethods: ['personal', 'certified_mail'], courtWebsite: 'https://courts.michigan.gov/', formsUrl: 'https://courts.michigan.gov/Administration/SCAO/Forms/Pages/search.aspx' },
      { stateCode: 'MN', courtType: 'family', filingType: 'divorce', residencyRequirement: '180 days state residency', residencyDurationDays: 180, filingFee: 365, waitingPeriodDays: 0, mandatoryMediation: true, parentingClassRequired: true, efilingAvailable: true, efilingSystem: 'eFS', feeWaiverAvailable: true, serviceMethods: ['personal', 'certified_mail'], courtWebsite: 'https://www.mncourts.gov/', formsUrl: 'https://www.mncourts.gov/Help-Topics/Forms.aspx' },
      { stateCode: 'MS', courtType: 'family', filingType: 'divorce', residencyRequirement: '6 months state residency', residencyDurationDays: 180, filingFee: 52, waitingPeriodDays: 60, mandatoryMediation: false, parentingClassRequired: false, efilingAvailable: true, efilingSystem: 'MEC', feeWaiverAvailable: true, serviceMethods: ['personal', 'certified_mail'], courtWebsite: 'https://courts.ms.gov/', formsUrl: 'https://courts.ms.gov/trialcourts/chanceryclerk/chanceryclerkdivpro.php' },
      { stateCode: 'MO', courtType: 'family', filingType: 'divorce', residencyRequirement: '90 days state residency', residencyDurationDays: 90, filingFee: 163, waitingPeriodDays: 30, mandatoryMediation: false, parentingClassRequired: true, efilingAvailable: true, efilingSystem: 'CaseNet', feeWaiverAvailable: true, serviceMethods: ['personal', 'certified_mail'], courtWebsite: 'https://www.courts.mo.gov/', formsUrl: 'https://www.courts.mo.gov/page.jsp?id=704' },
      { stateCode: 'MT', courtType: 'family', filingType: 'divorce', residencyRequirement: '90 days state residency', residencyDurationDays: 90, filingFee: 170, waitingPeriodDays: 20, mandatoryMediation: true, parentingClassRequired: true, efilingAvailable: true, efilingSystem: 'File & ServeXpress', feeWaiverAvailable: true, serviceMethods: ['personal', 'certified_mail'], courtWebsite: 'https://courts.mt.gov/', formsUrl: 'https://courts.mt.gov/forms' },
      { stateCode: 'NE', courtType: 'family', filingType: 'divorce', residencyRequirement: '1 year state residency or married in NE', residencyDurationDays: 365, filingFee: 158, waitingPeriodDays: 60, mandatoryMediation: true, parentingClassRequired: true, efilingAvailable: true, efilingSystem: 'Nebraska Judicial Branch E-Filing', feeWaiverAvailable: true, serviceMethods: ['personal', 'certified_mail'], courtWebsite: 'https://supremecourt.nebraska.gov/', formsUrl: 'https://supremecourt.nebraska.gov/self-help/forms/divorce-forms' },
      { stateCode: 'NV', courtType: 'family', filingType: 'divorce', residencyRequirement: '6 weeks state residency', residencyDurationDays: 42, filingFee: 299, waitingPeriodDays: 0, mandatoryMediation: false, parentingClassRequired: true, efilingAvailable: true, efilingSystem: 'Various by county', feeWaiverAvailable: true, serviceMethods: ['personal', 'certified_mail'], courtWebsite: 'https://nvcourts.gov/', formsUrl: 'https://selfhelp.nvcourts.gov/self-help/divorce-and-separation' },
      { stateCode: 'NH', courtType: 'family', filingType: 'divorce', residencyRequirement: '1 year state residency', residencyDurationDays: 365, filingFee: 252, waitingPeriodDays: 0, mandatoryMediation: true, parentingClassRequired: true, efilingAvailable: true, efilingSystem: 'NH eCourt', feeWaiverAvailable: true, serviceMethods: ['personal', 'certified_mail'], courtWebsite: 'https://www.courts.state.nh.us/', formsUrl: 'https://www.courts.state.nh.us/fdpp/forms.htm' },
      { stateCode: 'NJ', courtType: 'family', filingType: 'divorce', residencyRequirement: '12 months state residency', residencyDurationDays: 365, filingFee: 300, waitingPeriodDays: 0, mandatoryMediation: true, parentingClassRequired: true, efilingAvailable: true, efilingRequired: true, efilingSystem: 'eCourts', feeWaiverAvailable: true, serviceMethods: ['personal', 'certified_mail'], courtWebsite: 'https://www.njcourts.gov/', formsUrl: 'https://www.njcourts.gov/self-help/divorce' },
      { stateCode: 'NM', courtType: 'family', filingType: 'divorce', residencyRequirement: '6 months state residency', residencyDurationDays: 180, filingFee: 137, waitingPeriodDays: 30, mandatoryMediation: true, parentingClassRequired: true, efilingAvailable: true, efilingSystem: 'Odyssey', feeWaiverAvailable: true, serviceMethods: ['personal', 'certified_mail'], courtWebsite: 'https://www.nmcourts.gov/', formsUrl: 'https://www.nmcourts.gov/Self-Help/forms-and-information/' },
      { stateCode: 'NY', courtType: 'family', filingType: 'divorce', residencyRequirement: '1 year state or 2 years if married in NY', residencyDurationDays: 365, filingFee: 335, waitingPeriodDays: 0, mandatoryMediation: true, parentingClassRequired: true, efilingAvailable: true, efilingSystem: 'NYSCEF', feeWaiverAvailable: true, serviceMethods: ['personal', 'certified_mail'], courtWebsite: 'https://www.nycourts.gov/', formsUrl: 'https://www.nycourts.gov/divorce/forms.shtml' },
      { stateCode: 'NC', courtType: 'family', filingType: 'divorce', residencyRequirement: '6 months state residency', residencyDurationDays: 180, filingFee: 225, waitingPeriodDays: 365, mandatoryMediation: true, parentingClassRequired: true, efilingAvailable: true, efilingSystem: 'Odyssey', feeWaiverAvailable: true, serviceMethods: ['personal', 'certified_mail'], courtWebsite: 'https://www.nccourts.gov/', formsUrl: 'https://www.nccourts.gov/help-topics/divorce' },
      { stateCode: 'ND', courtType: 'family', filingType: 'divorce', residencyRequirement: '6 months state residency', residencyDurationDays: 180, filingFee: 80, waitingPeriodDays: 0, mandatoryMediation: true, parentingClassRequired: true, efilingAvailable: true, efilingSystem: 'Odyssey', feeWaiverAvailable: true, serviceMethods: ['personal', 'certified_mail'], courtWebsite: 'https://www.ndcourts.gov/', formsUrl: 'https://www.ndcourts.gov/legal-self-help/divorce-forms' },
      { stateCode: 'OH', courtType: 'family', filingType: 'divorce', residencyRequirement: '6 months state residency', residencyDurationDays: 180, filingFee: 350, waitingPeriodDays: 0, mandatoryMediation: false, parentingClassRequired: true, efilingAvailable: true, efilingSystem: 'Various by county', feeWaiverAvailable: true, serviceMethods: ['personal', 'certified_mail'], courtWebsite: 'https://www.supremecourt.ohio.gov/', formsUrl: 'https://www.supremecourt.ohio.gov/JCS/CFC/DRForms/' },
      { stateCode: 'OK', courtType: 'family', filingType: 'divorce', residencyRequirement: '6 months state residency', residencyDurationDays: 180, filingFee: 183, waitingPeriodDays: 10, mandatoryMediation: false, parentingClassRequired: true, efilingAvailable: true, efilingSystem: 'Oklahoma eFiling', feeWaiverAvailable: true, serviceMethods: ['personal', 'certified_mail'], courtWebsite: 'https://www.oscn.net/', formsUrl: 'https://www.oscn.net/static/forms/' },
      { stateCode: 'OR', courtType: 'family', filingType: 'divorce', residencyRequirement: '6 months state residency (petitioner or respondent)', residencyDurationDays: 180, filingFee: 301, waitingPeriodDays: 90, mandatoryMediation: true, parentingClassRequired: true, efilingAvailable: true, efilingSystem: 'Oregon eCourt', feeWaiverAvailable: true, serviceMethods: ['personal', 'certified_mail'], courtWebsite: 'https://www.courts.oregon.gov/', formsUrl: 'https://www.courts.oregon.gov/forms/Pages/Family.aspx' },
      { stateCode: 'PA', courtType: 'family', filingType: 'divorce', residencyRequirement: '6 months state residency', residencyDurationDays: 180, filingFee: 333, waitingPeriodDays: 90, mandatoryMediation: true, parentingClassRequired: true, efilingAvailable: true, efilingSystem: 'PACFile', feeWaiverAvailable: true, serviceMethods: ['personal', 'certified_mail'], courtWebsite: 'https://www.pacourts.us/', formsUrl: 'https://www.pacourts.us/forms/for-the-public' },
      { stateCode: 'RI', courtType: 'family', filingType: 'divorce', residencyRequirement: '1 year state residency', residencyDurationDays: 365, filingFee: 160, waitingPeriodDays: 0, mandatoryMediation: false, parentingClassRequired: true, efilingAvailable: true, efilingSystem: 'File & Serve', feeWaiverAvailable: true, serviceMethods: ['personal', 'certified_mail'], courtWebsite: 'https://www.courts.ri.gov/', formsUrl: 'https://www.courts.ri.gov/Courts/FamilyCourt/Pages/Family%20Court%20Forms.aspx' },
      { stateCode: 'SC', courtType: 'family', filingType: 'divorce', residencyRequirement: '3 months if both residents, 1 year if only petitioner', residencyDurationDays: 90, filingFee: 150, waitingPeriodDays: 0, mandatoryMediation: true, parentingClassRequired: true, efilingAvailable: true, efilingSystem: 'SC Courts eFiling', feeWaiverAvailable: true, serviceMethods: ['personal', 'certified_mail'], courtWebsite: 'https://www.sccourts.org/', formsUrl: 'https://www.sccourts.org/forms/' },
      { stateCode: 'SD', courtType: 'family', filingType: 'divorce', residencyRequirement: 'State resident at filing', residencyDurationDays: 0, filingFee: 95, waitingPeriodDays: 60, mandatoryMediation: true, parentingClassRequired: true, efilingAvailable: true, efilingSystem: 'Odyssey', feeWaiverAvailable: true, serviceMethods: ['personal', 'certified_mail'], courtWebsite: 'https://ujs.sd.gov/', formsUrl: 'https://ujs.sd.gov/Forms/default.aspx' },
      { stateCode: 'TN', courtType: 'family', filingType: 'divorce', residencyRequirement: '6 months state residency', residencyDurationDays: 180, filingFee: 305, waitingPeriodDays: 60, mandatoryMediation: true, parentingClassRequired: true, efilingAvailable: true, efilingSystem: 'Odyssey', feeWaiverAvailable: true, serviceMethods: ['personal', 'certified_mail'], courtWebsite: 'https://www.tncourts.gov/', formsUrl: 'https://www.tncourts.gov/programs/mediation-alternative-dispute-resolution/self-help-center' },
      { stateCode: 'TX', courtType: 'family', filingType: 'divorce', residencyRequirement: '6 months state, 90 days county', residencyDurationDays: 180, filingFee: 350, waitingPeriodDays: 60, mandatoryMediation: true, parentingClassRequired: true, efilingAvailable: true, efilingRequired: true, efilingSystem: 'eFileTexas', feeWaiverAvailable: true, serviceMethods: ['personal', 'certified_mail'], courtWebsite: 'https://www.txcourts.gov/', formsUrl: 'https://www.texaslawhelp.org/self-help-forms' },
      { stateCode: 'UT', courtType: 'family', filingType: 'divorce', residencyRequirement: '3 months county residency', residencyDurationDays: 90, filingFee: 325, waitingPeriodDays: 90, mandatoryMediation: true, parentingClassRequired: true, efilingAvailable: true, efilingSystem: 'Utah Courts OCAP', feeWaiverAvailable: true, serviceMethods: ['personal', 'certified_mail'], courtWebsite: 'https://www.utcourts.gov/', formsUrl: 'https://www.utcourts.gov/howto/divorce/' },
      { stateCode: 'VT', courtType: 'family', filingType: 'divorce', residencyRequirement: '6 months state residency', residencyDurationDays: 180, filingFee: 295, waitingPeriodDays: 0, mandatoryMediation: false, parentingClassRequired: true, efilingAvailable: true, efilingSystem: 'Odyssey', feeWaiverAvailable: true, serviceMethods: ['personal', 'certified_mail'], courtWebsite: 'https://www.vermontjudiciary.org/', formsUrl: 'https://www.vermontjudiciary.org/self-help/divorce-and-separation' },
      { stateCode: 'VA', courtType: 'family', filingType: 'divorce', residencyRequirement: '6 months state residency', residencyDurationDays: 180, filingFee: 86, waitingPeriodDays: 0, mandatoryMediation: false, parentingClassRequired: true, efilingAvailable: true, efilingSystem: 'VSCMS', feeWaiverAvailable: true, serviceMethods: ['personal', 'certified_mail'], courtWebsite: 'https://www.vacourts.gov/', formsUrl: 'https://www.vacourts.gov/forms/circuit/home.html' },
      { stateCode: 'WA', courtType: 'family', filingType: 'divorce', residencyRequirement: 'Washington domicile', residencyDurationDays: 0, filingFee: 350, waitingPeriodDays: 90, mandatoryMediation: true, parentingClassRequired: true, efilingAvailable: true, efilingSystem: 'Various by county', feeWaiverAvailable: true, serviceMethods: ['personal', 'certified_mail'], courtWebsite: 'https://www.courts.wa.gov/', formsUrl: 'https://www.courts.wa.gov/forms/' },
      { stateCode: 'WV', courtType: 'family', filingType: 'divorce', residencyRequirement: '1 year state residency or married in WV', residencyDurationDays: 365, filingFee: 200, waitingPeriodDays: 20, mandatoryMediation: false, parentingClassRequired: true, efilingAvailable: true, efilingSystem: 'E-Filing WV', feeWaiverAvailable: true, serviceMethods: ['personal', 'certified_mail'], courtWebsite: 'https://www.courtswv.gov/', formsUrl: 'https://www.courtswv.gov/lower-courts/family-court/family-court-forms' },
      { stateCode: 'WI', courtType: 'family', filingType: 'divorce', residencyRequirement: '6 months state, 30 days county', residencyDurationDays: 180, filingFee: 184, waitingPeriodDays: 120, mandatoryMediation: true, parentingClassRequired: true, efilingAvailable: true, efilingSystem: 'eFiling Wisconsin', feeWaiverAvailable: true, serviceMethods: ['personal', 'certified_mail'], courtWebsite: 'https://www.wicourts.gov/', formsUrl: 'https://www.wicourts.gov/forms1/circuit.htm' },
      { stateCode: 'WY', courtType: 'family', filingType: 'divorce', residencyRequirement: '60 days state residency', residencyDurationDays: 60, filingFee: 70, waitingPeriodDays: 20, mandatoryMediation: false, parentingClassRequired: true, efilingAvailable: true, efilingSystem: 'Wyoming eCourt', feeWaiverAvailable: true, serviceMethods: ['personal', 'certified_mail'], courtWebsite: 'https://www.courts.state.wy.us/', formsUrl: 'https://www.courts.state.wy.us/legal-assistance/court-self-help-resources/' },
    ];

    return divorceRules;
  }
}

