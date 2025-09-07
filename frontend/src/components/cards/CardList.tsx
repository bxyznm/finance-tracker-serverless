import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  IconButton,
  LinearProgress,
  Tooltip,
  useTheme,
  Stack,
} from '@mui/material';
import {
  CreditCard as CreditCardIcon,
  MoreVert as MoreVertIcon,
  Warning as WarningIcon,
  TrendingUp as TrendingUpIcon,
  AccountBalance as BalanceIcon,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { Card as CardType } from '../../types/card';

// Card network colors
const NETWORK_COLORS: Record<string, string> = {
  visa: '#1A1F71',
  mastercard: '#EB001B',
  amex: '#006FCF',
  discover: '#FF6000',
  jcb: '#006FCF',
  unionpay: '#E21836',
  diners: '#0079BE',
  other: '#666666',
};

// Card status colors
const STATUS_COLORS: Record<string, 'success' | 'warning' | 'error' | 'info'> = {
  active: 'success',
  blocked: 'error',
  expired: 'error',
  cancelled: 'error',
  pending: 'warning',
};

// Status labels
const STATUS_LABELS: Record<string, string> = {
  active: 'Activa',
  blocked: 'Bloqueada',
  expired: 'Vencida',
  cancelled: 'Cancelada',
  pending: 'Pendiente',
};

interface CardListProps {
  cards: CardType[];
  onCardSelect?: (card: CardType) => void;
  onCardEdit?: (card: CardType) => void;
  onCardDelete?: (card: CardType) => void;
  onAddTransaction?: (card: CardType) => void;
  onMakePayment?: (card: CardType) => void;
  loading?: boolean;
}

const CardList: React.FC<CardListProps> = ({
  cards,
  onCardSelect,
  onCardEdit,
  onCardDelete,
  onAddTransaction,
  onMakePayment,
  loading = false,
}) => {
  const theme = useTheme();

  // Calculate utilization rate
  const getUtilizationRate = (card: CardType) => {
    if (!card.credit_limit || card.credit_limit === 0) return 0;
    return (card.current_balance / card.credit_limit) * 100;
  };

  // Get utilization color
  const getUtilizationColor = (rate: number) => {
    if (rate >= 90) return theme.palette.error.main;
    if (rate >= 70) return theme.palette.warning.main;
    if (rate >= 50) return theme.palette.info.main;
    return theme.palette.success.main;
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  if (loading) {
    return (
      <Stack direction="row" spacing={3} flexWrap="wrap">
        {[1, 2, 3].map((i) => (
          <Box key={i} sx={{ minWidth: 300, flex: '1 1 300px' }}>
            <Card>
              <CardContent>
                <Box sx={{ width: '100%' }}>
                  <LinearProgress />
                </Box>
              </CardContent>
            </Card>
          </Box>
        ))}
      </Stack>
    );
  }

  if (cards.length === 0) {
    return (
      <Card>
        <CardContent sx={{ textAlign: 'center', py: 8 }}>
          <CreditCardIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No tienes tarjetas registradas
          </Typography>
          <Typography color="text.secondary">
            Agrega tu primera tarjeta para comenzar a gestionar tus finanzas
          </Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Stack spacing={3}>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
          gap: 3,
        }}
      >
        {cards.map((card, index) => {
        const utilization = getUtilizationRate(card);
        const utilizationColor = getUtilizationColor(utilization);
        const networkColor = card.color || NETWORK_COLORS[card.card_network] || NETWORK_COLORS.other;

        return (
          <motion.div
            key={card.card_id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card
              sx={{
                cursor: onCardSelect ? 'pointer' : 'default',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: onCardSelect ? 'translateY(-4px)' : 'none',
                  boxShadow: 4,
                },
                background: `linear-gradient(135deg, ${networkColor}15 0%, ${networkColor}08 100%)`,
                border: `1px solid ${networkColor}30`,
              }}
              onClick={() => onCardSelect?.(card)}
            >
              <CardContent>
                {/* Header */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="h6" noWrap title={card.name}>
                      {card.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" noWrap>
                      {card.bank_name}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Chip
                      label={STATUS_LABELS[card.status]}
                      color={STATUS_COLORS[card.status]}
                      size="small"
                    />
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        // Handle menu open
                      }}
                    >
                      <MoreVertIcon />
                    </IconButton>
                  </Box>
                </Box>

                {/* Card Network & Type */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <CreditCardIcon sx={{ color: networkColor, fontSize: 20 }} />
                  <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>
                    {card.card_network} {card.card_type === 'credit' ? 'Crédito' : 'Débito'}
                  </Typography>
                </Box>

                {/* Balance & Credit Info */}
                <Box sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      Balance Actual
                    </Typography>
                    {card.current_balance > 0 && (
                      <Tooltip title="Balance elevado">
                        <WarningIcon sx={{ fontSize: 16, color: 'warning.main' }} />
                      </Tooltip>
                    )}
                  </Box>
                  <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                    {formatCurrency(card.current_balance, card.currency)}
                  </Typography>
                </Box>

                {/* Credit Limit & Available Credit (for credit cards) */}
                {card.card_type === 'credit' && card.credit_limit && (
                  <Box sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        Crédito Disponible
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {utilization.toFixed(1)}%
                      </Typography>
                    </Box>
                    <Typography variant="body2" sx={{ fontWeight: 'medium', mb: 1 }}>
                      {formatCurrency(card.available_credit || 0, card.currency)}
                    </Typography>
                    <LinearProgress
                      variant="determinate"
                      value={Math.min(utilization, 100)}
                      sx={{
                        height: 6,
                        borderRadius: 3,
                        backgroundColor: 'grey.200',
                        '& .MuiLinearProgress-bar': {
                          backgroundColor: utilizationColor,
                        },
                      }}
                    />
                  </Box>
                )}

                {/* Due Date (for credit cards) */}
                {card.card_type === 'credit' && card.days_until_due !== undefined && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <BalanceIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                    <Typography variant="body2" color="text.secondary">
                      {card.days_until_due === 0 
                        ? 'Vence hoy' 
                        : card.days_until_due < 0 
                          ? `Vencido hace ${Math.abs(card.days_until_due)} días`
                          : `Vence en ${card.days_until_due} días`
                      }
                    </Typography>
                  </Box>
                )}

                {/* APR (for credit cards) */}
                {card.card_type === 'credit' && card.apr && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <TrendingUpIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                    <Typography variant="body2" color="text.secondary">
                      APR: {card.apr}%
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          </motion.div>
        );
      })}
      </Box>
    </Stack>
  );
};

export default CardList;
