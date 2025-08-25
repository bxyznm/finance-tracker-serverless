import React from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
} from '@mui/material';
import { motion } from 'framer-motion';
import { AppLayout } from '../components/layout';

const ReportsPage: React.FC = () => {
  return (
    <AppLayout title="Reportes">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" gutterBottom sx={{ fontWeight: 700 }}>
            Reportes Financieros
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Analiza tus finanzas con reportes detallados
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <Box sx={{ display: 'flex', gap: 3, flexDirection: { xs: 'column', md: 'row' } }}>
            <Box sx={{ flex: 1 }}>
              <Card sx={{ borderRadius: 3, height: '100%' }}>
                <CardContent sx={{ p: 4, textAlign: 'center' }}>
                  <Typography variant="h6" gutterBottom>
                    📊 Reportes Mensuales
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Análisis detallado de ingresos y gastos por mes
                  </Typography>
                </CardContent>
              </Card>
            </Box>
            
            <Box sx={{ flex: 1 }}>
              <Card sx={{ borderRadius: 3, height: '100%' }}>
                <CardContent sx={{ p: 4, textAlign: 'center' }}>
                  <Typography variant="h6" gutterBottom>
                    📈 Tendencias
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Visualiza las tendencias de tus finanzas
                  </Typography>
                </CardContent>
              </Card>
            </Box>
          </Box>
          
          <Card sx={{ borderRadius: 3 }}>
            <CardContent sx={{ p: 4, textAlign: 'center' }}>
              <Typography variant="h6" gutterBottom>
                📊 Módulo de Reportes
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                Aquí podrás generar reportes detallados de tus finanzas.
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Esta funcionalidad estará disponible próximamente.
              </Typography>
            </CardContent>
          </Card>
        </Box>
      </motion.div>
    </AppLayout>
  );
};

export default ReportsPage;
