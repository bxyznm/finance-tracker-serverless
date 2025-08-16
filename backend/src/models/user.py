"""
Modelos de datos para usuarios usando Pydantic
Define la estructura de datos y validaciones para users
"""

from pydantic import BaseModel, EmailStr, Field, ConfigDict
from typing import Optional
from datetime import datetime
import uuid

class UserBase(BaseModel):
    """Modelo base para usuarios"""
    name: str = Field(..., min_length=1, max_length=100, description="Nombre completo del usuario")
    email: EmailStr = Field(..., description="Email válido del usuario")
    currency: str = Field(default="MXN", pattern="^[A-Z]{3}$", description="Código de moneda en formato ISO (ej: MXN, USD)")

class UserCreate(UserBase):
    """Modelo para crear un nuevo usuario"""
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "name": "Bryan Torres",
                "email": "bryan@example.com",
                "currency": "MXN"
            }
        }
    )

class UserUpdate(BaseModel):
    """Modelo para actualizar un usuario existente"""
    name: Optional[str] = Field(None, min_length=1, max_length=100, description="Nombre completo del usuario")
    email: Optional[EmailStr] = Field(None, description="Email válido del usuario")  
    currency: Optional[str] = Field(None, pattern="^[A-Z]{3}$", description="Código de moneda en formato ISO")
    
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "name": "Bryan Torres Actualizado",
                "email": "bryan.nuevo@example.com",
                "currency": "USD"
            }
        }
    )

class User(UserBase):
    """Modelo completo del usuario (para respuestas)"""
    user_id: str = Field(..., description="ID único del usuario")
    created_at: datetime = Field(..., description="Fecha de creación")
    updated_at: datetime = Field(..., description="Fecha de última actualización")
    is_active: bool = Field(default=True, description="Si el usuario está activo")
    
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
                "is_active": True
            }
        }
    )

    @classmethod
    def from_dynamodb_item(cls, item: dict) -> 'User':
        """
        Convertir un item de DynamoDB al modelo User
        
        Args:
            item: Item de DynamoDB con los campos del usuario
            
        Returns:
            User: Instancia del modelo User
        """
        return cls(
            user_id=item.get('user_id', ''),
            name=item.get('name', ''),
            email=item.get('email', ''),
            currency=item.get('currency', 'MXN'),
            created_at=datetime.fromisoformat(item.get('created_at', datetime.now().isoformat())),
            updated_at=datetime.fromisoformat(item.get('updated_at', datetime.now().isoformat())),
            is_active=item.get('is_active', True)
        )

def generate_user_id() -> str:
    """
    Generar un ID único para usuarios
    
    Returns:
        str: ID único con prefijo 'usr_'
    """
    return f"usr_{uuid.uuid4().hex[:12]}"

def create_user_from_input(user_data: UserCreate) -> dict:
    """
    Crear diccionario de usuario desde UserCreate para almacenar en DynamoDB
    
    Args:
        user_data: Datos validados del usuario
        
    Returns:
        dict: Diccionario con todos los campos necesarios para DynamoDB
    """
    now = datetime.now().isoformat()
    user_id = generate_user_id()
    
    return {
        'user_id': user_id,
        'name': user_data.name,
        'email': user_data.email,
        'currency': user_data.currency,
        'created_at': now,
        'updated_at': now,
        'is_active': True
    }
