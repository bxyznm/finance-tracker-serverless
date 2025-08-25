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
    backgroundColor: '#2d2d2d',
    transition: 'all 0.2s ease-in-out',
    
    '& fieldset': {
      borderColor: '#2d2d2d',
    },
    
    '&:hover': {
      '& .MuiOutlinedInput-notchedOutline': {
        borderColor: '#6366f1',
      },
    },
    
    '&.Mui-focused': {
      '& .MuiOutlinedInput-notchedOutline': {
        borderColor: '#6366f1',
        borderWidth: 2,
      },
    },
    
    '&.Mui-error': {
      '& .MuiOutlinedInput-notchedOutline': {
        borderColor: '#ef4444',
      },
    },
  },
  
  '& .MuiInputLabel-root': {
    fontWeight: 500,
    color: '#a0a0a0',
    '&.Mui-focused': {
      color: '#6366f1',
    },
  },
  
  '& .MuiInputBase-input': {
    color: '#ffffff',
    '&::placeholder': {
      color: '#666666',
      opacity: 1,
    },
  },
  
  '& .MuiFormHelperText-root': {
    color: '#a0a0a0',
    '&.Mui-error': {
      color: '#ef4444',
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
                sx={{
                  color: '#a0a0a0',
                  '&:hover': {
                    color: '#6366f1',
                    backgroundColor: 'rgba(99, 102, 241, 0.1)',
                  },
                }}
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
            color: '#10b981', 
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
