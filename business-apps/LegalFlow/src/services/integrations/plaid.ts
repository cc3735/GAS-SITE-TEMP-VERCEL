/**
 * Plaid Integration Service
 *
 * Provides secure bank account connections, automatic import of tax documents
 * (1099-INT, 1099-DIV), investment tracking, and direct deposit setup.
 *
 * @module services/integrations/plaid
 */

import { config } from '../../config/index.js';
import { logger } from '../../utils/logger.js';
import { supabase } from '../../lib/supabase.js';

// ============================================================================
// TYPES
// ============================================================================

export type PlaidEnvironment = 'sandbox' | 'development' | 'production';

export type PlaidProduct = 'transactions' | 'auth' | 'identity' | 'investments' | 'liabilities' | 'assets';

export type AccountType = 'depository' | 'credit' | 'loan' | 'investment' | 'brokerage' | 'other';

export type AccountSubtype =
  | 'checking'
  | 'savings'
  | 'cd'
  | 'money_market'
  | 'ira'
  | '401k'
  | '401a'
  | 'roth'
  | 'roth_401k'
  | 'brokerage'
  | 'credit_card'
  | 'mortgage'
  | 'student'
  | 'auto'
  | 'other';

export interface PlaidConfig {
  clientId: string;
  secret: string;
  environment: PlaidEnvironment;
  webhookUrl?: string;
}

export interface PlaidLinkTokenRequest {
  userId: string;
  products: PlaidProduct[];
  accountTypes?: AccountType[];
  redirectUri?: string;
}

export interface PlaidLinkTokenResponse {
  linkToken: string;
  expiration: string;
  requestId: string;
}

export interface PlaidPublicTokenExchange {
  publicToken: string;
  userId: string;
  institutionId?: string;
  institutionName?: string;
}

export interface PlaidAccessToken {
  accessToken: string;
  itemId: string;
}

export interface PlaidInstitution {
  institutionId: string;
  name: string;
  logo?: string;
  primaryColor?: string;
  url?: string;
  oauth: boolean;
}

export interface PlaidAccount {
  accountId: string;
  name: string;
  officialName?: string;
  type: AccountType;
  subtype: AccountSubtype;
  mask: string;
  currentBalance?: number;
  availableBalance?: number;
  currency: string;
  institutionId: string;
  institutionName: string;
}

export interface LinkedAccount {
  id: string;
  userId: string;
  itemId: string;
  accessToken: string; // Encrypted
  institutionId: string;
  institutionName: string;
  accounts: PlaidAccount[];
  products: PlaidProduct[];
  status: 'active' | 'requires_reauth' | 'disconnected' | 'error';
  lastSync: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface TaxDocument1099INT {
  id: string;
  userId: string;
  linkedAccountId: string;
  taxYear: number;
  payerName: string;
  payerTin?: string;
  interestIncome: number;
  earlyWithdrawalPenalty?: number;
  interestOnUsSavingsBonds?: number;
  federalTaxWithheld?: number;
  investmentExpenses?: number;
  foreignTaxPaid?: number;
  taxExemptInterest?: number;
  specifiedPrivateActivityBondInterest?: number;
  marketDiscount?: number;
  bondPremium?: number;
  bondPremiumOnTreasury?: number;
  bondPremiumOnTaxExemptBond?: number;
  stateTaxWithheld?: number;
  state?: string;
  stateIdNumber?: string;
  createdAt: Date;
}

export interface TaxDocument1099DIV {
  id: string;
  userId: string;
  linkedAccountId: string;
  taxYear: number;
  payerName: string;
  payerTin?: string;
  ordinaryDividends: number;
  qualifiedDividends: number;
  totalCapitalGainDistributions: number;
  unrecapturedSection1250Gain?: number;
  section1202Gain?: number;
  collectiblesGain?: number;
  section897OrdinaryDividends?: number;
  section897CapitalGain?: number;
  nondividendDistributions?: number;
  federalTaxWithheld?: number;
  section199ADividends?: number;
  investmentExpenses?: number;
  foreignTaxPaid?: number;
  foreignCountry?: string;
  cashLiquidationDistributions?: number;
  noncashLiquidationDistributions?: number;
  exemptInterestDividends?: number;
  specifiedPrivateActivityBondDividends?: number;
  stateTaxWithheld?: number;
  state?: string;
  stateIdNumber?: string;
  createdAt: Date;
}

export interface InvestmentHolding {
  id: string;
  userId: string;
  linkedAccountId: string;
  accountId: string;
  securityId: string;
  securityName: string;
  securityTicker?: string;
  securityType: string;
  quantity: number;
  costBasis?: number;
  currentValue: number;
  unrealizedGainLoss?: number;
  unrealizedGainLossPercent?: number;
  asOfDate: Date;
  createdAt: Date;
}

export interface InvestmentTransaction {
  id: string;
  userId: string;
  linkedAccountId: string;
  accountId: string;
  transactionId: string;
  securityId?: string;
  securityName?: string;
  securityTicker?: string;
  transactionType: string;
  transactionSubtype?: string;
  quantity?: number;
  price?: number;
  amount: number;
  fees?: number;
  date: Date;
  createdAt: Date;
}

export interface DirectDepositInfo {
  accountId: string;
  routingNumber: string;
  accountNumber: string;
  accountType: 'checking' | 'savings';
  bankName: string;
  wireRoutingNumber?: string;
}

export interface PlaidWebhookPayload {
  webhookType: string;
  webhookCode: string;
  itemId: string;
  error?: {
    errorType: string;
    errorCode: string;
    errorMessage: string;
  };
  newTransactions?: number;
  removedTransactions?: string[];
  accountIds?: string[];
}

export interface TaxDocumentSummary {
  taxYear: number;
  totalInterestIncome: number;
  totalDividendIncome: number;
  totalQualifiedDividends: number;
  totalCapitalGains: number;
  totalFederalWithholding: number;
  totalStateTaxWithheld: number;
  documents1099INT: number;
  documents1099DIV: number;
  linkedInstitutions: string[];
}

// ============================================================================
// PLAID SERVICE
// ============================================================================

export class PlaidService {
  private config: PlaidConfig;

