/**
 * Componente de filtros para transacciones
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  Collapse,
  IconButton,
  Typography,
  Chip,
  InputAdornment,
  Stack,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Search as SearchIcon,
  FilterList as FilterListIcon,
  Clear as ClearIcon,
} from '@mui/icons-material';
import type { TransactionFilter, TransactionCategory } from '../../types';
import { 
  TRANSACTION_TYPE_LABELS, 
  TRANSACTION_CATEGORY_LABELS,
  INCOME_CATEGORIES,
  EXPENSE_CATEGORIES,
  TRANSFER_CATEGORIES
} from '../../types/transaction';
import { useDebounce } from '../../hooks';

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
  const [searchTerm, setSearchTerm] = useState(filters.search_term || '');
  const [isExpanded, setIsExpanded] = useState(false);

  // Debounce del término de búsqueda
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  // Sincronizar con filtros externos
  useEffect(() => {
    setLocalFilters(filters);
    setSearchTerm(filters.search_term || '');
  }, [filters]);

  // Aplicar filtros automáticamente cuando cambie el término de búsqueda debounced
  useEffect(() => {
    if (debouncedSearchTerm !== filters.search_term) {
      const newFilters = { ...localFilters, search_term: debouncedSearchTerm || undefined, page: 1 };
      setLocalFilters(newFilters);
      onFiltersChange(newFilters);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearchTerm]);

  const handleFilterChange = (key: keyof TransactionFilter, value: any) => {
    const newFilters = { ...localFilters, [key]: value, page: 1 };
    setLocalFilters(newFilters);
  };

  const handleApplyFilters = () => {
    onFiltersChange(localFilters);
  };

  const handleClearFilters = () => {
    setLocalFilters({ page: 1, per_page: 50 });
    setSearchTerm('');
    onClearFilters();
  };

  const getActiveFiltersCount = (): number => {
    let count = 0;
    if (localFilters.transaction_type) count++;
    if (localFilters.category) count++;
    if (localFilters.date_from || localFilters.date_to) count++;
    if (localFilters.amount_min !== undefined) count++;
    if (localFilters.amount_max !== undefined) count++;
    if (debouncedSearchTerm) count++;
    return count;
  };

  const getActiveFilterChips = () => {
    const chips: { key: string; label: string; onDelete: () => void }[] = [];

    if (debouncedSearchTerm) {
      chips.push({
        key: 'search',
        label: `Búsqueda: "${debouncedSearchTerm}"`,
        onDelete: () => {
          setSearchTerm('');
          handleFilterChange('search_term', undefined);
        }
      });
    }

    if (localFilters.transaction_type) {
      chips.push({
        key: 'type',
        label: `Tipo: ${TRANSACTION_TYPE_LABELS[localFilters.transaction_type]}`,
        onDelete: () => handleFilterChange('transaction_type', undefined)
      });
    }

    if (localFilters.category) {
      chips.push({
        key: 'category',
        label: `Categoría: ${TRANSACTION_CATEGORY_LABELS[localFilters.category]}`,
        onDelete: () => handleFilterChange('category', undefined)
      });
    }

    if (localFilters.date_from && localFilters.date_to) {
      const from = new Date(localFilters.date_from).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' });
      const to = new Date(localFilters.date_to).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' });
      chips.push({
        key: 'dates',
        label: `Período: ${from} - ${to}`,
        onDelete: () => {
          handleFilterChange('date_from', undefined);
          handleFilterChange('date_to', undefined);
        }
      });
    } else if (localFilters.date_from) {
      chips.push({
        key: 'date_from',
        label: `Desde: ${new Date(localFilters.date_from).toLocaleDateString('es-MX')}`,
        onDelete: () => handleFilterChange('date_from', undefined)
      });
    } else if (localFilters.date_to) {
      chips.push({
        key: 'date_to',
        label: `Hasta: ${new Date(localFilters.date_to).toLocaleDateString('es-MX')}`,
        onDelete: () => handleFilterChange('date_to', undefined)
      });
    }

    if (localFilters.amount_min !== undefined) {
      chips.push({
        key: 'amount_min',
        label: `Mínimo: $${localFilters.amount_min}`,
        onDelete: () => handleFilterChange('amount_min', undefined)
      });
    }

    if (localFilters.amount_max !== undefined) {
      chips.push({
        key: 'amount_max',
        label: `Máximo: $${localFilters.amount_max}`,
        onDelete: () => handleFilterChange('amount_max', undefined)
      });
    }

    return chips;
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

  return (
    <Box>
      {/* Header con indicador de filtros activos */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <FilterListIcon sx={{ color: 'text.secondary' }} />
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Filtros
          </Typography>
          {getActiveFiltersCount() > 0 && (
            <Chip 
              label={getActiveFiltersCount()} 
              size="small" 
              color="primary" 
              sx={{ ml: 1, fontWeight: 600 }}
            />
          )}
        </Box>
        <IconButton
          onClick={() => setIsExpanded(!isExpanded)}
          sx={{ 
            transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.3s'
          }}
        >
          <ExpandMoreIcon />
        </IconButton>
      </Box>

      {/* Chips de filtros activos */}
      {getActiveFilterChips().length > 0 && (
        <Stack 
          direction="row" 
          spacing={1} 
          sx={{ mb: 2, flexWrap: 'wrap', gap: 1 }}
        >
          {getActiveFilterChips().map((chip) => (
            <Chip
              key={chip.key}
              label={chip.label}
              onDelete={chip.onDelete}
              color="primary"
              variant="outlined"
              size="small"
              sx={{ mb: 0.5 }}
            />
          ))}
        </Stack>
      )}

      {/* Filtros rápidos - siempre visibles */}
      <Box 
        sx={{ 
          display: 'grid', 
          gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, 
          gap: 2, 
          mb: 2 
        }}
      >
        {/* Búsqueda */}
        <TextField
          fullWidth
          size="small"
          placeholder="Buscar transacciones..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: 'text.secondary' }} />
              </InputAdornment>
            ),
          }}
          sx={{ bgcolor: 'background.paper' }}
          helperText={searchTerm !== debouncedSearchTerm ? 'Buscando...' : ''}
        />

        {/* Tipo de transacción */}
        <FormControl fullWidth size="small">
          <InputLabel>Tipo de transacción</InputLabel>
          <Select
            value={localFilters.transaction_type || ''}
            label="Tipo de transacción"
            onChange={(e) => {
              handleFilterChange('transaction_type', e.target.value || undefined);
              // Limpiar categoría si cambia el tipo
              if (e.target.value !== localFilters.transaction_type) {
                handleFilterChange('category', undefined);
              }
            }}
            sx={{ bgcolor: 'background.paper' }}
          >
            <MenuItem value="">Todos los tipos</MenuItem>
            {Object.entries(TRANSACTION_TYPE_LABELS).map(([key, label]) => (
              <MenuItem key={key} value={key}>
                {label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Rango de fechas rápido */}
        <FormControl fullWidth size="small">
          <InputLabel>Período</InputLabel>
          <Select
            label="Período"
            defaultValue=""
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
            sx={{ bgcolor: 'background.paper' }}
          >
            <MenuItem value="">Todas las fechas</MenuItem>
            <MenuItem value="today">Hoy</MenuItem>
            <MenuItem value="week">Última semana</MenuItem>
            <MenuItem value="month">Este mes</MenuItem>
            <MenuItem value="year">Este año</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {/* Filtros expandidos */}
      <Collapse in={isExpanded}>
        <Box sx={{ pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
          <Box 
            sx={{ 
              display: 'grid', 
              gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, 
              gap: 2 
            }}
          >
            {/* Categoría */}
            <FormControl fullWidth size="small">
              <InputLabel>Categoría</InputLabel>
              <Select
                value={localFilters.category || ''}
                label="Categoría"
                onChange={(e) => handleFilterChange('category', e.target.value || undefined)}
                sx={{ bgcolor: 'background.paper' }}
              >
                <MenuItem value="">Todas las categorías</MenuItem>
                {getAvailableCategories().map((category) => (
                  <MenuItem key={category} value={category}>
                    {TRANSACTION_CATEGORY_LABELS[category]}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Fecha desde */}
            <TextField
              fullWidth
              size="small"
              type="date"
              label="Desde"
              value={localFilters.date_from ? localFilters.date_from.split('T')[0] : ''}
              onChange={(e) => {
                const date = e.target.value ? new Date(e.target.value).toISOString() : undefined;
                handleFilterChange('date_from', date);
              }}
              InputLabelProps={{ shrink: true }}
              sx={{ bgcolor: 'background.paper' }}
            />

            {/* Fecha hasta */}
            <TextField
              fullWidth
              size="small"
              type="date"
              label="Hasta"
              value={localFilters.date_to ? localFilters.date_to.split('T')[0] : ''}
              onChange={(e) => {
                const date = e.target.value ? new Date(e.target.value + 'T23:59:59').toISOString() : undefined;
                handleFilterChange('date_to', date);
              }}
              InputLabelProps={{ shrink: true }}
              sx={{ bgcolor: 'background.paper' }}
            />

            {/* Monto mínimo */}
            <TextField
              fullWidth
              size="small"
              type="number"
              label="Monto mínimo"
              placeholder="0.00"
              value={localFilters.amount_min || ''}
              onChange={(e) => handleFilterChange('amount_min', e.target.value ? parseFloat(e.target.value) : undefined)}
              InputProps={{
                startAdornment: <InputAdornment position="start">$</InputAdornment>,
              }}
              sx={{ bgcolor: 'background.paper' }}
            />

            {/* Monto máximo */}
            <TextField
              fullWidth
              size="small"
              type="number"
              label="Monto máximo"
              placeholder="0.00"
              value={localFilters.amount_max || ''}
              onChange={(e) => handleFilterChange('amount_max', e.target.value ? parseFloat(e.target.value) : undefined)}
              InputProps={{
                startAdornment: <InputAdornment position="start">$</InputAdornment>,
              }}
              sx={{ bgcolor: 'background.paper' }}
            />

            {/* Ordenar por */}
            <FormControl fullWidth size="small">
              <InputLabel>Ordenar por</InputLabel>
              <Select
                value={localFilters.sort_by || 'date'}
                label="Ordenar por"
                onChange={(e) => handleFilterChange('sort_by', e.target.value)}
                sx={{ bgcolor: 'background.paper' }}
              >
                <MenuItem value="date">Fecha</MenuItem>
                <MenuItem value="amount">Monto</MenuItem>
                <MenuItem value="description">Descripción</MenuItem>
                <MenuItem value="created_at">Fecha de creación</MenuItem>
              </Select>
            </FormControl>

            {/* Orden */}
            <FormControl fullWidth size="small">
              <InputLabel>Orden</InputLabel>
              <Select
                value={localFilters.sort_order || 'desc'}
                label="Orden"
                onChange={(e) => handleFilterChange('sort_order', e.target.value as 'asc' | 'desc')}
                sx={{ bgcolor: 'background.paper' }}
              >
                <MenuItem value="desc">Descendente</MenuItem>
                <MenuItem value="asc">Ascendente</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </Box>
      </Collapse>

      {/* Botones de acción */}
      <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
        <Button
          variant="contained"
          onClick={handleApplyFilters}
          disabled={loading}
          startIcon={<FilterListIcon />}
          sx={{ borderRadius: 2, px: 3 }}
        >
          {loading ? 'Aplicando...' : 'Aplicar Filtros'}
        </Button>
        
        {getActiveFiltersCount() > 0 && (
          <Button
            variant="outlined"
            onClick={handleClearFilters}
            startIcon={<ClearIcon />}
            sx={{ borderRadius: 2, px: 3 }}
          >
            Limpiar Filtros
          </Button>
        )}
      </Box>
    </Box>
  );
};
