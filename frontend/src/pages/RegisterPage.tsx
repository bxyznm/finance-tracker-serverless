import React from 'react';
import { RegisterForm } from '../components/auth';
import { useRedirectIfAuthenticated } from '../hooks';
import { Box, CircularProgress } from '@mui/material';

const RegisterPage: React.FC = () => {
  const { isLoading } = useRedirectIfAuthenticated();

  if (isLoading) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <CircularProgress size={40} />
      </Box>
    );
  }

  return <RegisterForm />;
};

export default RegisterPage;
