import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  IconButton,
  Avatar,
  Stack,
  Divider,
  Button,
  useTheme,
  alpha,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { Account } from '../../types/account';
import { AccountService } from '../../services/accountService';

interface AccountCardProps {
  account: Account;
  onEdit: (account: Account) => void;
  onDelete: (account: Account) => void;
  onUpdateBalance: (account: Account) => void;
}

/**
 * Componente de tarjeta individual para mostrar información de una cuenta
 * Incluye información principal, balance y acciones disponibles
 */
export const AccountCard: React.FC<AccountCardProps> = ({
  account,
  onEdit,
  onDelete,
  onUpdateBalance,
}) => {
  const theme = useTheme();
  
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

  const getAccountTypeIcon = (type: string) => {
    switch (type) {
      case 'checking':
        return '💳';
      case 'savings':
        return '🏦';
      case 'credit':
        return '💴';
      case 'investment':
        return '📈';
      default:
        return '🏛️';
    }
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
    hover: { 
      y: -4,
      transition: { duration: 0.2 }
    }
  };

  const balanceColor = account.current_balance >= 0 ? theme.palette.success.main : theme.palette.error.main;
  const balanceBackground = alpha(balanceColor, 0.1);

  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      whileHover="hover"
      layout
    >
      <Card
        elevation={2}
        sx={{
          height: '100%',
          borderRadius: 3,
          position: 'relative',
          overflow: 'hidden',
          transition: 'all 0.3s ease-in-out',
          border: `2px solid ${alpha(account.color || theme.palette.primary.main, 0.2)}`,
          '&:hover': {
            borderColor: alpha(account.color || theme.palette.primary.main, 0.5),
            transform: 'none',
            boxShadow: 'none',
          }
        }}
      >

        <CardContent sx={{ p: 3, pl: 4, position: 'relative' }}>
          {/* Header con acciones */}
          <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
            <Box display="flex" alignItems="center" gap={1.5}>
              <Avatar
                sx={{
                  bgcolor: alpha(account.color || theme.palette.primary.main, 0.1),
                  color: account.color || theme.palette.primary.main,
                  width: 40,
                  height: 40,
                }}
              >
                <span style={{ fontSize: '1.2rem' }}>{getAccountTypeIcon(account.account_type)}</span>
              </Avatar>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
                  {account.name}
                </Typography>
                <Chip
                  label={getBankLabel(account.bank_code || '')}
                  size="small"
                  variant="outlined"
                  sx={{
                    fontSize: '0.75rem',
                    height: 20,
                    borderColor: alpha(account.color || theme.palette.primary.main, 0.3),
                    color: account.color || theme.palette.primary.main,
                  }}
                />
              </Box>
            </Box>
            
            <Stack direction="row" spacing={0.5}>
              <IconButton
                size="small"
                onClick={() => onEdit(account)}
                sx={{
                  color: theme.palette.text.secondary,
                  '&:hover': { color: theme.palette.primary.main }
                }}
              >
                <EditIcon fontSize="small" />
              </IconButton>
              <IconButton
                size="small"
                onClick={() => onDelete(account)}
                sx={{
                  color: theme.palette.text.secondary,
                  '&:hover': { color: theme.palette.error.main }
                }}
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Stack>
          </Box>

          {/* Información de la cuenta */}
          <Stack spacing={1.5} mb={2}>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Typography variant="body2" color="text.secondary">
                Tipo:
              </Typography>
              <Chip
                label={getAccountTypeLabel(account.account_type)}
                size="small"
                variant="filled"
                sx={{
                  fontSize: '0.75rem',
                  height: 24,
                  bgcolor: alpha(account.color || theme.palette.primary.main, 0.1),
                  color: account.color || theme.palette.primary.main,
                }}
              />
            </Box>
            
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Typography variant="body2" color="text.secondary">
                Moneda:
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                {account.currency}
              </Typography>
            </Box>

            {account.description && (
              <Box>
                <Typography variant="body2" color="text.secondary" sx={{ 
                  fontStyle: 'italic',
                  fontSize: '0.85rem',
                  lineHeight: 1.4
                }}>
                  "{account.description}"
                </Typography>
              </Box>
            )}
          </Stack>

          <Divider sx={{ my: 2 }} />

          {/* Balance Section */}
          <Box
            sx={{
              p: 2,
              bgcolor: balanceBackground,
              borderRadius: 2,
              border: `1px solid ${alpha(balanceColor, 0.2)}`,
            }}
          >
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
              <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                Balance Actual
              </Typography>
              <Box display="flex" alignItems="center" gap={0.5}>
                {account.current_balance >= 0 ? (
                  <TrendingUpIcon sx={{ color: theme.palette.success.main, fontSize: 16 }} />
                ) : (
                  <TrendingDownIcon sx={{ color: theme.palette.error.main, fontSize: 16 }} />
                )}
              </Box>
            </Box>
            
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Typography 
                variant="h4" 
                sx={{ 
                  color: balanceColor,
                  fontWeight: 600,
                  fontSize: '1.75rem'
                }}
              >
                {AccountService.formatCurrency(account.current_balance, account.currency)}
              </Typography>
              
              <Button
                variant="outlined"
                size="small"
                onClick={() => onUpdateBalance(account)}
                sx={{
                  borderColor: alpha(balanceColor, 0.5),
                  color: balanceColor,
                  '&:hover': {
                    borderColor: balanceColor,
                    bgcolor: alpha(balanceColor, 0.1),
                  }
                }}
              >
                Actualizar
              </Button>
            </Box>
          </Box>

          {/* Fecha de actualización */}
          <Typography 
            variant="caption" 
            color="text.disabled" 
            sx={{ 
              mt: 2,
              display: 'block',
              textAlign: 'center'
            }}
          >
            Actualizado: {new Date(account.updated_at).toLocaleDateString('es-MX', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </Typography>
        </CardContent>
      </Card>
    </motion.div>
  );
};
