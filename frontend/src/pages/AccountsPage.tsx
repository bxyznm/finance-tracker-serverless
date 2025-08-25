import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Chip,
  IconButton,
  Fab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Alert,
  CircularProgress,
  Avatar,
  Stack,
  Tooltip,
  Divider,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  AccountBalance as AccountBalanceIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import toast from 'react-hot-toast';

import { AppLayout } from '../components/layout';
import { useCustomTheme } from '../context/ThemeContext';
import { useAccounts } from '../hooks/useAccounts';
import { AccountService } from '../services/accountService';
import {
  Account,
  CreateAccountRequest,
  UpdateAccountRequest,
  UpdateBalanceRequest,
  BANK_OPTIONS,
  ACCOUNT_TYPE_OPTIONS,
  CURRENCY_OPTIONS,
  DEFAULT_ACCOUNT_COLORS,
} from '../types/account';

// Validation schemas
const createAccountSchema: yup.ObjectSchema<CreateAccountFormData> = yup.object({
  name: yup.string().required('Account name is required').min(2, 'Name must be at least 2 characters'),
  bank_code: yup.string().required('Bank is required'),
  account_type: yup.string().required('Account type is required'),
  currency: yup.string().required('Currency is required'),
  initial_balance: yup.number().optional().min(0, 'Balance cannot be negative'),
  color: yup.string().optional(),
  description: yup.string().optional(),
});

const updateAccountSchema: yup.ObjectSchema<UpdateAccountRequest> = yup.object({
  name: yup.string().required('Account name is required').min(2, 'Name must be at least 2 characters'),
  color: yup.string().optional(),
  description: yup.string().optional(),
});

const updateBalanceSchema: yup.ObjectSchema<UpdateBalanceRequest> = yup.object({
  balance: yup.number().required('Balance is required'),
  reason: yup.string().optional(),
});

// Form types (for react-hook-form)
interface CreateAccountFormData {
  name: string;
  bank_code: string;
  account_type: string;
  currency: string;
  initial_balance?: number;
  color?: string;
  description?: string;
}

interface DialogState {
  type: 'create' | 'edit' | 'balance' | 'delete' | null;
  account?: Account;
}

