import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Stack,
  useTheme,
  alpha,
} from '@mui/material';
import {
  CreditCard as CreditCardIcon,
  TrendingDown as DebtIcon,
  AccountBalance as BalanceIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import { CardListResponse } from '../../types/card';

interface CardStatsProps {
  cardData: CardListResponse | undefined;
  loading?: boolean;
}

const CardStats: React.FC<CardStatsProps> = ({ cardData, loading = false }) => {
  const theme = useTheme();

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  if (loading || !cardData) {
    return (
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} sx={{ flex: 1, minWidth: 200 }}>
            <CardContent>
              <Box sx={{ height: 60, background: 'linear-gradient(45deg, #f0f0f0, #e0e0e0)', borderRadius: 1 }} />
            </CardContent>
          </Card>
        ))}
      </Stack>
    );
  }

  const totalDebtMXN = cardData.total_debt_by_currency?.MXN || 0;
  const totalCreditMXN = cardData.total_available_credit?.MXN || 0;
  const totalLimitMXN = totalDebtMXN + totalCreditMXN;
  const utilizationRate = totalLimitMXN > 0 ? (totalDebtMXN / totalLimitMXN) * 100 : 0;

  const stats = [
    {
      title: 'Tarjetas Activas',
      value: cardData.active_count.toString(),
      total: cardData.total_count.toString(),
      icon: <CreditCardIcon />,
      color: theme.palette.primary.main,
      subtitle: `${cardData.total_count} total`,
    },
    {
      title: 'Deuda Total',
      value: formatCurrency(totalDebtMXN, 'MXN'),
      icon: <DebtIcon />,
      color: totalDebtMXN > 50000 ? theme.palette.error.main : theme.palette.warning.main,
      subtitle: 'Pesos mexicanos',
    },
    {
      title: 'Crédito Disponible',
      value: formatCurrency(totalCreditMXN, 'MXN'),
      icon: <BalanceIcon />,
      color: theme.palette.success.main,
      subtitle: 'Disponible',
    },
    {
      title: 'Utilización',
      value: `${utilizationRate.toFixed(1)}%`,
      icon: <WarningIcon />,
      color: utilizationRate > 70 ? theme.palette.error.main : 
             utilizationRate > 50 ? theme.palette.warning.main : 
             theme.palette.success.main,
      subtitle: utilizationRate > 70 ? 'Alto riesgo' : 'Saludable',
    },
  ];

  return (
    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
      {stats.map((stat, index) => (
        <Card 
          key={index} 
          sx={{ 
            flex: 1, 
            minWidth: 200,
            background: `linear-gradient(135deg, ${alpha(stat.color, 0.1)}, ${alpha(stat.color, 0.05)})`,
            border: `1px solid ${alpha(stat.color, 0.2)}`,
          }}
        >
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Box
                sx={{
                  p: 1.5,
                  borderRadius: 2,
                  backgroundColor: alpha(stat.color, 0.1),
                  color: stat.color,
                  mr: 2,
                }}
              >
                {stat.icon}
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                  {stat.title}
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 'bold', color: stat.color }}>
                  {stat.value}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {stat.subtitle}
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      ))}
    </Stack>
  );
};

export default CardStats;
