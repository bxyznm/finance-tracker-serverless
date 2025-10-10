/**
 * Componente de formulario para crear/editar transacciones con Material-UI
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Alert,
  InputAdornment,
  Chip,
  FormHelperText,
  CircularProgress,
  Paper,
} from '@mui/material';
import {
  Save as SaveIcon,
  Cancel as CancelIcon,
} from '@mui/icons-material';
import type { 
  Transaction, 
  TransactionCreateRequest, 
  TransactionUpdateRequest, 
  TransactionType, 
  TransactionCategory 
} from '../../types';
import {
  TRANSACTION_TYPE_LABELS,
  TRANSACTION_CATEGORY_LABELS,
  INCOME_CATEGORIES,
  EXPENSE_CATEGORIES,
  TRANSFER_CATEGORIES
} from '../../types/transaction';

interface TransactionFormProps {
  transaction?: Transaction | null;
  accounts?: Array<{ account_id: string; name: string; account_type?: string; bank_name?: string }>;
  onSubmit: (data: TransactionCreateRequest | TransactionUpdateRequest) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

export const TransactionForm: React.FC<TransactionFormProps> = ({
  transaction,
  accounts = [],
  onSubmit,
  onCancel,
  loading = false
}) => {
  const isEditing = !!transaction;

  // Estado del formulario
  const [formData, setFormData] = useState({
    account_id: transaction?.account_id || (accounts[0]?.account_id || ''),
    amount: transaction?.amount?.toString() || '',
    description: transaction?.description || '',
    transaction_type: transaction?.transaction_type || 'expense' as TransactionType,
    category: transaction?.category || 'other_expenses' as TransactionCategory,
    transaction_date: transaction?.transaction_date 
      ? new Date(transaction.transaction_date).toISOString().slice(0, 16)
      : new Date().toISOString().slice(0, 16),
    reference_number: transaction?.reference_number || '',
    notes: transaction?.notes || '',
    tags: transaction?.tags?.join(', ') || '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string>('');

  // Actualizar categorías disponibles cuando cambia el tipo de transacción
  const getAvailableCategories = (transactionType: TransactionType): TransactionCategory[] => {
    switch (transactionType) {
      case 'income':
        return INCOME_CATEGORIES;
      case 'expense':
        return EXPENSE_CATEGORIES;
      case 'transfer':
        return TRANSFER_CATEGORIES;
      default:
        return EXPENSE_CATEGORIES;
    }
  };

  const availableCategories = getAvailableCategories(formData.transaction_type);

  // Actualizar categoría cuando cambia el tipo
  useEffect(() => {
    const newCategories = getAvailableCategories(formData.transaction_type);
    if (!newCategories.includes(formData.category)) {
      setFormData(prev => ({
        ...prev,
        category: newCategories[0] || 'other_expenses'
      }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.transaction_type]);

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | any) => {
    const { name, value } = event.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Limpiar error si existe
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.account_id) {
      newErrors.account_id = 'La cuenta es requerida';
    }
    
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      newErrors.amount = 'El monto debe ser mayor a cero';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'La descripción es requerida';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    if (!validateForm()) return;

    setSubmitError('');

    try {
      const submitData = isEditing ? {
        amount: parseFloat(formData.amount),
        description: formData.description,
        category: formData.category,
        transaction_date: formData.transaction_date.replace('T', ' ') + ':00',
        reference_number: formData.reference_number || undefined,
        notes: formData.notes || undefined,
        tags: formData.tags ? formData.tags.split(',').map(tag => tag.trim()).filter(Boolean) : undefined
      } as TransactionUpdateRequest : {
        account_id: formData.account_id,
        amount: parseFloat(formData.amount),
        description: formData.description,
        transaction_type: formData.transaction_type,
        category: formData.category,
        transaction_date: formData.transaction_date.replace('T', ' ') + ':00',
        reference_number: formData.reference_number || undefined,
        notes: formData.notes || undefined,
        tags: formData.tags ? formData.tags.split(',').map(tag => tag.trim()).filter(Boolean) : undefined
      } as TransactionCreateRequest;

      await onSubmit(submitData);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Error al guardar la transacción');
    }
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(amount);
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%' }}>
      {submitError && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {submitError}
        </Alert>
      )}

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: 3, mb: 3 }}>
        {/* Tipo de transacción */}
        <FormControl fullWidth error={!!errors.transaction_type}>
          <InputLabel>Tipo de Transacción</InputLabel>
          <Select
            name="transaction_type"
            value={formData.transaction_type}
            onChange={handleInputChange}
            label="Tipo de Transacción"
            disabled={loading || isEditing}
          >
            {Object.entries(TRANSACTION_TYPE_LABELS).map(([value, label]) => (
              <MenuItem key={value} value={value}>
                {label}
              </MenuItem>
            ))}
          </Select>
          {errors.transaction_type && (
            <FormHelperText>{errors.transaction_type}</FormHelperText>
          )}
        </FormControl>

        {/* Cuenta */}
        <FormControl fullWidth error={!!errors.account_id}>
          <InputLabel>Cuenta</InputLabel>
          <Select
            name="account_id"
            value={formData.account_id}
            onChange={handleInputChange}
            label="Cuenta"
            disabled={loading || isEditing}
          >
            {accounts.map((account) => (
              <MenuItem key={account.account_id} value={account.account_id}>
                <Box>
                  <Typography variant="body1">{account.name}</Typography>
                  {account.bank_name && (
                    <Typography variant="caption" color="text.secondary">
                      {account.bank_name} - {account.account_type}
                    </Typography>
                  )}
                </Box>
              </MenuItem>
            ))}
          </Select>
          {errors.account_id && (
            <FormHelperText>{errors.account_id}</FormHelperText>
          )}
        </FormControl>

        {/* Monto */}
        <TextField
          fullWidth
          label="Monto"
          name="amount"
          type="number"
          value={formData.amount}
          onChange={handleInputChange}
          disabled={loading}
          error={!!errors.amount}
          helperText={errors.amount || "Ingresa el monto en pesos mexicanos"}
          InputProps={{
            startAdornment: <InputAdornment position="start">$</InputAdornment>,
            inputProps: { 
              min: 0, 
              step: '0.01' 
            }
          }}
          required
        />

        {/* Categoría */}
        <FormControl fullWidth error={!!errors.category}>
          <InputLabel>Categoría</InputLabel>
          <Select
            name="category"
            value={formData.category}
            onChange={handleInputChange}
            label="Categoría"
            disabled={loading}
          >
            {availableCategories.map((category) => (
              <MenuItem key={category} value={category}>
                {TRANSACTION_CATEGORY_LABELS[category] || category}
              </MenuItem>
            ))}
          </Select>
          <FormHelperText>
            {errors.category || 
             (formData.transaction_type === 'income' ? 'Tipo de ingreso' :
              formData.transaction_type === 'expense' ? 'Tipo de gasto' :
              'Tipo de transferencia')}
          </FormHelperText>
        </FormControl>

        {/* Fecha */}
        <TextField
          fullWidth
          label="Fecha de Transacción"
          name="transaction_date"
          type="datetime-local"
          value={formData.transaction_date}
          onChange={handleInputChange}
          disabled={loading}
          error={!!errors.transaction_date}
          helperText={errors.transaction_date}
          InputLabelProps={{
            shrink: true,
          }}
          required
        />

        {/* Número de referencia */}
        <TextField
          fullWidth
          label="Número de Referencia"
          name="reference_number"
          value={formData.reference_number}
          onChange={handleInputChange}
          disabled={loading}
          error={!!errors.reference_number}
          helperText={errors.reference_number || "Opcional - número de transacción bancaria"}
        />
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr', gap: 3, mb: 3 }}>
        {/* Descripción */}
        <TextField
          fullWidth
          label="Descripción"
          name="description"
          value={formData.description}
          onChange={handleInputChange}
          disabled={loading}
          error={!!errors.description}
          helperText={errors.description || "Describe brevemente la transacción"}
          multiline
          rows={2}
          required
        />

        {/* Notas */}
        <TextField
          fullWidth
          label="Notas Adicionales"
          name="notes"
          value={formData.notes}
          onChange={handleInputChange}
          disabled={loading}
          error={!!errors.notes}
          helperText={errors.notes || "Notas adicionales sobre la transacción (opcional)"}
          multiline
          rows={3}
        />

        {/* Tags */}
        <Box>
          <TextField
            fullWidth
            label="Etiquetas"
            name="tags"
            value={formData.tags}
            onChange={handleInputChange}
            disabled={loading}
            error={!!errors.tags}
            helperText={errors.tags || "Etiquetas separadas por comas (ej: trabajo, proyecto, personal)"}
          />
          {formData.tags && (
            <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {formData.tags.split(',').filter(tag => tag.trim()).map((tag, index) => (
                <Chip 
                  key={index} 
                  label={tag.trim()} 
                  size="small" 
                  variant="outlined"
                  color="primary"
                  sx={{ fontSize: '0.75rem' }}
                />
              ))}
            </Box>
          )}
        </Box>
      </Box>

      {/* Preview del monto */}
      {formData.amount && !errors.amount && (
        <Paper sx={{ p: 2, mt: 3, bgcolor: 'primary.50', border: '1px solid', borderColor: 'primary.200' }}>
          <Typography variant="body1" color="primary.main" sx={{ fontWeight: 600 }}>
            Monto: {formatCurrency(parseFloat(formData.amount) || 0)}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Tipo: {TRANSACTION_TYPE_LABELS[formData.transaction_type]} • 
            Categoría: {TRANSACTION_CATEGORY_LABELS[formData.category]}
          </Typography>
        </Paper>
      )}

      {/* Botones de acción */}
      <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 4 }}>
        <Button
          onClick={onCancel}
          variant="outlined"
          disabled={loading}
          startIcon={<CancelIcon />}
          size="large"
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          variant="contained"
          disabled={loading}
          startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
          size="large"
        >
          {loading ? 'Guardando...' : (isEditing ? 'Actualizar' : 'Crear')} Transacción
        </Button>
      </Box>
    </Box>
  );
};
