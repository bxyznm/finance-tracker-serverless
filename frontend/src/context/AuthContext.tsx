import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { UserFromToken, LoginRequest, RegisterRequest } from '../types/auth';
import { AuthService } from '../services/authService';
import toast from 'react-hot-toast';

interface AuthState {
  user: UserFromToken | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

type AuthAction = 
  | { type: 'AUTH_START' }
  | { type: 'AUTH_SUCCESS'; payload: UserFromToken }
  | { type: 'AUTH_FAILURE'; payload: string }
  | { type: 'AUTH_LOGOUT' }
  | { type: 'CLEAR_ERROR' };

interface AuthContextType extends AuthState {
  login: (credentials: LoginRequest) => Promise<void>;
  register: (userData: RegisterRequest) => Promise<void>;
  logout: () => void;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'AUTH_START':
      return {
        ...state,
        isLoading: true,
        error: null
      };
    case 'AUTH_SUCCESS':
      return {
        ...state,
        isLoading: false,
        isAuthenticated: true,
        user: action.payload,
        error: null
      };
    case 'AUTH_FAILURE':
      return {
        ...state,
        isLoading: false,
        isAuthenticated: false,
        user: null,
        error: action.payload
      };
    case 'AUTH_LOGOUT':
      return {
        ...state,
        isAuthenticated: false,
        user: null,
        isLoading: false,
        error: null
      };
    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null
      };
    default:
      return state;
  }
};

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Check if user has stored tokens on app load
  useEffect(() => {
    const initializeAuth = () => {
      if (AuthService.hasStoredTokens()) {
        const user = AuthService.getStoredUser();
        if (user) {
          dispatch({ type: 'AUTH_SUCCESS', payload: user });
        }
      }
    };

    initializeAuth();
  }, []);

  const login = async (credentials: LoginRequest) => {
    try {
      dispatch({ type: 'AUTH_START' });
      
      // Call your serverless backend
      const response = await AuthService.login(credentials);
      
      // Store authentication data on client
      AuthService.storeAuthData(response);
      
      // Get user data from the stored JWT token
      const userData = AuthService.getStoredUser();
      
      if (userData) {
        dispatch({ type: 'AUTH_SUCCESS', payload: userData });
        toast.success(`¡Bienvenido de vuelta, ${userData.email}!`);
      } else {
        throw new Error('No se pudo obtener la información del usuario del token');
      }
    } catch (error: any) {
      const errorMessage = error.message || 'Error al iniciar sesión';
      dispatch({ type: 'AUTH_FAILURE', payload: errorMessage });
      toast.error(errorMessage);
      throw error;
    }
  };

  const register = async (userData: RegisterRequest) => {
    try {
      dispatch({ type: 'AUTH_START' });
      
      // Call your serverless backend
      const response = await AuthService.register(userData);
      
      // Store authentication data on client
      AuthService.storeAuthData(response);
      
      // Get user data from the stored JWT token
      const userFromToken = AuthService.getStoredUser();
      
      if (userFromToken) {
        dispatch({ type: 'AUTH_SUCCESS', payload: userFromToken });
        toast.success(`¡Cuenta creada exitosamente! Bienvenido, ${userFromToken.email}!`);
      } else {
        throw new Error('No se pudo obtener la información del usuario del token');
      }
    } catch (error: any) {
      const errorMessage = error.message || 'Error al crear la cuenta';
      dispatch({ type: 'AUTH_FAILURE', payload: errorMessage });
      toast.error(errorMessage);
      throw error;
    }
  };

  const logout = () => {
    // Clear client-side data only
    AuthService.clearAuthData();
    dispatch({ type: 'AUTH_LOGOUT' });
    toast.success('Has cerrado sesión correctamente');
  };

  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  const contextValue: AuthContextType = {
    ...state,
    login,
    register,
    logout,
    clearError
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
