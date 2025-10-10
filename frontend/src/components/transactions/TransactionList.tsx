/**
 * Componente para mostrar una lista de transacciones
 */

import React from 'react';
import type { Transaction } from '../../types';
import { TRANSACTION_TYPE_LABELS, TRANSACTION_CATEGORY_LABELS } from '../../types/transaction';

interface TransactionListProps {
  transactions: Transaction[];
  loading?: boolean;
  onTransactionClick?: (transaction: Transaction) => void;
  onEditTransaction?: (transaction: Transaction) => void;
  onDeleteTransaction?: (transactionId: string) => void;
}

export const TransactionList: React.FC<TransactionListProps> = ({
  transactions,
  loading = false,
  onTransactionClick,
  onEditTransaction,
  onDeleteTransaction
}) => {
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('es-MX', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const getTransactionTypeColor = (type: string): string => {
    const colors: Record<string, string> = {
      income: 'text-green-600',
      expense: 'text-red-600',
      transfer: 'text-blue-600',
      investment: 'text-purple-600',
      refund: 'text-green-500',
      fee: 'text-red-500'
    };
    return colors[type] || 'text-gray-600';
  };

  const getAmountSign = (amount: number, type: string): string => {
    if (type === 'income' || type === 'refund') return '+';
    if (type === 'expense' || type === 'fee') return '-';
    return '';
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, index) => (
          <div key={index} className="bg-white rounded-lg shadow p-6 animate-pulse">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
              <div className="h-6 bg-gray-200 rounded w-20"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!transactions.length) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 text-lg mb-2">No hay transacciones</div>
        <div className="text-gray-500">No se encontraron transacciones con los filtros aplicados</div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {transactions.map((transaction) => (
        <div
          key={transaction.transaction_id}
          className={`bg-white rounded-lg shadow-sm border border-gray-200 p-4 transition-all duration-200 hover:shadow-md ${
            onTransactionClick ? 'cursor-pointer hover:bg-gray-50' : ''
          }`}
          onClick={() => onTransactionClick?.(transaction)}
        >
          <div className="flex items-center justify-between">
            {/* Información principal */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-1">
                {/* Icono de categoría */}
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold ${
                  transaction.transaction_type === 'income' 
                    ? 'bg-green-100 text-green-700'
                    : transaction.transaction_type === 'expense'
                    ? 'bg-red-100 text-red-700'
                    : transaction.transaction_type === 'transfer'
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-gray-100 text-gray-700'
                }`}>
                  {transaction.transaction_type === 'income' && '↗'}
                  {transaction.transaction_type === 'expense' && '↙'}
                  {transaction.transaction_type === 'transfer' && '↔'}
                  {!['income', 'expense', 'transfer'].includes(transaction.transaction_type) && '○'}
                </div>
                
                <div className="min-w-0 flex-1">
                  {/* Descripción */}
                  <h3 className="font-medium text-gray-900 truncate">
                    {transaction.description}
                  </h3>
                  
                  {/* Categoría y tipo */}
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <span>{TRANSACTION_CATEGORY_LABELS[transaction.category]}</span>
                    <span>•</span>
                    <span>{TRANSACTION_TYPE_LABELS[transaction.transaction_type]}</span>
                    {transaction.location && (
                      <>
                        <span>•</span>
                        <span>{transaction.location}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Fecha y etiquetas */}
              <div className="flex items-center gap-2 mt-2">
                <span className="text-xs text-gray-400">
                  {formatDate(transaction.transaction_date)}
                </span>
                
                {transaction.tags && transaction.tags.length > 0 && (
                  <div className="flex gap-1">
                    {transaction.tags.slice(0, 3).map((tag, index) => (
                      <span
                        key={index}
                        className="inline-block px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                    {transaction.tags.length > 3 && (
                      <span className="text-xs text-gray-400">+{transaction.tags.length - 3}</span>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Monto y acciones */}
            <div className="flex items-center gap-3 ml-4">
              <div className="text-right">
                <div className={`font-semibold text-lg ${getTransactionTypeColor(transaction.transaction_type)}`}>
                  {getAmountSign(transaction.amount, transaction.transaction_type)}
                  {formatCurrency(Math.abs(transaction.amount))}
                </div>
                
                {transaction.reference_number && (
                  <div className="text-xs text-gray-400">
                    Ref: {transaction.reference_number}
                  </div>
                )}
              </div>

              {/* Menú de acciones */}
              {(onEditTransaction || onDeleteTransaction) && (
                <div className="flex flex-col gap-1">
                  {onEditTransaction && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditTransaction(transaction);
                      }}
                      className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                      title="Editar transacción"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                  )}
                  
                  {onDeleteTransaction && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        // eslint-disable-next-line no-restricted-globals
                        if (confirm('¿Estás seguro de que deseas eliminar esta transacción?')) {
                          onDeleteTransaction(transaction.transaction_id);
                        }
                      }}
                      className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                      title="Eliminar transacción"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Notas (si existen) */}
          {transaction.notes && (
            <div className="mt-3 pt-3 border-t border-gray-100">
              <p className="text-sm text-gray-600 italic">
                {transaction.notes}
              </p>
            </div>
          )}

          {/* Información de transferencia (si es transferencia) */}
          {transaction.transaction_type === 'transfer' && transaction.destination_account_id && (
            <div className="mt-3 pt-3 border-t border-gray-100">
              <p className="text-sm text-gray-600">
                <span className="font-medium">Transferencia a:</span> {transaction.destination_account_id}
              </p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};
