// =============================================================================
// ACCOUNT TYPES
// =============================================================================

export type BankCode = 
  | 'bbva'
  | 'santander'
  | 'banorte'
  | 'hsbc'
  | 'banamex'
  | 'scotiabank'
  | 'inbursa'
  | 'azteca'
  | 'bajio'
  | 'other';

export type AccountType = 'checking' | 'savings' | 'credit_card' | 'investment';

export type CurrencyCode = 'MXN' | 'USD' | 'EUR' | 'CAD';

// Complete account data from API
export interface Account {
  account_id: string;
  user_id: string;
  name: string;
  bank_code?: BankCode;
  bank_name: string;
  account_type: AccountType;
  currency: CurrencyCode;
  current_balance: number;
  color?: string;
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Account creation request
export interface CreateAccountRequest {
  name: string;
  bank_code: BankCode;
  bank_name: string;  // Requerido por el backend
  account_type: AccountType;
  currency: CurrencyCode;
  initial_balance?: number;
  color?: string;
  description?: string;
}

// Account update request (only editable fields)
export interface UpdateAccountRequest {
  name?: string;
  color?: string;
  description?: string;
}

// Balance update request
export interface UpdateBalanceRequest {
  amount: number;
  description?: string;
}

// API response for single account
export interface AccountResponse {
  message: string;
  account: Account;
}

// API response for account list
export interface AccountListResponse {
  message?: string;
  accounts: Account[];
  total_balance_by_currency: Record<CurrencyCode, number>;
  total_count: number;
  active_count: number;
}

// =============================================================================
// CONSTANTS
// =============================================================================

export const BANK_OPTIONS: { value: BankCode; label: string }[] = [
  { value: 'bbva', label: 'BBVA México' },
  { value: 'santander', label: 'Banco Santander México' },
  { value: 'banorte', label: 'Banco Mercantil del Norte' },
  { value: 'hsbc', label: 'HSBC México' },
  { value: 'banamex', label: 'Citibanamex' },
  { value: 'scotiabank', label: 'Scotiabank México' },
  { value: 'inbursa', label: 'Banco Inbursa' },
  { value: 'azteca', label: 'Banco Azteca' },
  { value: 'bajio', label: 'Banco del Bajío' },
  { value: 'other', label: 'Otro Banco' },
];

export const ACCOUNT_TYPE_OPTIONS: { value: AccountType; label: string; icon: string }[] = [
  { value: 'checking', label: 'Checking Account', icon: '🏧' },
  { value: 'savings', label: 'Savings Account', icon: '💰' },
  { value: 'credit_card', label: 'Credit Card', icon: '💳' },
  { value: 'investment', label: 'Investment Account', icon: '📈' },
];

export const CURRENCY_OPTIONS: { value: CurrencyCode; label: string; symbol: string }[] = [
  { value: 'MXN', label: 'Mexican Peso', symbol: '$' },
  { value: 'USD', label: 'US Dollar', symbol: '$' },
  { value: 'EUR', label: 'Euro', symbol: '€' },
  { value: 'CAD', label: 'Canadian Dollar', symbol: 'C$' },
];

// Helper function to get bank name from bank code
export const getBankName = (bankCode: BankCode): string => {
  const bank = BANK_OPTIONS.find(b => b.value === bankCode);
  return bank?.label || 'Unknown Bank';
};

export const DEFAULT_ACCOUNT_COLORS = [
  '#1f77b4', // Blue
  '#ff7f0e', // Orange
  '#2ca02c', // Green
  '#d62728', // Red
  '#9467bd', // Purple
  '#8c564b', // Brown
  '#e377c2', // Pink
  '#7f7f7f', // Gray
  '#bcbd22', // Olive
  '#17becf', // Cyan
];
