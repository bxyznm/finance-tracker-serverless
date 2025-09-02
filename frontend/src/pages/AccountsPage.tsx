import React, { useState, useMemo, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Stack,
  useTheme,
  alpha,
  SpeedDial,
  SpeedDialAction,
  SpeedDialIcon,
} from '@mui/material';
import {
  Add as AddIcon,
  Refresh as RefreshIcon,
  AccountBalance as AccountBalanceIcon,
  GetApp as ExportIcon,
} from '@mui/icons-material';
import { AnimatePresence } from 'framer-motion';
import { useForm, Controller } from 'react-hook-form';
import toast from 'react-hot-toast';

import { AppLayout } from '../components/layout';
import { useAccounts } from '../hooks/useAccounts';
import { AccountCard, AccountStats, AccountFiltersBar, AccountFilters, AccountSort } from '../components/accounts';
import { AccountService } from '../services/accountService';
import {
  Account,
  UpdateAccountRequest,
  BANK_OPTIONS,
  ACCOUNT_TYPE_OPTIONS,
  CURRENCY_OPTIONS,
  BankCode,
  AccountType,
  CurrencyCode,
} from '../types/account';

// Interfaces para formularios
interface CreateAccountFormData {
  name: string;
  bank_code: BankCode;
  account_type: AccountType;
  currency: CurrencyCode;
  initial_balance: number;
  color?: string;
  description?: string;
}

interface UpdateBalanceFormData {
  amount: number;
  description?: string;
}

// Colores por defecto para las cuentas
const DEFAULT_ACCOUNT_COLORS = [
  '#1976d2', // Blue
  '#388e3c', // Green
  '#f57c00', // Orange
  '#7b1fa2', // Purple
  '#c2185b', // Pink
  '#00796b', // Teal
  '#5d4037', // Brown
  '#455a64', // Blue Grey
  '#e53935', // Red
  '#fbc02d', // Yellow
];

// Estados del diálogo
type DialogState = 
  | { type: null }
  | { type: 'create' }
  | { type: 'edit'; account: Account }
  | { type: 'balance'; account: Account }
  | { type: 'delete'; account: Account };

/**
 * Página principal de gestión de cuentas
 * Incluye estadísticas, filtros, búsqueda y operaciones CRUD
 */
