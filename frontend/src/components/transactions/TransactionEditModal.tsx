import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Box,
  Chip,
  InputAdornment,
} from '@mui/material';
import { Transaction, TransactionCategory } from '../../types/transaction';

interface TransactionEditModalProps {
  open: boolean;
  transaction: Transaction | null;
  onClose: () => void;
  onSave: (transactionId: string, updateData: Partial<Transaction>) => Promise<void>;
}

// Categorías disponibles por tipo de transacción
const INCOME_CATEGORIES: TransactionCategory[] = [
  'salary',
  'freelance',
  'business_income',
  'investment_gains',
  'rental_income',
  'gifts_received',
  'refunds',
  'other_income',
];

const EXPENSE_CATEGORIES: TransactionCategory[] = [
  'food_drinks',
  'transportation',
  'shopping',
  'entertainment',
  'bills_utilities',
  'healthcare',
  'education',
  'travel',
  'insurance',
  'taxes',
  'rent_mortgage',
  'groceries',
  'restaurants',
  'gas_fuel',
  'clothing',
  'electronics',
  'subscriptions',
  'gifts_donations',
  'bank_fees',
  'other_expenses',
];

const TRANSFER_CATEGORIES: TransactionCategory[] = [
  'account_transfer',
  'investment',
  'savings',
  'debt_payment',
  'other_transfer',
];

const CATEGORY_LABELS: { [key in TransactionCategory]: string } = {
  // Income categories
  salary: '💰 Salario',
  freelance: '💼 Freelance',
  business_income: '🏢 Ingresos de Negocio',
  investment_gains: '📈 Ganancias de Inversión',
  rental_income: '🏠 Ingresos por Renta',
  gifts_received: '🎁 Regalos Recibidos',
  refunds: '↩️ Reembolsos',
  other_income: '💵 Otros Ingresos',
  
  // Expense categories
  food_drinks: '🍔 Comida y Bebidas',
  transportation: '🚗 Transporte',
  shopping: '🛍️ Compras',
  entertainment: '🎬 Entretenimiento',
  bills_utilities: '💡 Servicios y Facturas',
  healthcare: '🏥 Salud',
  education: '📚 Educación',
  travel: '✈️ Viajes',
  insurance: '�️ Seguros',
  taxes: '📋 Impuestos',
  rent_mortgage: '🏘️ Renta/Hipoteca',
  groceries: '🛒 Supermercado',
  restaurants: '🍽️ Restaurantes',
  gas_fuel: '⛽ Gasolina',
  clothing: '👕 Ropa',
  electronics: '📱 Electrónicos',
  subscriptions: '📺 Suscripciones',
  gifts_donations: '🎁 Regalos y Donaciones',
  bank_fees: '🏦 Comisiones Bancarias',
  other_expenses: '💸 Otros Gastos',
  
  // Transfer categories
  account_transfer: '🔄 Transferencia entre Cuentas',
  investment: '📊 Inversión',
  savings: '🐷 Ahorros',
  debt_payment: '💳 Pago de Deudas',
  other_transfer: '↔️ Otras Transferencias',
};

