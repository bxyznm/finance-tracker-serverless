import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem as SelectItem,
  useTheme,
  Skeleton,
  Alert,
  Fab,
  Stack,
  CircularProgress,
  InputAdornment,
} from '@mui/material';
import {
  Add as AddIcon,
  CreditCard as CreditCardIcon,
  MoreVert as MoreVertIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Payment as PaymentIcon,
  TrendingDown as DebtIcon,
  AccountBalance as BalanceIcon,
  Close as CloseIcon,
  Save as SaveIcon,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { AppLayout } from '../components/layout';
import { useCards, useDeleteCard, useCreateCard, useUpdateCard } from '../hooks/useCards';
import { Card as CardType, CardNetwork, CardType as CardTypeEnum, CardStatus, CreateCardRequest, UpdateCardRequest } from '../types/card';

// Card network icons/colors
const CARD_NETWORK_CONFIG: Record<CardNetwork, { color: string; icon: string }> = {
  visa: { color: '#1A1F71', icon: '💳' },
  mastercard: { color: '#EB001B', icon: '💳' },
  amex: { color: '#006FCF', icon: '💳' },
  discover: { color: '#FF6000', icon: '💳' },
  jcb: { color: '#006FCF', icon: '💳' },
  unionpay: { color: '#E21836', icon: '💳' },
  diners: { color: '#0079BE', icon: '💳' },
  other: { color: '#666666', icon: '💳' },
};

// Card type labels
const CARD_TYPE_LABELS = {
  credit: 'Crédito',
  debit: 'Débito',
  prepaid: 'Prepagada',
  business: 'Empresarial',
  rewards: 'Recompensas',
  store: 'Tienda',
  other: 'Otra',
};

const CARD_NETWORK_LABELS = {
  visa: 'Visa',
  mastercard: 'Mastercard',
  amex: 'American Express',
  discover: 'Discover',
  jcb: 'JCB',
  unionpay: 'UnionPay',
  diners: 'Diners Club',
  other: 'Otra',
};

const CARD_STATUS_LABELS = {
  active: 'Activa',
  blocked: 'Bloqueada',
  expired: 'Vencida',
  cancelled: 'Cancelada',
  pending: 'Pendiente',
};

// Dialog types
type DialogState = 
  | { type: null }
  | { type: 'create' }
  | { type: 'edit'; card: CardType }
  | { type: 'delete'; card: CardType }
  | { type: 'transaction'; card: CardType }
  | { type: 'payment'; card: CardType };

const CARD_STATUS_COLORS = {
  active: 'success',
  blocked: 'error',
  expired: 'error',
  cancelled: 'default',
  pending: 'warning',
} as const;

interface CardMenuProps {
  card: CardType;
  onEdit: (card: CardType) => void;
  onDelete: (card: CardType) => void;
  onAddTransaction: (card: CardType) => void;
  onMakePayment: (card: CardType) => void;
}

const CardMenu: React.FC<CardMenuProps> = ({
  card,
  onEdit,
  onDelete,
  onAddTransaction,
  onMakePayment,
}) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  return (
    <>
      <IconButton onClick={handleClick} size="small">
        <MoreVertIcon />
      </IconButton>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <MenuItem
          onClick={() => {
            onEdit(card);
            handleClose();
          }}
        >
          <EditIcon sx={{ mr: 1, fontSize: 20 }} />
          Editar
        </MenuItem>
        <MenuItem
          onClick={() => {
            onAddTransaction(card);
            handleClose();
          }}
        >
          <CreditCardIcon sx={{ mr: 1, fontSize: 20 }} />
          Agregar Transacción
        </MenuItem>
        <MenuItem
          onClick={() => {
            onMakePayment(card);
            handleClose();
          }}
        >
          <PaymentIcon sx={{ mr: 1, fontSize: 20 }} />
          Hacer Pago
        </MenuItem>
        <MenuItem
          onClick={() => {
            onDelete(card);
            handleClose();
          }}
          sx={{ color: 'error.main' }}
        >
          <DeleteIcon sx={{ mr: 1, fontSize: 20 }} />
          Eliminar
        </MenuItem>
      </Menu>
    </>
  );
};

