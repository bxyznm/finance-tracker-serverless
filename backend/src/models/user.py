"""
Data models for users using Pydantic
Defines data structure and validations for users
"""

from pydantic import BaseModel, EmailStr, Field, ConfigDict, field_validator
from typing import Optional
from datetime import datetime
import uuid
import re
import bcrypt

class UserBase(BaseModel):
    """Base model for users"""
    name: str = Field(..., min_length=2, max_length=100, description="Full name of the user")
    email: EmailStr = Field(..., description="Valid email of the user")
    currency: str = Field(default="MXN", pattern="^[A-Z]{3}$", description="Currency code in ISO format (e.g: MXN, USD)")
    
    @field_validator('name')
    @classmethod
    def validate_name(cls, v: str) -> str:
        """Validate that name only contains letters, spaces and accents"""
        if not re.match(r"^[a-zA-ZáéíóúüñÁÉÍÓÚÜÑ\s]+$", v.strip()):
            raise ValueError("Name can only contain letters, spaces and accents")
        return v.strip().title()  # Capitalize each word
    
    @field_validator('currency')
    @classmethod
    def validate_currency(cls, v: str) -> str:
        """Validate supported currency codes"""
        supported_currencies = ['MXN', 'USD', 'EUR', 'CAD']
        if v not in supported_currencies:
            raise ValueError(f"Currency not supported. Use: {', '.join(supported_currencies)}")
        return v

class UserCreate(UserBase):
    """Model for creating a new user"""
    password: str = Field(..., min_length=8, max_length=128, description="User password")
    confirm_password: str = Field(..., min_length=8, max_length=128, description="Password confirmation")
    
    @field_validator('password')
    @classmethod
    def validate_password(cls, v: str) -> str:
        """Validate password strength"""
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters long")
        if not re.search(r"[A-Z]", v):
            raise ValueError("Password must contain at least one uppercase letter")
        if not re.search(r"[a-z]", v):
            raise ValueError("Password must contain at least one lowercase letter")
        if not re.search(r"\d", v):
            raise ValueError("Password must contain at least one number")
        if not re.search(r"[!@#$%^&*(),.?\":{}|<>]", v):
            raise ValueError("Password must contain at least one special character")
        return v
    
    def __init__(self, **data):
        super().__init__(**data)
        # Validate that passwords match
        if self.password != self.confirm_password:
            raise ValueError("Passwords do not match")
    
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "name": "Bryan Torres",
                "email": "bryan@example.com",
                "currency": "MXN",
                "password": "MyPassword123!",
                "confirm_password": "MyPassword123!"
            }
        }
    )

class UserUpdate(BaseModel):
    """Model for updating an existing user"""
    name: Optional[str] = Field(None, min_length=2, max_length=100, description="Full name of the user")
    email: Optional[EmailStr] = Field(None, description="Valid email of the user")  
    currency: Optional[str] = Field(None, pattern="^[A-Z]{3}$", description="Currency code in ISO format")
    current_password: Optional[str] = Field(None, min_length=8, description="Current password (required for sensitive changes)")
    new_password: Optional[str] = Field(None, min_length=8, max_length=128, description="New password")
    confirm_new_password: Optional[str] = Field(None, min_length=8, max_length=128, description="New password confirmation")
    
    @field_validator('name')
    @classmethod
    def validate_name(cls, v: Optional[str]) -> Optional[str]:
        """Validate that name only contains letters, spaces and accents"""
        if v is not None:
            if not re.match(r"^[a-zA-ZáéíóúüñÁÉÍÓÚÜÑ\s]+$", v.strip()):
                raise ValueError("Name can only contain letters, spaces and accents")
            return v.strip().title()
        return v
    
    @field_validator('currency')
    @classmethod
    def validate_currency(cls, v: Optional[str]) -> Optional[str]:
        """Validate supported currency codes"""
        if v is not None:
            supported_currencies = ['MXN', 'USD', 'EUR', 'CAD']
            if v not in supported_currencies:
                raise ValueError(f"Currency not supported. Use: {', '.join(supported_currencies)}")
        return v
    
    @field_validator('new_password')
    @classmethod
    def validate_new_password(cls, v: Optional[str]) -> Optional[str]:
        """Validate new password strength"""
        if v is not None:
            if len(v) < 8:
                raise ValueError("Password must be at least 8 characters long")
            if not re.search(r"[A-Z]", v):
                raise ValueError("Password must contain at least one uppercase letter")
            if not re.search(r"[a-z]", v):
                raise ValueError("Password must contain at least one lowercase letter")
            if not re.search(r"\d", v):
                raise ValueError("Password must contain at least one number")
            if not re.search(r"[!@#$%^&*(),.?\":{}|<>]", v):
                raise ValueError("Password must contain at least one special character")
        return v
    
    def __init__(self, **data):
        super().__init__(**data)
        # Validate that new passwords match if provided
        if self.new_password and self.confirm_new_password:
            if self.new_password != self.confirm_new_password:
                raise ValueError("New passwords do not match")
        elif self.new_password and not self.confirm_new_password:
            raise ValueError("Must confirm new password")
        elif self.confirm_new_password and not self.new_password:
            raise ValueError("Must provide new password")
    
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "name": "Bryan Torres Updated",
                "email": "bryan.new@example.com",
                "currency": "USD",
                "current_password": "MyCurrentPassword123!",
                "new_password": "MyNewPassword456!",
                "confirm_new_password": "MyNewPassword456!"
            }
        }
    )

