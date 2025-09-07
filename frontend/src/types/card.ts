// =============================================================================
// CARD TYPES
// =============================================================================

import { CurrencyCode } from './auth';

export type CardType = 
  | 'credit'
  | 'debit' 
  | 'prepaid'
  | 'business'
  | 'rewards'
  | 'store'
  | 'other';

export type CardNetwork = 
  | 'visa'
  | 'mastercard'
  | 'amex'
  | 'discover'
  | 'jcb'
  | 'unionpay'
  | 'diners'
  | 'other';

export type CardStatus = 
  | 'active'
  | 'blocked'
  | 'expired'
  | 'cancelled'
  | 'pending';

export type PaymentStatus = 
  | 'pending'
  | 'paid'
  | 'overdue'
  | 'partial'
  | 'cancelled';

export type TransactionType = 
  | 'purchase'
  | 'payment'
  | 'fee'
  | 'interest'
  | 'cashback'
  | 'refund';

// Complete card data from API
export interface Card {
  card_id: string;
  user_id: string;
  name: string;
  card_type: CardType;
  card_network: CardNetwork;
  bank_name: string;
  credit_limit?: number;
  current_balance: number;
  available_credit?: number;
  minimum_payment?: number;
  payment_due_date?: number;
  cut_off_date?: number;
  apr?: number;
  annual_fee?: number;
  rewards_program?: string;
  currency: CurrencyCode;
  color?: string;
  description?: string;
  status: CardStatus;
  days_until_due?: number;
  created_at: string;
  updated_at: string;
}

// Card creation request
export interface CreateCardRequest {
  name: string;
  card_type: CardType;
  card_network: CardNetwork;
  bank_name: string;
  credit_limit?: number;
  current_balance?: number;
  minimum_payment?: number;
  payment_due_date?: number;  // Día del mes para fecha de pago (1-31)
  cut_off_date?: number;      // Día del mes para fecha de corte (1-31)
  apr?: number;
  annual_fee?: number;
  rewards_program?: string;
  currency?: CurrencyCode;
  color?: string;
  description?: string;
  status?: CardStatus;
}

// Card update request
export interface UpdateCardRequest {
  name?: string;
  bank_name?: string;
  credit_limit?: number;
  minimum_payment?: number;
  payment_due_date?: number;
  apr?: number;
  annual_fee?: number;
  rewards_program?: string;
  color?: string;
  description?: string;
  status?: CardStatus;
}

// Card transaction
export interface CardTransaction {
  amount: number;
  description: string;
  transaction_type: TransactionType;
  transaction_date?: string;
}

// Card payment
export interface CardPayment {
  amount: number;
  payment_date?: string;
  description?: string;
}

// Card bill/statement
export interface CardBill {
  bill_id: string;
  card_id: string;
  user_id: string;
  billing_month: number;
  billing_year: number;
  statement_balance: number;
  minimum_payment: number;
  payment_due_date: string;
  status: PaymentStatus;
  paid_amount: number;
  late_fee: number;
  interest_charged: number;
  created_at: string;
  updated_at: string;
}

// Card list response from API
export interface CardListResponse {
  cards: Card[];
  total_count: number;
  active_count: number;
  total_debt_by_currency: Record<string, number>;
  total_available_credit: Record<string, number>;
}

// Card API response wrapper
export interface CardResponse {
  card: Card;
}

// Card form validation
export interface CardFormData {
  name: string;
  card_type: CardType;
  card_network: CardNetwork;
  bank_name: string;
  last_four_digits: string;
  expiry_month: number;
  expiry_year: number;
  credit_limit: string;
  current_balance: string;
  minimum_payment: string;
  payment_due_date: string;
  apr: string;
  annual_fee: string;
  rewards_program: string;
  currency: CurrencyCode;
  color: string;
  description: string;
  status: CardStatus;
}

// Card filter options
export interface CardFilters {
  status?: CardStatus;
  card_type?: CardType;
  card_network?: CardNetwork;
  currency?: CurrencyCode;
  expired_only?: boolean;
  due_soon?: boolean; // Cards with payment due in next 7 days
}

// Card statistics
export interface CardStats {
  total_cards: number;
  active_cards: number;
  expired_cards: number;
  total_debt: Record<CurrencyCode, number>;
  total_available_credit: Record<CurrencyCode, number>;
  cards_due_soon: number;
  highest_apr: number;
  lowest_apr: number;
}

// Card network configuration
export interface CardNetworkConfig {
  name: string;
  icon: string;
  color: string;
  patterns: RegExp[];
}

// Card type configuration
export interface CardTypeConfig {
  name: string;
  icon: string;
  description: string;
  features: string[];
}

// Utility types
export type CardSortBy = 
  | 'name' 
  | 'balance' 
  | 'credit_limit' 
  | 'due_date' 
  | 'created_at'
  | 'updated_at';

export type CardSortOrder = 'asc' | 'desc';

export interface CardSortConfig {
  sortBy: CardSortBy;
  sortOrder: CardSortOrder;
}
