import React, { useEffect } from 'react';
import {
  Box,
  Typography,
  Link,
  Alert,
  Card,
  useTheme,
  useMediaQuery
} from '@mui/material';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { Link as RouterLink } from 'react-router-dom';
import { motion } from 'framer-motion';

import { Button, Input } from '../ui';
import { useLogin } from '../../hooks';
import { LoginRequest } from '../../types';
import { isValidEmail } from '../../utils';
import { useTheme as useCustomTheme } from '../../context/ThemeContext';

// Validation schema
const loginSchema = yup.object({
  email: yup
    .string()
    .required('El email es obligatorio')
    .test('valid-email', 'Ingresa un email válido', (value) => 
      value ? isValidEmail(value) : false
    ),
  password: yup
    .string()
    .required('La contraseña es obligatoria')
    .min(8, 'La contraseña debe tener al menos 8 caracteres'),
});

const LoginForm: React.FC = () => {
  const theme = useTheme();
  const { mode } = useCustomTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { login, isLoading, error, clearError } = useLogin();

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch
  } = useForm<LoginRequest>({
    resolver: yupResolver(loginSchema),
    mode: 'onChange'
  });

  const watchedFields = watch();

  // Clear errors when user starts typing
  useEffect(() => {
    if (error && (watchedFields.email || watchedFields.password)) {
      clearError();
    }
  }, [watchedFields.email, watchedFields.password, error, clearError]);

  const onSubmit = async (data: LoginRequest) => {
    await login(data);
  };

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <Box
      component={motion.div}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: mode === 'light' 
          ? `linear-gradient(135deg, ${theme.palette.primary.light} 0%, ${theme.palette.primary.main} 50%, ${theme.palette.primary.dark} 100%)`
          : `linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 25%, #2d2d2d 50%, #1a1a1a 75%, #0a0a0a 100%)`,
        padding: theme.spacing(2),
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'radial-gradient(circle at 20% 80%, rgba(99, 102, 241, 0.1) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(99, 102, 241, 0.05) 0%, transparent 50%)',
          pointerEvents: 'none'
        },
        '&::after': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'url("data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGcgZmlsbD0ibm9uZSIgZmlsbC1ydWxlPSJldmVub2RkIj4KPGcgZmlsbD0iIzY2NjY2NiIgZmlsbC1vcGFjaXR5PSIwLjA1Ij4KPGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPgo8L2c+CjwvZz4KPC9zdmc+")',
          opacity: 0.3,
          pointerEvents: 'none'
        }
      }}
    >
      <Card
        sx={{
          width: '100%',
          maxWidth: 400,
          p: { xs: 3, sm: 4 },
          borderRadius: 3,
          backgroundColor: mode === 'light' 
            ? 'rgba(255, 255, 255, 0.95)' 
            : 'rgba(26, 26, 26, 0.9)',
          backdropFilter: 'blur(20px)',
          boxShadow: mode === 'light'
            ? '0 8px 32px rgba(0,0,0,0.12)'
            : '0 8px 32px rgba(0,0,0,0.4), 0 0 0 1px rgba(45, 45, 45, 0.3)',
          border: mode === 'light' 
            ? '1px solid rgba(255, 255, 255, 0.3)'
            : '1px solid rgba(45, 45, 45, 0.2)',
          position: 'relative',
          zIndex: 1,
        }}
      >
        <Box component="form" onSubmit={handleSubmit(onSubmit)}>
          <Box
            component={motion.div}
            variants={itemVariants}
            sx={{ textAlign: 'center', mb: 4 }}
          >
            <Typography
              variant="h4"
              component="h1"
              sx={{
                fontWeight: 700,
                mb: 1,
                fontSize: { xs: '1.75rem', sm: '2rem' },
                color: theme.palette.text.primary,
              }}
            >
              ¡Bienvenido de vuelta! 👋
            </Typography>
            <Typography
              variant="body1"
              sx={{ 
                fontSize: { xs: '0.9rem', sm: '1rem' },
                color: theme.palette.text.secondary
              }}
            >
              Ingresa a tu cuenta de Finance Tracker
            </Typography>
          </Box>

          {error && (
            <motion.div
              variants={itemVariants}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
            >
              <Alert 
                severity="error" 
                sx={{ 
                  mb: 3, 
                  borderRadius: 2,
                  '& .MuiAlert-message': {
                    fontSize: { xs: '0.875rem', sm: '1rem' }
                  }
                }}
                onClose={clearError}
              >
                {error}
              </Alert>
            </motion.div>
          )}

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <motion.div variants={itemVariants}>
              <Input
                {...register('email')}
                label="Email"
                type="email"
                placeholder="tu@email.com"
                error={!!errors.email}
                errorMessage={errors.email?.message}
                autoComplete="email"
                autoFocus={!isMobile}
              />
            </motion.div>

            <motion.div variants={itemVariants}>
              <Input
                {...register('password')}
                label="Contraseña"
                isPassword
                placeholder="Tu contraseña segura"
                error={!!errors.password}
                errorMessage={errors.password?.message}
                autoComplete="current-password"
              />
            </motion.div>

            <motion.div variants={itemVariants}>
              <Button
                type="submit"
                variant="contained"
                fullWidth
                size="large"
                isLoading={isLoading}
                disabled={!!errors.email || !!errors.password}
                sx={{
                  py: 1.5,
                  fontSize: { xs: '0.9rem', sm: '1rem' },
                  fontWeight: 600,
                }}
              >
                Iniciar Sesión
              </Button>
            </motion.div>

            <motion.div variants={itemVariants}>
              <Box sx={{ textAlign: 'center', mt: 2 }}>
                <Link
                  component={RouterLink}
                  to="/forgot-password"
                  sx={{
                    color: theme.palette.primary.main,
                    textDecoration: 'none',
                    fontWeight: 500,
                    fontSize: { xs: '0.875rem', sm: '0.9rem' },
                    '&:hover': {
                      color: theme.palette.primary.light,
                      textDecoration: 'underline'
                    }
                  }}
                >
                  ¿Olvidaste tu contraseña?
                </Link>
              </Box>
            </motion.div>
          </Box>

          <motion.div variants={itemVariants}>
            <Box
              sx={{
                textAlign: 'center',
                mt: 4,
                pt: 3,
                borderTop: `1px solid ${theme.palette.divider}`
              }}
            >
              <Typography 
                variant="body2" 
                sx={{ 
                  fontSize: { xs: '0.875rem', sm: '0.9rem' },
                  color: theme.palette.text.secondary
                }}
              >
                ¿No tienes una cuenta?{' '}
                <Link
                  component={RouterLink}
                  to="/register"
                  sx={{
                    color: theme.palette.primary.main,
                    textDecoration: 'none',
                    fontWeight: 600,
                    '&:hover': {
                      color: theme.palette.primary.light,
                      textDecoration: 'underline'
                    }
                  }}
                >
                  Regístrate aquí
                </Link>
              </Typography>
            </Box>
          </motion.div>
        </Box>
      </Card>
    </Box>
  );
};

export default LoginForm;
