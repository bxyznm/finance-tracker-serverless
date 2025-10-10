/**
 * Tipos TypeScript para transacciones
 * Corresponden a los modelos Pydantic del backend
 */

// Tipos de transacción
export type TransactionType = 
  | "income"        // Ingreso
  | "expense"       // Gasto  
  | "transfer"      // Transferencia
  | "investment"    // Inversión
  | "refund"        // Reembolso
  | "fee"           // Comisión
  | "interest"      // Interés
  | "dividend"      // Dividendo
  | "bonus"         // Bono
  | "salary"        // Salario
  | "other";        // Otro

// Categorías de transacción para el mercado mexicano
export type TransactionCategory =
  // Ingresos
  | "salary"           // Salario
  | "freelance"        // Freelance
  | "business_income"  // Ingresos de negocio
  | "investment_gains" // Ganancias de inversión
  | "rental_income"    // Ingresos por renta
  | "gifts_received"   // Regalos recibidos
  | "refunds"          // Reembolsos
  | "other_income"     // Otros ingresos
  
  // Gastos
  | "food_drinks"      // Comida y bebidas
  | "transportation"   // Transporte
  | "shopping"         // Compras
  | "entertainment"    // Entretenimiento
  | "bills_utilities"  // Servicios y facturas
  | "healthcare"       // Salud
  | "education"        // Educación
  | "travel"          // Viajes
  | "insurance"       // Seguros
  | "taxes"           // Impuestos
  | "rent_mortgage"   // Renta/Hipoteca
  | "groceries"       // Supermercado
  | "restaurants"     // Restaurantes
  | "gas_fuel"        // Gasolina
  | "clothing"        // Ropa
  | "electronics"     // Electrónicos
  | "subscriptions"   // Suscripciones
  | "gifts_donations" // Regalos y donaciones
  | "bank_fees"       // Comisiones bancarias
  | "other_expenses"  // Otros gastos
  
  // Transferencias
  | "account_transfer" // Transferencia entre cuentas
  | "investment"       // Inversión
  | "savings"         // Ahorros
  | "debt_payment"    // Pago de deudas
  | "other_transfer"; // Otras transferencias

// Estado de transacción
export type TransactionStatus = 
  | "pending"      // Pendiente
  | "completed"    // Completada
  | "failed"       // Fallida
  | "cancelled";   // Cancelada

// Interfaz para crear una nueva transacción
export interface TransactionCreateRequest {
  account_id: string;
  amount: number;
  description: string;
  transaction_type: TransactionType;
  category: TransactionCategory;
  transaction_date?: string; // ISO format
  reference_number?: string;
  notes?: string;
  tags?: string[];
  location?: string;
  // Para transferencias
  destination_account_id?: string;
  // Para transacciones recurrentes
  is_recurring?: boolean;
  recurring_frequency?: "daily" | "weekly" | "monthly" | "yearly";
}

// Interfaz para actualizar una transacción
export interface TransactionUpdateRequest {
  description?: string;
  category?: TransactionCategory;
  notes?: string;
  tags?: string[];
  location?: string;
  reference_number?: string;
}

// Interfaz para respuesta de transacción
export interface Transaction {
  transaction_id: string;
  user_id: string;
  account_id: string;
  amount: number;
  description: string;
  transaction_type: TransactionType;
  category: TransactionCategory;
  transaction_date: string;
  created_at: string;
  updated_at?: string;
  reference_number?: string;
  notes?: string;
  tags?: string[];
  location?: string;
  // Para transferencias
  destination_account_id?: string;
  // Para transacciones recurrentes
  is_recurring: boolean;
  recurring_frequency?: string;
}

// Interfaz para filtros de transacciones
export interface TransactionFilter {
  account_id?: string;
  transaction_type?: TransactionType;
  category?: TransactionCategory;
  status?: TransactionStatus;
  date_from?: string; // ISO format
  date_to?: string;   // ISO format
  amount_min?: number;
  amount_max?: number;
  search_term?: string;
  tags?: string[];
  page?: number;
  per_page?: number;
  sort_by?: "date" | "amount" | "description" | "created_at";
  sort_order?: "asc" | "desc";
}

// Interfaz para lista de transacciones
export interface TransactionListResponse {
  transactions: Transaction[];
  total_count: number;
  page: number;
  per_page: number;
  total_pages: number;
  // Datos de resumen
  total_income: number;
  total_expenses: number;
  net_amount: number;
}

// Interfaz para resumen de transacciones
export interface TransactionSummary {
  period: string;
  total_income: number;
  total_expenses: number;
  net_amount: number;
  transaction_count: number;
  // Por categoría
  income_by_category: Record<string, number>;
  expenses_by_category: Record<string, number>;
  // Por cuenta
  activity_by_account: Record<string, any>;
  // Principales categorías
  top_expense_categories: Array<any>;
  top_income_categories: Array<any>;
}

// Labels en español para los tipos de transacción
export const TRANSACTION_TYPE_LABELS: Record<TransactionType, string> = {
  income: "Ingreso",
  expense: "Gasto",
  transfer: "Transferencia",
  investment: "Inversión",
  refund: "Reembolso",
  fee: "Comisión",
  interest: "Interés",
  dividend: "Dividendo",
  bonus: "Bono",
  salary: "Salario",
  other: "Otro"
};

// Labels en español para las categorías
export const TRANSACTION_CATEGORY_LABELS: Record<TransactionCategory, string> = {
  // Ingresos
  salary: "Salario",
  freelance: "Freelance",
  business_income: "Ingresos de Negocio",
  investment_gains: "Ganancias de Inversión",
  rental_income: "Ingresos por Renta",
  gifts_received: "Regalos Recibidos",
  refunds: "Reembolsos",
  other_income: "Otros Ingresos",
  
  // Gastos
  food_drinks: "Comida y Bebidas",
  transportation: "Transporte",
  shopping: "Compras",
  entertainment: "Entretenimiento",
  bills_utilities: "Servicios y Facturas",
  healthcare: "Salud",
  education: "Educación",
  travel: "Viajes",
  insurance: "Seguros",
  taxes: "Impuestos",
  rent_mortgage: "Renta/Hipoteca",
  groceries: "Supermercado",
  restaurants: "Restaurantes",
  gas_fuel: "Gasolina",
  clothing: "Ropa",
  electronics: "Electrónicos",
  subscriptions: "Suscripciones",
  gifts_donations: "Regalos y Donaciones",
  bank_fees: "Comisiones Bancarias",
  other_expenses: "Otros Gastos",
  
  // Transferencias  
  account_transfer: "Transferencia entre Cuentas",
  investment: "Inversión",
  savings: "Ahorros",
  debt_payment: "Pago de Deudas",
  other_transfer: "Otras Transferencias"
};

// Categorías agrupadas por tipo
export const INCOME_CATEGORIES: TransactionCategory[] = [
  "salary", "freelance", "business_income", "investment_gains", 
  "rental_income", "gifts_received", "refunds", "other_income"
];

export const EXPENSE_CATEGORIES: TransactionCategory[] = [
  "food_drinks", "transportation", "shopping", "entertainment",
  "bills_utilities", "healthcare", "education", "travel", "insurance",
  "taxes", "rent_mortgage", "groceries", "restaurants", "gas_fuel",
  "clothing", "electronics", "subscriptions", "gifts_donations",
  "bank_fees", "other_expenses"
];

export const TRANSFER_CATEGORIES: TransactionCategory[] = [
  "account_transfer", "investment", "savings", "debt_payment", "other_transfer"
];
