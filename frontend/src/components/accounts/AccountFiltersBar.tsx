import React from 'react';
import {
  Box,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Stack,
  IconButton,
  Tooltip,
  InputAdornment,
  useTheme,
  alpha,
} from '@mui/material';
import {
  Search as SearchIcon,
  Clear as ClearIcon,
  FilterList as FilterIcon,
  SwapVert as SortIcon,
} from '@mui/icons-material';
import { Account, AccountType, BankCode, CurrencyCode } from '../../types/account';

export interface AccountFilters {
  search: string;
  accountType: AccountType | 'all';
  bankCode: BankCode | 'all';
  currency: CurrencyCode | 'all';
  balanceFilter: 'all' | 'positive' | 'negative' | 'zero';
}

export interface AccountSort {
  field: 'name' | 'current_balance' | 'bank_code' | 'account_type' | 'updated_at';
  direction: 'asc' | 'desc';
}

interface AccountFiltersBarProps {
  filters: AccountFilters;
  sort: AccountSort;
  onFiltersChange: (filters: AccountFilters) => void;
  onSortChange: (sort: AccountSort) => void;
  onClearFilters: () => void;
  accounts: Account[];
}

/**
 * Componente de barra de filtros y búsqueda para cuentas
 * Permite filtrar por texto, tipo, banco, moneda y balance
 */
