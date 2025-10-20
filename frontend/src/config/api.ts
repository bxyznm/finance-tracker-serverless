// API Configuration
// This file handles API base URL configuration for different environments

const isDevelopment = process.env.NODE_ENV === 'development';
const isProduction = process.env.NODE_ENV === 'production';

// Production API URL - Updated to correct endpoint
const PRODUCTION_API_URL = 'https://aadzwc24la.execute-api.mx-central-1.amazonaws.com/dev';

// Development API URL - uses proxy to avoid CORS issues
const DEVELOPMENT_API_URL = '/dev';

/**
 * Get the appropriate API base URL based on the current environment
 */
export const getApiBaseUrl = (): string => {
  if (isDevelopment) {
    // In development, use proxy defined in package.json
    return DEVELOPMENT_API_URL;
  }
  
  if (isProduction) {
    // In production, use the full AWS API Gateway URL
    return PRODUCTION_API_URL;
  }
  
  // Fallback to production URL
  return PRODUCTION_API_URL;
};

/**
 * Configuration object for API settings
 */
export const apiConfig = {
  baseURL: getApiBaseUrl(),
  timeout: isDevelopment ? 30000 : 10000, // Longer timeout in dev for cold starts
  headers: {
    'Content-Type': 'application/json',
  },
};

/**
 * Allowed origins for CORS (this is just for reference)
 * The actual CORS configuration is handled by the backend
 */
export const allowedOrigins = [
  'http://localhost:3000',
  'https://localhost:3000',
  'https://finance-tracker.brxvn.xyz',
  'https://financetracker.brxvn.xyz',
];

export default apiConfig;
