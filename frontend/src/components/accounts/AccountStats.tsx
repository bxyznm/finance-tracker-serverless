import React, { useMemo } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Avatar,
  useTheme,
  alpha,
  LinearProgress,
  Stack,
  Chip,
} from '@mui/material';
import {
  AccountBalance as AccountBalanceIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Savings as SavingsIcon,
  CreditCard as CreditCardIcon,
  ShowChart as InvestmentIcon,
  AccountBox as CheckingIcon,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { Account } from '../../types/account';
import { AccountService } from '../../services/accountService';

interface AccountStatsProps {
  accounts?: Account[];
  totalBalance?: Record<string, number>;
  totalAccounts: number;
  isLoading: boolean;
}

/**
 * Componente que muestra estadísticas y resumen de las cuentas
 * Incluye balance total, distribución por tipo, y métricas importantes
 */
export const AccountStats: React.FC<AccountStatsProps> = ({
  accounts,
  totalBalance,
  totalAccounts,
  isLoading,
}) => {
  const theme = useTheme();

  // Debug logs
  console.log('AccountStats received:', {
    accounts: accounts?.length || 0,
    totalBalance,
    totalAccounts,
    isLoading
  });

  // Asegurar que totalBalance sea un objeto válido
  const safeTotalBalance = totalBalance || {};
  const safeAccounts = useMemo(() => accounts || [], [accounts]);

  // Calcular estadísticas por tipo de cuenta
  const accountTypeStats = React.useMemo(() => {
    const stats = safeAccounts.reduce((acc, account) => {
      const type = account.account_type;
      if (!acc[type]) {
        acc[type] = { count: 0, balance: 0, accounts: [] };
      }
      acc[type].count += 1;
      acc[type].balance += account.current_balance;
      acc[type].accounts.push(account);
      return acc;
    }, {} as Record<string, { count: number; balance: number; accounts: Account[] }>);

    return stats;
  }, [safeAccounts]);

  // Calcular cuentas con balance positivo vs negativo
  const balanceStats = React.useMemo(() => {
    const positive = safeAccounts.filter(acc => acc.current_balance >= 0).length;
    const negative = safeAccounts.filter(acc => acc.current_balance < 0).length;
    return { positive, negative };
  }, [safeAccounts]);

  const getAccountTypeIcon = (type: string) => {
    switch (type) {
      case 'checking':
        return <CheckingIcon />;
      case 'savings':
        return <SavingsIcon />;
      case 'credit':
        return <CreditCardIcon />;
      case 'investment':
        return <InvestmentIcon />;
      default:
        return <AccountBalanceIcon />;
    }
  };

  const getAccountTypeLabel = (type: string): string => {
    const typeLabels: Record<string, string> = {
      'checking': 'Corriente',
      'savings': 'Ahorro',
      'credit': 'Crédito',
      'investment': 'Inversión',
    };
    return typeLabels[type] || type;
  };

  const getAccountTypeColor = (type: string): string => {
    switch (type) {
      case 'checking':
        return theme.palette.primary.main;
      case 'savings':
        return theme.palette.success.main;
      case 'credit':
        return theme.palette.warning.main;
      case 'investment':
        return theme.palette.info.main;
      default:
        return theme.palette.grey[600];
    }
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  if (isLoading) {
    return (
      <Box mb={4}>
        <Box display="flex" flexWrap="wrap" gap={3}>
          {[1, 2, 3, 4].map((item) => (
            <Box key={item} sx={{ minWidth: 280, flex: '1 1 280px' }}>
              <Card>
                <CardContent>
                  <LinearProgress />
                  <Typography variant="h6" sx={{ mt: 2, opacity: 0.5 }}>
                    Cargando...
                  </Typography>
                </CardContent>
              </Card>
            </Box>
          ))}
        </Box>
      </Box>
    );
  }

  return (
    <Box mb={4}>
      <Box display="flex" flexWrap="wrap" gap={3} mb={3}>
        {/* Total de cuentas */}
        <Box sx={{ minWidth: 280, flex: '1 1 280px' }}>
          <motion.div variants={cardVariants} initial="hidden" animate="visible">
            <Card
              elevation={3}
              sx={{
                borderRadius: 3,
                background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                color: 'white',
              }}
            >
              <CardContent>
                <Box display="flex" alignItems="center" gap={2}>
                  <Avatar sx={{ bgcolor: alpha('#fff', 0.2) }}>
                    <AccountBalanceIcon />
                  </Avatar>
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 600 }}>
                      {totalAccounts}
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.9 }}>
                      Cuentas Totales
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </motion.div>
        </Box>

        {/* Balance total por moneda */}
        {Object.entries(safeTotalBalance).map(([currency, balance], index) => (
          <Box key={currency} sx={{ minWidth: 280, flex: '1 1 280px' }}>
            <motion.div 
              variants={cardVariants} 
              initial="hidden" 
              animate="visible"
              transition={{ delay: 0.1 * (index + 1) }}
            >
              <Card
                elevation={3}
                sx={{
                  borderRadius: 3,
                  background: balance >= 0 
                    ? `linear-gradient(135deg, ${theme.palette.success.main} 0%, ${theme.palette.success.dark} 100%)`
                    : `linear-gradient(135deg, ${theme.palette.error.main} 0%, ${theme.palette.error.dark} 100%)`,
                  color: 'white',
                }}
              >
                <CardContent>
                  <Box display="flex" alignItems="center" gap={2}>
                    <Avatar sx={{ bgcolor: alpha('#fff', 0.2) }}>
                      {balance >= 0 ? <TrendingUpIcon /> : <TrendingDownIcon />}
                    </Avatar>
                    <Box>
                      <Typography variant="h5" sx={{ fontWeight: 600, fontSize: '1.5rem' }}>
                        {AccountService.formatCurrency(balance, currency as any)}
                      </Typography>
                      <Typography variant="body2" sx={{ opacity: 0.9 }}>
                        Balance Total ({currency})
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </motion.div>
          </Box>
        ))}

        {/* Estado de cuentas */}
        <Box sx={{ minWidth: 280, flex: '1 1 280px' }}>
          <motion.div 
            variants={cardVariants} 
            initial="hidden" 
            animate="visible"
            transition={{ delay: 0.3 }}
          >
            <Card elevation={2} sx={{ borderRadius: 3 }}>
              <CardContent>
                <Box display="flex" alignItems="center" gap={2} mb={2}>
                  <Avatar sx={{ bgcolor: theme.palette.info.main }}>
                    <AccountBalanceIcon />
                  </Avatar>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      Estado de Cuentas
                    </Typography>
                  </Box>
                </Box>
                <Stack spacing={1}>
                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Chip
                      label="Positivas"
                      size="small"
                      icon={<TrendingUpIcon />}
                      color="success"
                      variant="outlined"
                    />
                    <Typography variant="h6" color="success.main">
                      {balanceStats.positive}
                    </Typography>
                  </Box>
                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Chip
                      label="Negativas"
                      size="small"
                      icon={<TrendingDownIcon />}
                      color="error"
                      variant="outlined"
                    />
                    <Typography variant="h6" color="error.main">
                      {balanceStats.negative}
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </motion.div>
        </Box>
      </Box>

      {/* Distribución por tipo de cuenta */}
      {Object.keys(accountTypeStats).length > 0 && (
        <Card elevation={2} sx={{ borderRadius: 3 }}>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
              Distribución por Tipo de Cuenta
            </Typography>
            <Box display="flex" flexWrap="wrap" gap={2}>
              {Object.entries(accountTypeStats).map(([type, stats]) => (
                <Box key={type} sx={{ minWidth: 200, flex: '1 1 200px' }}>
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Card
                      variant="outlined"
                      sx={{
                        borderRadius: 2,
                        borderColor: alpha(getAccountTypeColor(type), 0.3),
                        bgcolor: alpha(getAccountTypeColor(type), 0.05),
                        '&:hover': {
                          borderColor: getAccountTypeColor(type),
                          bgcolor: alpha(getAccountTypeColor(type), 0.1),
                        }
                      }}
                    >
                      <CardContent sx={{ textAlign: 'center' }}>
                        <Avatar
                          sx={{
                            bgcolor: getAccountTypeColor(type),
                            mx: 'auto',
                            mb: 2,
                          }}
                        >
                          {getAccountTypeIcon(type)}
                        </Avatar>
                        <Typography variant="h5" sx={{ fontWeight: 600, mb: 1 }}>
                          {stats.count}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                          {getAccountTypeLabel(type)}
                        </Typography>
                        <Typography 
                          variant="body1" 
                          sx={{ 
                            color: stats.balance >= 0 ? 'success.main' : 'error.main',
                            fontWeight: 500
                          }}
                        >
                          {AccountService.formatCurrency(stats.balance, 'MXN')}
                        </Typography>
                      </CardContent>
                    </Card>
                  </motion.div>
                </Box>
              ))}
            </Box>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};
