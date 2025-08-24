import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Container, 
  Typography, 
  Button, 
  Card,
  Box,
  CircularProgress,
  Alert
} from '@mui/material';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useUserProfile } from '../hooks/useUserProfile';

const DashboardPage: React.FC = () => {
  const { user, logout } = useAuth();
  const { userProfile, isLoading, error, refetchProfile } = useUserProfile();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    // Redirect to login page after logout
    navigate('/login', { replace: true });
  };

  if (isLoading) {
    return (
      <Container maxWidth="md" sx={{ py: 8 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress size={60} />
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="md" sx={{ py: 8 }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
        <Button variant="outlined" onClick={refetchProfile}>
          Reintentar
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 8 }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <Card sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h4" gutterBottom>
            ¡Bienvenido, {userProfile?.name || user?.email}! 🎉
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            Tu dashboard del Finance Tracker estará aquí pronto.
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
            Email: {userProfile?.email || user?.email}
            {userProfile?.currency && ` | Moneda: ${userProfile.currency}`}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
            {userProfile?.created_at && `Miembro desde: ${new Date(userProfile.created_at).toLocaleDateString('es-MX')}`}
          </Typography>
          <Button
            variant="outlined"
            color="secondary"
            onClick={handleLogout}
            sx={{ mt: 2 }}
          >
            Cerrar Sesión
          </Button>
        </Card>
      </motion.div>
    </Container>
  );
};

export default DashboardPage;
