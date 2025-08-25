import axios, { AxiosResponse } from 'axios';
import { 
  LoginRequest, 
  RegisterRequest, 
  AuthResponse, 
  RefreshTokenRequest, 
  RefreshTokenResponse 
} from '../types/auth';
import { getUserFromToken, isTokenExpired } from '../utils/jwt';
import { apiConfig } from '../config/api';

// Create axios instance with better timeout and error handling
const apiClient = axios.create({
  ...apiConfig,
  validateStatus: function (status) {
    return status < 500; // Accept all responses below 500 as valid
  }
});

export class AuthService {
  /**
   * Register a new user - calls your serverless backend
   */
  static async register(data: RegisterRequest): Promise<AuthResponse> {
    try {
      const response: AxiosResponse<AuthResponse> = await apiClient.post('/auth/register', data);
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  /**
   * Login user - calls your serverless backend
   */
  static async login(data: LoginRequest): Promise<AuthResponse> {
    try {
      const response: AxiosResponse<AuthResponse> = await apiClient.post('/auth/login', data);
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  /**
   * Refresh access token - calls your serverless backend
   */
  static async refreshToken(data: RefreshTokenRequest): Promise<RefreshTokenResponse> {
    try {
      const response: AxiosResponse<RefreshTokenResponse> = await apiClient.post('/auth/refresh', data);
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  /**
   * Create authenticated API client for other requests
   */
  static createAuthenticatedClient() {
    const token = localStorage.getItem('access_token');
    return axios.create({
      ...apiConfig,
      headers: {
        ...apiConfig.headers,
        ...(token && { Authorization: `Bearer ${token}` })
      },
    });
  }

  /**
   * Client-side helper: Clear stored authentication data
   */
  static clearAuthData(): void {
    // Only store essential JWT tokens - no sensitive user data
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  }

  /**
   * Client-side helper: Check if user has valid tokens
   */
  static hasStoredTokens(): boolean {
    const token = localStorage.getItem('access_token');
    const refreshToken = localStorage.getItem('refresh_token');
    
    if (!token || !refreshToken) return false;
    
    // Check if access token is expired
    return !isTokenExpired(token);
  }

  /**
   * Client-side helper: Get user data from JWT token
   */
  static getStoredUser() {
    const token = localStorage.getItem('access_token');
    if (!token) return null;
    
    return getUserFromToken(token);
  }

  /**
   * Client-side helper: Store authentication data (only tokens!)
   */
  static storeAuthData(authResponse: AuthResponse): void {
    // Only store essential JWT tokens - user data is in the token itself
    localStorage.setItem('access_token', authResponse.access_token);
    localStorage.setItem('refresh_token', authResponse.refresh_token);
  }

  /**
   * Handle API errors consistently
   */
  private static handleError(error: any) {
    console.error('API Error:', error);
    
    if (error.code === 'ECONNABORTED' && error.message.includes('timeout')) {
      return {
        message: 'El servidor está tardando en responder. Esto es normal en la primera solicitud (cold start de AWS Lambda). Intenta de nuevo.',
        error: 'TIMEOUT_ERROR'
      };
    }
    
    if (error.response?.data) {
      return error.response.data;
    }
    
    if (error.code === 'ERR_NETWORK') {
      return {
        message: 'Error de conexión. Verifica tu conexión a internet y que el servidor esté funcionando.',
        error: 'NETWORK_ERROR'
      };
    }
    
    return {
      message: error.message || 'Error inesperado. Intenta de nuevo.',
      error: 'UNKNOWN_ERROR'
    };
  }
}

// Export the refresh function for external use if needed
export const { refreshToken: refreshAccessToken } = AuthService;
