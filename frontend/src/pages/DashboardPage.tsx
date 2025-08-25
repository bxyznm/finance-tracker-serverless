import React from 'react';
import {
  Typography, 
  Card,
  Box,
  CircularProgress,
  Alert,
  CardContent,
  Button,
} from '@mui/material';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useUserProfile } from '../hooks/useUserProfile';
import { useTheme as useCustomTheme } from '../context/ThemeContext';
import { AppLayout } from '../components/layout';

const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const { userProfile, isLoading, error, refetchProfile } = useUserProfile();
  const { mode } = useCustomTheme();

  if (isLoading) {
    return (
      <AppLayout title="Cargando...">
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '60vh',
          }}
        >
          <CircularProgress size={60} sx={{ color: '#6366f1' }} />
        </Box>
      </AppLayout>
    );
  }

  if (error) {
    return (
      <AppLayout title="Error">
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
        <Button variant="outlined" onClick={refetchProfile}>
          Reintentar
        </Button>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Dashboard">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" gutterBottom sx={{ fontWeight: 700 }}>
            ¡Bienvenido, {userProfile?.name || user?.email?.split('@')[0]}! 🎉
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Tu centro de control financiero personal
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {/* Welcome Card */}
          <Box sx={{ display: 'flex', gap: 3, flexDirection: { xs: 'column', md: 'row' } }}>
            <Box sx={{ flex: 2 }}>
              <Card sx={{ borderRadius: 3, height: '100%' }}>
                <CardContent sx={{ p: 4 }}>
                  <Typography variant="h6" gutterBottom>
                    📊 Resumen de tu cuenta
                  </Typography>
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      📧 Email: {userProfile?.email || user?.email}
                    </Typography>
                    {userProfile?.currency && (
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        💰 Moneda: {userProfile.currency}
                      </Typography>
                    )}
                    {userProfile?.created_at && (
                      <Typography variant="body2" color="text.secondary">
                        📅 Miembro desde: {new Date(userProfile.created_at).toLocaleDateString('es-MX')}
                      </Typography>
                    )}
                  </Box>
                  <Typography variant="body1" color="text.secondary">
                    Explora las diferentes secciones usando el menú lateral para gestionar tus finanzas.
                  </Typography>
                </CardContent>
              </Card>
            </Box>

            {/* Quick Stats */}
            <Box sx={{ flex: 1 }}>
              <Card sx={{ borderRadius: 3, height: '100%' }}>
                <CardContent sx={{ p: 4, textAlign: 'center' }}>
                  <Typography variant="h6" gutterBottom>
                    🚀 Próximamente
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Estadísticas rápidas de tus finanzas
                  </Typography>
                  <Box sx={{ 
                    p: 2, 
                    borderRadius: 2, 
                    backgroundColor: mode === 'light' ? '#f1f5f9' : 'rgba(99, 102, 241, 0.1)',
                    border: `1px solid ${mode === 'light' ? '#e2e8f0' : 'rgba(99, 102, 241, 0.2)'}`,
                  }}>
                    <Typography variant="caption" color="text.secondary">
                      Balance total, transacciones recientes y más...
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Box>
          </Box>

          {/* Recent Activity */}
          <Card sx={{ borderRadius: 3 }}>
            <CardContent sx={{ p: 4 }}>
              <Typography variant="h6" gutterBottom>
                📈 Actividad Reciente
              </Typography>
              <Box sx={{ 
                p: 3, 
                textAlign: 'center',
                borderRadius: 2,
                backgroundColor: mode === 'light' ? '#f8fafc' : 'rgba(45, 45, 45, 0.3)',
                border: `1px solid ${mode === 'light' ? '#e2e8f0' : 'rgba(45, 45, 45, 0.5)'}`,
              }}>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                  🎯 Tu historial de transacciones aparecerá aquí
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Comienza agregando tu primera transacción desde el menú "Transacciones"
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Box>
      </motion.div>
    </AppLayout>
  );
};

export default DashboardPage;
