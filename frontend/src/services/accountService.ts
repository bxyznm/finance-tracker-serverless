import { ApiClient, apiGet, apiPost, apiPut, apiDelete } from './apiClient';
import {
  CreateAccountRequest,
  UpdateAccountRequest,
  UpdateBalanceRequest,
  AccountResponse,
  AccountListResponse,
} from '../types/account';

export class AccountService {
  /**
   * Get all accounts for the current user
   * Endpoint: GET /accounts
   */
  static async getAccounts(): Promise<AccountListResponse> {
    try {
      const response = await apiGet<AccountListResponse>('/accounts');
      return response.data;
    } catch (error: any) {
      console.error('Error fetching accounts:', error);
      throw error;
    }
  }

  /**
   * Get a specific account by ID
   * Endpoint: GET /accounts/{account_id}
   */
  static async getAccount(accountId: string): Promise<AccountResponse> {
    try {
      const response = await apiGet<AccountResponse>(`/accounts/${accountId}`);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching account:', error);
      throw error;
    }
  }

  /**
   * Create a new account
   * Endpoint: POST /accounts
   */
  static async createAccount(accountData: CreateAccountRequest): Promise<AccountResponse> {
    try {
      const response = await apiPost<AccountResponse>('/accounts', accountData);
      return response.data;
    } catch (error: any) {
      console.error('Error creating account:', error);
      throw error;
    }
  }

  /**
   * Update account information (name, color, description only)
   * Endpoint: PUT /accounts/{account_id}
   */
  static async updateAccount(
    accountId: string,
    accountData: UpdateAccountRequest
  ): Promise<AccountResponse> {
    try {
      const response = await apiPut<AccountResponse>(`/accounts/${accountId}`, accountData);
      return response.data;
    } catch (error: any) {
      console.error('Error updating account:', error);
      throw error;
    }
  }

  /**
   * Update account balance
   * Endpoint: PATCH /accounts/{account_id}/balance
   */
  static async updateBalance(
    accountId: string,
    balanceData: UpdateBalanceRequest
  ): Promise<AccountResponse> {
    try {
      const response = await ApiClient.makeAuthenticatedRequest<AccountResponse>(
        `/accounts/${accountId}/balance`,
        {
          method: 'PATCH',
          data: balanceData,
        }
      );
      return response.data;
    } catch (error: any) {
      console.error('Error updating account balance:', error);
      throw error;
    }
  }

  /**
   * Delete account (soft delete)
   * Endpoint: DELETE /accounts/{account_id}
   */
  static async deleteAccount(accountId: string): Promise<{ message: string }> {
    try {
      const response = await apiDelete<{ message: string }>(`/accounts/${accountId}`);
      return response.data;
    } catch (error: any) {
      console.error('Error deleting account:', error);
      throw error;
    }
  }

  /**
   * Format currency amount for display
   */
  static formatCurrency(amount: number, currency: string): string {
    const formatters: Record<string, Intl.NumberFormat> = {
      MXN: new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }),
      USD: new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }),
      EUR: new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }),
      CAD: new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD' }),
    };

    const formatter = formatters[currency] || formatters.MXN;
    return formatter.format(amount);
  }

  /**
   * Get bank logo URL (placeholder for now)
   */
  static getBankLogo(bankCode: string): string {
    // This could be expanded to use actual bank logos
    const bankLogos: Record<string, string> = {
      BBVA: '🏦',
      SANTANDER: '🏛️',
      BANORTE: '🏢',
      HSBC: '🏪',
      CITIBANAMEX: '🏬',
      SCOTIABANK: '🏦',
      INBURSA: '🏢',
      AZTECA: '🏪',
      BAJIO: '🏛️',
      BANREGIO: '🏦',
    };

    return bankLogos[bankCode] || '🏦';
  }

  /**
   * Get account type icon
   */
  static getAccountTypeIcon(accountType: string): string {
    const icons: Record<string, string> = {
      checking: '🏧',
      savings: '💰',
      credit: '💳',
      investment: '📈',
    };

    return icons[accountType] || '🏦';
  }
}
