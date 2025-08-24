import React from 'react';
import { LoginForm } from '../components/auth';
import { useRedirectIfAuthenticated } from '../hooks';
import { Box, CircularProgress } from '@mui/material';

const LoginPage: React.FC = () => {
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

  return <LoginForm />;
};

export default LoginPage;
