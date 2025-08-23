"""
Application configuration.
Centralized management of environment variables and settings.
"""

import os
from typing import Optional


class Config:
    """Application configuration."""
    
    # Basic configuration
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "dev")
    DEBUG: bool = os.getenv("DEBUG", "false").lower() == "true"
    VERSION: str = os.getenv("VERSION", "1.0.0")
    
    # AWS configuration
    AWS_REGION: str = os.getenv("APP_AWS_REGION", "mx-central-1")
    
    # DynamoDB configuration
    DYNAMODB_TABLE_PREFIX: str = os.getenv("DYNAMODB_TABLE_PREFIX", "finance-tracker")
    USERS_TABLE: str = f"{DYNAMODB_TABLE_PREFIX}-users"
    ACCOUNTS_TABLE: str = f"{DYNAMODB_TABLE_PREFIX}-accounts"
    TRANSACTIONS_TABLE: str = f"{DYNAMODB_TABLE_PREFIX}-transactions"
    CATEGORIES_TABLE: str = f"{DYNAMODB_TABLE_PREFIX}-categories"
    BUDGETS_TABLE: str = f"{DYNAMODB_TABLE_PREFIX}-budgets"
    
    # Authentication configuration
    JWT_SECRET_KEY: Optional[str] = os.getenv("JWT_SECRET_KEY")
    JWT_ALGORITHM: str = os.getenv("JWT_ALGORITHM", "HS256")
    JWT_EXPIRATION_HOURS: int = int(os.getenv("JWT_EXPIRATION_HOURS", "24"))
    
    # CORS configuration
    ALLOWED_ORIGINS: list = os.getenv(
        "ALLOWED_ORIGINS", 
        "http://localhost:3000,http://localhost:8080"
    ).split(",")
    
    # Logging configuration
    LOG_LEVEL: str = os.getenv("LOG_LEVEL", "INFO")
    
    # Mexico-specific configuration
    DEFAULT_CURRENCY: str = "MXN"
    DEFAULT_TIMEZONE: str = "America/Mexico_City"
    DEFAULT_LOCALE: str = "es_MX"
    
    @classmethod
    def is_production(cls) -> bool:
        """Check if we are in production."""
        return cls.ENVIRONMENT.lower() == "production"
    
    @classmethod
    def is_development(cls) -> bool:
        """Check if we are in development."""
        return cls.ENVIRONMENT.lower() in ["dev", "development"]
    
    @classmethod
    def get_table_name(cls, entity: str) -> str:
        """
        Get table name for an entity.
        
        Args:
            entity: Entity name (users, accounts, etc.)
            
        Returns:
            Complete table name
        """
        return f"{cls.DYNAMODB_TABLE_PREFIX}-{entity}"


# Global configuration instance
config = Config()
