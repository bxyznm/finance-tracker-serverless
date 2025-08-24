import React, { useState } from 'react';
import {
  TextField,
  TextFieldProps,
  InputAdornment,
  IconButton,
  Box,
  Typography
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { styled } from '@mui/material/styles';

interface CustomTextFieldProps extends Omit<TextFieldProps, 'variant'> {
  isPassword?: boolean;
  showPasswordToggle?: boolean;
  errorMessage?: string;
  successMessage?: string;
}

const StyledTextField = styled(TextField)(({ theme }) => ({
  '& .MuiOutlinedInput-root': {
    borderRadius: 12,
    backgroundColor: theme.palette.background.paper,
    transition: 'all 0.2s ease-in-out',
    
    '&:hover': {
      '& .MuiOutlinedInput-notchedOutline': {
        borderColor: theme.palette.primary.main,
      },
    },
    
    '&.Mui-focused': {
      '& .MuiOutlinedInput-notchedOutline': {
        borderColor: theme.palette.primary.main,
        borderWidth: 2,
      },
    },
    
    '&.Mui-error': {
      '& .MuiOutlinedInput-notchedOutline': {
        borderColor: theme.palette.error.main,
      },
    },
  },
  
  '& .MuiInputLabel-root': {
    fontWeight: 500,
    '&.Mui-focused': {
      color: theme.palette.primary.main,
    },
  },
}));

export const Input: React.FC<CustomTextFieldProps> = ({
  isPassword = false,
  showPasswordToggle = true,
  errorMessage,
  successMessage,
  type,
  error,
  helperText,
  ...props
}) => {
  const [showPassword, setShowPassword] = useState(false);

  const handleTogglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const inputType = isPassword ? (showPassword ? 'text' : 'password') : type;
  const hasError = error || !!errorMessage;
  const displayHelperText = errorMessage || successMessage || helperText;

  return (
    <Box sx={{ width: '100%' }}>
      <StyledTextField
        {...props}
        type={inputType}
        error={hasError}
        helperText={displayHelperText}
        variant="outlined"
        fullWidth
        InputProps={{
          ...props.InputProps,
          endAdornment: isPassword && showPasswordToggle ? (
            <InputAdornment position="end">
              <IconButton
                aria-label="toggle password visibility"
                onClick={handleTogglePasswordVisibility}
                edge="end"
                size="small"
              >
                {showPassword ? <VisibilityOff /> : <Visibility />}
              </IconButton>
            </InputAdornment>
          ) : props.InputProps?.endAdornment,
        }}
      />
      
      {successMessage && !hasError && (
        <Typography 
          variant="caption" 
          sx={{ 
            color: 'success.main', 
            mt: 0.5, 
            display: 'block',
            fontSize: '0.75rem'
          }}
        >
          {successMessage}
        </Typography>
      )}
    </Box>
  );
};
