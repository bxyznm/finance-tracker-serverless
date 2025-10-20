/**
 * Componente para mostrar una lista de transacciones con diseño mejorado y user-friendly
 */

import React, { useState, Fragment } from 'react';
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
    <div className="bg-white rounded-lg shadow overflow-hidden">
      {/* Tabla Header */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Descripción
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Categoría
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Fecha
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Cuenta
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Monto
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {transactions.map((transaction) => {
              const colors = getTransactionColor(transaction.transaction_type);
              const isExpanded = expandedTransaction === transaction.transaction_id;
              const icon = getTransactionIcon(transaction.transaction_type, transaction.category);
              const isNegative = transaction.amount < 0;

              return (
                <Fragment key={transaction.transaction_id}>
                  {/* Fila principal */}
                  <tr 
                    className={`hover:bg-gray-50 transition-colors border-l-4 ${colors.border} cursor-pointer`}
                    onClick={() => {
                      setExpandedTransaction(isExpanded ? null : transaction.transaction_id);
                      onTransactionClick?.(transaction);
                    }}
                  >
                    {/* Descripción con ícono */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg ${colors.bg} flex items-center justify-center text-xl flex-shrink-0`}>
                          {icon}
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm font-medium text-gray-900 truncate max-w-xs">
                            {transaction.description}
                          </div>
                          {transaction.reference_number && (
                            <div className="text-xs text-gray-400">
                              #{transaction.reference_number}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Categoría */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col gap-1">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors.bg} ${colors.text} w-fit`}>
                          {TRANSACTION_CATEGORY_LABELS[transaction.category]}
                        </span>
                        <span className="text-xs text-gray-500">
                          {TRANSACTION_TYPE_LABELS[transaction.transaction_type]}
                        </span>
                      </div>
                    </td>

                    {/* Fecha */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {formatDate(transaction.transaction_date)}
                      </div>
                    </td>

                    {/* Cuenta */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500 font-mono text-xs">
                        {transaction.account_id.substring(0, 16)}...
                      </div>
                      {transaction.tags && transaction.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {transaction.tags.slice(0, 2).map((tag, index) => (
                            <span
                              key={index}
                              className="inline-flex items-center px-1.5 py-0.5 text-xs bg-gray-100 text-gray-600 rounded"
                            >
                              #{tag}
                            </span>
                          ))}
                          {transaction.tags.length > 2 && (
                            <span className="text-xs text-gray-400">
                              +{transaction.tags.length - 2}
                            </span>
                          )}
                        </div>
                      )}
                    </td>

                    {/* Monto */}
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className={`text-sm font-bold ${isNegative ? 'text-red-600' : 'text-green-600'}`}>
                        {isNegative ? '-' : '+'} {formatCurrency(transaction.amount)}
                      </div>
                    </td>

                    {/* Acciones */}
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="flex items-center justify-center gap-2">
                        {onEditTransaction && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onEditTransaction(transaction);
                            }}
                            className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 p-2 rounded-lg transition-colors"
                            title="Editar"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                        )}
                        
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setExpandedTransaction(isExpanded ? null : transaction.transaction_id);
                          }}
                          className="text-gray-600 hover:text-gray-800 hover:bg-gray-50 p-2 rounded-lg transition-colors"
                          title={isExpanded ? "Ocultar detalles" : "Ver detalles"}
                        >
                          <svg 
                            className={`w-5 h-5 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                            fill="none" 
                            stroke="currentColor" 
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>

                        {onDeleteTransaction && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (window.confirm('¿Estás seguro de eliminar esta transacción?')) {
                                onDeleteTransaction(transaction.transaction_id);
                              }
                            }}
                            className="text-red-600 hover:text-red-800 hover:bg-red-50 p-2 rounded-lg transition-colors"
                            title="Eliminar"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>

                  {/* Fila expandible con detalles */}
                  {isExpanded && (
                    <tr>
                      <td colSpan={6} className={`px-6 py-4 ${colors.bg} border-l-4 ${colors.border}`}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Notas */}
                          {transaction.notes && (
                            <div>
                              <div className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                                <span>📝</span>
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
                              <div className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                                <span>📍</span>
                                <span>Ubicación</span>
                              </div>
                              <p className="text-sm text-gray-600 pl-6">
                                {transaction.location}
                              </p>
                            </div>
                          )}

                          {/* Transferencia */}
                          {transaction.transaction_type === 'transfer' && transaction.destination_account_id && (
                            <div>
                              <div className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                                <span>🔄</span>
                                <span>Transferencia</span>
                              </div>
                              <p className="text-sm text-gray-600 pl-6 font-mono text-xs">
                                Destino: {transaction.destination_account_id}
                              </p>
                            </div>
                          )}

                          {/* Timestamps */}
                          <div className="col-span-1 md:col-span-2">
                            <div className="grid grid-cols-2 gap-4 pt-3 border-t border-gray-200">
                              <div>
                                <div className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                                  <span>✨</span> Creada
                                </div>
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
                                  <div className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                                    <span>🔄</span> Actualizada
                                  </div>
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
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
