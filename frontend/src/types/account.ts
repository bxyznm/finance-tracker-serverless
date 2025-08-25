// =============================================================================
// ACCOUNT TYPES
// =============================================================================

export type BankCode = 
  | 'BBVA'
  | 'SANTANDER'
  | 'BANORTE'
  | 'HSBC'
  | 'CITIBANAMEX'
  | 'SCOTIABANK'
  | 'INBURSA'
  | 'AZTECA'
  | 'BAJIO'
  | 'BANREGIO';

export type AccountType = 'checking' | 'savings' | 'credit' | 'investment';

export type CurrencyCode = 'MXN' | 'USD' | 'EUR' | 'CAD';

// Complete account data from API
export interface Account {
  account_id: string;
  user_id: string;
  name: string;
  bank_code: BankCode;
  account_type: AccountType;
  currency: CurrencyCode;
  balance: number;
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
  balance: number;
  reason?: string;
}

// API response for single account
export interface AccountResponse {
  message: string;
  account: Account;
}

// API response for account list
export interface AccountListResponse {
  message: string;
  accounts: Account[];
  total_balance: Record<CurrencyCode, number>;
  total_accounts: number;
}

// =============================================================================
// CONSTANTS
// =============================================================================

export const BANK_OPTIONS: { value: BankCode; label: string }[] = [
  { value: 'BBVA', label: 'Banco Bilbao Vizcaya Argentaria' },
  { value: 'SANTANDER', label: 'Banco Santander México' },
  { value: 'BANORTE', label: 'Banco Mercantil del Norte' },
  { value: 'HSBC', label: 'HSBC México' },
  { value: 'CITIBANAMEX', label: 'Citibanamex' },
  { value: 'SCOTIABANK', label: 'Scotiabank México' },
  { value: 'INBURSA', label: 'Banco Inbursa' },
  { value: 'AZTECA', label: 'Banco Azteca' },
  { value: 'BAJIO', label: 'Banco del Bajío' },
  { value: 'BANREGIO', label: 'Banregio' },
];

export const ACCOUNT_TYPE_OPTIONS: { value: AccountType; label: string; icon: string }[] = [
  { value: 'checking', label: 'Checking Account', icon: '🏧' },
  { value: 'savings', label: 'Savings Account', icon: '💰' },
  { value: 'credit', label: 'Credit Card', icon: '💳' },
  { value: 'investment', label: 'Investment Account', icon: '📈' },
];

export const CURRENCY_OPTIONS: { value: CurrencyCode; label: string; symbol: string }[] = [
  { value: 'MXN', label: 'Mexican Peso', symbol: '$' },
  { value: 'USD', label: 'US Dollar', symbol: '$' },
  { value: 'EUR', label: 'Euro', symbol: '€' },
  { value: 'CAD', label: 'Canadian Dollar', symbol: 'C$' },
];

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
