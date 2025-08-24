// =============================================================================
// USER TYPES
// =============================================================================

// Minimal user data (from JWT token) - used for AuthContext
export interface UserFromToken {
  user_id: string;
  email: string;
}

// Complete user profile data (loaded from API) - used for Dashboard
export interface UserProfile {
  user_id: string;
  name: string;
  email: string;
  currency: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
  email_verified: boolean;
  last_login_at: string | null;
}

// =============================================================================
// AUTHENTICATION TYPES - API REQUEST/RESPONSE
// =============================================================================

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  confirm_password: string;
  currency: string;
}

// Backend response for login/register - only essential tokens
export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  message?: string;
}

export interface RefreshTokenRequest {
  refresh_token: string;
}

export interface RefreshTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

export interface ApiError {
  message: string;
  error?: string;
  details?: any;
}

export type CurrencyCode = 'MXN' | 'USD' | 'EUR' | 'CAD';

export const CURRENCY_OPTIONS: { value: CurrencyCode; label: string; symbol: string }[] = [
  { value: 'MXN', label: 'Peso Mexicano', symbol: '$' },
  { value: 'USD', label: 'Dólar Estadounidense', symbol: '$' },
  { value: 'EUR', label: 'Euro', symbol: '€' },
  { value: 'CAD', label: 'Dólar Canadiense', symbol: 'C$' },
];
