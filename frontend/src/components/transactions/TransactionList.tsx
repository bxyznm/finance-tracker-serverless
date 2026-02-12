/**
 * Componente para mostrar una lista de transacciones con diseño mejorado y user-friendly
 */

import React, { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  Paper,
  IconButton,
  Chip,
  Box,
  Typography,
  Collapse,
  Grid,
  Tooltip,
  useTheme,
  useMediaQuery,
  Card,
  CardContent,
  Stack,
  Divider,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  ExpandMore as ExpandMoreIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
} from '@mui/icons-material';
import type { Transaction } from '../../types';
import { TRANSACTION_TYPE_LABELS, TRANSACTION_CATEGORY_LABELS } from '../../types/transaction';

type SortableField = 'transaction_date' | 'amount' | 'description' | 'category';
type SortOrder = 'asc' | 'desc';

interface TransactionListProps {
  transactions: Transaction[];
  loading?: boolean;
  onTransactionClick?: (transaction: Transaction) => void;
  onEditTransaction?: (transaction: Transaction) => void;
  onDeleteTransaction?: (transactionId: string) => void;
  onSort?: (field: SortableField, order: SortOrder) => void;
}

export const TransactionList: React.FC<TransactionListProps> = ({
  transactions,
  loading = false,
  onTransactionClick,
  onEditTransaction,
  onDeleteTransaction,
  onSort
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [expandedTransaction, setExpandedTransaction] = useState<string | null>(null);
  const [sortField, setSortField] = useState<SortableField>('transaction_date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(Math.abs(amount));
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    // Si es hoy
    if (diffDays === 0) {
      return `Hoy, ${date.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}`;
    }
    // Si es ayer
    if (diffDays === 1) {
      return `Ayer, ${date.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}`;
    }
    // Si es esta semana
    if (diffDays < 7) {
      return date.toLocaleDateString('es-MX', { 
        weekday: 'long', 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    }
    // Fecha normal
    return date.toLocaleDateString('es-MX', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleSort = (field: SortableField) => {
    const newOrder = sortField === field && sortOrder === 'asc' ? 'desc' : 'asc';
    setSortField(field);
    setSortOrder(newOrder);
    if (onSort) {
      onSort(field, newOrder);
    }
  };

  const getTransactionIcon = (type: string, category: string): string => {
    // Iconos específicos por categoría
    const categoryIcons: Record<string, string> = {
      // Ingresos
      salary: '💰',
      freelance: '💼',
      business_income: '🏢',
      investment_gains: '📈',
      rental_income: '🏠',
      gifts_received: '🎁',
      refunds: '↩️',
      
      // Gastos
      food_drinks: '🍽️',
      transportation: '🚗',
      shopping: '🛍️',
      entertainment: '🎬',
      bills_utilities: '📄',
      healthcare: '🏥',
      education: '📚',
      travel: '✈️',
      insurance: '🛡️',
      taxes: '🏛️',
      rent_mortgage: '🏠',
      groceries: '🛒',
      restaurants: '🍴',
      gas_fuel: '⛽',
      clothing: '👕',
      electronics: '📱',
      subscriptions: '📺',
      gifts_donations: '🎁',
      bank_fees: '🏦',
      
      // Transferencias
      account_transfer: '↔️',
      investment: '💹',
      savings: '🏦',
      debt_payment: '💳',
    };

    return categoryIcons[category] || (type === 'income' ? '💵' : type === 'expense' ? '💸' : '🔄');
  };

  const getTransactionColor = (type: string): { bg: string; text: string; chipColor: 'success' | 'error' | 'info' | 'warning' | 'default' } => {
    const colors: Record<string, { bg: string; text: string; chipColor: 'success' | 'error' | 'info' | 'warning' | 'default' }> = {
      income: { bg: 'success.50', text: 'success.dark', chipColor: 'success' },
      expense: { bg: 'error.50', text: 'error.dark', chipColor: 'error' },
      transfer: { bg: 'info.50', text: 'info.dark', chipColor: 'info' },
      investment: { bg: 'secondary.50', text: 'secondary.dark', chipColor: 'default' },
      refund: { bg: 'success.50', text: 'success.dark', chipColor: 'success' },
      fee: { bg: 'warning.50', text: 'warning.dark', chipColor: 'warning' }
    };
    return colors[type] || { bg: 'grey.50', text: 'grey.800', chipColor: 'default' };
  };

  if (loading) {
    return (
      <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Descripción</TableCell>
              <TableCell>Categoría</TableCell>
              <TableCell>Fecha</TableCell>
              <TableCell align="right">Monto</TableCell>
              <TableCell align="center">Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {[...Array(5)].map((_, index) => (
              <TableRow key={index}>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box sx={{ width: 40, height: 40, bgcolor: 'grey.200', borderRadius: 2 }} />
                    <Box sx={{ flex: 1 }}>
                      <Box sx={{ height: 16, bgcolor: 'grey.200', borderRadius: 1, mb: 0.5, width: '60%' }} />
                      <Box sx={{ height: 12, bgcolor: 'grey.200', borderRadius: 1, width: '40%' }} />
                    </Box>
                  </Box>
                </TableCell>
                <TableCell>
                  <Box sx={{ height: 24, bgcolor: 'grey.200', borderRadius: 12, width: 120 }} />
                </TableCell>
                <TableCell>
                  <Box sx={{ height: 16, bgcolor: 'grey.200', borderRadius: 1, width: 140 }} />
                </TableCell>
                <TableCell>
                  <Box sx={{ height: 24, bgcolor: 'grey.200', borderRadius: 1, width: 100, ml: 'auto' }} />
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1 }}>
                    <Box sx={{ width: 32, height: 32, bgcolor: 'grey.200', borderRadius: 1 }} />
                    <Box sx={{ width: 32, height: 32, bgcolor: 'grey.200', borderRadius: 1 }} />
                  </Box>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    );
  }

  if (!transactions.length) {
    return (
      <Paper sx={{ p: 8, textAlign: 'center', borderRadius: 2 }}>
        <Typography variant="h3" sx={{ mb: 2 }}>💳</Typography>
        <Typography variant="h6" color="text.secondary" gutterBottom>
          No hay transacciones
        </Typography>
        <Typography variant="body2" color="text.secondary">
          No se encontraron transacciones con los filtros aplicados
        </Typography>
      </Paper>
    );
  }

  // Vista móvil - tarjetas
  if (isMobile) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {transactions.map((transaction) => {
          const colors = getTransactionColor(transaction.transaction_type);
          const isExpanded = expandedTransaction === transaction.transaction_id;
          const icon = getTransactionIcon(transaction.transaction_type, transaction.category);
          const isNegative = transaction.amount < 0;

          return (
            <Card 
              key={transaction.transaction_id} 
              sx={{ 
                borderLeft: 4, 
                borderColor: colors.text,
                '&:hover': { boxShadow: 3 }
              }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                  <Box 
                    sx={{ 
                      width: 48, 
                      height: 48, 
                      borderRadius: 2, 
                      bgcolor: colors.bg,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.5rem'
                    }}
                  >
                    {icon}
                  </Box>
                  
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 0.5 }}>
                      {transaction.description}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, mb: 1, flexWrap: 'wrap' }}>
                      <Chip 
                        label={TRANSACTION_CATEGORY_LABELS[transaction.category]} 
                        size="small" 
                        color={colors.chipColor}
                      />
                      <Chip 
                        label={TRANSACTION_TYPE_LABELS[transaction.transaction_type]} 
                        size="small" 
                        variant="outlined"
                      />
                    </Box>
                    <Typography variant="caption" color="text.secondary">
                      {formatDate(transaction.transaction_date)}
                    </Typography>
                  </Box>

                  <Box sx={{ textAlign: 'right' }}>
                    <Typography 
                      variant="h6" 
                      sx={{ 
                        fontWeight: 700,
                        color: isNegative ? 'error.main' : 'success.main'
                      }}
                    >
                      {isNegative ? '-' : '+'} {formatCurrency(transaction.amount)}
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 2 }}>
                  {onEditTransaction && (
                    <Tooltip title="Editar">
                      <IconButton 
                        size="small" 
                        color="primary"
                        onClick={() => onEditTransaction(transaction)}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  )}
                  
                  <Tooltip title={isExpanded ? "Ocultar detalles" : "Ver detalles"}>
                    <IconButton
                      size="small"
                      onClick={() => setExpandedTransaction(isExpanded ? null : transaction.transaction_id)}
                    >
                      <ExpandMoreIcon 
                        sx={{ 
                          transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                          transition: '0.3s'
                        }} 
                      />
                    </IconButton>
                  </Tooltip>

                  {onDeleteTransaction && (
                    <Tooltip title="Eliminar">
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => {
                          if (window.confirm('¿Estás seguro de eliminar esta transacción?')) {
                            onDeleteTransaction(transaction.transaction_id);
                          }
                        }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  )}
                </Box>

                <Collapse in={isExpanded}>
                  <Divider sx={{ my: 2 }} />
                  <Grid container spacing={2}>
                    {transaction.reference_number && (
                      <Grid size={{ xs: 12 }}>
                        <Typography variant="caption" color="text.secondary">
                          Referencia
                        </Typography>
                        <Typography variant="body2">
                          {transaction.reference_number}
                        </Typography>
                      </Grid>
                    )}
                    
                    {transaction.notes && (
                      <Grid size={{ xs: 12 }}>
                        <Typography variant="caption" color="text.secondary">
                          Notas
                        </Typography>
                        <Typography variant="body2">
                          {transaction.notes}
                        </Typography>
                      </Grid>
                    )}

                    {transaction.tags && transaction.tags.length > 0 && (
                      <Grid size={{ xs: 12 }}>
                        <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                          Etiquetas
                        </Typography>
                        <Stack direction="row" spacing={0.5} flexWrap="wrap">
                          {transaction.tags.map((tag, idx) => (
                            <Chip key={idx} label={`#${tag}`} size="small" variant="outlined" />
                          ))}
                        </Stack>
                      </Grid>
                    )}

                    {transaction.location && (
                      <Grid size={{ xs: 12 }}>
                        <Typography variant="caption" color="text.secondary">
                          Ubicación
                        </Typography>
                        <Typography variant="body2">
                          📍 {transaction.location}
                        </Typography>
                      </Grid>
                    )}
                  </Grid>
                </Collapse>
              </CardContent>
            </Card>
          );
        })}
      </Box>
    );
  }

  // Vista de escritorio - tabla
  return (
    <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
      <Table>
        <TableHead>
          <TableRow sx={{ bgcolor: 'grey.50' }}>
            <TableCell sx={{ width: 60 }} />
            
            <TableCell>
              <TableSortLabel
                active={sortField === 'description'}
                direction={sortField === 'description' ? sortOrder : 'asc'}
                onClick={() => handleSort('description')}
              >
                Descripción
              </TableSortLabel>
            </TableCell>
            
            <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>
              <TableSortLabel
                active={sortField === 'category'}
                direction={sortField === 'category' ? sortOrder : 'asc'}
                onClick={() => handleSort('category')}
              >
                Categoría
              </TableSortLabel>
            </TableCell>
            
            <TableCell>
              <TableSortLabel
                active={sortField === 'transaction_date'}
                direction={sortField === 'transaction_date' ? sortOrder : 'asc'}
                onClick={() => handleSort('transaction_date')}
              >
                Fecha
              </TableSortLabel>
            </TableCell>
            
            <TableCell align="right">
              <TableSortLabel
                active={sortField === 'amount'}
                direction={sortField === 'amount' ? sortOrder : 'asc'}
                onClick={() => handleSort('amount')}
              >
                Monto
              </TableSortLabel>
            </TableCell>
            
            <TableCell align="center" sx={{ width: 140 }}>
              Acciones
            </TableCell>
          </TableRow>
        </TableHead>
        
        <TableBody>
          {transactions.map((transaction) => {
            const colors = getTransactionColor(transaction.transaction_type);
            const isExpanded = expandedTransaction === transaction.transaction_id;
            const icon = getTransactionIcon(transaction.transaction_type, transaction.category);
            const isNegative = transaction.amount < 0;

            return (
              <React.Fragment key={transaction.transaction_id}>
                <TableRow 
                  hover
                  sx={{ 
                    '& > *': { borderBottom: isExpanded ? 'unset' : undefined },
                    cursor: onTransactionClick ? 'pointer' : 'default',
                    borderLeft: 4,
                    borderColor: colors.text,
                  }}
                  onClick={() => onTransactionClick && onTransactionClick(transaction)}
                >
                  {/* Ícono */}
                  <TableCell>
                    <Box 
                      sx={{ 
                        width: 40, 
                        height: 40, 
                        borderRadius: 2, 
                        bgcolor: colors.bg,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1.25rem'
                      }}
                    >
                      {icon}
                    </Box>
                  </TableCell>

                  {/* Descripción */}
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {transaction.description}
                    </Typography>
                    {transaction.reference_number && (
                      <Typography variant="caption" color="text.secondary">
                        Ref: {transaction.reference_number}
                      </Typography>
                    )}
                  </TableCell>

                  {/* Categoría - oculto en móvil */}
                  <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                    <Chip 
                      label={TRANSACTION_CATEGORY_LABELS[transaction.category]} 
                      size="small" 
                      color={colors.chipColor}
                      sx={{ mb: 0.5 }}
                    />
                    <Typography variant="caption" display="block" color="text.secondary">
                      {TRANSACTION_TYPE_LABELS[transaction.transaction_type]}
                    </Typography>
                  </TableCell>

                  {/* Fecha */}
                  <TableCell>
                    <Typography variant="body2">
                      {formatDate(transaction.transaction_date)}
                    </Typography>
                  </TableCell>

                  {/* Monto */}
                  <TableCell align="right">
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 0.5 }}>
                      {isNegative ? (
                        <TrendingDownIcon sx={{ color: 'error.main', fontSize: '1.2rem' }} />
                      ) : (
                        <TrendingUpIcon sx={{ color: 'success.main', fontSize: '1.2rem' }} />
                      )}
                      <Typography 
                        variant="body1" 
                        sx={{ 
                          fontWeight: 700,
                          color: isNegative ? 'error.main' : 'success.main'
                        }}
                      >
                        {isNegative ? '-' : '+'} {formatCurrency(transaction.amount)}
                      </Typography>
                    </Box>
                  </TableCell>

                  {/* Acciones */}
                  <TableCell align="center" onClick={(e) => e.stopPropagation()}>
                    <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.5 }}>
                      {onEditTransaction && (
                        <Tooltip title="Editar">
                          <IconButton 
                            size="small" 
                            color="primary"
                            onClick={(e) => {
                              e.stopPropagation();
                              onEditTransaction(transaction);
                            }}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                      
                      <Tooltip title={isExpanded ? "Ocultar detalles" : "Ver detalles"}>
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            setExpandedTransaction(isExpanded ? null : transaction.transaction_id);
                          }}
                        >
                          <ExpandMoreIcon 
                            sx={{ 
                              transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                              transition: '0.3s'
                            }} 
                          />
                        </IconButton>
                      </Tooltip>

                      {onDeleteTransaction && (
                        <Tooltip title="Eliminar">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (window.confirm('¿Estás seguro de eliminar esta transacción?')) {
                                onDeleteTransaction(transaction.transaction_id);
                              }
                            }}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                    </Box>
                  </TableCell>
                </TableRow>

                {/* Fila expandible para detalles */}
                <TableRow>
                  <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={6}>
                    <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                      <Box sx={{ py: 3, px: 2, bgcolor: 'grey.50' }}>
                        <Grid container spacing={3}>
                          {/* Tags */}
                          {transaction.tags && transaction.tags.length > 0 && (
                            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                              <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block', fontWeight: 600 }}>
                                🏷️ Etiquetas
                              </Typography>
                              <Stack direction="row" spacing={0.5} flexWrap="wrap">
                                {transaction.tags.map((tag, idx) => (
                                  <Chip 
                                    key={idx} 
                                    label={`#${tag}`} 
                                    size="small" 
                                    variant="outlined"
                                    sx={{ mb: 0.5 }}
                                  />
                                ))}
                              </Stack>
                            </Grid>
                          )}

                          {/* Cuenta */}
                          {transaction.account_id && (
                            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                              <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block', fontWeight: 600 }}>
                                💳 Cuenta
                              </Typography>
                              <Typography variant="body2" sx={{ fontFamily: 'monospace', wordBreak: 'break-all' }}>
                                {transaction.account_id}
                              </Typography>
                            </Grid>
                          )}

                          {/* Notas */}
                          {transaction.notes && (
                            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                              <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block', fontWeight: 600 }}>
                                📝 Notas
                              </Typography>
                              <Typography variant="body2">
                                {transaction.notes}
                              </Typography>
                            </Grid>
                          )}

                          {/* Ubicación */}
                          {transaction.location && (
                            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                              <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block', fontWeight: 600 }}>
                                📍 Ubicación
                              </Typography>
                              <Typography variant="body2">
                                {transaction.location}
                              </Typography>
                            </Grid>
                          )}

                          {/* Transferencia */}
                          {transaction.transaction_type === 'transfer' && transaction.destination_account_id && (
                            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                              <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block', fontWeight: 600 }}>
                                🔄 Cuenta destino
                              </Typography>
                              <Typography variant="body2" sx={{ fontFamily: 'monospace', wordBreak: 'break-all' }}>
                                {transaction.destination_account_id}
                              </Typography>
                            </Grid>
                          )}

                          {/* Timestamps */}
                          <Grid size={{ xs: 12 }}>
                            <Divider sx={{ mb: 2 }} />
                            <Grid container spacing={2}>
                              <Grid size={{ xs: 6 }}>
                                <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block', fontWeight: 600 }}>
                                  ⏱️ Creada
                                </Typography>
                                <Typography variant="body2">
                                  {new Date(transaction.created_at).toLocaleDateString('es-MX', {
                                    day: 'numeric',
                                    month: 'short',
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </Typography>
                              </Grid>
                              {transaction.updated_at && (
                                <Grid size={{ xs: 6 }}>
                                  <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block', fontWeight: 600 }}>
                                    🔄 Actualizada
                                  </Typography>
                                  <Typography variant="body2">
                                    {new Date(transaction.updated_at).toLocaleDateString('es-MX', {
                                      day: 'numeric',
                                      month: 'short',
                                      year: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })}
                                  </Typography>
                                </Grid>
                              )}
                            </Grid>
                          </Grid>
                        </Grid>
                      </Box>
                    </Collapse>
                  </TableCell>
                </TableRow>
              </React.Fragment>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
};
