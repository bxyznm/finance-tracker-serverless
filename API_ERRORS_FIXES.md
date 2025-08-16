# 🐛 ERRORES IDENTIFICADOS Y CORRECCIONES

## **Fecha**: 15 de Agosto, 2025

---

### ⚠️ **PROBLEMAS CRÍTICOS IDENTIFICADOS**

#### **1. ImportError: Pydantic EmailStr**
**Error**: `ImportError: cannot import name 'EmailStr' from 'pydantic'`
**Ubicación**: `backend/src/models/user.py`
**Causa**: Pydantic v2 cambió la importación de EmailStr

**❌ Código Problemático:**
```python
from pydantic import BaseModel, EmailStr, Field, field_validator
```

**✅ Corrección:**
```python
from pydantic import BaseModel, Field, field_validator
from pydantic_core import PydanticCustomError
from pydantic.networks import EmailStr
# O mejor aún, usar email-validator
from email_validator import validate_email, EmailNotValidError
```

---

#### **2. Dependencia Faltante: email-validator**
**Error**: EmailStr requiere email-validator para funcionar
**Ubicación**: `backend/requirements.txt`
**Causa**: Dependencia no incluida en requirements

**❌ Requirements Actual:**
```
boto3==1.40.11
pydantic==2.11.7
fastapi==0.116.1
mangum==0.19.0
python-dotenv==1.0.1
```

**✅ Corrección:**
```
boto3==1.40.11
pydantic==2.11.7
email-validator==2.0.0
fastapi==0.116.1
mangum==0.19.0
python-dotenv==1.0.1
```

---

#### **3. Validador de Campo Deprecado**
**Error**: `@field_validator` syntax error
**Ubicación**: `backend/src/models/user.py`
**Causa**: Cambio de sintaxis en Pydantic v2

**❌ Código Problemático:**
```python
@field_validator('phone_number')
def validate_phone(cls, v):
    if v and not v.startswith('+52'):
        raise ValueError('Phone number must include Mexican country code (+52)')
    return v
```

**✅ Corrección:**
```python
@field_validator('phone_number')
@classmethod
def validate_phone(cls, v):
    if v and not v.startswith('+52'):
        raise ValueError('Phone number must include Mexican country code (+52)')
    return v
```

---

#### **4. Model Dump vs Dict**
**Error**: `AttributeError: 'UserResponse' object has no attribute 'model_dump'`
**Ubicación**: `backend/src/handlers/users.py`
**Causa**: Diferencias entre Pydantic v1 y v2

**❌ Código Problemático:**
```python
return created_response(
    data=user_response.model_dump(),
    message="User created successfully"
)
```

**✅ Corrección:**
```python
return created_response(
    data=user_response.model_dump() if hasattr(user_response, 'model_dump') else user_response.dict(),
    message="User created successfully"
)
```

---

### 🔧 **CORRECCIONES IMPLEMENTADAS**

#### **1. Modelo User Corregido**
```python
"""
User models for Finance Tracker API - FIXED VERSION
"""

from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, field_validator
from email_validator import validate_email, EmailNotValidError


class UserCreateRequest(BaseModel):
    """Schema for creating a new user"""
    first_name: str = Field(..., min_length=2, max_length=50)
    last_name: str = Field(..., min_length=2, max_length=100)
    email: str = Field(..., description="User's email (unique)")
    phone_number: Optional[str] = Field(None, pattern=r'^\+52\d{10}$')
    birth_date: Optional[str] = Field(None, description="Birth date (YYYY-MM-DD)")
    
    @field_validator('email')
    @classmethod
    def validate_email(cls, v):
        try:
            validate_email(v)
            return v
        except EmailNotValidError:
            raise ValueError('Invalid email address')
    
    @field_validator('phone_number')
    @classmethod  
    def validate_phone(cls, v):
        if v and not v.startswith('+52'):
            raise ValueError('Phone number must include Mexican country code (+52)')
        return v
```

#### **2. Requirements.txt Actualizado**
```
boto3==1.40.11
pydantic==2.11.7
email-validator==2.0.0
fastapi==0.116.1
mangum==0.19.0
python-dotenv==1.0.1
```

---

### 📋 **ARCHIVOS A CORREGIR**

1. ✅ `backend/src/models/user.py` - Importaciones y validadores
2. ✅ `backend/requirements.txt` - Agregar email-validator
3. ✅ `backend/src/handlers/users.py` - Manejo de model_dump()
4. 🔄 Lambda Layer - Recrear con nueva dependencia

---

### 🚀 **PASOS PARA CORREGIR**

1. **Actualizar dependencias**
2. **Corregir modelos Pydantic** 
3. **Recrear Lambda Layer** con email-validator
4. **Redesplegar funciones Lambda**
5. **Probar endpoints**

---

### ⏰ **PRIORIDAD**
- **CRÍTICO**: Sin estas correcciones la API no funciona
- **IMPACTO**: Todos los endpoints de usuarios fallan
- **TIEMPO ESTIMADO**: 15-20 minutos para corregir y redesplegar
