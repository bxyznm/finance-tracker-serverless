import React from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Switch,
  FormControlLabel,
  Divider,
  Button,
} from '@mui/material';
import { motion } from 'framer-motion';
import { AppLayout } from '../components/layout';
import { useTheme as useCustomTheme } from '../context/ThemeContext';

const SettingsPage: React.FC = () => {
  const { mode, toggleTheme } = useCustomTheme();

  return (
    <AppLayout title="Configuración">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" gutterBottom sx={{ fontWeight: 700 }}>
            Configuración
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Personaliza tu experiencia con Finance Tracker
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <Box sx={{ display: 'flex', gap: 3, flexDirection: { xs: 'column', md: 'row' } }}>
            <Box sx={{ flex: 1 }}>
              <Card sx={{ borderRadius: 3 }}>
                <CardContent sx={{ p: 4 }}>
                  <Typography variant="h6" gutterBottom>
                    🎨 Apariencia
                  </Typography>
                  
                  <FormControlLabel
                    control={
                      <Switch
                        checked={mode === 'dark'}
                        onChange={toggleTheme}
                        color="primary"
                      />
                    }
                    label={`Tema ${mode === 'dark' ? 'Oscuro' : 'Claro'}`}
                    sx={{ mb: 2 }}
                  />
                  
                  <Typography variant="body2" color="text.secondary">
                    Cambia entre el tema claro y oscuro según tu preferencia.
                  </Typography>
                </CardContent>
              </Card>
            </Box>
            
            <Box sx={{ flex: 1 }}>
              <Card sx={{ borderRadius: 3 }}>
                <CardContent sx={{ p: 4 }}>
                  <Typography variant="h6" gutterBottom>
                    🔔 Notificaciones
                  </Typography>
                  
                  <FormControlLabel
                    control={<Switch defaultChecked color="primary" />}
                    label="Notificaciones por email"
                    sx={{ mb: 1 }}
                  />
                  
                  <FormControlLabel
                    control={<Switch defaultChecked color="primary" />}
                    label="Recordatorios de presupuesto"
                    sx={{ mb: 2 }}
                  />
                  
                  <Typography variant="body2" color="text.secondary">
                    Configura qué notificaciones deseas recibir.
                  </Typography>
                </CardContent>
              </Card>
            </Box>
          </Box>
          
          <Card sx={{ borderRadius: 3 }}>
            <CardContent sx={{ p: 4 }}>
              <Typography variant="h6" gutterBottom>
                🔐 Privacidad y Seguridad
              </Typography>
              
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Cambiar Contraseña
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Actualiza tu contraseña para mantener tu cuenta segura.
                </Typography>
                <Button variant="outlined" size="small">
                  Cambiar Contraseña
                </Button>
              </Box>
              
              <Divider sx={{ my: 3 }} />
              
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Autenticación de Dos Factores
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Añade una capa extra de seguridad a tu cuenta.
                </Typography>
                <Button variant="outlined" size="small">
                  Configurar 2FA
                </Button>
              </Box>
              
              <Divider sx={{ my: 3 }} />
              
              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  Eliminar Cuenta
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Esta acción es irreversible. Todos tus datos serán eliminados permanentemente.
                </Typography>
                <Button variant="outlined" color="error" size="small">
                  Eliminar Cuenta
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Box>
      </motion.div>
    </AppLayout>
  );
};

export default SettingsPage;
