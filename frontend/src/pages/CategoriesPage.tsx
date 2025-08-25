import React from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
} from '@mui/material';
import { motion } from 'framer-motion';
import { Add as AddIcon } from '@mui/icons-material';
import { AppLayout } from '../components/layout';

const CategoriesPage: React.FC = () => {
  return (
    <AppLayout title="Categorías">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h4" gutterBottom sx={{ fontWeight: 700 }}>
              Categorías
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Organiza tus transacciones por categorías
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            sx={{ borderRadius: 2 }}
          >
            Nueva Categoría
          </Button>
        </Box>

        <Card sx={{ borderRadius: 3 }}>
          <CardContent sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="h6" gutterBottom>
              📂 Módulo de Categorías
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              Aquí podrás crear y gestionar categorías para organizar tus transacciones.
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Esta funcionalidad estará disponible próximamente.
            </Typography>
          </CardContent>
        </Card>
      </motion.div>
    </AppLayout>
  );
};

export default CategoriesPage;
