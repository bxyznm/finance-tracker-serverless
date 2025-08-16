"""
Application configuration.
Centralized management of environment variables and settings.
"""

import os
from typing import Optional


class Config:
    """Application configuration."""
    
    @property
    def environment(self) -> str:
        return os.getenv("ENVIRONMENT", "dev")
    
    @property
    def debug(self) -> bool:
        return os.getenv("DEBUG", "false").lower() == "true"
    
    @property
    def version(self) -> str:
        return os.getenv("VERSION", "1.0.0")
    
    @property
    def aws_region(self) -> str:
        # First try AWS_REGION (standard), then APP_AWS_REGION (custom), then default
        return os.getenv("AWS_REGION") or os.getenv("APP_AWS_REGION", "mx-central-1")
    
    # DynamoDB configuration
    @property
    def users_table_name(self) -> str:
        return os.getenv("USERS_TABLE", "finance-tracker-dev-users")
    
    @property
    def accounts_table_name(self) -> str:
        return os.getenv("ACCOUNTS_TABLE", "finance-tracker-dev-accounts")
    
    @property
    def transactions_table_name(self) -> str:
        return os.getenv("TRANSACTIONS_TABLE", "finance-tracker-dev-transactions")
    
    @property
    def categories_table_name(self) -> str:
        return os.getenv("CATEGORIES_TABLE", "finance-tracker-dev-categories")
    
    @property
    def budgets_table_name(self) -> str:
        return os.getenv("BUDGETS_TABLE", "finance-tracker-dev-budgets")
    
    # Authentication configuration
    @property
    def jwt_secret_key(self) -> Optional[str]:
        return os.getenv("JWT_SECRET_KEY")
    
    @property
    def jwt_algorithm(self) -> str:
        return os.getenv("JWT_ALGORITHM", "HS256")
    
    @property
    def jwt_expiration_hours(self) -> int:
        return int(os.getenv("JWT_EXPIRATION_HOURS", "24"))
    
    # CORS configuration
    @property
    def allowed_origins(self) -> list:
        return os.getenv(
            "ALLOWED_ORIGINS", 
            "http://localhost:3000,http://localhost:8080"
        ).split(",")
    
    @property
    def log_level(self) -> str:
        return os.getenv("LOG_LEVEL", "INFO")
    
    # Mexico-specific configuration
    @property
    def default_currency(self) -> str:
        return os.getenv("DEFAULT_CURRENCY", "MXN")
    
    @property
    def default_timezone(self) -> str:
        return os.getenv("DEFAULT_TIMEZONE", "America/Mexico_City")
    
    @property
    def default_locale(self) -> str:
        return os.getenv("DEFAULT_LOCALE", "es_MX")
    
    def is_production(self) -> bool:
        """Check if we are in production."""
        return self.environment.lower() == "production"
    
    def is_development(self) -> bool:
        """Check if we are in development."""
        return self.environment.lower() in ["dev", "development"]


def get_config() -> Config:
    """
    Get application configuration instance.
    
    Returns:
        Config instance with environment settings
    """
    return Config()


# Global configuration instance
config = Config()