export const AccountFiltersBar: React.FC<AccountFiltersBarProps> = ({
  filters,
  sort,
  onFiltersChange,
  onSortChange,
  onClearFilters,
  accounts,
}) => {
  const theme = useTheme();

  const handleFilterChange = (field: keyof AccountFilters, value: string) => {
    onFiltersChange({
      ...filters,
      [field]: value,
    });
  };

  const handleSortChange = (field: AccountSort['field']) => {
    const direction = sort.field === field && sort.direction === 'asc' ? 'desc' : 'asc';
    onSortChange({ field, direction });
  };

  const getActiveFiltersCount = (): number => {
    let count = 0;
    if (filters.search) count++;
    if (filters.accountType !== 'all') count++;
    if (filters.bankCode !== 'all') count++;
    if (filters.currency !== 'all') count++;
    if (filters.balanceFilter !== 'all') count++;
    return count;
  };

  const getBankLabel = (bankCode: string): string => {
    const bankLabels: Record<string, string> = {
      'BBVA': 'BBVA México',
      'SANTANDER': 'Santander México',
      'BANORTE': 'Banorte',
      'HSBC': 'HSBC México',
      'CITIBANAMEX': 'Citibanamex',
      'SCOTIABANK': 'Scotiabank',
      'INBURSA': 'Inbursa',
      'AZTECA': 'Banco Azteca',
      'BAJIO': 'BanBajío',
      'BANREGIO': 'Banregio',
    };
    return bankLabels[bankCode] || bankCode;
  };

  const getAccountTypeLabel = (type: string): string => {
    const typeLabels: Record<string, string> = {
      'checking': 'Cuenta Corriente',
      'savings': 'Ahorro',
      'credit': 'Tarjeta de Crédito',
      'investment': 'Inversión',
    };
    return typeLabels[type] || type;
  };

  // Obtener opciones únicas de los datos existentes
  const uniqueBanks = Array.from(new Set(accounts.map(acc => acc.bank_code)));
  const uniqueCurrencies = Array.from(new Set(accounts.map(acc => acc.currency)));
  const uniqueAccountTypes = Array.from(new Set(accounts.map(acc => acc.account_type)));

  const activeFiltersCount = getActiveFiltersCount();

  return (
    <Box
      sx={{
        mb: 3,
        p: 3,
        bgcolor: alpha(theme.palette.background.paper, 0.6),
        borderRadius: 3,
        border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
        backdropFilter: 'blur(10px)',
      }}
    >
      {/* Barra de búsqueda */}
      <Box mb={2}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Buscar cuentas por nombre, descripción o banco..."
          value={filters.search}
          onChange={(e) => handleFilterChange('search', e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon color="action" />
              </InputAdornment>
            ),
            endAdornment: filters.search && (
              <InputAdornment position="end">
                <IconButton
                  size="small"
                  onClick={() => handleFilterChange('search', '')}
                  edge="end"
                >
                  <ClearIcon />
                </IconButton>
              </InputAdornment>
            ),
            sx: {
              borderRadius: 2,
              bgcolor: theme.palette.background.paper,
            }
          }}
        />
      </Box>

      {/* Filtros y ordenamiento */}
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
        {/* Tipo de cuenta */}
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Tipo</InputLabel>
          <Select
            value={filters.accountType}
            label="Tipo"
            onChange={(e) => handleFilterChange('accountType', e.target.value)}
            sx={{ borderRadius: 2 }}
          >
            <MenuItem value="all">Todos los tipos</MenuItem>
            {uniqueAccountTypes.map((type) => (
              <MenuItem key={type} value={type}>
                {getAccountTypeLabel(type)}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Banco */}
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Banco</InputLabel>
          <Select
            value={filters.bankCode}
            label="Banco"
            onChange={(e) => handleFilterChange('bankCode', e.target.value)}
            sx={{ borderRadius: 2 }}
          >
            <MenuItem value="all">Todos los bancos</MenuItem>
            {uniqueBanks.map((bank) => (
              <MenuItem key={bank} value={bank}>
                {getBankLabel(bank || '')}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Moneda */}
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>Moneda</InputLabel>
          <Select
            value={filters.currency}
            label="Moneda"
            onChange={(e) => handleFilterChange('currency', e.target.value)}
            sx={{ borderRadius: 2 }}
          >
            <MenuItem value="all">Todas</MenuItem>
            {uniqueCurrencies.map((currency) => (
              <MenuItem key={currency} value={currency}>
                {currency}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Balance */}
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Balance</InputLabel>
          <Select
            value={filters.balanceFilter}
            label="Balance"
            onChange={(e) => handleFilterChange('balanceFilter', e.target.value)}
            sx={{ borderRadius: 2 }}
          >
            <MenuItem value="all">Todos</MenuItem>
            <MenuItem value="positive">Positivo</MenuItem>
            <MenuItem value="negative">Negativo</MenuItem>
            <MenuItem value="zero">Cero</MenuItem>
          </Select>
        </FormControl>

        {/* Ordenamiento */}
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Ordenar por</InputLabel>
          <Select
            value={sort.field}
            label="Ordenar por"
            onChange={(e) => handleSortChange(e.target.value as AccountSort['field'])}
            sx={{ borderRadius: 2 }}
          >
            <MenuItem value="name">Nombre</MenuItem>
            <MenuItem value="current_balance">Balance</MenuItem>
            <MenuItem value="bank_code">Banco</MenuItem>
            <MenuItem value="account_type">Tipo</MenuItem>
            <MenuItem value="updated_at">Actualización</MenuItem>
          </Select>
        </FormControl>

        {/* Dirección de ordenamiento */}
        <Tooltip title={`Ordenar ${sort.direction === 'asc' ? 'ascendente' : 'descendente'}`}>
          <IconButton
            onClick={() => onSortChange({ ...sort, direction: sort.direction === 'asc' ? 'desc' : 'asc' })}
            sx={{
              bgcolor: alpha(theme.palette.primary.main, 0.1),
              '&:hover': {
                bgcolor: alpha(theme.palette.primary.main, 0.2),
              }
            }}
          >
            <SortIcon
              sx={{
                transform: sort.direction === 'desc' ? 'rotate(180deg)' : 'none',
                transition: 'transform 0.2s ease-in-out',
              }}
            />
          </IconButton>
        </Tooltip>

        {/* Botón limpiar filtros */}
        {activeFiltersCount > 0 && (
          <Tooltip title="Limpiar filtros">
            <Box>
              <IconButton
                onClick={onClearFilters}
                sx={{
                  bgcolor: alpha(theme.palette.error.main, 0.1),
                  '&:hover': {
                    bgcolor: alpha(theme.palette.error.main, 0.2),
                  }
                }}
              >
                <ClearIcon />
              </IconButton>
            </Box>
          </Tooltip>
        )}
      </Stack>

      {/* Indicadores de filtros activos */}
      {activeFiltersCount > 0 && (
        <Box mt={2}>
          <Stack direction="row" spacing={1} flexWrap="wrap">
            <Chip
              icon={<FilterIcon />}
              label={`${activeFiltersCount} filtro${activeFiltersCount > 1 ? 's' : ''} activo${activeFiltersCount > 1 ? 's' : ''}`}
              size="small"
              color="primary"
              variant="outlined"
            />
            {filters.search && (
              <Chip
                label={`Búsqueda: "${filters.search}"`}
                size="small"
                onDelete={() => handleFilterChange('search', '')}
                deleteIcon={<ClearIcon />}
              />
            )}
            {filters.accountType !== 'all' && (
              <Chip
                label={`Tipo: ${getAccountTypeLabel(filters.accountType)}`}
                size="small"
                onDelete={() => handleFilterChange('accountType', 'all')}
                deleteIcon={<ClearIcon />}
              />
            )}
            {filters.bankCode !== 'all' && (
              <Chip
                label={`Banco: ${getBankLabel(filters.bankCode)}`}
                size="small"
                onDelete={() => handleFilterChange('bankCode', 'all')}
                deleteIcon={<ClearIcon />}
              />
            )}
            {filters.currency !== 'all' && (
              <Chip
                label={`Moneda: ${filters.currency}`}
                size="small"
                onDelete={() => handleFilterChange('currency', 'all')}
                deleteIcon={<ClearIcon />}
              />
            )}
            {filters.balanceFilter !== 'all' && (
              <Chip
                label={`Balance: ${filters.balanceFilter === 'positive' ? 'Positivo' : 
                      filters.balanceFilter === 'negative' ? 'Negativo' : 'Cero'}`}
                size="small"
                onDelete={() => handleFilterChange('balanceFilter', 'all')}
                deleteIcon={<ClearIcon />}
              />
            )}
          </Stack>
        </Box>
      )}
    </Box>
  );
};
