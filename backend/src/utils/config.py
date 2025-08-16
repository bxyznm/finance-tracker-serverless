"""
Configuración de la aplicación.
Manejo centralizado de variables de entorno y configuraciones.
"""

import os
from typing import Optional


class Config:
    """Configuración de la aplicación."""
    
    # Configuración básica
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "dev")
    DEBUG: bool = os.getenv("DEBUG", "false").lower() == "true"
    VERSION: str = os.getenv("VERSION", "1.0.0")
    
    # Configuración de AWS
    AWS_REGION: str = os.getenv("APP_AWS_REGION", "mx-central-1")
    
    # Configuración de DynamoDB
    DYNAMODB_TABLE_PREFIX: str = os.getenv("DYNAMODB_TABLE_PREFIX", "finance-tracker")
    USERS_TABLE: str = f"{DYNAMODB_TABLE_PREFIX}-users"
    ACCOUNTS_TABLE: str = f"{DYNAMODB_TABLE_PREFIX}-accounts"
    TRANSACTIONS_TABLE: str = f"{DYNAMODB_TABLE_PREFIX}-transactions"
    CATEGORIES_TABLE: str = f"{DYNAMODB_TABLE_PREFIX}-categories"
    BUDGETS_TABLE: str = f"{DYNAMODB_TABLE_PREFIX}-budgets"
    
    # Configuración de autenticación
    JWT_SECRET_KEY: Optional[str] = os.getenv("JWT_SECRET_KEY")
    JWT_ALGORITHM: str = os.getenv("JWT_ALGORITHM", "HS256")
    JWT_EXPIRATION_HOURS: int = int(os.getenv("JWT_EXPIRATION_HOURS", "24"))
    
    # Configuración de CORS
    ALLOWED_ORIGINS: list = os.getenv(
        "ALLOWED_ORIGINS", 
        "http://localhost:3000,http://localhost:8080"
    ).split(",")
    
    # Configuración de logging
    LOG_LEVEL: str = os.getenv("LOG_LEVEL", "INFO")
    
    # Configuración específica de México
    DEFAULT_CURRENCY: str = "MXN"
    DEFAULT_TIMEZONE: str = "America/Mexico_City"
    DEFAULT_LOCALE: str = "es_MX"
    
    @classmethod
    def is_production(cls) -> bool:
        """Verificar si estamos en producción."""
        return cls.ENVIRONMENT.lower() == "production"
    
    @classmethod
    def is_development(cls) -> bool:
        """Verificar si estamos en desarrollo."""
        return cls.ENVIRONMENT.lower() in ["dev", "development"]
    
    @classmethod
    def get_table_name(cls, entity: str) -> str:
        """
        Obtener nombre de tabla para una entidad.
        
        Args:
            entity: Nombre de la entidad (users, accounts, etc.)
            
        Returns:
            Nombre completo de la tabla
        """
        return f"{cls.DYNAMODB_TABLE_PREFIX}-{entity}"


# Instancia global de configuración
config = Config()
