import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';

/**
 * Hook to protect routes that require authentication
 */
export const useRequireAuth = (redirectTo: string = '/login') => {
  const { isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate(redirectTo, { replace: true });
    }
  }, [isAuthenticated, isLoading, navigate, redirectTo]);

  return { isAuthenticated, isLoading };
};

/**
 * Hook to redirect authenticated users away from auth pages
 */
export const useRedirectIfAuthenticated = (redirectTo: string = '/dashboard') => {
  const { isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      navigate(redirectTo, { replace: true });
    }
  }, [isAuthenticated, isLoading, navigate, redirectTo]);

  return { isAuthenticated, isLoading };
};

/**
 * Hook for login functionality
 */
export const useLogin = () => {
  const { login, isLoading, error, clearError } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (credentials: { email: string; password: string }) => {
    try {
      await login(credentials);
      navigate('/dashboard', { replace: true });
    } catch (error) {
      // Error is handled in the context
    }
  };

  return {
    login: handleLogin,
    isLoading,
    error,
    clearError
  };
};

/**
 * Hook for register functionality
 */
export const useRegister = () => {
  const { register, isLoading, error, clearError } = useAuth();
  const navigate = useNavigate();

  const handleRegister = async (userData: {
    name: string;
    email: string;
    password: string;
    confirm_password: string;
    currency: string;
  }) => {
    try {
      await register(userData);
      navigate('/dashboard', { replace: true });
    } catch (error) {
      // Error is handled in the context
    }
  };

  return {
    register: handleRegister,
    isLoading,
    error,
    clearError
  };
};
