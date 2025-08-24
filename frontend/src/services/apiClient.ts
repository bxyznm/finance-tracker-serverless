import { AxiosRequestConfig, AxiosResponse } from 'axios';
import { AuthService } from './authService';

/**
 * Utility for making authenticated API calls to your serverless backend
 * This handles token refresh automatically when needed
 */
export class ApiClient {
  /**
   * Make an authenticated request to your serverless backend
   * Automatically handles token refresh if needed
   */
  static async makeAuthenticatedRequest<T = any>(
    endpoint: string,
    options: AxiosRequestConfig = {}
  ): Promise<AxiosResponse<T>> {
    let client = AuthService.createAuthenticatedClient();
    
    try {
      // Make the initial request
      const response = await client.request({
        url: endpoint,
        method: 'GET',
        ...options,
      });
      
      return response;
    } catch (error: any) {
      // If token expired, try to refresh and retry once
      if (error.response?.status === 401) {
        try {
          const refreshToken = localStorage.getItem('refresh_token');
          if (refreshToken) {
            const refreshResponse = await AuthService.refreshToken({ 
              refresh_token: refreshToken 
            });
            
            // Update stored tokens - only essential data
            localStorage.setItem('access_token', refreshResponse.access_token);
            
            // Retry the original request with new token
            client = AuthService.createAuthenticatedClient();
            return await client.request({
              url: endpoint,
              ...options,
            });
          }
        } catch (refreshError) {
          // Refresh failed, clear auth data and redirect to login
          AuthService.clearAuthData();
          window.location.href = '/login';
          throw refreshError;
        }
      }
      
      throw error;
    }
  }
}

/**
 * Convenience functions for common HTTP methods
 */
export const apiGet = <T = any>(endpoint: string) => 
  ApiClient.makeAuthenticatedRequest<T>(endpoint, { method: 'GET' });

export const apiPost = <T = any>(endpoint: string, data: any) =>
  ApiClient.makeAuthenticatedRequest<T>(endpoint, {
    method: 'POST',
    data,
  });

export const apiPut = <T = any>(endpoint: string, data: any) =>
  ApiClient.makeAuthenticatedRequest<T>(endpoint, {
    method: 'PUT',
    data,
  });

export const apiDelete = <T = any>(endpoint: string) =>
  ApiClient.makeAuthenticatedRequest<T>(endpoint, { method: 'DELETE' });
