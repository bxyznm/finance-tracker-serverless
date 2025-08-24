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
        background: `linear-gradient(135deg, ${theme.palette.secondary.light} 0%, ${theme.palette.secondary.main} 50%, ${theme.palette.secondary.dark} 100%)`,
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
          background: 'url("data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGcgZmlsbD0ibm9uZSIgZmlsbC1ydWxlPSJldmVub2RkIj4KPGcgZmlsbD0iIzAwMCIgZmlsbC1vcGFjaXR5PSIwLjA1Ij4KPGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPgo8L2c+CjwvZz4KPC9zdmc+")',
          opacity: 0.3,
          pointerEvents: 'none'
        }
      }}
    >
      <Card
        sx={{
          width: '100%',
          maxWidth: 500,
          p: { xs: 3, sm: 4 },
          borderRadius: 3,
          boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
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
                color: 'secondary.main',
                mb: 1,
                fontSize: { xs: '1.75rem', sm: '2rem' }
              }}
            >
              Crea tu cuenta 🚀
            </Typography>
            <Typography
              variant="body1"
              color="text.secondary"
              sx={{ fontSize: { xs: '0.9rem', sm: '1rem' } }}
            >
              Únete a Finance Tracker y toma control de tus finanzas
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
              <Controller
                name="currency"
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth error={!!errors.currency}>
                    <InputLabel>Moneda principal</InputLabel>
                    <Select
                      {...field}
                      label="Moneda principal"
                      sx={{
                        borderRadius: 3,
                        '& .MuiOutlinedInput-notchedOutline': {
                          borderRadius: 3,
                        },
                      }}
                    >
                      {CURRENCY_OPTIONS.map((currency) => (
                        <MenuItem key={currency.value} value={currency.value}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography component="span" sx={{ fontWeight: 500 }}>
                              {currency.symbol}
                            </Typography>
                            <Typography component="span">
                              {currency.label}
                            </Typography>
                          </Box>
                        </MenuItem>
                      ))}
                    </Select>
                    {errors.currency && (
                      <FormHelperText>{errors.currency.message}</FormHelperText>
                    )}
                  </FormControl>
                )}
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
              {passwordStrength && !passwordStrength.isValid && (
                <Box sx={{ mt: 1 }}>
                  {passwordStrength.errors.map((error, index) => (
                    <Typography
                      key={index}
                      variant="caption"
                      sx={{
                        color: 'error.main',
                        fontSize: '0.75rem',
                        display: 'block'
                      }}
                    >
                      • {error}
                    </Typography>
                  ))}
                </Box>
              )}
            </motion.div>

            <motion.div variants={itemVariants}>
              <Input
                {...register('confirm_password')}
                label="Confirmar contraseña"
                isPassword
                placeholder="Confirma tu contraseña"
                error={!!errors.confirm_password}
                errorMessage={errors.confirm_password?.message}
                autoComplete="new-password"
              />
            </motion.div>

            <motion.div variants={itemVariants}>
              <Button
                type="submit"
                variant="contained"
                color="secondary"
                fullWidth
                size="large"
                isLoading={isLoading}
                disabled={Object.keys(errors).length > 0}
                sx={{
                  py: 1.5,
                  fontSize: { xs: '0.9rem', sm: '1rem' },
                  fontWeight: 600
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
                color="text.secondary"
                sx={{ fontSize: { xs: '0.875rem', sm: '0.9rem' } }}
              >
                ¿Ya tienes una cuenta?{' '}
                <Link
                  component={RouterLink}
                  to="/login"
                  sx={{
                    color: 'secondary.main',
                    textDecoration: 'none',
                    fontWeight: 600,
                    '&:hover': {
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
