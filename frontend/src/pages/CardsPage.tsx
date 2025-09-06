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
  useTheme,
  Skeleton,
  Alert,
  Fab,
  Stack,
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
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { AppLayout } from '../components/layout';
import { useCards, useDeleteCard } from '../hooks/useCards';
import { Card as CardType, CardNetwork } from '../types/card';

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

const CARD_STATUS_COLORS = {
  active: 'success',
  blocked: 'error',
  expired: 'error',
  cancelled: 'default',
  pending: 'warning',
} as const;

const CARD_STATUS_LABELS = {
  active: 'Activa',
  blocked: 'Bloqueada',
  expired: 'Vencida',
  cancelled: 'Cancelada',
  pending: 'Pendiente',
};

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

  const formatCardNumber = (digits: string) => {
    return `**** **** **** ${digits}`;
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

          <Typography
            variant="body2"
            fontFamily="monospace"
            sx={{ mb: 2, letterSpacing: 1 }}
          >
            {formatCardNumber(card.last_four_digits)}
          </Typography>

          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="body2" color="text.secondary">
              Vence: {String(card.expiry_month).padStart(2, '0')}/{card.expiry_year}
            </Typography>
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
  const theme = useTheme();
  const { data: cardsData, isLoading, error } = useCards();
  const deleteCardMutation = useDeleteCard();

  // Dialog states
  const [selectedCard, setSelectedCard] = useState<CardType | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  const handleEdit = (card: CardType) => {
    setSelectedCard(card);
    // TODO: Open edit dialog
  };

  const handleDelete = (card: CardType) => {
    setSelectedCard(card);
    setDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = () => {
    if (selectedCard) {
      deleteCardMutation.mutate(selectedCard.card_id);
      setDeleteConfirmOpen(false);
      setSelectedCard(null);
    }
  };

  const handleAddTransaction = (card: CardType) => {
    setSelectedCard(card);
    // TODO: Open transaction dialog
  };

  const handleMakePayment = (card: CardType) => {
    setSelectedCard(card);
    // TODO: Open payment dialog
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
            onClick={() => {/* TODO: Open create dialog */}}
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
              onClick={() => {/* TODO: Open create dialog */}}
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
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onAddTransaction={handleAddTransaction}
                  onMakePayment={handleMakePayment}
                />
              ))}
            </AnimatePresence>
          </Stack>
        )}

        {/* Floating Action Button */}
        <Fab
          color="primary"
          onClick={() => {/* TODO: Open create dialog */}}
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
          open={deleteConfirmOpen}
          onClose={() => setDeleteConfirmOpen(false)}
          maxWidth="sm"
          fullWidth
        >
          <CardContent>
            <Typography variant="h6" gutterBottom>
              ¿Eliminar tarjeta?
            </Typography>
            <Typography variant="body1" color="text.secondary" mb={3}>
              Esta acción no se puede deshacer. Se eliminará la tarjeta{' '}
              <strong>{selectedCard?.name}</strong> permanentemente.
            </Typography>
            <Box display="flex" gap={2} justifyContent="flex-end">
              <Button onClick={() => setDeleteConfirmOpen(false)}>
                Cancelar
              </Button>
              <Button
                variant="contained"
                color="error"
                onClick={handleConfirmDelete}
                disabled={deleteCardMutation.isPending}
              >
                {deleteCardMutation.isPending ? 'Eliminando...' : 'Eliminar'}
              </Button>
            </Box>
          </CardContent>
        </Dialog>
      </Box>
    </AppLayout>
  );
};

export default CardsPage;
