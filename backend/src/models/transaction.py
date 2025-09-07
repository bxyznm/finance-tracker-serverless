"""
Transaction models for validation using Pydantic
Handles financial transactions between accounts and general transaction tracking
"""

from pydantic import BaseModel, Field, field_validator
from typing import Optional, Literal, Dict, Any
from datetime import datetime
import re

# Transaction types
TransactionType = Literal[
    "income",        # Ingreso - money coming in
    "expense",       # Gasto - money going out
    "transfer",      # Transferencia - movement between accounts
    "investment",    # Inversión - investment transaction
    "refund",        # Reembolso - refund received
    "fee",           # Comisión - bank/service fee
    "interest",      # Interés - interest earned/paid
    "dividend",      # Dividendo - dividend received
    "bonus",         # Bono - bonus received
    "salary",        # Salario - salary payment
    "other"          # Otro - other type
]

# Transaction categories for Mexican market
TransactionCategory = Literal[
    # Ingresos (Income)
    "salary",           # Salario
    "freelance",        # Freelance
    "business_income",  # Ingresos de negocio
    "investment_gains", # Ganancias de inversión
    "rental_income",    # Ingresos por renta
    "gifts_received",   # Regalos recibidos
    "refunds",          # Reembolsos
    "other_income",     # Otros ingresos
    
    # Gastos (Expenses)
    "food_drinks",      # Comida y bebidas
    "transportation",   # Transporte
    "shopping",         # Compras
    "entertainment",    # Entretenimiento
    "bills_utilities",  # Servicios y facturas
    "healthcare",       # Salud
    "education",        # Educación
    "travel",          # Viajes
    "insurance",       # Seguros
    "taxes",           # Impuestos
    "rent_mortgage",   # Renta/Hipoteca
    "groceries",       # Supermercado
    "restaurants",     # Restaurantes
    "gas_fuel",        # Gasolina
    "clothing",        # Ropa
    "electronics",     # Electrónicos
    "subscriptions",   # Suscripciones
    "gifts_donations", # Regalos y donaciones
    "bank_fees",       # Comisiones bancarias
    "other_expenses",  # Otros gastos
    
    # Transferencias
    "account_transfer", # Transferencia entre cuentas
    "investment",       # Inversión
    "savings",         # Ahorros
    "debt_payment",    # Pago de deudas
    "other_transfer"   # Otras transferencias
]

# Transaction status
TransactionStatus = Literal[
    "pending",      # Pendiente
    "completed",    # Completada
    "failed",       # Fallida
    "cancelled"     # Cancelada
]

class TransactionCreate(BaseModel):
    """Model for creating a new transaction"""
    account_id: str = Field(..., min_length=1, description="Source account ID")
    amount: float = Field(..., description="Transaction amount")
    description: str = Field(..., min_length=1, max_length=255, description="Transaction description")
    transaction_type: TransactionType = Field(..., description="Type of transaction")
    category: TransactionCategory = Field(..., description="Transaction category")
    transaction_date: Optional[str] = Field(None, description="Transaction date (ISO format), defaults to now")
    reference_number: Optional[str] = Field(None, max_length=50, description="External reference number")
    notes: Optional[str] = Field(None, max_length=500, description="Additional notes")
    tags: Optional[list[str]] = Field(default_factory=list, description="Transaction tags")
    location: Optional[str] = Field(None, max_length=100, description="Transaction location")
    # For transfers
    destination_account_id: Optional[str] = Field(None, description="Destination account ID for transfers")
    # For recurring transactions
    is_recurring: bool = Field(default=False, description="Whether this is a recurring transaction")
    recurring_frequency: Optional[Literal["daily", "weekly", "monthly", "yearly"]] = Field(None, description="Frequency if recurring")

    @field_validator('amount')
    @classmethod
    def validate_amount(cls, v):
        if v == 0:
            raise ValueError('Transaction amount cannot be zero')
        if v < -999999999.99 or v > 999999999.99:
            raise ValueError('Amount must be between -999,999,999.99 and 999,999,999.99')
        return round(v, 2)

    @field_validator('description')
    @classmethod
    def validate_description(cls, v):
        if not v or v.isspace():
            raise ValueError('Transaction description cannot be empty or only spaces')
        return ' '.join(v.split())  # Normalize spaces

    @field_validator('transaction_date')
    @classmethod
    def validate_transaction_date(cls, v):
        if v is not None:
            try:
                # Validate ISO format
                datetime.fromisoformat(v.replace('Z', '+00:00'))
            except ValueError:
                raise ValueError('Transaction date must be in ISO format (YYYY-MM-DDTHH:MM:SS)')
        return v

    @field_validator('tags')
    @classmethod
    def validate_tags(cls, v):
        if v is not None:
            # Remove empty strings and normalize
            v = [tag.strip() for tag in v if tag and tag.strip()]
            # Limit number of tags
            if len(v) > 10:
                raise ValueError('Maximum 10 tags allowed')
            # Validate each tag
            for tag in v:
                if len(tag) > 30:
                    raise ValueError('Each tag must be 30 characters or less')
        return v

