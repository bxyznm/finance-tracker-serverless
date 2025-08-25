import React, { useEffect } from 'react';
import {
  Box,
  Typography,
  Link,
  Alert,
  Card,
  useTheme,
  useMediaQuery,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText
} from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { Link as RouterLink } from 'react-router-dom';
import { motion } from 'framer-motion';

import { Button, Input } from '../ui';
import { useRegister } from '../../hooks';
import { RegisterRequest, CURRENCY_OPTIONS } from '../../types';
import { isValidEmail, isValidPassword, isValidName } from '../../utils';
import { useTheme as useCustomTheme } from '../../context/ThemeContext';

// Validation schema
const registerSchema = yup.object({
  name: yup
    .string()
    .required('El nombre es obligatorio')
    .test('valid-name', 'Solo se permiten letras, espacios y acentos', (value) => 
      value ? isValidName(value) : false
    ),
  email: yup
    .string()
    .required('El email es obligatorio')
    .test('valid-email', 'Ingresa un email válido', (value) => 
      value ? isValidEmail(value) : false
    ),
  password: yup
    .string()
    .required('La contraseña es obligatoria')
    .test('strong-password', 'La contraseña no cumple con los requisitos', (value) => {
      if (!value) return false;
      const { isValid } = isValidPassword(value);
      return isValid;
    }),
  confirm_password: yup
    .string()
    .required('Confirma tu contraseña')
    .oneOf([yup.ref('password')], 'Las contraseñas no coinciden'),
  currency: yup
    .string()
    .required('Selecciona tu moneda principal')
    .oneOf(['MXN', 'USD', 'EUR', 'CAD'], 'Selecciona una moneda válida'),
});