export const AccountsPage: React.FC = () => {
  const theme = useTheme();
  const {
    accounts,
    totalBalance,
    totalAccounts,
    isLoading,
    error,
    refetchAccounts,
    createAccount,
    updateAccount,
    updateBalance,
    deleteAccount,
  } = useAccounts();

  // Debug logs
  console.log('AccountsPage data:', {
    accounts: accounts?.length || 0,
    totalBalance,
    totalAccounts,
    isLoading,
    error
  });

  // Estados locales
  const [dialogState, setDialogState] = useState<DialogState>({ type: null });
  const [selectedColor, setSelectedColor] = useState<string>(DEFAULT_ACCOUNT_COLORS[0]);
  const [speedDialOpen, setSpeedDialOpen] = useState(false);

  // Estados de filtros y ordenamiento
  const [filters, setFilters] = useState<AccountFilters>({
    search: '',
    accountType: 'all',
    bankCode: 'all',
    currency: 'all',
    balanceFilter: 'all',
  });
  
  const [sort, setSort] = useState<AccountSort>({
    field: 'updated_at',
    direction: 'desc',
  });

  // Formularios
  const createForm = useForm<CreateAccountFormData>({
    defaultValues: {
      name: '',
      account_type: 'checking',
      bank_code: 'bbva',
      currency: 'MXN',
      initial_balance: 0,
      color: DEFAULT_ACCOUNT_COLORS[0],
      description: '',
    },
  });

  const updateForm = useForm<UpdateAccountRequest>({
    defaultValues: {
      name: '',
      color: DEFAULT_ACCOUNT_COLORS[0],
      description: '',
    },
  });

  const balanceForm = useForm<UpdateBalanceFormData>({
    defaultValues: {
      amount: 0,
      description: '',
    },
  });

  // Effect to handle dialog state changes and form resets
  useEffect(() => {
    if (dialogState.type === null) {
      // Reset all forms when dialog closes
      createForm.reset({
        name: '',
        account_type: 'checking',
        bank_code: 'bbva',
        currency: 'MXN',
        initial_balance: 0,
        color: DEFAULT_ACCOUNT_COLORS[0],
        description: '',
      });
      updateForm.reset({
        name: '',
        color: DEFAULT_ACCOUNT_COLORS[0],
        description: '',
      });
      balanceForm.reset({
        amount: 0,
        description: '',
      });
      setSelectedColor(DEFAULT_ACCOUNT_COLORS[0]);
    }
  }, [dialogState.type, createForm, updateForm, balanceForm]);

  // Filtrar y ordenar cuentas
  const filteredAndSortedAccounts = useMemo(() => {
    let filtered = accounts.filter(account => {
      // Filtro de búsqueda
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const matchesSearch = 
          account.name.toLowerCase().includes(searchLower) ||
          (account.bank_code?.toLowerCase().includes(searchLower) || false) ||
          (account.description?.toLowerCase().includes(searchLower) || false);
        
        if (!matchesSearch) return false;
      }

      // Filtro por tipo
      if (filters.accountType !== 'all' && account.account_type !== filters.accountType) {
        return false;
      }

      // Filtro por banco
      if (filters.bankCode !== 'all' && account.bank_code !== filters.bankCode) {
        return false;
      }

      // Filtro por moneda
      if (filters.currency !== 'all' && account.currency !== filters.currency) {
        return false;
      }

      // Filtro por balance
      if (filters.balanceFilter !== 'all') {
        if (filters.balanceFilter === 'positive' && account.current_balance <= 0) return false;
        if (filters.balanceFilter === 'negative' && account.current_balance >= 0) return false;
        if (filters.balanceFilter === 'zero' && account.current_balance !== 0) return false;
      }

      return true;
    });

    // Ordenar
    filtered.sort((a, b) => {
      let aValue: any = a[sort.field];
      let bValue: any = b[sort.field];

      if (sort.field === 'updated_at') {
        aValue = new Date(aValue).getTime();
        bValue = new Date(bValue).getTime();
      } else if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (sort.direction === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  }, [accounts, filters, sort]);

  // Manejadores de diálogos
  const openCreateDialog = () => {
    createForm.reset({
      currency: 'MXN',
      initial_balance: 0,
      color: DEFAULT_ACCOUNT_COLORS[0],
    });
    setSelectedColor(DEFAULT_ACCOUNT_COLORS[0]);
    setDialogState({ type: 'create' });
  };

  const openEditDialog = (account: Account) => {
    updateForm.reset({
      name: account.name || '',
      color: account.color || DEFAULT_ACCOUNT_COLORS[0],
      description: account.description || '',
    });
    setSelectedColor(account.color || DEFAULT_ACCOUNT_COLORS[0]);
    setDialogState({ type: 'edit', account });
  };

  const openBalanceDialog = (account: Account) => {
    balanceForm.reset({
      amount: 0,
      description: '',
    });
    setDialogState({ type: 'balance', account });
  };

  const openDeleteDialog = (account: Account) => {
    setDialogState({ type: 'delete', account });
  };

  const closeDialog = () => {
    setDialogState({ type: null });
    // The useEffect will handle the form resets when dialogState.type becomes null
  };

  // Manejadores de operaciones
  const handleCreateAccount = async (data: CreateAccountFormData) => {
    try {
      // Obtener el nombre del banco desde las opciones
      const bankOption = BANK_OPTIONS.find(option => option.value === data.bank_code);
      const bankName = bankOption?.label || 'Other Bank';
      
      await createAccount({
        name: data.name,
        bank_code: data.bank_code,
        bank_name: bankName,
        account_type: data.account_type,
        currency: data.currency,
        initial_balance: Number(data.initial_balance) || 0,
        color: selectedColor,
        description: data.description,
      });
      toast.success('Cuenta creada exitosamente');
      closeDialog();
    } catch (error: any) {
      toast.error(error.message || 'Error al crear la cuenta');
    }
  };

  const handleUpdateAccount = async (data: UpdateAccountRequest) => {
    if (dialogState.type !== 'edit') return;

    try {
      await updateAccount(dialogState.account.account_id, {
        ...data,
        color: selectedColor,
      });
      toast.success('Cuenta actualizada exitosamente');
      closeDialog();
    } catch (error: any) {
      toast.error(error.message || 'Error al actualizar la cuenta');
    }
  };

  const handleUpdateBalance = async (data: UpdateBalanceFormData) => {
    if (dialogState.type !== 'balance') return;

    try {
      const balanceData = {
        amount: Number(data.amount) || 0,
        description: data.description,
      };
      
      console.log('Updating balance with data:', balanceData);
      console.log('Account ID:', dialogState.account.account_id);
      
      await updateBalance(dialogState.account.account_id, balanceData);
      toast.success('Balance actualizado exitosamente');
      closeDialog();
    } catch (error: any) {
      console.error('Balance update error:', error);
      toast.error(error.message || 'Error al actualizar el balance');
    }
  };

  const handleDeleteAccount = async () => {
    if (dialogState.type !== 'delete') return;

    try {
      await deleteAccount(dialogState.account.account_id);
      toast.success('Cuenta eliminada exitosamente');
      closeDialog();
    } catch (error: any) {
      toast.error(error.message || 'Error al eliminar la cuenta');
    }
  };

  // Manejadores de filtros
  const handleFiltersChange = (newFilters: AccountFilters) => {
    setFilters(newFilters);
  };

  const handleSortChange = (newSort: AccountSort) => {
    setSort(newSort);
  };

  const handleClearFilters = () => {
    setFilters({
      search: '',
      accountType: 'all',
      bankCode: 'all',
      currency: 'all',
      balanceFilter: 'all',
    });
  };

  // Acciones del Speed Dial
  const speedDialActions = [
    {
      icon: <AddIcon />,
      name: 'Nueva Cuenta',
      onClick: openCreateDialog,
    },
    {
      icon: <RefreshIcon />,
      name: 'Actualizar',
      onClick: refetchAccounts,
    },
    {
      icon: <ExportIcon />,
      name: 'Exportar',
      onClick: () => toast('Funcionalidad próximamente'),
    },
  ];

  return (
    <AppLayout>
      <Box sx={{ maxWidth: 1200, mx: 'auto', p: 3 }}>
        {/* Header */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
          <Box>
            <Typography 
              variant="h4" 
              sx={{ 
                fontWeight: 600,
                background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                mb: 1,
              }}
            >
              Mis Cuentas
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Gestiona todas tus cuentas bancarias y mantén control de tus finanzas
            </Typography>
          </Box>

          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={openCreateDialog}
            sx={{
              borderRadius: 3,
              py: 1.5,
              px: 3,
              background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
              boxShadow: `0 8px 16px ${alpha(theme.palette.primary.main, 0.3)}`,
              '&:hover': {
                boxShadow: `0 12px 20px ${alpha(theme.palette.primary.main, 0.4)}`,
              },
              display: { xs: 'none', sm: 'flex' }
            }}
          >
            Nueva Cuenta
          </Button>
        </Box>

        {/* Error Alert */}
        {error && (
          <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
            {error}
          </Alert>
        )}

        {/* Estadísticas */}
        <AccountStats
          accounts={accounts}
          totalBalance={totalBalance}
          totalAccounts={totalAccounts}
          isLoading={isLoading}
        />

        {/* Filtros */}
        {!isLoading && accounts.length > 0 && (
          <AccountFiltersBar
            filters={filters}
            sort={sort}
            onFiltersChange={handleFiltersChange}
            onSortChange={handleSortChange}
            onClearFilters={handleClearFilters}
            accounts={accounts}
          />
        )}

        {/* Lista de cuentas */}
        {isLoading ? (
          <Box display="flex" justifyContent="center" py={8}>
            <CircularProgress size={60} thickness={4} />
          </Box>
        ) : filteredAndSortedAccounts.length === 0 ? (
          <Box
            display="flex"
            flexDirection="column"
            alignItems="center"
            justifyContent="center"
            py={8}
            sx={{
              bgcolor: alpha(theme.palette.background.paper, 0.5),
              borderRadius: 3,
              border: `2px dashed ${alpha(theme.palette.primary.main, 0.3)}`,
            }}
          >
            <AccountBalanceIcon sx={{ fontSize: 80, color: 'text.disabled', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" mb={1}>
              {accounts.length === 0 ? 'No tienes cuentas registradas' : 'No se encontraron cuentas'}
            </Typography>
            <Typography variant="body2" color="text.disabled" mb={3}>
              {accounts.length === 0 
                ? 'Comienza agregando tu primera cuenta bancaria'
                : 'Intenta ajustar los filtros de búsqueda'
              }
            </Typography>
            {accounts.length === 0 && (
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={openCreateDialog}
                sx={{ borderRadius: 2 }}
              >
                Agregar Primera Cuenta
              </Button>
            )}
          </Box>
        ) : (
          <Box>
            <Typography variant="h6" sx={{ mb: 3, fontWeight: 500 }}>
              {filteredAndSortedAccounts.length} cuenta{filteredAndSortedAccounts.length !== 1 ? 's' : ''} 
              {filteredAndSortedAccounts.length !== accounts.length && ` de ${accounts.length}`}
            </Typography>
            
            <Box display="flex" flexWrap="wrap" gap={3}>
              <AnimatePresence mode="popLayout">
                {filteredAndSortedAccounts.map((account) => (
                  <Box
                    key={account.account_id}
                    sx={{
                      minWidth: 320,
                      maxWidth: 400,
                      flex: '1 1 320px',
                    }}
                  >
                    <AccountCard
                      account={account}
                      onEdit={openEditDialog}
                      onDelete={openDeleteDialog}
                      onUpdateBalance={openBalanceDialog}
                    />
                  </Box>
                ))}
              </AnimatePresence>
            </Box>
          </Box>
        )}

        {/* Speed Dial para móviles */}
        <SpeedDial
          ariaLabel="Acciones rápidas"
          sx={{
            position: 'fixed',
            bottom: 16,
            right: 16,
            display: { xs: 'block', sm: 'none' }
          }}
          icon={<SpeedDialIcon />}
          onClose={() => setSpeedDialOpen(false)}
          onOpen={() => setSpeedDialOpen(true)}
          open={speedDialOpen}
        >
          {speedDialActions.map((action) => (
            <SpeedDialAction
              key={action.name}
              icon={action.icon}
              tooltipTitle={action.name}
              onClick={action.onClick}
            />
          ))}
        </SpeedDial>
      </Box>

      {/* Diálogos */}
      {/* Crear cuenta */}
      <Dialog
        open={dialogState.type === 'create'}
        onClose={closeDialog}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 3 }
        }}
      >
        <form onSubmit={createForm.handleSubmit(handleCreateAccount)}>
          <DialogTitle sx={{ pb: 1 }}>
            <Typography variant="h5" component="div" sx={{ fontWeight: 600 }}>
              Crear Nueva Cuenta
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Agrega una nueva cuenta bancaria a tu perfil
            </Typography>
          </DialogTitle>
          
          <DialogContent>
            <Stack spacing={3} sx={{ mt: 1 }}>
              <Controller
                name="name"
                control={createForm.control}
                render={({ field, fieldState }) => (
                  <TextField
                    {...field}
                    label="Nombre de la cuenta"
                    error={!!fieldState.error}
                    helperText={fieldState.error?.message}
                    fullWidth
                  />
                )}
              />

              <Controller
                name="bank_code"
                control={createForm.control}
                render={({ field, fieldState }) => (
                  <FormControl error={!!fieldState.error} fullWidth>
                    <InputLabel>Banco</InputLabel>
                    <Select {...field} label="Banco">
                      {BANK_OPTIONS.map((bank) => (
                        <MenuItem key={bank.value} value={bank.value}>
                          {bank.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                )}
              />

              <Controller
                name="account_type"
                control={createForm.control}
                render={({ field, fieldState }) => (
                  <FormControl error={!!fieldState.error} fullWidth>
                    <InputLabel>Tipo de cuenta</InputLabel>
                    <Select {...field} label="Tipo de cuenta">
                      {ACCOUNT_TYPE_OPTIONS.map((accountType) => (
                        <MenuItem key={accountType.value} value={accountType.value}>
                          {accountType.icon} {accountType.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                )}
              />

              <Controller
                name="currency"
                control={createForm.control}
                render={({ field, fieldState }) => (
                  <FormControl error={!!fieldState.error} fullWidth>
                    <InputLabel>Moneda</InputLabel>
                    <Select {...field} label="Moneda">
                      {CURRENCY_OPTIONS.map((currency) => (
                        <MenuItem key={currency.value} value={currency.value}>
                          {currency.label} ({currency.value})
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                )}
              />

              <Controller
                name="initial_balance"
                control={createForm.control}
                render={({ field, fieldState }) => (
                  <TextField
                    {...field}
                    label="Balance inicial"
                    type="number"
                    inputProps={{ 
                      step: 0.01,
                      min: 0,
                    }}
                    error={!!fieldState.error}
                    helperText={fieldState.error?.message}
                    fullWidth
                    onChange={(e) => field.onChange(Number(e.target.value) || 0)}
                  />
                )}
              />

              <Controller
                name="description"
                control={createForm.control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Descripción (opcional)"
                    multiline
                    rows={2}
                    fullWidth
                  />
                )}
              />

              {/* Selector de color */}
              <Box>
                <Typography variant="body2" color="text.secondary" mb={1}>
                  Color de la cuenta
                </Typography>
                <Box display="flex" flexWrap="wrap" gap={1}>
                  {DEFAULT_ACCOUNT_COLORS.map((color) => (
                    <Box
                      key={color}
                      onClick={() => setSelectedColor(color)}
                      sx={{
                        width: 32,
                        height: 32,
                        bgcolor: color,
                        borderRadius: '50%',
                        cursor: 'pointer',
                        border: selectedColor === color ? `3px solid ${theme.palette.common.white}` : 'none',
                        boxShadow: selectedColor === color 
                          ? `0 0 0 2px ${color}` 
                          : `0 2px 4px ${alpha(color, 0.3)}`,
                        '&:hover': {
                          transform: 'scale(1.1)',
                        },
                        transition: 'all 0.2s ease-in-out',
                      }}
                    />
                  ))}
                </Box>
              </Box>
            </Stack>
          </DialogContent>
          
          <DialogActions sx={{ p: 3, gap: 1 }}>
            <Button onClick={closeDialog} color="inherit">
              Cancelar
            </Button>
            <Button 
              type="submit" 
              variant="contained"
              disabled={createForm.formState.isSubmitting}
              sx={{ minWidth: 100 }}
            >
              {createForm.formState.isSubmitting ? (
                <CircularProgress size={20} />
              ) : (
                'Crear Cuenta'
              )}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Editar cuenta */}
      <Dialog
        open={dialogState.type === 'edit'}
        onClose={closeDialog}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 3 }
        }}
      >
        <form onSubmit={updateForm.handleSubmit(handleUpdateAccount)}>
          <DialogTitle>
            <Typography variant="h5" component="div" sx={{ fontWeight: 600 }}>
              Editar Cuenta
            </Typography>
            {dialogState.type === 'edit' && (
              <Typography variant="body2" color="text.secondary">
                {dialogState.account.name}
              </Typography>
            )}
          </DialogTitle>
          
          <DialogContent>
            <Stack spacing={3} sx={{ mt: 1 }}>
              <Controller
                name="name"
                control={updateForm.control}
                render={({ field, fieldState }) => (
                  <TextField
                    {...field}
                    label="Nombre de la cuenta"
                    error={!!fieldState.error}
                    helperText={fieldState.error?.message}
                    fullWidth
                  />
                )}
              />

              <Controller
                name="description"
                control={updateForm.control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Descripción"
                    multiline
                    rows={2}
                    fullWidth
                  />
                )}
              />

              {/* Selector de color */}
              <Box>
                <Typography variant="body2" color="text.secondary" mb={1}>
                  Color de la cuenta
                </Typography>
                <Box display="flex" flexWrap="wrap" gap={1}>
                  {DEFAULT_ACCOUNT_COLORS.map((color) => (
                    <Box
                      key={color}
                      onClick={() => setSelectedColor(color)}
                      sx={{
                        width: 32,
                        height: 32,
                        bgcolor: color,
                        borderRadius: '50%',
                        cursor: 'pointer',
                        border: selectedColor === color ? `3px solid ${theme.palette.common.white}` : 'none',
                        boxShadow: selectedColor === color 
                          ? `0 0 0 2px ${color}` 
                          : `0 2px 4px ${alpha(color, 0.3)}`,
                        '&:hover': {
                          transform: 'scale(1.1)',
                        },
                        transition: 'all 0.2s ease-in-out',
                      }}
                    />
                  ))}
                </Box>
              </Box>
            </Stack>
          </DialogContent>
          
          <DialogActions sx={{ p: 3, gap: 1 }}>
            <Button onClick={closeDialog} color="inherit">
              Cancelar
            </Button>
            <Button 
              type="submit" 
              variant="contained"
              disabled={updateForm.formState.isSubmitting}
              sx={{ minWidth: 100 }}
            >
              {updateForm.formState.isSubmitting ? (
                <CircularProgress size={20} />
              ) : (
                'Actualizar'
              )}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Actualizar balance */}
      <Dialog
        open={dialogState.type === 'balance'}
        onClose={closeDialog}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 3 }
        }}
      >
        <form onSubmit={balanceForm.handleSubmit(handleUpdateBalance)}>
          <DialogTitle>
            <Typography variant="h5" component="div" sx={{ fontWeight: 600 }}>
              Ajustar Balance
            </Typography>
            {dialogState.type === 'balance' && (
              <>
                <Typography variant="body2" color="text.secondary">
                  {dialogState.account.name}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                  Balance actual: {AccountService.formatCurrency(dialogState.account.current_balance, dialogState.account.currency)}
                </Typography>
              </>
            )}
          </DialogTitle>
          
          <DialogContent>
            <Controller
              name="amount"
              control={balanceForm.control}
              render={({ field, fieldState }) => (
                <TextField
                  {...field}
                  label="Cantidad a agregar/quitar"
                  type="number"
                  inputProps={{ 
                    step: 0.01,
                  }}
                  error={!!fieldState.error}
                  helperText={fieldState.error?.message || "Use números positivos para aumentar el balance, negativos para disminuir"}
                  fullWidth
                  sx={{ mt: 2 }}
                  onChange={(e) => field.onChange(Number(e.target.value) || 0)}
                  InputProps={{
                    startAdornment: dialogState.type === 'balance' && (
                      <Typography color="text.secondary" sx={{ mr: 1 }}>
                        {dialogState.account.currency}
                      </Typography>
                    ),
                  }}
                />
              )}
            />

            <Controller
              name="description"
              control={balanceForm.control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Descripción (opcional)"
                  fullWidth
                  sx={{ mt: 2 }}
                  placeholder="Ej: Depósito de nómina, Pago de cuenta, etc."
                />
              )}
            />
          </DialogContent>
          
          <DialogActions sx={{ p: 3, gap: 1 }}>
            <Button onClick={closeDialog} color="inherit">
              Cancelar
            </Button>
            <Button 
              type="submit" 
              variant="contained"
              disabled={balanceForm.formState.isSubmitting}
              sx={{ minWidth: 100 }}
            >
              {balanceForm.formState.isSubmitting ? (
                <CircularProgress size={20} />
              ) : (
                'Actualizar'
              )}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Confirmar eliminación */}
      <Dialog
        open={dialogState.type === 'delete'}
        onClose={closeDialog}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 3 }
        }}
      >
        <DialogTitle>
          <Typography variant="h5" component="div" sx={{ fontWeight: 600 }}>
            Eliminar Cuenta
          </Typography>
        </DialogTitle>
        
        <DialogContent>
          {dialogState.type === 'delete' && (
            <Typography>
              ¿Estás seguro de que deseas eliminar la cuenta <strong>{dialogState.account.name}</strong>?
              Esta acción no se puede deshacer.
            </Typography>
          )}
        </DialogContent>
        
        <DialogActions sx={{ p: 3, gap: 1 }}>
          <Button onClick={closeDialog} color="inherit">
            Cancelar
          </Button>
          <Button 
            onClick={handleDeleteAccount}
            variant="contained"
            color="error"
            sx={{ minWidth: 100 }}
          >
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>
    </AppLayout>
  );
};

export default AccountsPage;