const AccountsPage: React.FC = () => {
  const { mode } = useCustomTheme();
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

  const [dialogState, setDialogState] = useState<DialogState>({ type: null });
  const [selectedColor, setSelectedColor] = useState<string>(DEFAULT_ACCOUNT_COLORS[0]);

  // Form controls
  const createForm = useForm<CreateAccountFormData>({
    resolver: yupResolver(createAccountSchema),
    defaultValues: {
      currency: 'MXN',
      initial_balance: 0,
      color: DEFAULT_ACCOUNT_COLORS[0],
    },
  });

  const updateForm = useForm<UpdateAccountRequest>({
    resolver: yupResolver(updateAccountSchema),
  });

  const balanceForm = useForm<UpdateBalanceRequest>({
    resolver: yupResolver(updateBalanceSchema),
  });

  // Dialog handlers
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
      name: account.name,
      color: account.color,
      description: account.description,
    });
    setSelectedColor(account.color || DEFAULT_ACCOUNT_COLORS[0]);
    setDialogState({ type: 'edit', account });
  };

  const openBalanceDialog = (account: Account) => {
    balanceForm.reset({
      balance: account.balance,
    });
    setDialogState({ type: 'balance', account });
  };

  const openDeleteDialog = (account: Account) => {
    setDialogState({ type: 'delete', account });
  };

  const closeDialog = () => {
    setDialogState({ type: null });
    createForm.reset();
    updateForm.reset();
    balanceForm.reset();
  };

  // CRUD operations
  const handleCreateAccount = async (data: CreateAccountFormData) => {
    try {
      const accountData: CreateAccountRequest = {
        name: data.name,
        bank_code: data.bank_code as any,
        account_type: data.account_type as any,
        currency: data.currency as any,
        initial_balance: data.initial_balance,
        color: selectedColor,
        description: data.description,
      };
      await createAccount(accountData);
      toast.success('Account created successfully!');
      closeDialog();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleUpdateAccount = async (data: UpdateAccountRequest) => {
    if (!dialogState.account) return;
    try {
      await updateAccount(dialogState.account.account_id, { ...data, color: selectedColor });
      toast.success('Account updated successfully!');
      closeDialog();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleUpdateBalance = async (data: UpdateBalanceRequest) => {
    if (!dialogState.account) return;
    try {
      await updateBalance(dialogState.account.account_id, data);
      toast.success('Balance updated successfully!');
      closeDialog();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleDeleteAccount = async () => {
    if (!dialogState.account) return;
    try {
      await deleteAccount(dialogState.account.account_id);
      toast.success('Account deleted successfully!');
      closeDialog();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const getAccountTypeLabel = (type: string) => {
    return ACCOUNT_TYPE_OPTIONS.find(opt => opt.value === type)?.label || type;
  };

  const getBankLabel = (code: string) => {
    return BANK_OPTIONS.find(opt => opt.value === code)?.label || code;
  };

  if (isLoading) {
    return (
      <AppLayout title="Accounts">
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress size={60} />
        </Box>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Accounts">
      <Box>
        {/* Header */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Box>
            <Typography variant="h4" gutterBottom>
              My Accounts
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Manage your bank accounts and track balances
            </Typography>
          </Box>
          <Box display="flex" gap={1}>
            <Tooltip title="Refresh accounts">
              <IconButton onClick={refetchAccounts} disabled={isLoading}>
                <RefreshIcon />
              </IconButton>
            </Tooltip>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={openCreateDialog}
              sx={{ borderRadius: 2 }}
            >
              Add Account
            </Button>
          </Box>
        </Box>

        {/* Error Alert */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* Summary Cards */}
        <Box display="flex" flexWrap="wrap" gap={3} mb={4}>
          <Box sx={{ minWidth: 250, flex: { xs: '1 1 100%', sm: '1 1 45%', md: '1 1 30%' } }}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" gap={2}>
                  <Avatar sx={{ bgcolor: 'primary.main' }}>
                    <AccountBalanceIcon />
                  </Avatar>
                  <Box>
                    <Typography variant="h6">{totalAccounts}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Accounts
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Box>
          {Object.entries(totalBalance).map(([currency, balance]) => (
            <Box key={currency} sx={{ minWidth: 250, flex: { xs: '1 1 100%', sm: '1 1 45%', md: '1 1 30%' } }}>
              <Card>
                <CardContent>
                  <Box display="flex" alignItems="center" gap={2}>
                    <Avatar sx={{ bgcolor: balance >= 0 ? 'success.main' : 'error.main' }}>
                      {balance >= 0 ? <TrendingUpIcon /> : <TrendingDownIcon />}
                    </Avatar>
                    <Box>
                      <Typography variant="h6">
                        {AccountService.formatCurrency(balance, currency)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Total {currency}
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Box>
          ))}
        </Box>

        {/* Accounts List */}
        <AnimatePresence>
          {accounts.length === 0 ? (
            <Card>
              <CardContent sx={{ textAlign: 'center', py: 6 }}>
                <AccountBalanceIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" gutterBottom>
                  No accounts yet
                </Typography>
                <Typography variant="body2" color="text.secondary" mb={3}>
                  Create your first account to start tracking your finances
                </Typography>
                <Button variant="contained" startIcon={<AddIcon />} onClick={openCreateDialog}>
                  Add First Account
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Box display="flex" flexWrap="wrap" gap={3}>
              {accounts.map((account, index) => (
                <Box key={account.account_id} sx={{ minWidth: 300, flex: { xs: '1 1 100%', sm: '1 1 45%', md: '1 1 30%' } }}>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card
                      sx={{
                        height: '100%',
                        border: `2px solid ${account.color || '#e0e0e0'}`,
                        borderRadius: 3,
                        '&:hover': {
                          transform: 'translateY(-4px)',
                          boxShadow: 4,
                        },
                        transition: 'all 0.2s ease',
                      }}
                    >
                      <CardContent>
                        {/* Account Header */}
                        <Box display="flex" justifyContent="space-between" alignItems="start" mb={2}>
                          <Box display="flex" alignItems="center" gap={1}>
                            <Box
                              sx={{
                                width: 12,
                                height: 12,
                                borderRadius: '50%',
                                backgroundColor: account.color || '#e0e0e0',
                              }}
                            />
                            <Typography variant="h6" noWrap>
                              {account.name}
                            </Typography>
                          </Box>
                          <Box display="flex" gap={0.5}>
                            <IconButton
                              size="small"
                              onClick={() => openEditDialog(account)}
                              sx={{ color: 'text.secondary' }}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                            <IconButton
                              size="small"
                              onClick={() => openDeleteDialog(account)}
                              sx={{ color: 'error.main' }}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Box>
                        </Box>

                        {/* Account Details */}
                        <Stack spacing={1} mb={2}>
                          <Box display="flex" justifyContent="space-between">
                            <Typography variant="body2" color="text.secondary">
                              Bank:
                            </Typography>
                            <Typography variant="body2">
                              {getBankLabel(account.bank_code)}
                            </Typography>
                          </Box>
                          <Box display="flex" justifyContent="space-between">
                            <Typography variant="body2" color="text.secondary">
                              Type:
                            </Typography>
                            <Chip
                              label={getAccountTypeLabel(account.account_type)}
                              size="small"
                              variant="outlined"
                              icon={<span>{AccountService.getAccountTypeIcon(account.account_type)}</span>}
                            />
                          </Box>
                          {account.description && (
                            <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                              {account.description}
                            </Typography>
                          )}
                        </Stack>

                        <Divider sx={{ my: 2 }} />

                        {/* Balance */}
                        <Box display="flex" justifyContent="space-between" alignItems="center">
                          <Typography variant="h5" color={account.balance >= 0 ? 'success.main' : 'error.main'}>
                            {AccountService.formatCurrency(account.balance, account.currency)}
                          </Typography>
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() => openBalanceDialog(account)}
                          >
                            Update
                          </Button>
                        </Box>
                      </CardContent>
                    </Card>
                  </motion.div>
                </Box>
              ))}
            </Box>
          )}
        </AnimatePresence>

        {/* Floating Action Button for Mobile */}
        <Fab
          color="primary"
          aria-label="add account"
          sx={{
            position: 'fixed',
            bottom: 16,
            right: 16,
            display: { xs: 'flex', sm: 'none' },
          }}
          onClick={openCreateDialog}
        >
          <AddIcon />
        </Fab>

        {/* Create Account Dialog */}
        <Dialog
          open={dialogState.type === 'create'}
          onClose={closeDialog}
          maxWidth="sm"
          fullWidth
        >
          <form onSubmit={createForm.handleSubmit(handleCreateAccount)}>
            <DialogTitle>Create New Account</DialogTitle>
            <DialogContent>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
                <Controller
                  name="name"
                  control={createForm.control}
                  render={({ field, fieldState }) => (
                    <TextField
                      {...field}
                      label="Account Name"
                      fullWidth
                      error={!!fieldState.error}
                      helperText={fieldState.error?.message}
                    />
                  )}
                />
                
                <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
                  <Controller
                    name="bank_code"
                    control={createForm.control}
                    render={({ field, fieldState }) => (
                      <FormControl fullWidth error={!!fieldState.error}>
                        <InputLabel>Bank</InputLabel>
                        <Select {...field} label="Bank">
                          {BANK_OPTIONS.map((bank) => (
                            <MenuItem key={bank.value} value={bank.value}>
                              {AccountService.getBankLogo(bank.value)} {bank.label}
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
                      <FormControl fullWidth error={!!fieldState.error}>
                        <InputLabel>Account Type</InputLabel>
                        <Select {...field} label="Account Type">
                          {ACCOUNT_TYPE_OPTIONS.map((type) => (
                            <MenuItem key={type.value} value={type.value}>
                              {type.icon} {type.label}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    )}
                  />
                </Box>

                <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
                  <Controller
                    name="currency"
                    control={createForm.control}
                    render={({ field, fieldState }) => (
                      <FormControl fullWidth error={!!fieldState.error}>
                        <InputLabel>Currency</InputLabel>
                        <Select {...field} label="Currency">
                          {CURRENCY_OPTIONS.map((currency) => (
                            <MenuItem key={currency.value} value={currency.value}>
                              {currency.symbol} {currency.label}
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
                        label="Initial Balance"
                        type="number"
                        fullWidth
                        error={!!fieldState.error}
                        helperText={fieldState.error?.message}
                      />
                    )}
                  />
                </Box>

                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    Account Color
                  </Typography>
                  <Box display="flex" gap={1} flexWrap="wrap">
                    {DEFAULT_ACCOUNT_COLORS.map((color) => (
                      <Box
                        key={color}
                        sx={{
                          width: 32,
                          height: 32,
                          borderRadius: '50%',
                          backgroundColor: color,
                          border: selectedColor === color ? '3px solid' : '2px solid transparent',
                          borderColor: selectedColor === color ? mode === 'dark' ? '#fff' : '#000' : 'transparent',
                          cursor: 'pointer',
                          '&:hover': { transform: 'scale(1.1)' },
                        }}
                        onClick={() => setSelectedColor(color)}
                      />
                    ))}
                  </Box>
                </Box>

                <Controller
                  name="description"
                  control={createForm.control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Description (Optional)"
                      multiline
                      rows={2}
                      fullWidth
                    />
                  )}
                />
              </Box>
            </DialogContent>
            <DialogActions>
              <Button onClick={closeDialog}>Cancel</Button>
              <Button type="submit" variant="contained">
                Create Account
              </Button>
            </DialogActions>
          </form>
        </Dialog>

        {/* Edit Account Dialog */}
        <Dialog
          open={dialogState.type === 'edit'}
          onClose={closeDialog}
          maxWidth="sm"
          fullWidth
        >
          <form onSubmit={updateForm.handleSubmit(handleUpdateAccount)}>
            <DialogTitle>Edit Account</DialogTitle>
            <DialogContent>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
                <Controller
                  name="name"
                  control={updateForm.control}
                  render={({ field, fieldState }) => (
                    <TextField
                      {...field}
                      label="Account Name"
                      fullWidth
                      error={!!fieldState.error}
                      helperText={fieldState.error?.message}
                    />
                  )}
                />

                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    Account Color
                  </Typography>
                  <Box display="flex" gap={1} flexWrap="wrap">
                    {DEFAULT_ACCOUNT_COLORS.map((color) => (
                      <Box
                        key={color}
                        sx={{
                          width: 32,
                          height: 32,
                          borderRadius: '50%',
                          backgroundColor: color,
                          border: selectedColor === color ? '3px solid' : '2px solid transparent',
                          borderColor: selectedColor === color ? mode === 'dark' ? '#fff' : '#000' : 'transparent',
                          cursor: 'pointer',
                          '&:hover': { transform: 'scale(1.1)' },
                        }}
                        onClick={() => setSelectedColor(color)}
                      />
                    ))}
                  </Box>
                </Box>

                <Controller
                  name="description"
                  control={updateForm.control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Description (Optional)"
                      multiline
                      rows={2}
                      fullWidth
                    />
                  )}
                />
              </Box>
            </DialogContent>
            <DialogActions>
              <Button onClick={closeDialog}>Cancel</Button>
              <Button type="submit" variant="contained">
                Update Account
              </Button>
            </DialogActions>
          </form>
        </Dialog>

        {/* Update Balance Dialog */}
        <Dialog
          open={dialogState.type === 'balance'}
          onClose={closeDialog}
          maxWidth="sm"
          fullWidth
        >
          <form onSubmit={balanceForm.handleSubmit(handleUpdateBalance)}>
            <DialogTitle>Update Account Balance</DialogTitle>
            <DialogContent>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Account: {dialogState.account?.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Current Balance: {dialogState.account && AccountService.formatCurrency(dialogState.account.balance, dialogState.account.currency)}
                  </Typography>
                </Box>
                
                <Controller
                  name="balance"
                  control={balanceForm.control}
                  render={({ field, fieldState }) => (
                    <TextField
                      {...field}
                      label="New Balance"
                      type="number"
                      fullWidth
                      error={!!fieldState.error}
                      helperText={fieldState.error?.message}
                    />
                  )}
                />

                <Controller
                  name="reason"
                  control={balanceForm.control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Reason for Change (Optional)"
                      multiline
                      rows={2}
                      fullWidth
                      placeholder="e.g., Bank statement reconciliation, manual adjustment..."
                    />
                  )}
                />
              </Box>
            </DialogContent>
            <DialogActions>
              <Button onClick={closeDialog}>Cancel</Button>
              <Button type="submit" variant="contained">
                Update Balance
              </Button>
            </DialogActions>
          </form>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog
          open={dialogState.type === 'delete'}
          onClose={closeDialog}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Delete Account</DialogTitle>
          <DialogContent>
            <Alert severity="warning" sx={{ mb: 2 }}>
              This action cannot be undone. The account will be permanently deleted.
            </Alert>
            <Typography>
              Are you sure you want to delete the account "{dialogState.account?.name}"?
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={closeDialog}>Cancel</Button>
            <Button onClick={handleDeleteAccount} variant="contained" color="error">
              Delete Account
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </AppLayout>
  );
};

export default AccountsPage;