const RegisterForm: React.FC = () => {
  const theme = useTheme();
  const { mode } = useCustomTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { register: registerUser, isLoading, error, clearError } = useRegister();

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    watch
  } = useForm<RegisterRequest>({
    resolver: yupResolver(registerSchema),
    mode: 'onChange',
    defaultValues: {
      currency: 'MXN'
    }
  });

  const watchedFields = watch();

  // Clear errors when user starts typing
  useEffect(() => {
    if (error && Object.values(watchedFields).some(Boolean)) {
      clearError();
    }
  }, [watchedFields, error, clearError]);

  const onSubmit = async (data: RegisterRequest) => {
    await registerUser(data);
  };

  // Get password strength info
  const passwordStrength = watchedFields.password ? isValidPassword(watchedFields.password) : null;

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
          ? `linear-gradient(135deg, ${theme.palette.secondary.light} 0%, ${theme.palette.secondary.main} 50%, ${theme.palette.secondary.dark} 100%)`
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
          maxWidth: 450,
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
                color: '#ffffff',
                mb: 1,
                fontSize: { xs: '1.75rem', sm: '2rem' },
                background: 'linear-gradient(135deg, #ffffff 0%, #a0a0a0 100%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              ¡Únete a nosotros! 🚀
            </Typography>
            <Typography
              variant="body1"
              sx={{ 
                fontSize: { xs: '0.9rem', sm: '1rem' },
                color: '#a0a0a0'
              }}
            >
              Crea tu cuenta en Finance Tracker
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
                  backgroundColor: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  '& .MuiAlert-message': {
                    fontSize: { xs: '0.875rem', sm: '1rem' },
                    color: '#ffffff'
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
                {...register('name')}
                label="Nombre completo"
                placeholder="Tu nombre completo"
                error={!!errors.name}
                errorMessage={errors.name?.message}
                autoComplete="name"
                autoFocus={!isMobile}
              />
            </motion.div>

            <motion.div variants={itemVariants}>
              <Input
                {...register('email')}
                label="Email"
                type="email"
                placeholder="tu@email.com"
                error={!!errors.email}
                errorMessage={errors.email?.message}
                autoComplete="email"
              />
            </motion.div>

            <motion.div variants={itemVariants}>
              <Input
                {...register('password')}
                label="Contraseña"
                isPassword
                placeholder="Crea una contraseña segura"
                error={!!errors.password}
                errorMessage={errors.password?.message}
                autoComplete="new-password"
              />
            </motion.div>

            {passwordStrength && (
              <motion.div
                variants={itemVariants}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                transition={{ duration: 0.3 }}
              >
                <Box sx={{ p: 2, borderRadius: 2, backgroundColor: 'rgba(45, 45, 45, 0.3)', border: '1px solid rgba(45, 45, 45, 0.5)' }}>
                  <Typography variant="body2" sx={{ color: '#a0a0a0', mb: 1 }}>
                    Fortaleza de la contraseña:
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                    {[1, 2, 3, 4].map((level) => (
                      <Box
                        key={level}
                        sx={{
                          flex: 1,
                          height: 4,
                          borderRadius: 2,
                          backgroundColor: level <= passwordStrength.score ? 
                            (passwordStrength.score <= 2 ? '#ef4444' : 
                             passwordStrength.score <= 3 ? '#f59e0b' : '#10b981') : 
                            '#2d2d2d'
                        }}
                      />
                    ))}
                  </Box>
                  <Typography variant="caption" sx={{ color: passwordStrength.score <= 2 ? '#ef4444' : passwordStrength.score <= 3 ? '#f59e0b' : '#10b981' }}>
                    {passwordStrength.message}
                  </Typography>
                </Box>
              </motion.div>
            )}

            <motion.div variants={itemVariants}>
              <Input
                {...register('confirm_password')}
                label="Confirmar contraseña"
                isPassword
                placeholder="Repite tu contraseña"
                error={!!errors.confirm_password}
                errorMessage={errors.confirm_password?.message}
                autoComplete="new-password"
              />
            </motion.div>

            <motion.div variants={itemVariants}>
              <Controller
                name="currency"
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth error={!!errors.currency}>
                    <InputLabel sx={{ color: '#a0a0a0' }}>Moneda principal</InputLabel>
                    <Select
                      {...field}
                      sx={{
                        backgroundColor: '#2d2d2d',
                        '& .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#2d2d2d',
                        },
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#6366f1',
                        },
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#6366f1',
                        },
                        '& .MuiSelect-icon': {
                          color: '#a0a0a0',
                        },
                        '& .MuiSelect-select': {
                          color: '#ffffff',
                        },
                      }}
                    >
                      {CURRENCY_OPTIONS.map((option) => (
                        <MenuItem key={option.value} value={option.value} sx={{ color: '#ffffff' }}>
                          {option.label}
                        </MenuItem>
                      ))}
                    </Select>
                    {errors.currency && (
                      <FormHelperText sx={{ color: '#ef4444' }}>
                        {errors.currency.message}
                      </FormHelperText>
                    )}
                  </FormControl>
                )}
              />
            </motion.div>

            <motion.div variants={itemVariants}>
              <Button
                type="submit"
                variant="contained"
                fullWidth
                size="large"
                isLoading={isLoading}
                disabled={!!errors.name || !!errors.email || !!errors.password || !!errors.confirm_password || !!errors.currency}
                sx={{
                  py: 1.5,
                  fontSize: { xs: '0.9rem', sm: '1rem' },
                  fontWeight: 600,
                  background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 50%, #6366f1 100%)',
                  color: '#ffffff',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #2d2d2d 0%, #6366f1 50%, #818cf8 100%)',
                    boxShadow: '0 4px 20px rgba(99, 102, 241, 0.4)',
                  },
                  '&:disabled': {
                    background: '#2d2d2d',
                    color: '#666666',
                  }
                }}
              >
                Crear Cuenta
              </Button>
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
                  color: '#a0a0a0'
                }}
              >
                ¿Ya tienes una cuenta?{' '}
                <Link
                  component={RouterLink}
                  to="/login"
                  sx={{
                    color: '#6366f1',
                    textDecoration: 'none',
                    fontWeight: 600,
                    '&:hover': {
                      color: '#818cf8',
                      textDecoration: 'underline'
                    }
                  }}
                >
                  Inicia sesión aquí
                </Link>
              </Typography>
            </Box>
          </motion.div>
        </Box>
      </Card>
    </Box>
  );
};

export default RegisterForm;
