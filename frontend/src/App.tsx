import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { Toaster } from 'react-hot-toast';

import { AuthProvider, CustomThemeProvider, useTheme } from './context';
import {
  LoginPage,
  RegisterPage,
  DashboardPage,
  AccountsPage,
  TransactionsPage,
  CategoriesPage,
  ReportsPage,
  ProfilePage,
  SettingsPage
} from './pages';
import { ProtectedRoute } from './components';

// Create React Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

const AppContent: React.FC = () => {
  const { mode } = useTheme();

  return (
    <>
      <Router>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/accounts" 
            element={
              <ProtectedRoute>
                <AccountsPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/transactions" 
            element={
              <ProtectedRoute>
                <TransactionsPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/categories" 
            element={
              <ProtectedRoute>
                <CategoriesPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/reports" 
            element={
              <ProtectedRoute>
                <ReportsPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/profile" 
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/settings" 
            element={
              <ProtectedRoute>
                <SettingsPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/" 
            element={
              <ProtectedRoute>
                <Navigate to="/dashboard" replace />
              </ProtectedRoute>
            } 
          />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
      
      {/* Toast notifications */}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: mode === 'light' ? '#ffffff' : '#1a1a1a',
            color: mode === 'light' ? '#1e293b' : '#ffffff',
            borderRadius: '12px',
            padding: '12px 16px',
            fontSize: '14px',
            fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            border: mode === 'light' ? '1px solid #e2e8f0' : '1px solid #27272a',
            boxShadow: mode === 'light' 
              ? '0 4px 12px rgba(0, 0, 0, 0.08)' 
              : '0 8px 32px rgba(0, 0, 0, 0.4)',
          },
          success: {
            style: {
              background: mode === 'light' 
                ? 'rgba(16, 185, 129, 0.1)' 
                : 'rgba(16, 185, 129, 0.9)',
              border: '1px solid #10b981',
              color: mode === 'light' ? '#065f46' : '#ffffff',
            },
          },
          error: {
            style: {
              background: mode === 'light' 
                ? 'rgba(239, 68, 68, 0.1)' 
                : 'rgba(239, 68, 68, 0.9)',
              border: '1px solid #ef4444',
              color: mode === 'light' ? '#991b1b' : '#ffffff',
            },
          },
        }}
      />
    </>
  );
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <CustomThemeProvider>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </CustomThemeProvider>
      
      {/* React Query DevTools - only in development */}
      {process.env.NODE_ENV === 'development' && <ReactQueryDevtools />}
    </QueryClientProvider>
  );
}

export default App;