class UserLogin(BaseModel):
    """Model for user login"""
    email: EmailStr = Field(..., description="User email")
    password: str = Field(..., min_length=8, description="User password")
    
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "email": "bryan@example.com",
                "password": "MyPassword123!"
            }
        }
    )

class User(UserBase):
    """Complete user model (for responses)"""
    user_id: str = Field(..., description="Unique user ID")
    created_at: datetime = Field(..., description="Creation date")
    updated_at: datetime = Field(..., description="Last update date")
    is_active: bool = Field(default=True, description="Whether the user is active")
    email_verified: bool = Field(default=False, description="Whether the email is verified")
    last_login_at: Optional[datetime] = Field(None, description="Last login date")
    
    model_config = ConfigDict(
        from_attributes=True,
        json_schema_extra={
            "example": {
                "user_id": "usr_123abc456def",
                "name": "Bryan Torres",
                "email": "bryan@example.com", 
                "currency": "MXN",
                "created_at": "2025-08-16T07:00:00.000Z",
                "updated_at": "2025-08-16T07:00:00.000Z",
                "is_active": True,
                "email_verified": False,
                "last_login_at": "2025-08-16T09:30:00.000Z"
            }
        }
    )

    @classmethod
    def from_dynamodb_item(cls, item: dict) -> 'User':
        """
        Convert a DynamoDB item to User model
        
        Args:
            item: DynamoDB item with user fields
            
        Returns:
            User: Instance of User model
        """
        # Parse last_login_at if it exists and is not None
        last_login_at = None
        if item.get('last_login_at'):
            try:
                last_login_at = datetime.fromisoformat(item['last_login_at'])
            except (ValueError, TypeError):
                last_login_at = None
        
        return cls(
            user_id=item.get('user_id', ''),
            name=item.get('name', ''),
            email=item.get('email', ''),
            currency=item.get('currency', 'MXN'),
            created_at=datetime.fromisoformat(item.get('created_at', datetime.now().isoformat())),
            updated_at=datetime.fromisoformat(item.get('updated_at', datetime.now().isoformat())),
            is_active=item.get('is_active', True),
            email_verified=item.get('email_verified', False),
            last_login_at=last_login_at
        )

def generate_user_id() -> str:
    """
    Generate a unique ID for users
    
    Returns:
        str: Unique ID with 'usr_' prefix
    """
    return f"usr_{uuid.uuid4().hex[:12]}"

def hash_password(password: str) -> str:
    """
    Generate password hash using bcrypt
    
    Args:
        password: Plain text password
        
    Returns:
        str: Password hash
    """
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
    return hashed.decode('utf-8')

def verify_password(password: str, hashed_password: str) -> bool:
    """
    Verify password against its hash
    
    Args:
        password: Plain text password
        hashed_password: Stored hash
        
    Returns:
        bool: True if password is correct
    """
    return bcrypt.checkpw(password.encode('utf-8'), hashed_password.encode('utf-8'))

def create_user_from_input(user_data: UserCreate) -> dict:
    """
    Create user dictionary from UserCreate for storing in DynamoDB
    
    Args:
        user_data: Validated user data
        
    Returns:
        dict: Dictionary with all necessary fields for DynamoDB
    """
    now = datetime.now().isoformat()
    user_id = generate_user_id()
    
    return {
        'user_id': user_id,
        'name': user_data.name,
        'email': user_data.email.lower(),  # Normalize email to lowercase
        'currency': user_data.currency,
        'password_hash': hash_password(user_data.password),
        'created_at': now,
        'updated_at': now,
        'is_active': True,
        'email_verified': False,  # For future email verification implementation
        'failed_login_attempts': 0,
        'last_login_at': None
    }
