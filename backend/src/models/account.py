"""
Account models for validation using Pydantic
Handles bank accounts and financial accounts management
"""

from pydantic import BaseModel, Field, field_validator
from typing import Optional, Literal
from datetime import datetime
import re

# Supported account types
AccountType = Literal[
    "checking",      # Cuenta de cheques
    "savings",       # Cuenta de ahorros  
    "credit_card",   # Tarjeta de crédito
    "investment",    # Cuenta de inversión
    "cash",          # Efectivo
    "loan",          # Préstamo
    "other"          # Otro tipo
]

# Supported banks/institutions in Mexico
BankCode = Literal[
    "bbva",          # BBVA México
    "banamex",       # Citibanamex
    "santander",     # Santander México
    "banorte",       # Banorte
    "hsbc",          # HSBC México
    "scotiabank",    # Scotiabank México
    "inbursa",       # Banco Inbursa
    "azteca",        # Banco Azteca
    "bajio",         # BanBajío
    "mifel",         # Banca Mifel
    "actinver",      # Actinver
    "invex",         # Banco Invex
    "multiva",       # Multiva
    "ve_por_mas",    # Ve por Más
    "bank_of_america", # Bank of America
    "chase",         # JPMorgan Chase
    "wells_fargo",   # Wells Fargo
    "citi",          # Citibank
    "other"          # Otro banco
]

class AccountCreate(BaseModel):
    """Model for creating a new account"""
    name: str = Field(..., min_length=1, max_length=100, description="Account name")
    account_type: AccountType = Field(..., description="Type of account")
    bank_name: str = Field(..., min_length=1, max_length=50, description="Bank or institution name")
    bank_code: Optional[BankCode] = Field(None, description="Bank code for known institutions")
    currency: str = Field(default="MXN", description="Account currency")
    initial_balance: float = Field(default=0.0, description="Initial account balance")
    is_active: bool = Field(default=True, description="Whether account is active")
    description: Optional[str] = Field(None, max_length=255, description="Account description")
    color: Optional[str] = Field(None, description="Hex color for UI display")

    @field_validator('name')
    @classmethod
    def validate_name(cls, v):
        if not v or v.isspace():
            raise ValueError('Account name cannot be empty or only spaces')
        # Remove extra spaces
        return ' '.join(v.split())

    @field_validator('currency')
    @classmethod
    def validate_currency(cls, v):
        # Support common currencies
        valid_currencies = ['MXN', 'USD', 'EUR', 'CAD', 'GBP', 'JPY']
        if v.upper() not in valid_currencies:
            raise ValueError(f'Currency must be one of: {", ".join(valid_currencies)}')
        return v.upper()

    @field_validator('color')
    @classmethod
    def validate_color(cls, v):
        if v is None:
            return v
        # Validate hex color format
        if not re.match(r'^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$', v):
            raise ValueError('Color must be a valid hex color (e.g., #FF0000 or #F00)')
        return v.upper()

    @field_validator('initial_balance')
    @classmethod
    def validate_initial_balance(cls, v):
        # Allow negative balances for credit cards and loans
        if v < -999999999.99 or v > 999999999.99:
            raise ValueError('Initial balance must be between -999,999,999.99 and 999,999,999.99')
        return round(v, 2)

class AccountUpdate(BaseModel):
    """Model for updating an existing account"""
    name: Optional[str] = Field(None, min_length=1, max_length=100, description="Account name")
    account_type: Optional[AccountType] = Field(None, description="Type of account")
    bank_name: Optional[str] = Field(None, min_length=1, max_length=50, description="Bank name")
    bank_code: Optional[BankCode] = Field(None, description="Bank code")
    currency: Optional[str] = Field(None, description="Account currency")
    is_active: Optional[bool] = Field(None, description="Whether account is active")
    description: Optional[str] = Field(None, max_length=255, description="Account description")
    color: Optional[str] = Field(None, description="Hex color for UI display")

    @field_validator('name')
    @classmethod
    def validate_name(cls, v):
        if v is not None:
            if not v or v.isspace():
                raise ValueError('Account name cannot be empty or only spaces')
            return ' '.join(v.split())
        return v

    @field_validator('currency')
    @classmethod
    def validate_currency(cls, v):
        if v is not None:
            valid_currencies = ['MXN', 'USD', 'EUR', 'CAD', 'GBP', 'JPY']
            if v.upper() not in valid_currencies:
                raise ValueError(f'Currency must be one of: {", ".join(valid_currencies)}')
            return v.upper()
        return v

    @field_validator('color')
    @classmethod
    def validate_color(cls, v):
        if v is not None and v != "":
            if not re.match(r'^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$', v):
                raise ValueError('Color must be a valid hex color (e.g., #FF0000 or #F00)')
            return v.upper()
        return v

class AccountResponse(BaseModel):
    """Model for account response"""
    account_id: str = Field(..., description="Unique account identifier")
    user_id: str = Field(..., description="Owner user ID")
    name: str = Field(..., description="Account name")
    account_type: AccountType = Field(..., description="Type of account")
    bank_name: str = Field(..., description="Bank or institution name")
    bank_code: Optional[BankCode] = Field(None, description="Bank code")
    currency: str = Field(..., description="Account currency")
    current_balance: float = Field(..., description="Current account balance")
    is_active: bool = Field(..., description="Whether account is active")
    description: Optional[str] = Field(None, description="Account description")
    color: Optional[str] = Field(None, description="Hex color for UI display")
    created_at: str = Field(..., description="Creation timestamp")
    updated_at: str = Field(..., description="Last update timestamp")

class AccountBalance(BaseModel):
    """Model for account balance operations"""
    amount: float = Field(..., description="Amount to add/subtract")
    description: Optional[str] = Field(None, max_length=255, description="Balance change description")

    @field_validator('amount')
    @classmethod
    def validate_amount(cls, v):
        if v == 0:
            raise ValueError('Amount cannot be zero')
        if v < -999999999.99 or v > 999999999.99:
            raise ValueError('Amount must be between -999,999,999.99 and 999,999,999.99')
        return round(v, 2)

class AccountListResponse(BaseModel):
    """Model for listing accounts response"""
    accounts: list[AccountResponse] = Field(..., description="List of user accounts")
    total_count: int = Field(..., description="Total number of accounts")
    active_count: int = Field(..., description="Number of active accounts")
    total_balance_by_currency: dict[str, float] = Field(..., description="Total balance grouped by currency")
