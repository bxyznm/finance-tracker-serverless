import React from 'react';
import {
  Button as MuiButton,
  ButtonProps as MuiButtonProps,
  CircularProgress,
  Box
} from '@mui/material';
import { styled } from '@mui/material/styles';

interface CustomButtonProps extends Omit<MuiButtonProps, 'color'> {
  isLoading?: boolean;
  color?: 'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success';
}

const StyledButton = styled(MuiButton)(({ theme }) => ({
  borderRadius: 12,
  textTransform: 'none',
  fontWeight: 600,
  fontSize: '1rem',
  padding: '12px 24px',
  boxShadow: 'none',
  transition: 'all 0.2s ease-in-out',
  
  '&:hover': {
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
    transform: 'translateY(-1px)',
  },
  
  '&:active': {
    transform: 'translateY(0)',
  },
  
  '&.Mui-disabled': {
    backgroundColor: '#2d2d2d',
    color: '#666666',
  },
  
  // Dark theme specific styles
  '&.MuiButton-contained': {
    backgroundColor: '#1a1a1a',
    color: '#ffffff',
    '&:hover': {
      backgroundColor: '#2d2d2d',
    },
  },
  
  '&.MuiButton-outlined': {
    borderColor: '#2d2d2d',
    color: '#ffffff',
    '&:hover': {
      backgroundColor: 'rgba(255, 255, 255, 0.05)',
      borderColor: '#6366f1',
    },
  },
  
  '&.MuiButton-text': {
    color: '#ffffff',
    '&:hover': {
      backgroundColor: 'rgba(255, 255, 255, 0.05)',
    },
  },
}));

export const Button: React.FC<CustomButtonProps> = ({
  children,
  isLoading = false,
  disabled,
  color = 'primary',
  ...props
}) => {
  return (
    <StyledButton
      {...props}
      color={color}
      disabled={disabled || isLoading}
    >
      {isLoading ? (
        <Box display="flex" alignItems="center" gap={1}>
          <CircularProgress size={16} color="inherit" />
          <span>Cargando...</span>
        </Box>
      ) : (
        children
      )}
    </StyledButton>
  );
};
