/**
 * Página principal de transacciones
 */

import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
} from '@mui/material';
import {
  Add as AddIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  AccountBalance as BalanceIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { 
  TransactionList, 
  TransactionFilters, 
  TransactionForm 
} from '../components/transactions';
import { AppLayout } from '../components/layout';
import { useTransactions, useAccounts } from '../hooks';
import type { Transaction, TransactionCreateRequest, TransactionUpdateRequest } from '../types';

const TransactionsPage: React.FC = () => {
  // Estados locales
  const [showForm, setShowForm] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  // Hook de transacciones
  const {
    transactions,
    loading,
    error,
    totalCount,
    totalPages,
    currentPage,
    summary,
    createTransaction,
    updateTransaction,
    deleteTransaction,
    applyFilters,
    clearFilters,
    nextPage,
    prevPage,
    goToPage
  } = useTransactions();

  // Hook de cuentas - obtener las cuentas del usuario logueado
  const { accounts, isLoading: accountsLoading, error: accountsError } = useAccounts();

  // Handlers
  const handleFormSubmit = async (data: TransactionCreateRequest | TransactionUpdateRequest) => {
    if (editingTransaction) {
      // Es una actualización
      await updateTransaction(editingTransaction.transaction_id, data as TransactionUpdateRequest);
      setEditingTransaction(null);
    } else {
      // Es una creación
      await createTransaction(data as TransactionCreateRequest);
    }
    setShowForm(false);
  };

  const handleEditTransaction = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setShowForm(true);
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setEditingTransaction(null);
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 2
    }).format(amount);
  };

  return (
    <AppLayout title="Transacciones">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        {/* Header con botón de acción */}
        <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h4" gutterBottom sx={{ fontWeight: 700 }}>
              Transacciones
            </Typography>
            <Typography variant="body1" color="text.secondary">
              {totalCount > 0 ? `${totalCount} transacciones encontradas` : 'Gestiona tus ingresos y gastos'}
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            sx={{ borderRadius: 2, py: 1.5, px: 3 }}
            onClick={() => setShowForm(true)}
          >
            Nueva Transacción
          </Button>
        </Box>

        {/* Error Alert */}
        {error && (
          <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
            {error}
          </Alert>
        )}

        {/* Error de cuentas Alert */}
        {accountsError && (
          <Alert severity="warning" sx={{ mb: 3, borderRadius: 2 }}>
            Error al cargar cuentas: {accountsError}. Puedes seguir usando transacciones, pero no podrás filtrar por cuenta.
          </Alert>
        )}

        {/* Resumen de transacciones */}
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 3, mb: 4 }}>
          <Card sx={{ borderRadius: 3, border: '1px solid', borderColor: 'success.light', bgcolor: 'success.50' }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <TrendingUpIcon sx={{ color: 'success.main', mr: 1 }} />
                <Typography variant="h6" sx={{ fontWeight: 600, color: 'success.main' }}>
                  Ingresos
                </Typography>
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 700, color: 'success.dark' }}>
                {formatCurrency(summary.totalIncome)}
              </Typography>
            </CardContent>
          </Card>

          <Card sx={{ borderRadius: 3, border: '1px solid', borderColor: 'error.light', bgcolor: 'error.50' }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <TrendingDownIcon sx={{ color: 'error.main', mr: 1 }} />
                <Typography variant="h6" sx={{ fontWeight: 600, color: 'error.main' }}>
                  Gastos
                </Typography>
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 700, color: 'error.dark' }}>
                {formatCurrency(summary.totalExpenses)}
              </Typography>
            </CardContent>
          </Card>

          <Card sx={{ 
            borderRadius: 3, 
            border: '1px solid', 
            borderColor: summary.netAmount >= 0 ? 'primary.light' : 'warning.light',
            bgcolor: summary.netAmount >= 0 ? 'primary.50' : 'warning.50'
          }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <BalanceIcon sx={{ 
                  color: summary.netAmount >= 0 ? 'primary.main' : 'warning.main', 
                  mr: 1 
                }} />
                <Typography variant="h6" sx={{ 
                  fontWeight: 600, 
                  color: summary.netAmount >= 0 ? 'primary.main' : 'warning.main' 
                }}>
                  Balance
                </Typography>
              </Box>
              <Typography variant="h4" sx={{ 
                fontWeight: 700, 
                color: summary.netAmount >= 0 ? 'primary.dark' : 'warning.dark' 
              }}>
                {formatCurrency(summary.netAmount)}
              </Typography>
            </CardContent>
          </Card>
        </Box>

        {/* Formulario de transacción (Dialog) */}
        <Dialog
          open={showForm}
          onClose={handleCancelForm}
          maxWidth="md"
          fullWidth
          PaperProps={{
            sx: { borderRadius: 3 }
          }}
        >
          <DialogTitle sx={{ pb: 1 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h5" sx={{ fontWeight: 600 }}>
                {editingTransaction ? 'Editar Transacción' : 'Nueva Transacción'}
              </Typography>
              <IconButton onClick={handleCancelForm} size="small">
                <CloseIcon />
              </IconButton>
            </Box>
          </DialogTitle>
          <DialogContent>
            <TransactionForm
              transaction={editingTransaction}
              accounts={accounts}
              onSubmit={handleFormSubmit}
              onCancel={handleCancelForm}
              loading={loading}
            />
          </DialogContent>
        </Dialog>

        {/* Filtros */}
        <Card sx={{ borderRadius: 3, mb: 3 }}>
          <CardContent sx={{ p: 3 }}>
            <TransactionFilters
              filters={{}} // Se manejará internamente
              onFiltersChange={applyFilters}
              onClearFilters={clearFilters}
              loading={loading}
            />
          </CardContent>
        </Card>

        {/* Lista de transacciones */}
        <Card sx={{ borderRadius: 3 }}>
          <CardContent sx={{ p: 0 }}>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                <CircularProgress />
              </Box>
            ) : transactions.length > 0 ? (
              <>
                <Box sx={{ p: 3, borderBottom: '1px solid', borderColor: 'divider' }}>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Lista de Transacciones
                  </Typography>
                </Box>
                <Box sx={{ p: 3 }}>
                  <TransactionList
                    transactions={transactions}
                    loading={loading}
                    onEditTransaction={handleEditTransaction}
                    onDeleteTransaction={deleteTransaction}
                  />
                </Box>

                {/* Paginación */}
                {totalPages > 1 && (
                  <Box sx={{ 
                    p: 3, 
                    borderTop: '1px solid', 
                    borderColor: 'divider',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <Typography variant="body2" color="text.secondary">
                      Página {currentPage} de {totalPages}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button
                        onClick={prevPage}
                        disabled={currentPage <= 1}
                        variant="outlined"
                        size="small"
                      >
                        Anterior
                      </Button>
                      
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        const pageNumber = Math.max(1, currentPage - 2) + i;
                        if (pageNumber > totalPages) return null;
                        
                        return (
                          <Button
                            key={pageNumber}
                            onClick={() => goToPage(pageNumber)}
                            variant={pageNumber === currentPage ? 'contained' : 'outlined'}
                            size="small"
                            sx={{ minWidth: 40 }}
                          >
                            {pageNumber}
                          </Button>
                        );
                      })}
                      
                      <Button
                        onClick={nextPage}
                        disabled={currentPage >= totalPages}
                        variant="outlined"
                        size="small"
                      >
                        Siguiente
                      </Button>
                    </Box>
                  </Box>
                )}
              </>
            ) : (
              <Box sx={{ p: 8, textAlign: 'center' }}>
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  💰 No hay transacciones
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                  Comienza registrando tu primera transacción
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => setShowForm(true)}
                >
                  Nueva Transacción
                </Button>
              </Box>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </AppLayout>
  );
};

export default TransactionsPage;