interface CardItemProps {
  card: CardType;
  onEdit: (card: CardType) => void;
  onDelete: (card: CardType) => void;
  onAddTransaction: (card: CardType) => void;
  onMakePayment: (card: CardType) => void;
}

const CardItem: React.FC<CardItemProps> = ({
  card,
  onEdit,
  onDelete,
  onAddTransaction,
  onMakePayment,
}) => {
  const theme = useTheme();
  const networkConfig = CARD_NETWORK_CONFIG[card.card_network] || CARD_NETWORK_CONFIG.other;
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: card.currency,
    }).format(amount);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.2 }}
      style={{ width: '100%', marginBottom: 16 }}
    >
      <Card
        sx={{
          background: card.color 
            ? `linear-gradient(135deg, ${card.color}20, ${card.color}10)`
            : `linear-gradient(135deg, ${networkConfig.color}20, ${networkConfig.color}10)`,
          border: `1px solid ${card.color || networkConfig.color}40`,
          position: 'relative',
          '&:hover': {
            transform: 'translateY(-4px)',
            transition: 'transform 0.2s ease-in-out',
            boxShadow: theme.shadows[8],
          },
        }}
      >
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
            <Box>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                {card.name}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {card.bank_name} • {CARD_TYPE_LABELS[card.card_type]}
              </Typography>
            </Box>
            <CardMenu
              card={card}
              onEdit={onEdit}
              onDelete={onDelete}
              onAddTransaction={onAddTransaction}
              onMakePayment={onMakePayment}
            />
          </Box>

          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Box>
              {card.cut_off_date && (
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Corte: Día {card.cut_off_date}
                </Typography>
              )}
              {card.payment_due_date && (
                <Typography variant="body2" color="text.secondary">
                  Pago: Día {card.payment_due_date}
                </Typography>
              )}
            </Box>
            <Chip
              label={CARD_STATUS_LABELS[card.status]}
              color={CARD_STATUS_COLORS[card.status]}
              size="small"
            />
          </Box>

          <Box mb={2}>
            <Typography variant="h5" fontWeight="bold" color="primary.main">
              {formatCurrency(card.current_balance)}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Saldo actual
            </Typography>
          </Box>

          {card.credit_limit && (
            <Box mb={2}>
              <Typography variant="body2" color="text.secondary">
                Límite: {formatCurrency(card.credit_limit)}
              </Typography>
              <Typography variant="body2" color="success.main">
                Disponible: {formatCurrency(card.available_credit || 0)}
              </Typography>
            </Box>
          )}

          {card.days_until_due !== undefined && card.days_until_due <= 7 && (
            <Alert severity="warning" sx={{ mt: 1 }}>
              Pago vence en {card.days_until_due} días
            </Alert>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

const CardsPage: React.FC = () => {
  const { data: cardsData, isLoading, error } = useCards();
  const deleteCardMutation = useDeleteCard();
  const createCardMutation = useCreateCard();
  const updateCardMutation = useUpdateCard();

  // Dialog states
  const [dialogState, setDialogState] = useState<DialogState>({ type: null });
  
  // Form states for create card
  const [createForm, setCreateForm] = useState<CreateCardRequest>({
    name: '',
    card_type: 'credit',
    card_network: 'visa',
    bank_name: '',
    credit_limit: 0,
    current_balance: 0,
    payment_due_date: 15, // Día 15 por defecto
    cut_off_date: 1,      // Día 1 por defecto
    status: 'active',
  });

  // Form states for edit card
  const [editForm, setEditForm] = useState<UpdateCardRequest>({
    name: '',
    bank_name: '',
    credit_limit: 0,
    payment_due_date: 15,
    status: 'active',
  });

  const resetCreateForm = () => {
    setCreateForm({
      name: '',
      card_type: 'credit',
      card_network: 'visa',
      bank_name: '',
      credit_limit: 0,
      current_balance: 0,
      payment_due_date: 15,
      cut_off_date: 1,
      status: 'active',
    });
  };

  // Dialog handlers
  const openCreateDialog = () => {
    resetCreateForm();
    setDialogState({ type: 'create' });
  };

  const openEditDialog = (card: CardType) => {
    setEditForm({
      name: card.name,
      bank_name: card.bank_name,
      credit_limit: card.credit_limit,
      minimum_payment: card.minimum_payment,
      payment_due_date: card.payment_due_date,
      apr: card.apr,
      annual_fee: card.annual_fee,
      rewards_program: card.rewards_program,
      color: card.color,
      description: card.description,
      status: card.status,
    });
    setDialogState({ type: 'edit', card });
  };

  const openDeleteDialog = (card: CardType) => {
    setDialogState({ type: 'delete', card });
  };

  const openTransactionDialog = (card: CardType) => {
    setDialogState({ type: 'transaction', card });
  };

  const openPaymentDialog = (card: CardType) => {
    setDialogState({ type: 'payment', card });
  };

  const closeDialog = () => {
    setDialogState({ type: null });
  };

  // Form handlers
  const handleCreateSubmit = () => {
    if (!createForm.name.trim() || !createForm.bank_name.trim()) {
      return;
    }
    
    createCardMutation.mutate(createForm, {
      onSuccess: () => {
        closeDialog();
        resetCreateForm();
      }
    });
  };

  const handleEditSubmit = () => {
    if (dialogState.type !== 'edit') return;
    
    if (!editForm.name?.trim() || !editForm.bank_name?.trim()) {
      return;
    }
    
    updateCardMutation.mutate(
      { cardId: dialogState.card.card_id, cardData: editForm },
      {
        onSuccess: () => {
          closeDialog();
        }
      }
    );
  };

  const handleDeleteConfirm = () => {
    if (dialogState.type === 'delete') {
      deleteCardMutation.mutate(dialogState.card.card_id, {
        onSuccess: () => closeDialog()
      });
    }
  };

  const totalDebt = cardsData?.total_debt_by_currency?.MXN || 0;
  const totalCredit = cardsData?.total_available_credit?.MXN || 0;

  if (error) {
    return (
      <AppLayout>
        <Alert severity="error">
          Error al cargar las tarjetas: {(error as any).message}
        </Alert>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <Box sx={{ p: 3 }}>
        {/* Header */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
          <Box>
            <Typography variant="h4" fontWeight="bold" gutterBottom>
              Mis Tarjetas
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Gestiona tus tarjetas de crédito y débito
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={openCreateDialog}
            sx={{ borderRadius: 2 }}
          >
            Nueva Tarjeta
          </Button>
        </Box>

        {/* Summary Cards */}
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} mb={4}>
          <Card sx={{ flex: 1 }}>
            <CardContent>
              <Box display="flex" alignItems="center" mb={1}>
                <CreditCardIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Total Tarjetas</Typography>
              </Box>
              {isLoading ? (
                <Skeleton width="60%" height={32} />
              ) : (
                <Typography variant="h4" fontWeight="bold">
                  {cardsData?.total_count || 0}
                </Typography>
              )}
              <Typography variant="body2" color="text.secondary">
                {cardsData?.active_count || 0} activas
              </Typography>
            </CardContent>
          </Card>

          <Card sx={{ flex: 1 }}>
            <CardContent>
              <Box display="flex" alignItems="center" mb={1}>
                <DebtIcon color="error" sx={{ mr: 1 }} />
                <Typography variant="h6">Deuda Total</Typography>
              </Box>
              {isLoading ? (
                <Skeleton width="80%" height={32} />
              ) : (
                <Typography variant="h4" fontWeight="bold" color="error.main">
                  ${totalDebt.toFixed(2)}
                </Typography>
              )}
              <Typography variant="body2" color="text.secondary">
                MXN
              </Typography>
            </CardContent>
          </Card>

          <Card sx={{ flex: 1 }}>
            <CardContent>
              <Box display="flex" alignItems="center" mb={1}>
                <BalanceIcon color="success" sx={{ mr: 1 }} />
                <Typography variant="h6">Crédito Disponible</Typography>
              </Box>
              {isLoading ? (
                <Skeleton width="80%" height={32} />
              ) : (
                <Typography variant="h4" fontWeight="bold" color="success.main">
                  ${totalCredit.toFixed(2)}
                </Typography>
              )}
              <Typography variant="body2" color="text.secondary">
                MXN
              </Typography>
            </CardContent>
          </Card>
        </Stack>

        {/* Cards List */}
        {isLoading ? (
          <Stack spacing={2}>
            {Array.from({ length: 3 }).map((_, index) => (
              <Card key={index}>
                <CardContent>
                  <Skeleton variant="text" width="60%" height={32} />
                  <Skeleton variant="text" width="40%" height={24} />
                  <Skeleton variant="text" width="80%" height={24} />
                  <Box mt={2}>
                    <Skeleton variant="text" width="50%" height={40} />
                  </Box>
                </CardContent>
              </Card>
            ))}
          </Stack>
        ) : cardsData?.cards.length === 0 ? (
          <Box
            display="flex"
            flexDirection="column"
            alignItems="center"
            justifyContent="center"
            py={8}
          >
            <CreditCardIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No tienes tarjetas registradas
            </Typography>
            <Typography variant="body2" color="text.secondary" mb={3}>
              Agrega tu primera tarjeta para comenzar a gestionar tus finanzas
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={openCreateDialog}
            >
              Agregar Primera Tarjeta
            </Button>
          </Box>
        ) : (
          <Stack spacing={2}>
            <AnimatePresence>
              {cardsData?.cards.map((card) => (
                <CardItem
                  key={card.card_id}
                  card={card}
                  onEdit={openEditDialog}
                  onDelete={openDeleteDialog}
                  onAddTransaction={openTransactionDialog}
                  onMakePayment={openPaymentDialog}
                />
              ))}
            </AnimatePresence>
          </Stack>
        )}

        {/* Floating Action Button */}
        <Fab
          color="primary"
          onClick={openCreateDialog}
          sx={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            zIndex: 1000,
            display: { xs: 'flex', md: 'none' }, // Only show on mobile
          }}
        >
          <AddIcon />
        </Fab>

        {/* Delete Confirmation Dialog */}
        <Dialog
          open={dialogState.type === 'delete'}
          onClose={closeDialog}
          maxWidth="xs"
          fullWidth
        >
          <DialogTitle>
            <Box display="flex" alignItems="center" gap={1}>
              <DeleteIcon color="error" />
              <Typography variant="h6" fontWeight="bold">
                ¿Eliminar tarjeta?
              </Typography>
            </Box>
          </DialogTitle>
          <DialogContent>
            <Alert severity="warning" sx={{ mb: 2 }}>
              Esta acción no se puede deshacer
            </Alert>
            <Typography variant="body1" color="text.secondary">
              Estás a punto de eliminar la tarjeta:{' '}
              <strong>{dialogState.type === 'delete' ? dialogState.card.name : ''}</strong>
              {dialogState.type === 'delete' && dialogState.card.bank_name && (
                <> de <strong>{dialogState.card.bank_name}</strong></>
              )}
            </Typography>
            {dialogState.type === 'delete' && dialogState.card.current_balance > 0 && (
              <Alert severity="info" sx={{ mt: 2 }}>
                Saldo actual: ${dialogState.card.current_balance.toFixed(2)} {dialogState.card.currency}
              </Alert>
            )}
          </DialogContent>
          <DialogActions sx={{ p: 2.5, gap: 1 }}>
            <Button 
              onClick={closeDialog}
              variant="outlined"
              disabled={deleteCardMutation.isPending}
            >
              Cancelar
            </Button>
            <Button
              variant="contained"
              color="error"
              onClick={handleDeleteConfirm}
              disabled={deleteCardMutation.isPending}
              startIcon={deleteCardMutation.isPending ? <CircularProgress size={16} /> : <DeleteIcon />}
            >
              {deleteCardMutation.isPending ? 'Eliminando...' : 'Sí, eliminar'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Create Card Dialog */}
        <Dialog
          open={dialogState.type === 'create'}
          onClose={closeDialog}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            Nueva Tarjeta
            <IconButton
              onClick={closeDialog}
              sx={{
                position: 'absolute',
                right: 8,
                top: 8,
              }}
            >
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          <DialogContent>
            <Stack spacing={3} sx={{ mt: 1 }}>
              <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                <TextField
                  label="Nombre de la tarjeta"
                  value={createForm.name}
                  onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                  fullWidth
                  required
                  placeholder="Ej: Tarjeta Principal"
                />
                <TextField
                  label="Banco"
                  value={createForm.bank_name}
                  onChange={(e) => setCreateForm({ ...createForm, bank_name: e.target.value })}
                  fullWidth
                  required
                  placeholder="Ej: BBVA"
                />
              </Stack>
              
              <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                <FormControl fullWidth>
                  <InputLabel>Tipo de tarjeta</InputLabel>
                  <Select
                    value={createForm.card_type}
                    label="Tipo de tarjeta"
                    onChange={(e) => setCreateForm({ ...createForm, card_type: e.target.value as CardTypeEnum })}
                  >
                    {Object.entries(CARD_TYPE_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </Select>
                </FormControl>
                <FormControl fullWidth>
                  <InputLabel>Red de la tarjeta</InputLabel>
                  <Select
                    value={createForm.card_network}
                    label="Red de la tarjeta"
                    onChange={(e) => setCreateForm({ ...createForm, card_network: e.target.value as CardNetwork })}
                  >
                    {Object.entries(CARD_NETWORK_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </Select>
                </FormControl>
              </Stack>

              <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                <TextField
                  label="Fecha de corte (día del mes)"
                  type="number"
                  value={createForm.cut_off_date || 1}
                  onChange={(e) => setCreateForm({ ...createForm, cut_off_date: parseInt(e.target.value) || 1 })}
                  fullWidth
                  inputProps={{ min: 1, max: 31 }}
                  helperText="Día del mes cuando se genera el estado de cuenta"
                />
                <TextField
                  label="Fecha de pago (día del mes)"
                  type="number"
                  value={createForm.payment_due_date || 15}
                  onChange={(e) => setCreateForm({ ...createForm, payment_due_date: parseInt(e.target.value) || 15 })}
                  fullWidth
                  inputProps={{ min: 1, max: 31 }}
                  helperText="Día límite para realizar el pago"
                />
              </Stack>
              
              {createForm.card_type === 'credit' && (
                <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                  <TextField
                    label="Límite de crédito"
                    type="number"
                    value={createForm.credit_limit}
                    onChange={(e) => setCreateForm({ ...createForm, credit_limit: parseFloat(e.target.value) || 0 })}
                    fullWidth
                    InputProps={{
                      startAdornment: <InputAdornment position="start">$</InputAdornment>,
                    }}
                  />
                  <TextField
                    label="Saldo actual"
                    type="number"
                    value={createForm.current_balance}
                    onChange={(e) => setCreateForm({ ...createForm, current_balance: parseFloat(e.target.value) || 0 })}
                    fullWidth
                    InputProps={{
                      startAdornment: <InputAdornment position="start">$</InputAdornment>,
                    }}
                  />
                </Stack>
              )}
              
              <TextField
                label="Descripción (opcional)"
                value={createForm.description || ''}
                onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                fullWidth
                multiline
                rows={2}
                placeholder="Información adicional sobre la tarjeta"
              />
            </Stack>
          </DialogContent>
          <DialogActions sx={{ p: 3 }}>
            <Button onClick={closeDialog}>
              Cancelar
            </Button>
            <Button
              variant="contained"
              onClick={handleCreateSubmit}
              disabled={createCardMutation.isPending}
              startIcon={<SaveIcon />}
            >
              {createCardMutation.isPending ? (
                <Box display="flex" alignItems="center" gap={1}>
                  <CircularProgress size={16} />
                  Creando...
                </Box>
              ) : (
                'Crear Tarjeta'
              )}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Edit Card Dialog - Simplified */}
        <Dialog
          open={dialogState.type === 'edit'}
          onClose={closeDialog}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Typography variant="h6" fontWeight="bold">
                Editar Tarjeta
              </Typography>
              <IconButton onClick={closeDialog} size="small">
                <CloseIcon />
              </IconButton>
            </Box>
          </DialogTitle>
          <DialogContent>
            <Stack spacing={2.5} sx={{ mt: 2 }}>
              {/* Nombre y Banco */}
              <TextField
                label="Nombre de la tarjeta"
                value={editForm.name || ''}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                fullWidth
                required
                placeholder="Ej: Tarjeta Principal"
              />

              <TextField
                label="Banco"
                value={editForm.bank_name || ''}
                onChange={(e) => setEditForm({ ...editForm, bank_name: e.target.value })}
                fullWidth
                required
                placeholder="Ej: BBVA"
              />
              
              {/* Solo para tarjetas de crédito */}
              {dialogState.type === 'edit' && dialogState.card.card_type === 'credit' && (
                <>
                  <TextField
                    label="Límite de crédito"
                    type="number"
                    value={editForm.credit_limit || 0}
                    onChange={(e) => setEditForm({ ...editForm, credit_limit: parseFloat(e.target.value) || 0 })}
                    fullWidth
                    InputProps={{
                      startAdornment: <InputAdornment position="start">$</InputAdornment>,
                    }}
                    helperText="Límite total de la tarjeta"
                  />

                  <TextField
                    label="Día de pago"
                    type="number"
                    value={editForm.payment_due_date || ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      setEditForm({ 
                        ...editForm, 
                        payment_due_date: val ? parseInt(val) : undefined 
                      });
                    }}
                    fullWidth
                    inputProps={{ min: 1, max: 31 }}
                    helperText="Día del mes para realizar el pago (1-31)"
                    placeholder="Ej: 15"
                  />
                </>
              )}

              {/* Estado de la tarjeta */}
              <FormControl fullWidth>
                <InputLabel>Estado</InputLabel>
                <Select
                  value={editForm.status || 'active'}
                  label="Estado"
                  onChange={(e) => setEditForm({ ...editForm, status: e.target.value as CardStatus })}
                >
                  <SelectItem value="active">✅ Activa</SelectItem>
                  <SelectItem value="blocked">🔒 Bloqueada</SelectItem>
                  <SelectItem value="expired">⏰ Vencida</SelectItem>
                  <SelectItem value="cancelled">❌ Cancelada</SelectItem>
                </Select>
              </FormControl>

              {/* Descripción opcional */}
              <TextField
                label="Notas (opcional)"
                value={editForm.description || ''}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                fullWidth
                multiline
                rows={2}
                placeholder="Notas adicionales sobre la tarjeta..."
              />
            </Stack>
          </DialogContent>
          <DialogActions sx={{ p: 2.5, gap: 1 }}>
            <Button 
              onClick={closeDialog}
              variant="outlined"
            >
              Cancelar
            </Button>
            <Button
              variant="contained"
              onClick={handleEditSubmit}
              disabled={updateCardMutation.isPending || !editForm.name?.trim() || !editForm.bank_name?.trim()}
              startIcon={updateCardMutation.isPending ? <CircularProgress size={16} /> : <SaveIcon />}
            >
              {updateCardMutation.isPending ? 'Guardando...' : 'Guardar'}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </AppLayout>
  );
};

export default CardsPage;
