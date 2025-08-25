import React, { createContext, useContext, useState, useEffect } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';

type ThemeMode = 'light' | 'dark';

interface ThemeContextType {
  mode: ThemeMode;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

interface CustomThemeProviderProps {
  children: React.ReactNode;
}

export const CustomThemeProvider: React.FC<CustomThemeProviderProps> = ({ children }) => {
  const [mode, setMode] = useState<ThemeMode>(() => {
    const savedMode = localStorage.getItem('theme-mode') as ThemeMode;
    return savedMode || 'light';
  });

  const toggleTheme = () => {
    const newMode = mode === 'light' ? 'dark' : 'light';
    setMode(newMode);
    localStorage.setItem('theme-mode', newMode);
  };

  useEffect(() => {
    localStorage.setItem('theme-mode', mode);
  }, [mode]);

  // Create light theme
  const lightTheme = createTheme({
    palette: {
      mode: 'light',
      primary: {
        main: '#6366f1',
        light: '#818cf8',
        dark: '#4f46e5',
        contrastText: '#ffffff',
      },
      secondary: {
        main: '#10b981',
        light: '#34d399',
        dark: '#059669',
        contrastText: '#ffffff',
      },
      background: {
        default: '#f8fafc',
        paper: '#ffffff',
      },
      text: {
        primary: '#1e293b',
        secondary: '#64748b',
      },
      divider: '#e2e8f0',
    },
    typography: {
      fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      h1: { fontWeight: 700, fontSize: '2.25rem' },
      h2: { fontWeight: 700, fontSize: '1.875rem' },
      h3: { fontWeight: 600, fontSize: '1.5rem' },
      h4: { fontWeight: 600, fontSize: '1.25rem' },
      h5: { fontWeight: 600, fontSize: '1.125rem' },
      h6: { fontWeight: 600, fontSize: '1rem' },
      body1: { fontSize: '1rem', lineHeight: 1.6 },
      body2: { fontSize: '0.875rem', lineHeight: 1.5 },
      button: { textTransform: 'none', fontWeight: 600 },
    },
    shape: { borderRadius: 12 },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 12,
            fontWeight: 600,
            boxShadow: 'none',
            textTransform: 'none',
            '&:hover': {
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            },
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 16,
            boxShadow: '0 2px 12px rgba(0, 0, 0, 0.08)',
          },
        },
      },
      MuiTextField: {
        styleOverrides: {
          root: {
            '& .MuiOutlinedInput-root': {
              borderRadius: 12,
            },
          },
        },
      },
    },
  });

  // Create dark theme with better visibility
  const darkTheme = createTheme({
    palette: {
      mode: 'dark',
      primary: {
        main: '#6366f1',
        light: '#818cf8',
        dark: '#4f46e5',
        contrastText: '#ffffff',
      },
      secondary: {
        main: '#10b981',
        light: '#34d399',
        dark: '#059669',
        contrastText: '#ffffff',
      },
      background: {
        default: '#0f0f0f',
        paper: '#1a1a1a',
      },
      text: {
        primary: '#ffffff',
        secondary: '#a1a1aa',
        disabled: '#71717a',
      },
      divider: '#27272a',
      action: {
        hover: 'rgba(255, 255, 255, 0.08)',
        selected: 'rgba(99, 102, 241, 0.12)',
        disabled: 'rgba(255, 255, 255, 0.26)',
      },
    },
    typography: {
      fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      h1: { fontWeight: 700, fontSize: '2.25rem', color: '#ffffff' },
      h2: { fontWeight: 700, fontSize: '1.875rem', color: '#ffffff' },
      h3: { fontWeight: 600, fontSize: '1.5rem', color: '#ffffff' },
      h4: { fontWeight: 600, fontSize: '1.25rem', color: '#ffffff' },
      h5: { fontWeight: 600, fontSize: '1.125rem', color: '#ffffff' },
      h6: { fontWeight: 600, fontSize: '1rem', color: '#ffffff' },
      body1: { fontSize: '1rem', lineHeight: 1.6, color: '#e4e4e7' },
      body2: { fontSize: '0.875rem', lineHeight: 1.5, color: '#a1a1aa' },
      button: { textTransform: 'none', fontWeight: 600 },
    },
    shape: { borderRadius: 12 },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 12,
            fontWeight: 600,
            boxShadow: 'none',
            textTransform: 'none',
            '&:hover': {
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
            },
          },
          contained: {
            backgroundColor: '#6366f1',
            color: '#ffffff',
            '&:hover': {
              backgroundColor: '#5856eb',
            },
            '&:disabled': {
              backgroundColor: '#27272a',
              color: '#71717a',
            },
          },
          outlined: {
            borderColor: '#27272a',
            color: '#ffffff',
            '&:hover': {
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
              borderColor: '#6366f1',
            },
          },
          text: {
            color: '#ffffff',
            '&:hover': {
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
            },
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 16,
            backgroundColor: '#1a1a1a',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
            border: '1px solid #27272a',
          },
        },
      },
      MuiTextField: {
        styleOverrides: {
          root: {
            '& .MuiOutlinedInput-root': {
              borderRadius: 12,
              backgroundColor: '#27272a',
              '& fieldset': {
                borderColor: '#27272a',
              },
              '&:hover fieldset': {
                borderColor: '#6366f1',
              },
              '&.Mui-focused fieldset': {
                borderColor: '#6366f1',
              },
            },
            '& .MuiInputLabel-root': {
              color: '#a1a1aa',
              '&.Mui-focused': {
                color: '#6366f1',
              },
            },
            '& .MuiInputBase-input': {
              color: '#ffffff',
              '&::placeholder': {
                color: '#71717a',
                opacity: 1,
              },
            },
            '& .MuiFormHelperText-root': {
              color: '#a1a1aa',
              '&.Mui-error': {
                color: '#ef4444',
              },
            },
          },
        },
      },
      MuiAlert: {
        styleOverrides: {
          root: {
            borderRadius: 12,
            border: '1px solid',
          },
          standardError: {
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            borderColor: '#ef4444',
            color: '#ffffff',
          },
          standardSuccess: {
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            borderColor: '#10b981',
            color: '#ffffff',
          },
          standardWarning: {
            backgroundColor: 'rgba(245, 158, 11, 0.1)',
            borderColor: '#f59e0b',
            color: '#ffffff',
          },
          standardInfo: {
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            borderColor: '#3b82f6',
            color: '#ffffff',
          },
        },
      },
      MuiCircularProgress: {
        styleOverrides: {
          root: {
            color: '#6366f1',
          },
        },
      },
      MuiLink: {
        styleOverrides: {
          root: {
            color: '#6366f1',
            '&:hover': {
              color: '#818cf8',
            },
          },
        },
      },
      MuiDivider: {
        styleOverrides: {
          root: {
            borderColor: '#27272a',
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundColor: '#1a1a1a',
            backgroundImage: 'none',
          },
        },
      },
      MuiSelect: {
        styleOverrides: {
          root: {
            '& .MuiOutlinedInput-notchedOutline': {
              borderColor: '#27272a',
            },
            '&:hover .MuiOutlinedInput-notchedOutline': {
              borderColor: '#6366f1',
            },
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
              borderColor: '#6366f1',
            },
          },
        },
      },
      MuiMenuItem: {
        styleOverrides: {
          root: {
            color: '#ffffff',
            backgroundColor: '#1a1a1a',
            '&:hover': {
              backgroundColor: '#27272a',
            },
            '&.Mui-selected': {
              backgroundColor: 'rgba(99, 102, 241, 0.12)',
              '&:hover': {
                backgroundColor: 'rgba(99, 102, 241, 0.24)',
              },
            },
          },
        },
      },
    },
  });

  const theme = mode === 'light' ? lightTheme : darkTheme;

  return (
    <ThemeContext.Provider value={{ mode, toggleTheme }}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ThemeContext.Provider>
  );
};

// Export hook for easier usage
export const useCustomTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useCustomTheme must be used within a CustomThemeProvider');
  }
  return context;
};
