/**
 * Componente para mostrar una lista de transacciones con diseño mejorado y user-friendly
 */

import React, { useState } from 'react';
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
  const [expandedTransaction, setExpandedTransaction] = useState<string | null>(null);

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(Math.abs(amount));
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    // Si es hoy
    if (diffDays === 0) {
      return `Hoy, ${date.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}`;
    }
    // Si es ayer
    if (diffDays === 1) {
      return `Ayer, ${date.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}`;
    }
    // Si es esta semana
    if (diffDays < 7) {
      return date.toLocaleDateString('es-MX', { 
        weekday: 'long', 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    }
    // Fecha normal
    return date.toLocaleDateString('es-MX', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTransactionIcon = (type: string, category: string): string => {
    // Iconos específicos por categoría
    const categoryIcons: Record<string, string> = {
      // Ingresos
      salary: '💰',
      freelance: '💼',
      business_income: '🏢',
      investment_gains: '📈',
      rental_income: '🏠',
      gifts_received: '🎁',
      refunds: '↩️',
      
      // Gastos
      food_drinks: '🍽️',
      transportation: '🚗',
      shopping: '🛍️',
      entertainment: '🎬',
      bills_utilities: '📄',
      healthcare: '🏥',
      education: '📚',
      travel: '✈️',
      insurance: '🛡️',
      taxes: '🏛️',
      rent_mortgage: '🏠',
      groceries: '🛒',
      restaurants: '🍴',
      gas_fuel: '⛽',
      clothing: '👕',
      electronics: '📱',
      subscriptions: '📺',
      gifts_donations: '🎁',
      bank_fees: '🏦',
      
      // Transferencias
      account_transfer: '↔️',
      investment: '💹',
      savings: '🏦',
      debt_payment: '💳',
    };

    return categoryIcons[category] || (type === 'income' ? '💵' : type === 'expense' ? '💸' : '🔄');
  };

  const getTransactionColor = (type: string): { bg: string; text: string; border: string } => {
    const colors: Record<string, { bg: string; text: string; border: string }> = {
      income: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' },
      expense: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
      transfer: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
      investment: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
      refund: { bg: 'bg-green-50', text: 'text-green-600', border: 'border-green-200' },
      fee: { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' }
    };
    return colors[type] || { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200' };
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, index) => (
          <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 animate-pulse">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
              <div className="h-6 bg-gray-200 rounded w-24"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!transactions.length) {
    return (
      <div className="text-center py-16 bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="text-6xl mb-4">💳</div>
        <div className="text-gray-600 text-lg font-medium mb-2">No hay transacciones</div>
        <div className="text-gray-400">No se encontraron transacciones con los filtros aplicados</div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {transactions.map((transaction) => {
        const colors = getTransactionColor(transaction.transaction_type);
        const isExpanded = expandedTransaction === transaction.transaction_id;
        const icon = getTransactionIcon(transaction.transaction_type, transaction.category);
        const isNegative = transaction.amount < 0;

        return (
          <div
            key={transaction.transaction_id}
            className={`bg-white rounded-xl shadow-sm border-2 ${colors.border} hover:shadow-md transition-all duration-200 overflow-hidden ${
              onTransactionClick ? 'cursor-pointer' : ''
            }`}
          >
            {/* Contenido principal */}
            <div
              className="p-5"
              onClick={() => {
                setExpandedTransaction(isExpanded ? null : transaction.transaction_id);
                onTransactionClick?.(transaction);
              }}
            >
              <div className="flex items-start gap-4">
                {/* Icono de categoría */}
                <div className={`w-14 h-14 rounded-2xl ${colors.bg} flex items-center justify-center text-2xl flex-shrink-0 shadow-sm`}>
                  {icon}
                </div>

                {/* Información principal */}
                <div className="flex-1 min-w-0">
                  {/* Descripción y cuenta */}
                  <h3 className="font-semibold text-gray-900 text-lg mb-1 truncate">
                    {transaction.description}
                  </h3>

                  {/* Categoría y tipo */}
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors.bg} ${colors.text}`}>
                      {TRANSACTION_CATEGORY_LABELS[transaction.category]}
                    </span>
                    <span className="text-xs text-gray-500">
                      {TRANSACTION_TYPE_LABELS[transaction.transaction_type]}
                    </span>
                  </div>

                  {/* Fecha y cuenta */}
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>{formatDate(transaction.transaction_date)}</span>
                    
                    <span>•</span>
                    <span className="truncate">{transaction.account_id}</span>
                  </div>

                  {/* Tags */}
                  {transaction.tags && transaction.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {transaction.tags.slice(0, 3).map((tag, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded-full"
                        >
                          #{tag}
                        </span>
                      ))}
                      {transaction.tags.length > 3 && (
                        <span className="text-xs text-gray-400 px-2 py-0.5">
                          +{transaction.tags.length - 3} más
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Monto y acciones */}
                <div className="flex flex-col items-end gap-2 flex-shrink-0">
                  <div className={`font-bold text-xl ${isNegative ? 'text-red-600' : 'text-green-600'}`}>
                    {isNegative ? '-' : '+'} {formatCurrency(transaction.amount)}
                  </div>

                  {/* Referencia */}
                  {transaction.reference_number && (
                    <div className="text-xs text-gray-400 bg-gray-50 px-2 py-1 rounded">
                      #{transaction.reference_number}
                    </div>
                  )}

                  {/* Botones de acción */}
                  {(onEditTransaction || onDeleteTransaction) && (
                    <div className="flex gap-1 mt-1">
                      {onEditTransaction && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onEditTransaction(transaction);
                          }}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Editar transacción"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                      )}

                      {onDeleteTransaction && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (window.confirm('¿Estás seguro de que deseas eliminar esta transacción? Esta acción no se puede deshacer.')) {
                              onDeleteTransaction(transaction.transaction_id);
                            }
                          }}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Eliminar transacción"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Detalles expandibles */}
            {isExpanded && (
              <div className={`border-t-2 ${colors.border} ${colors.bg} p-5 space-y-3`}>
                {/* Notas */}
                {transaction.notes && (
                  <div>
                    <div className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                      </svg>
                      <span>Notas</span>
                    </div>
                    <p className="text-sm text-gray-600 italic pl-6">
                      {transaction.notes}
                    </p>
                  </div>
                )}

                {/* Ubicación */}
                {transaction.location && (
                  <div>
                    <div className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span>Ubicación</span>
                    </div>
                    <p className="text-sm text-gray-600 pl-6">
                      {transaction.location}
                    </p>
                  </div>
                )}

                {/* Información de transferencia */}
                {transaction.transaction_type === 'transfer' && transaction.destination_account_id && (
                  <div>
                    <div className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                      </svg>
                      <span>Transferencia</span>
                    </div>
                    <p className="text-sm text-gray-600 pl-6">
                      Destino: <span className="font-medium">{transaction.destination_account_id}</span>
                    </p>
                  </div>
                )}

                {/* Balance después de transacción - Nota: Este campo vendría del backend si está disponible */}

                {/* Timestamps */}
                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-gray-200">
                  <div>
                    <div className="text-xs text-gray-500">Creada</div>
                    <div className="text-sm text-gray-700">
                      {new Date(transaction.created_at).toLocaleDateString('es-MX', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  </div>
                  {transaction.updated_at && (
                    <div>
                      <div className="text-xs text-gray-500">Actualizada</div>
                      <div className="text-sm text-gray-700">
                        {new Date(transaction.updated_at).toLocaleDateString('es-MX', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
