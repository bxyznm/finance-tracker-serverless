"""
Card models for validation using Pydantic
Handles credit cards, debit cards, and related financial instruments
"""

from pydantic import BaseModel, Field, field_validator
from typing import Optional, Literal
from datetime import datetime, date
import re

# Supported card types
CardType = Literal[
    "credit",        # Tarjeta de crédito
    "debit",         # Tarjeta de débito
    "prepaid",       # Tarjeta prepagada
    "business",      # Tarjeta empresarial
    "rewards",       # Tarjeta de recompensas
    "store",         # Tarjeta de tienda
    "other"          # Otro tipo
]

# Card networks
CardNetwork = Literal[
    "visa",          # Visa
    "mastercard",    # Mastercard
    "amex",          # American Express
    "discover",      # Discover
    "jcb",           # JCB
    "unionpay",      # UnionPay
    "diners",        # Diners Club
    "other"          # Otra red
]

# Card status
CardStatus = Literal[
    "active",        # Activa
    "blocked",       # Bloqueada
    "expired",       # Vencida
    "cancelled",     # Cancelada
    "pending"        # Pendiente de activación
]

# Payment status for bills
PaymentStatus = Literal[
    "pending",       # Pendiente
    "paid",          # Pagado
    "overdue",       # Vencido
    "partial",       # Pago parcial
    "cancelled"      # Cancelado
]

class CardCreate(BaseModel):
    """Model for creating a new card"""
    name: str = Field(..., min_length=1, max_length=100, description="Card display name")
    card_type: CardType = Field(..., description="Type of card")
    card_network: CardNetwork = Field(..., description="Card network (Visa, Mastercard, etc.)")
    bank_name: str = Field(..., min_length=1, max_length=50, description="Issuing bank name")
    credit_limit: Optional[float] = Field(None, ge=0, description="Credit limit for credit cards")
    current_balance: float = Field(default=0.0, description="Current balance/debt")
    minimum_payment: Optional[float] = Field(None, ge=0, description="Minimum monthly payment")
    payment_due_date: Optional[int] = Field(None, ge=1, le=31, description="Day of month payment is due")
    cut_off_date: Optional[int] = Field(None, ge=1, le=31, description="Day of month for statement cut-off")
    apr: Optional[float] = Field(None, ge=0, le=100, description="Annual Percentage Rate")
    annual_fee: Optional[float] = Field(None, ge=0, description="Annual fee amount")
    rewards_program: Optional[str] = Field(None, max_length=100, description="Rewards program name")
    currency: str = Field(default="MXN", description="Card currency")
    color: Optional[str] = Field(None, description="Hex color for UI display")
    description: Optional[str] = Field(None, max_length=255, description="Card description/notes")
    status: CardStatus = Field(default="active", description="Card status")

    @field_validator('name')
    @classmethod
    def validate_name(cls, v):
        if not v or v.isspace():
            raise ValueError('Card name cannot be empty or only spaces')
        return ' '.join(v.split())

    @field_validator('currency')
    @classmethod
    def validate_currency(cls, v):
        valid_currencies = ['MXN', 'USD', 'EUR', 'CAD', 'GBP', 'JPY']
        if v.upper() not in valid_currencies:
            raise ValueError(f'Currency must be one of: {", ".join(valid_currencies)}')
        return v.upper()

    @field_validator('color')
    @classmethod
    def validate_color(cls, v):
        if v is None:
            return v
        if not re.match(r'^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$', v):
            raise ValueError('Color must be a valid hex color (e.g., #FF0000 or #F00)')
        return v.upper()

    @field_validator('current_balance', 'credit_limit', 'minimum_payment', 'annual_fee')
    @classmethod
    def validate_monetary_amounts(cls, v):
        if v is not None:
            if v < -999999999.99 or v > 999999999.99:
                raise ValueError('Amount must be between -999,999,999.99 and 999,999,999.99')
            return round(v, 2)
        return v

class CardUpdate(BaseModel):
    """Model for updating an existing card"""
    name: Optional[str] = Field(None, min_length=1, max_length=100, description="Card display name")
    bank_name: Optional[str] = Field(None, min_length=1, max_length=50, description="Issuing bank name")
    credit_limit: Optional[float] = Field(None, ge=0, description="Credit limit for credit cards")
    minimum_payment: Optional[float] = Field(None, ge=0, description="Minimum monthly payment")
    payment_due_date: Optional[int] = Field(None, ge=1, le=31, description="Day of month payment is due")
    apr: Optional[float] = Field(None, ge=0, le=100, description="Annual Percentage Rate")
    annual_fee: Optional[float] = Field(None, ge=0, description="Annual fee amount")
    rewards_program: Optional[str] = Field(None, max_length=100, description="Rewards program name")
    color: Optional[str] = Field(None, description="Hex color for UI display")
    description: Optional[str] = Field(None, max_length=255, description="Card description/notes")
    status: Optional[CardStatus] = Field(None, description="Card status")

    @field_validator('name')
    @classmethod
    def validate_name(cls, v):
        if v is not None:
            if not v or v.isspace():
                raise ValueError('Card name cannot be empty or only spaces')
            return ' '.join(v.split())
        return v

    @field_validator('color')
    @classmethod
    def validate_color(cls, v):
        if v is not None and v != "":
            if not re.match(r'^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$', v):
                raise ValueError('Color must be a valid hex color (e.g., #FF0000 or #F00)')
            return v.upper()
        return v

    @field_validator('credit_limit', 'minimum_payment', 'annual_fee')
    @classmethod
    def validate_monetary_amounts(cls, v):
        if v is not None:
            if v < 0 or v > 999999999.99:
                raise ValueError('Amount must be between 0 and 999,999,999.99')
            return round(v, 2)
        return v

