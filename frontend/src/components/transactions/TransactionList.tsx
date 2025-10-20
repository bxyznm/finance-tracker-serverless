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
            className={`bg-white rounded-lg shadow-sm border-l-4 ${colors.border} hover:shadow-md transition-all duration-200 overflow-hidden`}
          >
            {/* Contenido principal - Layout optimizado */}
            <div className="p-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                {/* Ícono de categoría */}
                <div className={`w-12 h-12 rounded-lg ${colors.bg} flex items-center justify-center text-2xl flex-shrink-0`}>
                  {icon}
                </div>

                {/* Información principal - Flex layout responsive */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col lg:flex-row lg:items-center gap-3">
                    {/* Descripción y categoría */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 text-base mb-1 truncate">
                        {transaction.description}
                      </h3>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors.bg} ${colors.text}`}>
                          {TRANSACTION_CATEGORY_LABELS[transaction.category]}
                        </span>
                        <span className="text-xs text-gray-500">
                          {TRANSACTION_TYPE_LABELS[transaction.transaction_type]}
                        </span>
                        {transaction.reference_number && (
                          <span className="text-xs text-gray-400">
                            #{transaction.reference_number}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Fecha y monto */}
                    <div className="flex flex-row sm:flex-col lg:flex-row items-start sm:items-end lg:items-center gap-3 lg:gap-6">
                      <div className="text-sm text-gray-600 whitespace-nowrap">
                        {formatDate(transaction.transaction_date)}
                      </div>
                      <div className={`text-xl sm:text-2xl font-bold whitespace-nowrap ${isNegative ? 'text-red-600' : 'text-green-600'}`}>
                        {isNegative ? '-' : '+'} {formatCurrency(transaction.amount)}
                      </div>
                    </div>
                  </div>

                  {/* Tags y cuenta */}
                  {((transaction.tags && transaction.tags.length > 0) || transaction.account_id) && (
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      {transaction.tags && transaction.tags.length > 0 && (
                        <>
                          {transaction.tags.slice(0, 3).map((tag, index) => (
                            <span
                              key={index}
                              className="inline-flex items-center px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded-full"
                            >
                              #{tag}
                            </span>
                          ))}
                          {transaction.tags.length > 3 && (
                            <span className="text-xs text-gray-400">+{transaction.tags.length - 3}</span>
                          )}
                        </>
                      )}
                      {transaction.account_id && (
                        <span className="text-xs text-gray-400 font-mono">
                          {transaction.account_id.substring(0, 8)}...
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Botones de acción - Horizontal en móvil, vertical en desktop */}
                <div className="flex sm:flex-row lg:flex-col gap-2 w-full sm:w-auto">
                  {onEditTransaction && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditTransaction(transaction);
                      }}
                      className="flex-1 sm:flex-none p-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                      title="Editar"
                    >
                      <svg className="w-5 h-5 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                  )}
                  
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setExpandedTransaction(isExpanded ? null : transaction.transaction_id);
                    }}
                    className={`flex-1 sm:flex-none p-2 ${isExpanded ? 'text-gray-700 bg-gray-100' : 'text-gray-500 bg-gray-50'} hover:bg-gray-100 rounded-lg transition-all`}
                    title={isExpanded ? "Ocultar" : "Ver más"}
                  >
                    <svg 
                      className={`w-5 h-5 mx-auto transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
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
                      className="flex-1 sm:flex-none p-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                      title="Eliminar"
                    >
                      <svg className="w-5 h-5 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>


              {/* Detalles expandibles */}
              {isExpanded && (
                <div className={`mt-4 pt-4 border-t ${colors.border}`}>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Notas */}
                    {transaction.notes && (
                      <div className="flex gap-3 items-start">
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
                          <p className="text-sm text-gray-700 font-mono truncate">{transaction.destination_account_id}</p>
                        </div>
                      </div>
                    )}

                    {/* Timestamps */}
                    <div className="flex gap-3 items-start sm:col-span-2">
                      <div className="text-xl flex-shrink-0">⏱️</div>
                      <div className="flex-1 grid grid-cols-2 gap-4">
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
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
