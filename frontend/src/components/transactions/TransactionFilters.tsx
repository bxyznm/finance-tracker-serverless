/**
 * Componente de filtros para transacciones
 */

import React, { useState, useEffect } from 'react';
import type { TransactionFilter, TransactionCategory } from '../../types';
import { 
  TRANSACTION_TYPE_LABELS, 
  TRANSACTION_CATEGORY_LABELS,
  INCOME_CATEGORIES,
  EXPENSE_CATEGORIES,
  TRANSFER_CATEGORIES
} from '../../types/transaction';

interface TransactionFiltersProps {
  filters: TransactionFilter;
  onFiltersChange: (filters: TransactionFilter) => void;
  onClearFilters: () => void;
  loading?: boolean;
}

export const TransactionFilters: React.FC<TransactionFiltersProps> = ({
  filters,
  onFiltersChange,
  onClearFilters,
  loading = false
}) => {
  // Estado local para los filtros
  const [localFilters, setLocalFilters] = useState<TransactionFilter>(filters);
  const [isExpanded, setIsExpanded] = useState(false);

  // Sincronizar con filtros externos
  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  const handleFilterChange = (key: keyof TransactionFilter, value: any) => {
    const newFilters = { ...localFilters, [key]: value, page: 1 };
    setLocalFilters(newFilters);
  };

  const handleApplyFilters = () => {
    onFiltersChange(localFilters);
  };

  const handleClearFilters = () => {
    setLocalFilters({ page: 1, per_page: 50 });
    onClearFilters();
  };

  const getAvailableCategories = (): TransactionCategory[] => {
    if (!localFilters.transaction_type) {
      return Object.keys(TRANSACTION_CATEGORY_LABELS) as TransactionCategory[];
    }
    
    switch (localFilters.transaction_type) {
      case 'income':
      case 'refund':
      case 'dividend':
      case 'bonus':
      case 'salary':
      case 'interest':
        return INCOME_CATEGORIES;
      case 'expense':
      case 'fee':
        return EXPENSE_CATEGORIES;
      case 'transfer':
      case 'investment':
        return TRANSFER_CATEGORIES;
      default:
        return Object.keys(TRANSACTION_CATEGORY_LABELS) as TransactionCategory[];
    }
  };

  const hasActiveFilters = () => {
    return Object.keys(localFilters).some(key => {
      if (key === 'page' || key === 'per_page' || key === 'sort_by' || key === 'sort_order') {
        return false;
      }
      const value = localFilters[key as keyof TransactionFilter];
      return value !== undefined && value !== null && value !== '';
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h3 className="font-medium text-gray-900">Filtros</h3>
          {hasActiveFilters() && (
            <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
              Activos
            </span>
          )}
        </div>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-gray-500 hover:text-gray-700 transition-colors"
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
      </div>

      {/* Filtros rápidos siempre visibles */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        {/* Búsqueda */}
        <div>
          <input
            type="text"
            placeholder="Buscar transacciones..."
            value={localFilters.search_term || ''}
            onChange={(e) => handleFilterChange('search_term', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Tipo de transacción */}
        <div>
          <select
            value={localFilters.transaction_type || ''}
            onChange={(e) => {
              handleFilterChange('transaction_type', e.target.value || undefined);
              // Limpiar categoría si cambia el tipo
              if (e.target.value !== localFilters.transaction_type) {
                handleFilterChange('category', undefined);
              }
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Todos los tipos</option>
            {Object.entries(TRANSACTION_TYPE_LABELS).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </div>

        {/* Rango de fechas rápido */}
        <div>
          <select
            onChange={(e) => {
              const value = e.target.value;
              const today = new Date();
              let dateFrom = '';
              let dateTo = today.toISOString();

              switch (value) {
                case 'today':
                  dateFrom = new Date(today.setHours(0, 0, 0, 0)).toISOString();
                  break;
                case 'week':
                  const weekStart = new Date(today);
                  weekStart.setDate(today.getDate() - 7);
                  dateFrom = weekStart.toISOString();
                  break;
                case 'month':
                  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
                  dateFrom = monthStart.toISOString();
                  break;
                case 'year':
                  const yearStart = new Date(today.getFullYear(), 0, 1);
                  dateFrom = yearStart.toISOString();
                  break;
                default:
                  dateFrom = '';
                  dateTo = '';
              }

              handleFilterChange('date_from', dateFrom || undefined);
              handleFilterChange('date_to', dateTo || undefined);
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Todas las fechas</option>
            <option value="today">Hoy</option>
            <option value="week">Última semana</option>
            <option value="month">Este mes</option>
            <option value="year">Este año</option>
          </select>
        </div>
      </div>

      {/* Filtros expandidos */}
      {isExpanded && (
        <div className="space-y-4 pt-4 border-t border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Categoría */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Categoría
              </label>
              <select
                value={localFilters.category || ''}
                onChange={(e) => handleFilterChange('category', e.target.value || undefined)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Todas las categorías</option>
                {getAvailableCategories().map((category) => (
                  <option key={category} value={category}>
                    {TRANSACTION_CATEGORY_LABELS[category]}
                  </option>
                ))}
              </select>
            </div>

            {/* Fecha desde */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Desde
              </label>
              <input
                type="date"
                value={localFilters.date_from ? localFilters.date_from.split('T')[0] : ''}
                onChange={(e) => {
                  const date = e.target.value ? new Date(e.target.value).toISOString() : undefined;
                  handleFilterChange('date_from', date);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Fecha hasta */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Hasta
              </label>
              <input
                type="date"
                value={localFilters.date_to ? localFilters.date_to.split('T')[0] : ''}
                onChange={(e) => {
                  const date = e.target.value ? new Date(e.target.value + 'T23:59:59').toISOString() : undefined;
                  handleFilterChange('date_to', date);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Monto mínimo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Monto mínimo
              </label>
              <input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={localFilters.amount_min || ''}
                onChange={(e) => handleFilterChange('amount_min', e.target.value ? parseFloat(e.target.value) : undefined)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Monto máximo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Monto máximo
              </label>
              <input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={localFilters.amount_max || ''}
                onChange={(e) => handleFilterChange('amount_max', e.target.value ? parseFloat(e.target.value) : undefined)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Ordenar por */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ordenar por
              </label>
              <div className="flex gap-2">
                <select
                  value={localFilters.sort_by || 'date'}
                  onChange={(e) => handleFilterChange('sort_by', e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="date">Fecha</option>
                  <option value="amount">Monto</option>
                  <option value="description">Descripción</option>
                  <option value="created_at">Fecha de creación</option>
                </select>
                <select
                  value={localFilters.sort_order || 'desc'}
                  onChange={(e) => handleFilterChange('sort_order', e.target.value as 'asc' | 'desc')}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="desc">Desc</option>
                  <option value="asc">Asc</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Botones de acción */}
      <div className="flex gap-3 mt-4">
        <button
          onClick={handleApplyFilters}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? 'Aplicando...' : 'Aplicar Filtros'}
        </button>
        
        {hasActiveFilters() && (
          <button
            onClick={handleClearFilters}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:ring-2 focus:ring-gray-500 transition-colors"
          >
            Limpiar Filtros
          </button>
        )}
      </div>
    </div>
  );
};
