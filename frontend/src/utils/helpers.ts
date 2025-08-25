/**
 * Validation utilities for forms
 */

/**
 * Validate email format
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate password strength according to backend requirements
 */
export const isValidPassword = (password: string): { 
  isValid: boolean; 
  errors: string[]; 
  score: number;
  message: string;
} => {
  const errors: string[] = [];
  let score = 0;
  
  if (password.length < 8) {
    errors.push('La contraseña debe tener al menos 8 caracteres');
  } else {
    score += 1;
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Debe incluir al menos una letra mayúscula');
  } else {
    score += 1;
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Debe incluir al menos una letra minúscula');
  } else {
    score += 1;
  }
  
  if (!/\d/.test(password)) {
    errors.push('Debe incluir al menos un número');
  } else {
    score += 1;
  }
  
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Debe incluir al menos un carácter especial (!@#$%^&*(),.?":{}|<>)');
  } else {
    score += 1;
  }
  
  // Additional score for length
  if (password.length >= 12) {
    score += 1;
  }
  
  const messages = [
    'Muy débil',
    'Débil', 
    'Regular',
    'Buena',
    'Fuerte',
    'Muy fuerte'
  ];
  
  return {
    isValid: errors.length === 0,
    errors,
    score: Math.min(score, 5),
    message: messages[Math.min(score, 5)]
  };
};

/**
 * Validate name format (only letters, spaces, and accents)
 */
export const isValidName = (name: string): boolean => {
  const nameRegex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$/;
  return nameRegex.test(name.trim()) && name.trim().length >= 2;
};

/**
 * Format currency based on currency code
 */
export const formatCurrency = (amount: number, currencyCode: string): string => {
  const currencySymbols: Record<string, string> = {
    MXN: '$',
    USD: '$',
    EUR: '€',
    CAD: 'C$'
  };
  
  const symbol = currencySymbols[currencyCode] || '$';
  
  return `${symbol}${amount.toLocaleString('es-MX', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
};

/**
 * Format date to display in Spanish locale
 */
export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('es-MX', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

/**
 * Debounce function for search inputs
 */
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(null, args), delay);
  };
};

/**
 * Generate random ID for temporary items
 */
export const generateId = (): string => {
  return Math.random().toString(36).substr(2, 9);
};
