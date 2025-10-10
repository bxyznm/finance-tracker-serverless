/**
 * Hook personalizado para manejar operaciones de transacciones
 */

import { useState, useEffect, useCallback } from 'react';
import { transactionService } from '../services';
import type {
  Transaction, 
  TransactionCreateRequest,
  TransactionUpdateRequest,
  TransactionListResponse,
  TransactionSummary,
  TransactionFilter
} from '../types';

export interface UseTransactionsOptions {
  autoLoad?: boolean;
  filters?: TransactionFilter;
}

export interface UseTransactionsReturn {
  // Estado
  transactions: Transaction[];
  loading: boolean;
  error: string | null;
  totalCount: number;
  totalPages: number;
  currentPage: number;
  summary: {
    totalIncome: number;
    totalExpenses: number;
    netAmount: number;
  };

  // Acciones
  loadTransactions: (filters?: TransactionFilter) => Promise<void>;
  createTransaction: (data: TransactionCreateRequest) => Promise<Transaction>;
  updateTransaction: (id: string, data: TransactionUpdateRequest) => Promise<Transaction>;
  deleteTransaction: (id: string) => Promise<void>;
  refreshTransactions: () => Promise<void>;
  
  // Filtros
  applyFilters: (filters: TransactionFilter) => void;
  clearFilters: () => void;
  
  // Paginación
  nextPage: () => void;
  prevPage: () => void;
  goToPage: (page: number) => void;
}

/**
 * Hook para manejar la lista de transacciones con filtros y paginación
 */
export function useTransactions(options: UseTransactionsOptions = {}): UseTransactionsReturn {
  const { autoLoad = true, filters: initialFilters = {} } = options;

  // Estado
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState<boolean>(autoLoad);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [filters, setFilters] = useState<TransactionFilter>(initialFilters);
  const [summary, setSummary] = useState({
    totalIncome: 0,
    totalExpenses: 0,
    netAmount: 0
  });

  // Cargar transacciones
  const loadTransactions = useCallback(async (newFilters?: TransactionFilter) => {
    setLoading(true);
    setError(null);

    try {
      const filtersToUse = newFilters || filters;
      const response: TransactionListResponse = await transactionService.listTransactions(filtersToUse);
      
      setTransactions(response.transactions);
      setTotalCount(response.total_count);
      setTotalPages(response.total_pages);
      setCurrentPage(response.page);
      setSummary({
        totalIncome: response.total_income,
        totalExpenses: response.total_expenses,
        netAmount: response.net_amount
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar transacciones');
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  // Crear transacción
  const createTransaction = useCallback(async (data: TransactionCreateRequest): Promise<Transaction> => {
    try {
      const newTransaction = await transactionService.createTransaction(data);
      // Recargar lista después de crear
      await loadTransactions();
      return newTransaction;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear transacción');
      throw err;
    }
  }, [loadTransactions]);

  // Actualizar transacción
  const updateTransaction = useCallback(async (id: string, data: TransactionUpdateRequest): Promise<Transaction> => {
    try {
      const updatedTransaction = await transactionService.updateTransaction(id, data);
      // Actualizar en la lista local
      setTransactions(prev => 
        prev.map(t => t.transaction_id === id ? updatedTransaction : t)
      );
      return updatedTransaction;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al actualizar transacción');
      throw err;
    }
  }, []);

  // Eliminar transacción
  const deleteTransaction = useCallback(async (id: string): Promise<void> => {
    try {
      await transactionService.deleteTransaction(id);
      // Remover de la lista local
      setTransactions(prev => prev.filter(t => t.transaction_id !== id));
      // Actualizar conteos
      setTotalCount(prev => prev - 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar transacción');
      throw err;
    }
  }, []);

  // Refrescar transacciones
  const refreshTransactions = useCallback(() => {
    return loadTransactions(filters);
  }, [loadTransactions, filters]);

  // Aplicar filtros
  const applyFilters = useCallback((newFilters: TransactionFilter) => {
    setFilters(newFilters);
    setCurrentPage(1); // Resetear a primera página
    loadTransactions({ ...newFilters, page: 1 });
  }, [loadTransactions]);

  // Limpiar filtros
  const clearFilters = useCallback(() => {
    const clearedFilters: TransactionFilter = { page: 1, per_page: 50 };
    setFilters(clearedFilters);
    loadTransactions(clearedFilters);
  }, [loadTransactions]);

  // Navegación de páginas
  const nextPage = useCallback(() => {
    if (currentPage < totalPages) {
      const newPage = currentPage + 1;
      const newFilters = { ...filters, page: newPage };
      setCurrentPage(newPage);
      loadTransactions(newFilters);
    }
  }, [currentPage, totalPages, filters, loadTransactions]);

  const prevPage = useCallback(() => {
    if (currentPage > 1) {
      const newPage = currentPage - 1;
      const newFilters = { ...filters, page: newPage };
      setCurrentPage(newPage);
      loadTransactions(newFilters);
    }
  }, [currentPage, filters, loadTransactions]);

  const goToPage = useCallback((page: number) => {
    if (page >= 1 && page <= totalPages) {
      const newFilters = { ...filters, page };
      setCurrentPage(page);
      loadTransactions(newFilters);
    }
  }, [totalPages, filters, loadTransactions]);

  // Efecto para carga automática
  useEffect(() => {
    if (autoLoad) {
      loadTransactions();
    }
  }, []); // Solo ejecutar una vez al montar

  return {
    // Estado
    transactions,
    loading,
    error,
    totalCount,
    totalPages,
    currentPage,
    summary,
    
    // Acciones
    loadTransactions,
    createTransaction,
    updateTransaction,
    deleteTransaction,
    refreshTransactions,
    
    // Filtros
    applyFilters,
    clearFilters,
    
    // Paginación
    nextPage,
    prevPage,
    goToPage
  };
}

/**
 * Hook para obtener una transacción específica
 */
export function useTransaction(transactionId?: string) {
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const loadTransaction = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);

    try {
      const transaction = await transactionService.getTransaction(id);
      setTransaction(transaction);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar transacción');
      setTransaction(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (transactionId) {
      loadTransaction(transactionId);
    }
  }, [transactionId, loadTransaction]);

  return {
    transaction,
    loading,
    error,
    loadTransaction,
    refetch: () => transactionId && loadTransaction(transactionId)
  };
}

/**
 * Hook para obtener resumen de transacciones
 */
export function useTransactionSummary(period: string = 'last_30_days', accountId?: string) {
  const [summary, setSummary] = useState<TransactionSummary | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadSummary = useCallback(async (newPeriod?: string, newAccountId?: string) => {
    setLoading(true);
    setError(null);

    try {
      const summaryData = await transactionService.getTransactionSummary(
        newPeriod || period,
        newAccountId || accountId
      );
      setSummary(summaryData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar resumen');
      setSummary(null);
    } finally {
      setLoading(false);
    }
  }, [period, accountId]);

  useEffect(() => {
    loadSummary();
  }, [loadSummary]);

  return {
    summary,
    loading,
    error,
    refetch: loadSummary
  };
}