class CardResponse(BaseModel):
    """Model for card response"""
    card_id: str = Field(..., description="Unique card identifier")
    user_id: str = Field(..., description="Owner user ID")
    name: str = Field(..., description="Card display name")
    card_type: CardType = Field(..., description="Type of card")
    card_network: CardNetwork = Field(..., description="Card network")
    bank_name: str = Field(..., description="Issuing bank name")
    credit_limit: Optional[float] = Field(None, description="Credit limit")
    current_balance: float = Field(..., description="Current balance/debt")
    available_credit: Optional[float] = Field(None, description="Available credit (calculated)")
    minimum_payment: Optional[float] = Field(None, description="Minimum monthly payment")
    payment_due_date: Optional[int] = Field(None, description="Day of month payment is due")
    cut_off_date: Optional[int] = Field(None, description="Day of month for statement cut-off")
    apr: Optional[float] = Field(None, description="Annual Percentage Rate")
    annual_fee: Optional[float] = Field(None, description="Annual fee amount")
    rewards_program: Optional[str] = Field(None, description="Rewards program name")
    currency: str = Field(..., description="Card currency")
    color: Optional[str] = Field(None, description="Hex color for UI display")
    description: Optional[str] = Field(None, description="Card description/notes")
    status: CardStatus = Field(..., description="Card status")
    days_until_due: Optional[int] = Field(None, description="Days until next payment due")
    created_at: str = Field(..., description="Creation timestamp")
    updated_at: str = Field(..., description="Last update timestamp")

class CardTransaction(BaseModel):
    """Model for card transaction"""
    amount: float = Field(..., description="Transaction amount")
    description: str = Field(..., min_length=1, max_length=255, description="Transaction description")
    transaction_type: Literal["purchase", "payment", "fee", "interest", "cashback", "refund"] = Field(..., description="Type of transaction")
    transaction_date: Optional[str] = Field(None, description="Transaction date (ISO format)")

    @field_validator('amount')
    @classmethod
    def validate_amount(cls, v):
        if v == 0:
            raise ValueError('Transaction amount cannot be zero')
        if v < -999999999.99 or v > 999999999.99:
            raise ValueError('Amount must be between -999,999,999.99 and 999,999,999.99')
        return round(v, 2)

class CardPayment(BaseModel):
    """Model for card payment"""
    amount: float = Field(..., gt=0, description="Payment amount")
    payment_date: Optional[str] = Field(None, description="Payment date (ISO format)")
    description: Optional[str] = Field(None, max_length=255, description="Payment description")

    @field_validator('amount')
    @classmethod
    def validate_amount(cls, v):
        if v <= 0:
            raise ValueError('Payment amount must be greater than zero')
        if v > 999999999.99:
            raise ValueError('Payment amount must be less than 999,999,999.99')
        return round(v, 2)

class CardBill(BaseModel):
    """Model for monthly card bill"""
    bill_id: str = Field(..., description="Unique bill identifier")
    card_id: str = Field(..., description="Associated card ID")
    user_id: str = Field(..., description="Owner user ID")
    billing_month: int = Field(..., ge=1, le=12, description="Billing month")
    billing_year: int = Field(..., ge=2024, description="Billing year")
    statement_balance: float = Field(..., description="Statement balance")
    minimum_payment: float = Field(..., description="Minimum payment due")
    payment_due_date: str = Field(..., description="Payment due date")
    status: PaymentStatus = Field(..., description="Payment status")
    paid_amount: float = Field(default=0.0, description="Amount paid towards bill")
    late_fee: float = Field(default=0.0, description="Late fee charged")
    interest_charged: float = Field(default=0.0, description="Interest charged")
    created_at: str = Field(..., description="Bill creation timestamp")
    updated_at: str = Field(..., description="Last update timestamp")

class CardListResponse(BaseModel):
    """Model for listing cards response"""
    cards: list[CardResponse] = Field(..., description="List of user cards")
    total_count: int = Field(..., description="Total number of cards")
    active_count: int = Field(..., description="Number of active cards")
    total_debt_by_currency: dict[str, float] = Field(..., description="Total debt grouped by currency")
    total_available_credit: dict[str, float] = Field(..., description="Total available credit by currency")
