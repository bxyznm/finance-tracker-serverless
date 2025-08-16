"""
User models for Finance Tracker API.

This module defines P    @field_validator('phone_number')
    @classmethod
    def validate_phone(cls, v):
        if v and not v.startswith('+52'):
            raise ValueError('Phone number must include Mexican country code (+52)')
        return vic models for user validation and serialization.
Models include validation for email format and Mexican phone numbers.
"""

from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, field_validator
from email_validator import validate_email, EmailNotValidError
import uuid


class UserCreateRequest(BaseModel):
    """Schema for creating a new user"""
    first_name: str = Field(..., min_length=2, max_length=50, description="User's first name")
    last_name: str = Field(..., min_length=2, max_length=100, description="User's last name")
    email: str = Field(..., description="User's email (unique)")
    phone_number: Optional[str] = Field(None, pattern=r'^\+52\d{10}$', description="Mexican phone number (+52XXXXXXXXXX)")
    birth_date: Optional[str] = Field(None, description="Birth date (YYYY-MM-DD)")
    
    @field_validator('email')
    @classmethod
    def validate_email_format(cls, v):
        """Validate email format using email-validator"""
        try:
            # Use check_deliverability=False for development/testing
            validated_email = validate_email(v, check_deliverability=False)
            return validated_email.email
        except EmailNotValidError as e:
            raise ValueError(f'Invalid email format: {str(e)}')
    
    @field_validator('phone_number')
    @classmethod
    def validate_phone(cls, v):
        if v and not v.startswith('+52'):
            raise ValueError('Phone number must include Mexican country code (+52)')
        return v


class UserResponse(BaseModel):
    """Schema for user response"""
    user_id: str = Field(..., description="Unique user ID")
    first_name: str = Field(..., description="User's first name")
    last_name: str = Field(..., description="User's last name")
    email: str = Field(..., description="User's email")
    phone_number: Optional[str] = Field(None, description="User's phone number")
    birth_date: Optional[str] = Field(None, description="User's birth date")
    created_at: str = Field(..., description="Creation timestamp (ISO 8601)")
    updated_at: str = Field(..., description="Last update timestamp (ISO 8601)")
    is_active: bool = Field(default=True, description="User status")
    
    class Config:
        from_attributes = True


class UserUpdateRequest(BaseModel):
    """Schema for updating user information"""
    first_name: Optional[str] = Field(None, min_length=2, max_length=50, description="User's first name")
    last_name: Optional[str] = Field(None, min_length=2, max_length=100, description="User's last name")
    phone_number: Optional[str] = Field(None, pattern=r'^\+52\d{10}$', description="Mexican phone number (+52XXXXXXXXXX)")
    birth_date: Optional[str] = Field(None, description="Birth date (YYYY-MM-DD)")
    
    @field_validator('phone_number')
    def validate_phone_number(cls, v):
        if v and not v.startswith('+52'):
            raise ValueError('Phone number must include Mexican country code (+52)')
        return v


class UserDynamoDBModel:
    """Model for DynamoDB conversions"""
    
    @staticmethod
    def from_create_request(user_data: UserCreateRequest) -> dict:
        """Converts UserCreateRequest to DynamoDB format"""
        user_id = str(uuid.uuid4())
        timestamp = datetime.utcnow().isoformat() + 'Z'
        
        item = {
            'PK': f'USER#{user_id}',
            'SK': f'USER#{user_id}',
            'user_id': user_id,
            'first_name': user_data.first_name,
            'last_name': user_data.last_name,
            'email': user_data.email.lower(),  # Email in lowercase for consistency
            'created_at': timestamp,
            'active': True,
            'GSI1PK': f'EMAIL#{user_data.email.lower()}',  # For email search
            'GSI1SK': f'USER#{user_id}',
        }
        
        # Optional fields
        if user_data.phone:
            item['phone'] = user_data.phone
            
        if user_data.birth_date:
            item['birth_date'] = user_data.birth_date
            
        return item
    
    @staticmethod
    def to_user_response(dynamodb_item: dict) -> UserResponse:
        """Converts DynamoDB item to UserResponse"""
        return UserResponse(
            user_id=dynamodb_item['user_id'],
            first_name=dynamodb_item['first_name'],
            last_name=dynamodb_item['last_name'],
            email=dynamodb_item['email'],
            phone=dynamodb_item.get('phone'),
            birth_date=dynamodb_item.get('birth_date'),
            created_at=dynamodb_item['created_at'],
            active=dynamodb_item.get('active', True)
        )


# Constants for DynamoDB
class UserTableKeys:
    """Constants for user table keys"""
    PK = 'PK'  # USER#{user_id}
    SK = 'SK'  # USER#{user_id}
    GSI1PK = 'GSI1PK'  # EMAIL#{email}
    GSI1SK = 'GSI1SK'  # USER#{user_id}
