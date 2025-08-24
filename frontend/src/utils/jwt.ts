/**
 * JWT Token utilities for client-side token handling
 * WARNING: This only decodes the token payload - it does NOT verify the signature
 * Token verification happens on the backend
 */

interface JWTPayload {
  user_id: string;
  email: string;
  exp: number;
  iat: number;
  token_type: string;
}

/**
 * Decode JWT token payload (client-side only, no signature verification)
 * This is safe because signature verification happens on the backend
 */
export const decodeJWTPayload = (token: string): JWTPayload | null => {
  try {
    // JWT has 3 parts: header.payload.signature
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }

    // Decode the payload (base64url)
    const payload = parts[1];
    const decodedPayload = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(decodedPayload);
  } catch (error) {
    console.error('Error decoding JWT:', error);
    return null;
  }
};

/**
 * Check if JWT token is expired (client-side check)
 */
export const isTokenExpired = (token: string): boolean => {
  const payload = decodeJWTPayload(token);
  if (!payload) return true;

  const currentTime = Math.floor(Date.now() / 1000);
  return payload.exp < currentTime;
};

/**
 * Get user info from JWT token
 */
export const getUserFromToken = (token: string): { user_id: string; email: string } | null => {
  const payload = decodeJWTPayload(token);
  if (!payload) return null;

  return {
    user_id: payload.user_id,
    email: payload.email
  };
};
