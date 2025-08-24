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
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
    transform: 'translateY(-1px)',
  },
  
  '&:active': {
    transform: 'translateY(0)',
  },
  
  '&.Mui-disabled': {
    backgroundColor: theme.palette.grey[300],
    color: theme.palette.grey[500],
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
