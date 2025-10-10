/**
 * Servicio para operaciones de transacciones
 */

import { apiGet, apiPost, apiPut, apiDelete } from './apiClient';
import type {
  Transaction,
  TransactionCreateRequest,
  TransactionUpdateRequest,
  TransactionListResponse,
  TransactionSummary,
  TransactionFilter
} from '../types/transaction';

class TransactionService {
  private baseUrl = '/transactions';

  /**
   * Crear una nueva transacción
   */
  async createTransaction(transactionData: TransactionCreateRequest): Promise<Transaction> {
    const response = await apiPost<Transaction>(this.baseUrl, transactionData);
    return response.data;
  }

  /**
   * Obtener una transacción por ID
   */
  async getTransaction(transactionId: string): Promise<Transaction> {
    const response = await apiGet<Transaction>(`${this.baseUrl}/${transactionId}`);
    return response.data;
  }

  /**
   * Listar transacciones con filtros opcionales
   */
  async listTransactions(filters: TransactionFilter = {}): Promise<TransactionListResponse> {
    const params = new URLSearchParams();
    
    // Agregar filtros como parámetros de consulta
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        if (Array.isArray(value)) {
          // Para arrays como tags, agregar múltiples parámetros
          value.forEach(item => params.append(key, item.toString()));
        } else {
          params.append(key, value.toString());
        }
      }
    });

    const queryString = params.toString();
    const url = queryString ? `${this.baseUrl}?${queryString}` : this.baseUrl;
    
    const response = await apiGet<TransactionListResponse>(url);
    return response.data;
  }

  /**
   * Actualizar una transacción existente
   */
  async updateTransaction(transactionId: string, updateData: TransactionUpdateRequest): Promise<Transaction> {
    const response = await apiPut<Transaction>(`${this.baseUrl}/${transactionId}`, updateData);
    return response.data;
  }

  /**
   * Eliminar una transacción
   */
  async deleteTransaction(transactionId: string): Promise<void> {
    await apiDelete(`${this.baseUrl}/${transactionId}`);
  }

  /**
   * Obtener resumen de transacciones
   */
  async getTransactionSummary(period: string = 'last_30_days', accountId?: string): Promise<TransactionSummary> {
    const params = new URLSearchParams({ period });
    if (accountId) {
      params.append('account_id', accountId);
    }
    
    const response = await apiGet<TransactionSummary>(`${this.baseUrl}/summary?${params.toString()}`);
    return response.data;
  }

  /**
   * Crear una transacción de transferencia entre cuentas
   */
  async createTransfer(
    sourceAccountId: string,
    destinationAccountId: string,
    amount: number,
    description: string,
    notes?: string
  ): Promise<Transaction> {
    const transferData: TransactionCreateRequest = {
      account_id: sourceAccountId,
      destination_account_id: destinationAccountId,
      amount,
      description,
      transaction_type: 'transfer',
      category: 'account_transfer',
      notes
    };

    return this.createTransaction(transferData);
  }

  /**
   * Obtener transacciones por cuenta
   */
  async getTransactionsByAccount(
    accountId: string, 
    page: number = 1, 
    perPage: number = 50,
    sortBy: 'date' | 'amount' | 'description' | 'created_at' = 'date',
    sortOrder: 'asc' | 'desc' = 'desc'
  ): Promise<TransactionListResponse> {
    return this.listTransactions({
      account_id: accountId,
      page,
      per_page: perPage,
      sort_by: sortBy,
      sort_order: sortOrder
    });
  }

  /**
   * Buscar transacciones por término
   */
  async searchTransactions(
    searchTerm: string,
    filters: Omit<TransactionFilter, 'search_term'> = {}
  ): Promise<TransactionListResponse> {
    return this.listTransactions({
      ...filters,
      search_term: searchTerm
    });
  }

  /**
   * Obtener transacciones por rango de fechas
   */
  async getTransactionsByDateRange(
    dateFrom: string,
    dateTo: string,
    filters: Omit<TransactionFilter, 'date_from' | 'date_to'> = {}
  ): Promise<TransactionListResponse> {
    return this.listTransactions({
      ...filters,
      date_from: dateFrom,
      date_to: dateTo
    });
  }

  /**
   * Obtener transacciones por categoría
   */
  async getTransactionsByCategory(
    category: string,
    filters: Omit<TransactionFilter, 'category'> = {}
  ): Promise<TransactionListResponse> {
    return this.listTransactions({
      ...filters,
      category: category as any
    });
  }

  /**
   * Obtener estadísticas de gastos por categoría
   */
  async getExpensesByCategory(period: string = 'last_30_days'): Promise<Record<string, number>> {
    const summary = await this.getTransactionSummary(period);
    return summary.expenses_by_category;
  }

  /**
   * Obtener estadísticas de ingresos por categoría
   */
  async getIncomeByCategory(period: string = 'last_30_days'): Promise<Record<string, number>> {
    const summary = await this.getTransactionSummary(period);
    return summary.income_by_category;
  }
}

// Exportar instancia única del servicio
export const transactionService = new TransactionService();
export default transactionService;