export const TransactionEditModal: React.FC<TransactionEditModalProps> = ({
  open,
  transaction,
  onClose,
  onSave,
}) => {
  const [formData, setFormData] = useState({
    description: '',
    category: '' as TransactionCategory,
    notes: '',
    reference_number: '',
    location: '',
    tags: [] as string[],
  });
  const [tagInput, setTagInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize form with transaction data
  useEffect(() => {
    if (transaction) {
      setFormData({
        description: transaction.description || '',
        category: transaction.category,
        notes: transaction.notes || '',
        reference_number: transaction.reference_number || '',
        location: transaction.location || '',
        tags: transaction.tags || [],
      });
    }
  }, [transaction]);

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setError(null);
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData((prev) => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()],
      }));
      setTagInput('');
    }
  };

  const handleDeleteTag = (tagToDelete: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((tag) => tag !== tagToDelete),
    }));
  };

  const handleSubmit = async () => {
    if (!transaction) return;

    // Validate required fields
    if (!formData.description.trim()) {
      setError('La descripción es obligatoria');
      return;
    }

    try {
      setSaving(true);
      setError(null);

      // Prepare update data (only send changed fields)
      const updateData: Partial<Transaction> = {};
      
      if (formData.description !== transaction.description) {
        updateData.description = formData.description;
      }
      if (formData.category !== transaction.category) {
        updateData.category = formData.category;
      }
      if (formData.notes !== transaction.notes) {
        updateData.notes = formData.notes || undefined;
      }
      if (formData.reference_number !== transaction.reference_number) {
        updateData.reference_number = formData.reference_number || undefined;
      }
      if (formData.location !== transaction.location) {
        updateData.location = formData.location || undefined;
      }
      if (JSON.stringify(formData.tags) !== JSON.stringify(transaction.tags)) {
        updateData.tags = formData.tags.length > 0 ? formData.tags : undefined;
      }

      // Only call API if there are changes
      if (Object.keys(updateData).length === 0) {
        onClose();
        return;
      }

      await onSave(transaction.transaction_id, updateData);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error al actualizar la transacción');
    } finally {
      setSaving(false);
    }
  };

  if (!transaction) return null;

  // Determinar las categorías disponibles según el tipo de transacción
  const getAvailableCategories = (): TransactionCategory[] => {
    const type = transaction.transaction_type;
    if (type === 'income' || type === 'salary' || type === 'bonus' || type === 'dividend') {
      return INCOME_CATEGORIES;
    } else if (type === 'expense' || type === 'fee') {
      return EXPENSE_CATEGORIES;
    } else if (type === 'transfer' || type === 'investment') {
      return TRANSFER_CATEGORIES;
    }
    // Default para tipos que no encajan claramente
    return [...INCOME_CATEGORIES, ...EXPENSE_CATEGORIES, ...TRANSFER_CATEGORIES];
  };

  const availableCategories = getAvailableCategories();

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        Editar Transacción
        <Box sx={{ fontSize: '0.875rem', color: 'text.secondary', mt: 0.5 }}>
          {transaction.transaction_type === 'income' ? '💰 Ingreso' : 
           transaction.transaction_type === 'expense' ? '💸 Gasto' : 
           '🔄 Transferencia'} • {new Date(transaction.transaction_date).toLocaleDateString('es-MX')}
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {error && (
            <Box
              sx={{
                p: 2,
                bgcolor: 'error.light',
                color: 'error.dark',
                borderRadius: 1,
                fontSize: '0.875rem',
              }}
            >
              {error}
            </Box>
          )}

          {/* Description */}
          <TextField
            label="Descripción"
            value={formData.description}
            onChange={(e) => handleChange('description', e.target.value)}
            fullWidth
            required
            autoFocus
            helperText="Descripción breve de la transacción"
          />

          {/* Category */}
          <FormControl fullWidth required>
            <InputLabel>Categoría</InputLabel>
            <Select
              value={formData.category}
              onChange={(e) => handleChange('category', e.target.value)}
              label="Categoría"
            >
              {availableCategories.map((cat: TransactionCategory) => (
                <MenuItem key={cat} value={cat}>
                  {CATEGORY_LABELS[cat]}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Notes */}
          <TextField
            label="Notas"
            value={formData.notes}
            onChange={(e) => handleChange('notes', e.target.value)}
            fullWidth
            multiline
            rows={3}
            helperText="Información adicional sobre la transacción"
          />

          {/* Reference Number */}
          <TextField
            label="Número de Referencia"
            value={formData.reference_number}
            onChange={(e) => handleChange('reference_number', e.target.value)}
            fullWidth
            helperText="Número de referencia o folio"
          />

          {/* Location */}
          <TextField
            label="Ubicación"
            value={formData.location}
            onChange={(e) => handleChange('location', e.target.value)}
            fullWidth
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">📍</InputAdornment>
              ),
            }}
            helperText="Lugar donde se realizó la transacción"
          />

          {/* Tags */}
          <Box>
            <TextField
              label="Etiquetas"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddTag();
                }
              }}
              fullWidth
              helperText="Presiona Enter para agregar una etiqueta"
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <Button
                      size="small"
                      onClick={handleAddTag}
                      disabled={!tagInput.trim()}
                    >
                      Agregar
                    </Button>
                  </InputAdornment>
                ),
              }}
            />
            {formData.tags.length > 0 && (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                {formData.tags.map((tag) => (
                  <Chip
                    key={tag}
                    label={tag}
                    onDelete={() => handleDeleteTag(tag)}
                    size="small"
                    color="primary"
                    variant="outlined"
                  />
                ))}
              </Box>
            )}
          </Box>

          {/* Read-only information */}
          <Box
            sx={{
              p: 2,
              bgcolor: 'grey.100',
              borderRadius: 1,
              fontSize: '0.875rem',
            }}
          >
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 }}>
              <Box>
                <Box sx={{ fontWeight: 'bold', color: 'text.secondary' }}>Monto:</Box>
                <Box>{new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(Math.abs(transaction.amount))}</Box>
              </Box>
              <Box>
                <Box sx={{ fontWeight: 'bold', color: 'text.secondary' }}>Cuenta:</Box>
                <Box sx={{ fontSize: '0.75rem' }}>{transaction.account_id}</Box>
              </Box>
            </Box>
          </Box>
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={saving}>
          Cancelar
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={saving || !formData.description.trim()}
        >
          {saving ? 'Guardando...' : 'Guardar Cambios'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default TransactionEditModal;
