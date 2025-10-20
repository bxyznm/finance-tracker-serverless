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
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      {/* Header de la tabla */}
      <div className="hidden lg:grid lg:grid-cols-12 gap-4 px-4 py-3 bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-600 uppercase tracking-wider">
        <div className="col-span-1">Categoría</div>
        <div className="col-span-3">Descripción</div>
        <div className="col-span-2">Tipo</div>
        <div className="col-span-2">Fecha</div>
        <div className="col-span-2 text-right">Monto</div>
        <div className="col-span-2 text-center">Acciones</div>
      </div>

      {/* Filas de transacciones */}
      <div className="divide-y divide-gray-200">
        {transactions.map((transaction) => {
          const colors = getTransactionColor(transaction.transaction_type);
          const isExpanded = expandedTransaction === transaction.transaction_id;
          const icon = getTransactionIcon(transaction.transaction_type, transaction.category);
          const isNegative = transaction.amount < 0;

          return (
            <div key={transaction.transaction_id} className={`border-l-4 ${colors.border} hover:bg-gray-50 transition-colors`}>
              {/* Fila principal */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 px-4 py-4 items-center">
                {/* Ícono - desktop */}
                <div className="hidden lg:flex col-span-1 justify-center">
                  <div className={`w-10 h-10 rounded-lg ${colors.bg} flex items-center justify-center text-xl`}>
                    {icon}
                  </div>
                </div>

                {/* Layout móvil */}
                <div className="lg:hidden flex items-start gap-3">
                  <div className={`w-12 h-12 rounded-lg ${colors.bg} flex items-center justify-center text-2xl flex-shrink-0`}>
                    {icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 text-base truncate">{transaction.description}</h3>
                    <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                      <span>{TRANSACTION_CATEGORY_LABELS[transaction.category]}</span>
                      <span>•</span>
                      <span>{formatDate(transaction.transaction_date)}</span>
                    </div>
                  </div>
                  <div className={`text-lg font-bold whitespace-nowrap ${isNegative ? 'text-red-600' : 'text-green-600'}`}>
                    {isNegative ? '-' : '+'} {formatCurrency(transaction.amount)}
                  </div>
                </div>

                {/* Descripción - desktop */}
                <div className="hidden lg:block col-span-3">
                  <h3 className="font-semibold text-gray-900 text-sm truncate">{transaction.description}</h3>
                  {transaction.reference_number && (
                    <p className="text-xs text-gray-400 mt-0.5">Ref: {transaction.reference_number}</p>
                  )}
                </div>

                {/* Tipo y Categoría - desktop */}
                <div className="hidden lg:block col-span-2">
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${colors.bg} ${colors.text}`}>
                    {TRANSACTION_CATEGORY_LABELS[transaction.category]}
                  </span>
                </div>

                {/* Fecha - desktop */}
                <div className="hidden lg:block col-span-2 text-sm text-gray-700">
                  {formatDate(transaction.transaction_date)}
                </div>

                {/* Monto - desktop */}
                <div className="hidden lg:block col-span-2 text-right">
                  <div className={`text-lg font-bold ${isNegative ? 'text-red-600' : 'text-green-600'}`}>
                    {isNegative ? '-' : '+'} {formatCurrency(transaction.amount)}
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5">
                    {TRANSACTION_TYPE_LABELS[transaction.transaction_type]}
                  </div>
                </div>

                {/* Acciones */}
                <div className="col-span-12 lg:col-span-2 flex items-center justify-end lg:justify-center gap-1">
                  {onEditTransaction && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditTransaction(transaction);
                      }}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
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
                    className={`p-2 ${isExpanded ? 'text-gray-700 bg-gray-100' : 'text-gray-500 hover:bg-gray-50'} rounded-lg transition-all`}
                    title={isExpanded ? "Ocultar" : "Ver más"}
                  >
                    <svg 
                      className={`w-5 h-5 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
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
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Eliminar"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>

              {/* Detalles expandibles */}
              {isExpanded && (
                <div className="px-4 pb-4 pt-0">
                  <div className={`pt-4 border-t ${colors.border}`}>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Tags */}
                      {transaction.tags && transaction.tags.length > 0 && (
                        <div className="flex gap-3 items-start">
                          <div className="text-xl flex-shrink-0">🏷️</div>
                          <div className="min-w-0 flex-1">
                            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Etiquetas</div>
                            <div className="flex flex-wrap gap-1">
                              {transaction.tags.map((tag, index) => (
                                <span
                                  key={index}
                                  className="inline-flex items-center px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded-full"
                                >
                                  #{tag}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Cuenta */}
                      {transaction.account_id && (
                        <div className="flex gap-3 items-start">
                          <div className="text-xl flex-shrink-0">💳</div>
                          <div className="min-w-0 flex-1">
                            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Cuenta</div>
                            <p className="text-sm text-gray-700 font-mono break-all">{transaction.account_id}</p>
                          </div>
                        </div>
                      )}

                      {/* Notas */}
                      {transaction.notes && (
                        <div className="flex gap-3 items-start sm:col-span-2">
                          <div className="text-xl flex-shrink-0">📝</div>
                          <div className="min-w-0 flex-1">
                            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Notas</div>
                            <p className="text-sm text-gray-700">{transaction.notes}</p>
                          </div>
                        </div>
                      )}

                      {/* Ubicación */}
                      {transaction.location && (
                        <div className="flex gap-3 items-start">
                          <div className="text-xl flex-shrink-0">📍</div>
                          <div className="min-w-0 flex-1">
                            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Ubicación</div>
                            <p className="text-sm text-gray-700">{transaction.location}</p>
                          </div>
                        </div>
                      )}

                      {/* Transferencia */}
                      {transaction.transaction_type === 'transfer' && transaction.destination_account_id && (
                        <div className="flex gap-3 items-start">
                          <div className="text-xl flex-shrink-0">🔄</div>
                          <div className="min-w-0 flex-1">
                            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Cuenta destino</div>
                            <p className="text-sm text-gray-700 font-mono break-all">{transaction.destination_account_id}</p>
                          </div>
                        </div>
                      )}

                      {/* Timestamps */}
                      <div className="flex gap-3 items-start sm:col-span-2 pt-3 border-t border-gray-200">
                        <div className="text-xl flex-shrink-0">⏱️</div>
                        <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Creada</div>
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
                              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Actualizada</div>
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
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