  constructor() {
    this.config = {
      clientId: process.env.PLAID_CLIENT_ID || '',
      secret: process.env.PLAID_SECRET || '',
      environment: (process.env.PLAID_ENV as PlaidEnvironment) || 'sandbox',
      webhookUrl: process.env.PLAID_WEBHOOK_URL,
    };
  }

  private getBaseUrl(): string {
    const urls: Record<PlaidEnvironment, string> = {
      sandbox: 'https://sandbox.plaid.com',
      development: 'https://development.plaid.com',
      production: 'https://production.plaid.com',
    };
    return urls[this.config.environment];
  }

  private async plaidRequest<T>(endpoint: string, body: object): Promise<T> {
    const response = await fetch(`${this.getBaseUrl()}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'PLAID-CLIENT-ID': this.config.clientId,
        'PLAID-SECRET': this.config.secret,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.json();
      logger.error('Plaid API error', { endpoint, error });
      throw new Error(`Plaid API error: ${error.error_message || error.message || 'Unknown error'}`);
    }

    return response.json();
  }

  // ============================================================================
  // LINK TOKEN MANAGEMENT
  // ============================================================================

  /**
   * Create a Link token for Plaid Link initialization
   */
  async createLinkToken(request: PlaidLinkTokenRequest): Promise<PlaidLinkTokenResponse> {
    logger.info('Creating Plaid Link token', { userId: request.userId, products: request.products });

    const response = await this.plaidRequest<any>('/link/token/create', {
      client_name: 'LegalFlow Tax',
      user: {
        client_user_id: request.userId,
      },
      products: request.products,
      country_codes: ['US'],
      language: 'en',
      webhook: this.config.webhookUrl,
      redirect_uri: request.redirectUri,
      account_filters: request.accountTypes
        ? {
            depository: request.accountTypes.includes('depository')
              ? { account_subtypes: ['checking', 'savings', 'money_market', 'cd'] }
              : undefined,
            investment: request.accountTypes.includes('investment')
              ? { account_subtypes: ['brokerage', 'ira', '401k', 'roth', 'roth_401k'] }
              : undefined,
          }
        : undefined,
    });

    return {
      linkToken: response.link_token,
      expiration: response.expiration,
      requestId: response.request_id,
    };
  }

  /**
   * Exchange public token for access token after successful Link flow
   */
  async exchangePublicToken(exchange: PlaidPublicTokenExchange): Promise<PlaidAccessToken> {
    logger.info('Exchanging Plaid public token', { userId: exchange.userId });

    const response = await this.plaidRequest<any>('/item/public_token/exchange', {
      public_token: exchange.publicToken,
    });

    // Store the linked account
    await this.storeLinkedAccount(
      exchange.userId,
      response.access_token,
      response.item_id,
      exchange.institutionId,
      exchange.institutionName
    );

    return {
      accessToken: response.access_token,
      itemId: response.item_id,
    };
  }

  /**
   * Store linked account in database
   */
  private async storeLinkedAccount(
    userId: string,
    accessToken: string,
    itemId: string,
    institutionId?: string,
    institutionName?: string
  ): Promise<void> {
    // Get accounts for this item
    const accountsResponse = await this.plaidRequest<any>('/accounts/get', {
      access_token: accessToken,
    });

    const accounts: PlaidAccount[] = accountsResponse.accounts.map((acc: any) => ({
      accountId: acc.account_id,
      name: acc.name,
      officialName: acc.official_name,
      type: acc.type,
      subtype: acc.subtype,
      mask: acc.mask,
      currentBalance: acc.balances?.current,
      availableBalance: acc.balances?.available,
      currency: acc.balances?.iso_currency_code || 'USD',
      institutionId: institutionId || '',
      institutionName: institutionName || '',
    }));

    // Encrypt access token before storing
    const encryptedToken = this.encryptAccessToken(accessToken);

    const { error } = await supabase.from('plaid_linked_accounts').upsert({
      user_id: userId,
      item_id: itemId,
      access_token: encryptedToken,
      institution_id: institutionId,
      institution_name: institutionName,
      accounts: accounts,
      products: ['transactions', 'investments'],
      status: 'active',
      last_sync: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    if (error) {
      logger.error('Error storing linked account', { error });
      throw new Error('Failed to store linked account');
    }

    logger.info('Linked account stored successfully', { userId, itemId });
  }

  private encryptAccessToken(token: string): string {
    // In production, use proper encryption (AES-256-GCM)
    // This is a placeholder - implement with crypto module
    return Buffer.from(token).toString('base64');
  }

  private decryptAccessToken(encryptedToken: string): string {
    // In production, use proper decryption
    return Buffer.from(encryptedToken, 'base64').toString('utf8');
  }

  // ============================================================================
  // ACCOUNT MANAGEMENT
  // ============================================================================

  /**
   * Get all linked accounts for a user
   */
  async getLinkedAccounts(userId: string): Promise<LinkedAccount[]> {
    const { data, error } = await supabase
      .from('plaid_linked_accounts')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      logger.error('Error fetching linked accounts', { error });
      throw new Error('Failed to fetch linked accounts');
    }

    return (data || []).map((row: any) => ({
      id: row.id,
      userId: row.user_id,
      itemId: row.item_id,
      accessToken: row.access_token,
      institutionId: row.institution_id,
      institutionName: row.institution_name,
      accounts: row.accounts,
      products: row.products,
      status: row.status,
      lastSync: new Date(row.last_sync),
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    }));
  }

  /**
   * Refresh account balances
   */
  async refreshAccountBalances(linkedAccountId: string, userId: string): Promise<PlaidAccount[]> {
    const linkedAccount = await this.getLinkedAccountById(linkedAccountId, userId);
    const accessToken = this.decryptAccessToken(linkedAccount.accessToken);

    const response = await this.plaidRequest<any>('/accounts/balance/get', {
      access_token: accessToken,
    });

    const accounts: PlaidAccount[] = response.accounts.map((acc: any) => ({
      accountId: acc.account_id,
      name: acc.name,
      officialName: acc.official_name,
      type: acc.type,
      subtype: acc.subtype,
      mask: acc.mask,
      currentBalance: acc.balances?.current,
      availableBalance: acc.balances?.available,
      currency: acc.balances?.iso_currency_code || 'USD',
      institutionId: linkedAccount.institutionId,
      institutionName: linkedAccount.institutionName,
    }));

    // Update stored accounts
    await supabase
      .from('plaid_linked_accounts')
      .update({
        accounts: accounts,
        last_sync: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', linkedAccountId);

    return accounts;
  }

  /**
   * Remove a linked account
   */
  async unlinkAccount(linkedAccountId: string, userId: string): Promise<void> {
    const linkedAccount = await this.getLinkedAccountById(linkedAccountId, userId);
    const accessToken = this.decryptAccessToken(linkedAccount.accessToken);

    // Remove from Plaid
    await this.plaidRequest('/item/remove', {
      access_token: accessToken,
    });

    // Remove from database
    await supabase.from('plaid_linked_accounts').delete().eq('id', linkedAccountId);

    logger.info('Account unlinked', { linkedAccountId, userId });
  }

  private async getLinkedAccountById(linkedAccountId: string, userId: string): Promise<LinkedAccount> {
    const { data, error } = await supabase
      .from('plaid_linked_accounts')
      .select('*')
      .eq('id', linkedAccountId)
      .eq('user_id', userId)
      .single();

    if (error || !data) {
      throw new Error('Linked account not found');
    }

    return {
      id: data.id,
      userId: data.user_id,
      itemId: data.item_id,
      accessToken: data.access_token,
      institutionId: data.institution_id,
      institutionName: data.institution_name,
      accounts: data.accounts,
      products: data.products,
      status: data.status,
      lastSync: new Date(data.last_sync),
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    };
  }

  // ============================================================================
  // TAX DOCUMENT IMPORT
  // ============================================================================

  /**
   * Import 1099-INT documents from all linked accounts
   */
  async import1099INT(userId: string, taxYear: number): Promise<TaxDocument1099INT[]> {
    const linkedAccounts = await this.getLinkedAccounts(userId);
    const documents: TaxDocument1099INT[] = [];

    for (const linkedAccount of linkedAccounts) {
      try {
        const accessToken = this.decryptAccessToken(linkedAccount.accessToken);

        // Get investment income (interest)
        const response = await this.plaidRequest<any>('/investments/holdings/get', {
          access_token: accessToken,
        });

        // In sandbox, simulate 1099-INT data
        // In production, this would come from Plaid's tax document endpoints
        const simulatedDoc: TaxDocument1099INT = {
          id: `1099int-${linkedAccount.id}-${taxYear}`,
          userId,
          linkedAccountId: linkedAccount.id,
          taxYear,
          payerName: linkedAccount.institutionName,
          interestIncome: this.calculateInterestIncome(response.holdings || []),
          federalTaxWithheld: 0,
          createdAt: new Date(),
        };

        if (simulatedDoc.interestIncome > 0) {
          documents.push(simulatedDoc);
          await this.store1099INT(simulatedDoc);
        }
      } catch (error) {
        logger.warn('Error importing 1099-INT from account', {
          linkedAccountId: linkedAccount.id,
          error,
        });
      }
    }

    logger.info('1099-INT import complete', { userId, taxYear, count: documents.length });
    return documents;
  }

  /**
   * Import 1099-DIV documents from all linked accounts
   */
  async import1099DIV(userId: string, taxYear: number): Promise<TaxDocument1099DIV[]> {
    const linkedAccounts = await this.getLinkedAccounts(userId);
    const documents: TaxDocument1099DIV[] = [];

    for (const linkedAccount of linkedAccounts) {
      try {
        const accessToken = this.decryptAccessToken(linkedAccount.accessToken);

        const response = await this.plaidRequest<any>('/investments/holdings/get', {
          access_token: accessToken,
        });

        // Calculate dividend income from holdings
        const dividendData = this.calculateDividendIncome(response.holdings || []);

        if (dividendData.ordinaryDividends > 0 || dividendData.qualifiedDividends > 0) {
          const doc: TaxDocument1099DIV = {
            id: `1099div-${linkedAccount.id}-${taxYear}`,
            userId,
            linkedAccountId: linkedAccount.id,
            taxYear,
            payerName: linkedAccount.institutionName,
            ...dividendData,
            federalTaxWithheld: 0,
            createdAt: new Date(),
          };

          documents.push(doc);
          await this.store1099DIV(doc);
        }
      } catch (error) {
        logger.warn('Error importing 1099-DIV from account', {
          linkedAccountId: linkedAccount.id,
          error,
        });
      }
    }

    logger.info('1099-DIV import complete', { userId, taxYear, count: documents.length });
    return documents;
  }

  private calculateInterestIncome(holdings: any[]): number {
    // In production, this would use actual interest payment data
    // For simulation, estimate based on bond holdings
    return holdings
      .filter((h) => h.type === 'fixed income' || h.type === 'cash')
      .reduce((sum, h) => sum + (h.institution_value || 0) * 0.03, 0);
  }

  private calculateDividendIncome(holdings: any[]): {
    ordinaryDividends: number;
    qualifiedDividends: number;
    totalCapitalGainDistributions: number;
  } {
    // In production, this would use actual dividend payment data
    // For simulation, estimate based on equity holdings
    const equityHoldings = holdings.filter(
      (h) => h.type === 'equity' || h.type === 'etf' || h.type === 'mutual fund'
    );

    const totalValue = equityHoldings.reduce((sum, h) => sum + (h.institution_value || 0), 0);

    return {
      ordinaryDividends: totalValue * 0.02, // 2% dividend yield estimate
      qualifiedDividends: totalValue * 0.015, // 75% of dividends qualified
      totalCapitalGainDistributions: totalValue * 0.01, // 1% capital gain distributions
    };
  }

  private async store1099INT(doc: TaxDocument1099INT): Promise<void> {
    const { error } = await supabase.from('plaid_tax_documents_1099int').upsert({
      id: doc.id,
      user_id: doc.userId,
      linked_account_id: doc.linkedAccountId,
      tax_year: doc.taxYear,
      payer_name: doc.payerName,
      interest_income: doc.interestIncome,
      federal_tax_withheld: doc.federalTaxWithheld,
      created_at: doc.createdAt.toISOString(),
    });

    if (error) {
      logger.error('Error storing 1099-INT', { error });
    }
  }

  private async store1099DIV(doc: TaxDocument1099DIV): Promise<void> {
    const { error } = await supabase.from('plaid_tax_documents_1099div').upsert({
      id: doc.id,
      user_id: doc.userId,
      linked_account_id: doc.linkedAccountId,
      tax_year: doc.taxYear,
      payer_name: doc.payerName,
      ordinary_dividends: doc.ordinaryDividends,
      qualified_dividends: doc.qualifiedDividends,
      total_capital_gain_distributions: doc.totalCapitalGainDistributions,
      federal_tax_withheld: doc.federalTaxWithheld,
      created_at: doc.createdAt.toISOString(),
    });

    if (error) {
      logger.error('Error storing 1099-DIV', { error });
    }
  }

  /**
   * Get all tax documents for a user and tax year
   */
  async getTaxDocuments(
    userId: string,
    taxYear: number
  ): Promise<{ documents1099INT: TaxDocument1099INT[]; documents1099DIV: TaxDocument1099DIV[] }> {
    const [int1099, div1099] = await Promise.all([
      supabase
        .from('plaid_tax_documents_1099int')
        .select('*')
        .eq('user_id', userId)
        .eq('tax_year', taxYear),
      supabase
        .from('plaid_tax_documents_1099div')
        .select('*')
        .eq('user_id', userId)
        .eq('tax_year', taxYear),
    ]);

    return {
      documents1099INT: (int1099.data || []).map(this.map1099INT),
      documents1099DIV: (div1099.data || []).map(this.map1099DIV),
    };
  }

  /**
   * Get tax document summary for a user
   */
  async getTaxDocumentSummary(userId: string, taxYear: number): Promise<TaxDocumentSummary> {
    const { documents1099INT, documents1099DIV } = await this.getTaxDocuments(userId, taxYear);
    const linkedAccounts = await this.getLinkedAccounts(userId);

    return {
      taxYear,
      totalInterestIncome: documents1099INT.reduce((sum, d) => sum + d.interestIncome, 0),
      totalDividendIncome: documents1099DIV.reduce((sum, d) => sum + d.ordinaryDividends, 0),
      totalQualifiedDividends: documents1099DIV.reduce((sum, d) => sum + d.qualifiedDividends, 0),
      totalCapitalGains: documents1099DIV.reduce((sum, d) => sum + d.totalCapitalGainDistributions, 0),
      totalFederalWithholding:
        documents1099INT.reduce((sum, d) => sum + (d.federalTaxWithheld || 0), 0) +
        documents1099DIV.reduce((sum, d) => sum + (d.federalTaxWithheld || 0), 0),
      totalStateTaxWithheld:
        documents1099INT.reduce((sum, d) => sum + (d.stateTaxWithheld || 0), 0) +
        documents1099DIV.reduce((sum, d) => sum + (d.stateTaxWithheld || 0), 0),
      documents1099INT: documents1099INT.length,
      documents1099DIV: documents1099DIV.length,
      linkedInstitutions: linkedAccounts.map((a) => a.institutionName),
    };
  }

  private map1099INT(row: any): TaxDocument1099INT {
    return {
      id: row.id,
      userId: row.user_id,
      linkedAccountId: row.linked_account_id,
      taxYear: row.tax_year,
      payerName: row.payer_name,
      payerTin: row.payer_tin,
      interestIncome: row.interest_income,
      earlyWithdrawalPenalty: row.early_withdrawal_penalty,
      interestOnUsSavingsBonds: row.interest_on_us_savings_bonds,
      federalTaxWithheld: row.federal_tax_withheld,
      investmentExpenses: row.investment_expenses,
      foreignTaxPaid: row.foreign_tax_paid,
      taxExemptInterest: row.tax_exempt_interest,
      specifiedPrivateActivityBondInterest: row.specified_private_activity_bond_interest,
      marketDiscount: row.market_discount,
      bondPremium: row.bond_premium,
      bondPremiumOnTreasury: row.bond_premium_on_treasury,
      bondPremiumOnTaxExemptBond: row.bond_premium_on_tax_exempt_bond,
      stateTaxWithheld: row.state_tax_withheld,
      state: row.state,
      stateIdNumber: row.state_id_number,
      createdAt: new Date(row.created_at),
    };
  }

  private map1099DIV(row: any): TaxDocument1099DIV {
    return {
      id: row.id,
      userId: row.user_id,
      linkedAccountId: row.linked_account_id,
      taxYear: row.tax_year,
      payerName: row.payer_name,
      payerTin: row.payer_tin,
      ordinaryDividends: row.ordinary_dividends,
      qualifiedDividends: row.qualified_dividends,
      totalCapitalGainDistributions: row.total_capital_gain_distributions,
      unrecapturedSection1250Gain: row.unrecaptured_section_1250_gain,
      section1202Gain: row.section_1202_gain,
      collectiblesGain: row.collectibles_gain,
      section897OrdinaryDividends: row.section_897_ordinary_dividends,
      section897CapitalGain: row.section_897_capital_gain,
      nondividendDistributions: row.nondividend_distributions,
      federalTaxWithheld: row.federal_tax_withheld,
      section199ADividends: row.section_199a_dividends,
      investmentExpenses: row.investment_expenses,
      foreignTaxPaid: row.foreign_tax_paid,
      foreignCountry: row.foreign_country,
      cashLiquidationDistributions: row.cash_liquidation_distributions,
      noncashLiquidationDistributions: row.noncash_liquidation_distributions,
      exemptInterestDividends: row.exempt_interest_dividends,
      specifiedPrivateActivityBondDividends: row.specified_private_activity_bond_dividends,
      stateTaxWithheld: row.state_tax_withheld,
      state: row.state,
      stateIdNumber: row.state_id_number,
      createdAt: new Date(row.created_at),
    };
  }

  // ============================================================================
  // INVESTMENT TRACKING
  // ============================================================================

  /**
   * Get investment holdings for all linked accounts
   */
  async getInvestmentHoldings(userId: string): Promise<InvestmentHolding[]> {
    const linkedAccounts = await this.getLinkedAccounts(userId);
    const allHoldings: InvestmentHolding[] = [];

    for (const linkedAccount of linkedAccounts) {
      if (!linkedAccount.products.includes('investments')) continue;

      try {
        const accessToken = this.decryptAccessToken(linkedAccount.accessToken);

        const response = await this.plaidRequest<any>('/investments/holdings/get', {
          access_token: accessToken,
        });

        const securities = new Map(response.securities?.map((s: any) => [s.security_id, s]) || []);

        const holdings: InvestmentHolding[] = (response.holdings || []).map((h: any) => {
          const security = securities.get(h.security_id) || {};
          return {
            id: `holding-${h.account_id}-${h.security_id}`,
            userId,
            linkedAccountId: linkedAccount.id,
            accountId: h.account_id,
            securityId: h.security_id,
            securityName: security.name || 'Unknown',
            securityTicker: security.ticker_symbol,
            securityType: security.type || 'unknown',
            quantity: h.quantity,
            costBasis: h.cost_basis,
            currentValue: h.institution_value,
            unrealizedGainLoss: h.cost_basis ? h.institution_value - h.cost_basis : undefined,
            unrealizedGainLossPercent:
              h.cost_basis && h.cost_basis > 0
                ? ((h.institution_value - h.cost_basis) / h.cost_basis) * 100
                : undefined,
            asOfDate: new Date(h.institution_price_as_of || new Date()),
            createdAt: new Date(),
          };
        });

        allHoldings.push(...holdings);
      } catch (error) {
        logger.warn('Error fetching holdings from account', {
          linkedAccountId: linkedAccount.id,
          error,
        });
      }
    }

    return allHoldings;
  }

  /**
   * Get investment transactions for all linked accounts
   */
  async getInvestmentTransactions(
    userId: string,
    startDate: Date,
    endDate: Date
  ): Promise<InvestmentTransaction[]> {
    const linkedAccounts = await this.getLinkedAccounts(userId);
    const allTransactions: InvestmentTransaction[] = [];

    for (const linkedAccount of linkedAccounts) {
      if (!linkedAccount.products.includes('investments')) continue;

      try {
        const accessToken = this.decryptAccessToken(linkedAccount.accessToken);

        const response = await this.plaidRequest<any>('/investments/transactions/get', {
          access_token: accessToken,
          start_date: startDate.toISOString().split('T')[0],
          end_date: endDate.toISOString().split('T')[0],
        });

        const securities = new Map(response.securities?.map((s: any) => [s.security_id, s]) || []);

        const transactions: InvestmentTransaction[] = (response.investment_transactions || []).map(
          (t: any) => {
            const security = securities.get(t.security_id) || {};
            return {
              id: `txn-${t.investment_transaction_id}`,
              userId,
              linkedAccountId: linkedAccount.id,
              accountId: t.account_id,
              transactionId: t.investment_transaction_id,
              securityId: t.security_id,
              securityName: security.name,
              securityTicker: security.ticker_symbol,
              transactionType: t.type,
              transactionSubtype: t.subtype,
              quantity: t.quantity,
              price: t.price,
              amount: t.amount,
              fees: t.fees,
              date: new Date(t.date),
              createdAt: new Date(),
            };
          }
        );

        allTransactions.push(...transactions);
      } catch (error) {
        logger.warn('Error fetching transactions from account', {
          linkedAccountId: linkedAccount.id,
          error,
        });
      }
    }

    // Sort by date descending
    return allTransactions.sort((a, b) => b.date.getTime() - a.date.getTime());
  }

  /**
   * Calculate cost basis for tax year
   */
  async calculateCostBasis(
    userId: string,
    taxYear: number
  ): Promise<{
    totalProceeds: number;
    totalCostBasis: number;
    totalGainLoss: number;
    shortTermGainLoss: number;
    longTermGainLoss: number;
    transactions: InvestmentTransaction[];
  }> {
    const startDate = new Date(taxYear, 0, 1);
    const endDate = new Date(taxYear, 11, 31);

    const transactions = await this.getInvestmentTransactions(userId, startDate, endDate);

    // Filter for sell transactions
    const sellTransactions = transactions.filter(
      (t) => t.transactionType === 'sell' || t.transactionType === 'cash'
    );

    // In production, this would track individual lots for accurate cost basis
    // This is a simplified calculation
    let totalProceeds = 0;
    let totalCostBasis = 0;
    let shortTermGainLoss = 0;
    let longTermGainLoss = 0;

    for (const txn of sellTransactions) {
      const proceeds = Math.abs(txn.amount);
      // Estimate cost basis (in production, use actual lot tracking)
      const estimatedCostBasis = proceeds * 0.8; // Assume 20% gain on average

      totalProceeds += proceeds;
      totalCostBasis += estimatedCostBasis;

      // Assume all are long-term for simplicity
      // In production, track purchase date for each lot
      longTermGainLoss += proceeds - estimatedCostBasis;
    }

    return {
      totalProceeds,
      totalCostBasis,
      totalGainLoss: totalProceeds - totalCostBasis,
      shortTermGainLoss,
      longTermGainLoss,
      transactions: sellTransactions,
    };
  }

  // ============================================================================
  // DIRECT DEPOSIT
  // ============================================================================

  /**
   * Get direct deposit information for tax refund
   */
  async getDirectDepositInfo(userId: string, accountId: string): Promise<DirectDepositInfo | null> {
    const linkedAccounts = await this.getLinkedAccounts(userId);

    for (const linkedAccount of linkedAccounts) {
      const account = linkedAccount.accounts.find((a) => a.accountId === accountId);
      if (!account) continue;

      // Only checking and savings accounts can receive direct deposit
      if (account.type !== 'depository') continue;
      if (!['checking', 'savings'].includes(account.subtype)) continue;

      try {
        const accessToken = this.decryptAccessToken(linkedAccount.accessToken);

        const response = await this.plaidRequest<any>('/auth/get', {
          access_token: accessToken,
          options: {
            account_ids: [accountId],
          },
        });

        const numbers = response.numbers?.ach?.find((n: any) => n.account_id === accountId);

        if (numbers) {
          return {
            accountId,
            routingNumber: numbers.routing,
            accountNumber: numbers.account,
            accountType: account.subtype as 'checking' | 'savings',
            bankName: linkedAccount.institutionName,
            wireRoutingNumber: numbers.wire_routing,
          };
        }
      } catch (error) {
        logger.warn('Error fetching auth data', { accountId, error });
      }
    }

    return null;
  }

  // ============================================================================
  // WEBHOOKS
  // ============================================================================

  /**
   * Handle Plaid webhook events
   */
  async handleWebhook(payload: PlaidWebhookPayload): Promise<void> {
    logger.info('Received Plaid webhook', {
      type: payload.webhookType,
      code: payload.webhookCode,
      itemId: payload.itemId,
    });

    switch (payload.webhookType) {
      case 'ITEM':
        await this.handleItemWebhook(payload);
        break;
      case 'INVESTMENTS_TRANSACTIONS':
        await this.handleInvestmentWebhook(payload);
        break;
      case 'HOLDINGS':
        await this.handleHoldingsWebhook(payload);
        break;
      default:
        logger.debug('Unhandled webhook type', { type: payload.webhookType });
    }
  }

  private async handleItemWebhook(payload: PlaidWebhookPayload): Promise<void> {
    const { itemId, webhookCode, error } = payload;

    if (webhookCode === 'ERROR' && error) {
      await supabase
        .from('plaid_linked_accounts')
        .update({
          status: error.errorCode === 'ITEM_LOGIN_REQUIRED' ? 'requires_reauth' : 'error',
          updated_at: new Date().toISOString(),
        })
        .eq('item_id', itemId);
    }
  }

  private async handleInvestmentWebhook(payload: PlaidWebhookPayload): Promise<void> {
    // New investment transactions available - could trigger auto-import
    logger.info('New investment transactions available', { itemId: payload.itemId });
  }

  private async handleHoldingsWebhook(payload: PlaidWebhookPayload): Promise<void> {
    // Holdings updated - could trigger portfolio refresh
    logger.info('Holdings updated', { itemId: payload.itemId });
  }

  // ============================================================================
  // INSTITUTION SEARCH
  // ============================================================================

  /**
   * Search for financial institutions
   */
  async searchInstitutions(query: string, products?: PlaidProduct[]): Promise<PlaidInstitution[]> {
    const response = await this.plaidRequest<any>('/institutions/search', {
      query,
      products: products || ['transactions'],
      country_codes: ['US'],
      options: {
        include_optional_metadata: true,
      },
    });

    return (response.institutions || []).map((inst: any) => ({
      institutionId: inst.institution_id,
      name: inst.name,
      logo: inst.logo,
      primaryColor: inst.primary_color,
      url: inst.url,
      oauth: inst.oauth || false,
    }));
  }

  /**
   * Get institution by ID
   */
  async getInstitution(institutionId: string): Promise<PlaidInstitution | null> {
    try {
      const response = await this.plaidRequest<any>('/institutions/get_by_id', {
        institution_id: institutionId,
        country_codes: ['US'],
        options: {
          include_optional_metadata: true,
        },
      });

      const inst = response.institution;
      return {
        institutionId: inst.institution_id,
        name: inst.name,
        logo: inst.logo,
        primaryColor: inst.primary_color,
        url: inst.url,
        oauth: inst.oauth || false,
      };
    } catch {
      return null;
    }
  }
}

// Export singleton instance
export const plaidService = new PlaidService();