class TransactionUpdate(BaseModel):
    """Model for updating an existing transaction"""
    description: Optional[str] = Field(None, min_length=1, max_length=255, description="Transaction description")
    category: Optional[TransactionCategory] = Field(None, description="Transaction category")
    notes: Optional[str] = Field(None, max_length=500, description="Additional notes")
    tags: Optional[list[str]] = Field(None, description="Transaction tags")
    location: Optional[str] = Field(None, max_length=100, description="Transaction location")
    reference_number: Optional[str] = Field(None, max_length=50, description="External reference number")

    @field_validator('description')
    @classmethod
    def validate_description(cls, v):
        if v is not None:
            if not v or v.isspace():
                raise ValueError('Transaction description cannot be empty or only spaces')
            return ' '.join(v.split())
        return v

    @field_validator('tags')
    @classmethod
    def validate_tags(cls, v):
        if v is not None:
            # Remove empty strings and normalize
            v = [tag.strip() for tag in v if tag and tag.strip()]
            if len(v) > 10:
                raise ValueError('Maximum 10 tags allowed')
            for tag in v:
                if len(tag) > 30:
                    raise ValueError('Each tag must be 30 characters or less')
        return v

class TransactionResponse(BaseModel):
    """Model for transaction response"""
    transaction_id: str = Field(..., description="Unique transaction identifier")
    user_id: str = Field(..., description="Owner user ID")
    account_id: str = Field(..., description="Source account ID")
    account_name: str = Field(..., description="Source account name")
    amount: float = Field(..., description="Transaction amount")
    description: str = Field(..., description="Transaction description")
    transaction_type: TransactionType = Field(..., description="Type of transaction")
    category: TransactionCategory = Field(..., description="Transaction category")
    status: TransactionStatus = Field(..., description="Transaction status")
    transaction_date: str = Field(..., description="Transaction date (ISO format)")
    reference_number: Optional[str] = Field(None, description="External reference number")
    notes: Optional[str] = Field(None, description="Additional notes")
    tags: list[str] = Field(default_factory=list, description="Transaction tags")
    location: Optional[str] = Field(None, description="Transaction location")
    # For transfers
    destination_account_id: Optional[str] = Field(None, description="Destination account ID for transfers")
    destination_account_name: Optional[str] = Field(None, description="Destination account name for transfers")
    # Balance after transaction
    account_balance_after: float = Field(..., description="Account balance after this transaction")
    # Metadata
    created_at: str = Field(..., description="Creation timestamp")
    updated_at: str = Field(..., description="Last update timestamp")

class TransactionListResponse(BaseModel):
    """Model for listing transactions response"""
    transactions: list[TransactionResponse] = Field(..., description="List of transactions")
    total_count: int = Field(..., description="Total number of transactions")
    page: int = Field(default=1, description="Current page number")
    per_page: int = Field(default=50, description="Items per page")
    total_pages: int = Field(..., description="Total number of pages")
    # Summary data
    total_income: float = Field(default=0.0, description="Total income in the filtered period")
    total_expenses: float = Field(default=0.0, description="Total expenses in the filtered period")
    net_amount: float = Field(default=0.0, description="Net amount (income - expenses)")

class TransactionSummary(BaseModel):
    """Model for transaction summary/analytics"""
    period: str = Field(..., description="Summary period (e.g., '2024-01', 'last_30_days')")
    total_income: float = Field(..., description="Total income in period")
    total_expenses: float = Field(..., description="Total expenses in period")
    net_amount: float = Field(..., description="Net amount (income - expenses)")
    transaction_count: int = Field(..., description="Number of transactions")
    # By category
    income_by_category: Dict[str, float] = Field(default_factory=dict, description="Income breakdown by category")
    expenses_by_category: Dict[str, float] = Field(default_factory=dict, description="Expenses breakdown by category")
    # By account
    activity_by_account: Dict[str, Dict[str, Any]] = Field(default_factory=dict, description="Activity by account")
    # Top categories
    top_expense_categories: list[Dict[str, Any]] = Field(default_factory=list, description="Top expense categories")
    top_income_categories: list[Dict[str, Any]] = Field(default_factory=list, description="Top income categories")

class TransactionFilter(BaseModel):
    """Model for transaction filtering and search"""
    account_id: Optional[str] = Field(None, description="Filter by account ID")
    transaction_type: Optional[TransactionType] = Field(None, description="Filter by transaction type")
    category: Optional[TransactionCategory] = Field(None, description="Filter by category")
    status: Optional[TransactionStatus] = Field(None, description="Filter by status")
    date_from: Optional[str] = Field(None, description="Filter from date (ISO format)")
    date_to: Optional[str] = Field(None, description="Filter to date (ISO format)")
    amount_min: Optional[float] = Field(None, description="Minimum amount filter")
    amount_max: Optional[float] = Field(None, description="Maximum amount filter")
    search_term: Optional[str] = Field(None, description="Search in description, notes, reference_number")
    tags: Optional[list[str]] = Field(None, description="Filter by tags (OR logic)")
    page: int = Field(default=1, ge=1, description="Page number")
    per_page: int = Field(default=50, ge=1, le=100, description="Items per page")
    sort_by: Literal["date", "amount", "description", "created_at"] = Field(default="date", description="Sort field")
    sort_order: Literal["asc", "desc"] = Field(default="desc", description="Sort order")

    @field_validator('date_from', 'date_to')
    @classmethod
    def validate_dates(cls, v):
        if v is not None:
            try:
                datetime.fromisoformat(v.replace('Z', '+00:00'))
            except ValueError:
                raise ValueError('Date must be in ISO format (YYYY-MM-DDTHH:MM:SS)')
        return v
