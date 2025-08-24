# Finance Tracker - Backend

> **✅ Live**: API Gateway + AWS Lambda | **Stack**: Python 3.12 + DynamoDB | **Auth**: JWT

## 🚀 **API Base URL**
```
https://xbp9zivp7c.execute-api.mx-central-1.amazonaws.com/api
```

## 🏗️ **Architecture**
- **🐍 Python 3.12** + Pydantic V2
- **⚡ AWS Lambda** (6 functions)
- **🗄️ DynamoDB** Single Table Design  
- **🔒 JWT Auth** (access + refresh tokens)
- **📊 44 Tests** (100% pass rate)

## 📁 **Project Structure**
```
backend/src/
├── handlers/           # Lambda functions
│   ├── auth.py        # Register, login, refresh
│   ├── users.py       # Users CRUD
│   ├── accounts.py    # Bank accounts CRUD
│   └── health.py      # Health check
├── models/            # Pydantic models
│   ├── user.py        # User data models
│   └── account.py     # Account data models  
└── utils/             # Shared utilities
    ├── jwt_auth.py    # JWT handling
    ├── dynamodb_*.py  # Database patterns
## 🧪 **Development & Testing**

### **Local Setup**
```bash
cd backend
pip install -r requirements.txt

# Run tests
python -m pytest tests/ -v

# Run specific tests  
python -m pytest tests/test_auth.py -v
python -m pytest tests/test_accounts.py -v
```

### **Test Coverage ✅**
- **44 tests total** (100% pass rate)
- **Auth**: 6 tests (register, login, JWT)
- **Users**: 14 tests (CRUD + validations)
- **Accounts**: 14 tests (CRUD + balance)
- **Models**: 30 tests (data validation)

### **API Endpoints**
```bash
# Health check
GET /api/health

# Auth
POST /api/auth/register
POST /api/auth/login  
POST /api/auth/refresh

# Users (JWT required)
GET    /api/users/{user_id}
PUT    /api/users/{user_id}
DELETE /api/users/{user_id}

# Accounts (JWT required)
POST   /api/accounts
GET    /api/accounts
GET    /api/accounts/{account_id}
PUT    /api/accounts/{account_id}
PATCH  /api/accounts/{account_id}/balance
DELETE /api/accounts/{account_id}
```

---

**¿Necesitas más detalles?** Ver [README principal](../README.md) y archivos en `/docs/`
├── requirements-prod.txt  # Dependencias optimizadas para producción
└── README.md             # Este archivo
```

## 🚀 Instalación y Setup

### Prerequisitos
- Python 3.12+
- pip
- AWS CLI configurado
- Terraform (para despliegue)

### Instalación Local
```bash
# Navegar al directorio backend
cd backend

# Crear entorno virtual
python -m venv venv

# Activar entorno virtual
# En Windows:
venv\Scripts\activate
# En Linux/Mac:
source venv/bin/activate

# Instalar dependencias
pip install -r requirements.txt

# Configurar variables de entorno (opcional para testing)
export JWT_SECRET_KEY="dev-secret-key-change-in-production"
```

## 🧪 Testing

```bash
# Ejecutar todos los tests (44 tests) ✅
pytest

# Ejecutar tests con coverage
pytest --cov=src

# Ejecutar tests específicos por módulo
pytest tests/test_auth.py          # Tests de autenticación
pytest tests/test_users.py         # Tests de usuarios  
pytest tests/test_users_jwt.py     # Tests de JWT en endpoints de usuarios
pytest tests/test_accounts.py      # Tests de cuentas (handlers) ✅ NUEVO
pytest tests/test_account_models.py # Tests de modelos de cuentas ✅ NUEVO
pytest tests/test_jwt_auth.py      # Tests de utilidades JWT
pytest tests/test_health.py        # Tests del health check

# Ejecutar con verbose output
pytest -v

# Tests con cobertura HTML
pytest --cov=src --cov-report=html
```

### Resumen de Tests ✅
- **Total de tests**: 44 tests
- **Test coverage**: 100% en handlers y modelos críticos
- **Tests de usuarios**: 14 tests
- **Tests de cuentas**: 44 tests (14 handlers + 30 modelos) ✅ NUEVO
- **Pass rate**: 100% (44/44 tests passing)

## 📝 Endpoints Disponibles

### 🔐 Autenticación (Públicos)
- **POST** `/auth/register` - Registro de usuario
- **POST** `/auth/login` - Inicio de sesión  
- **POST** `/auth/refresh` - Renovar access token

### 👤 Usuarios (Requieren Autenticación)
- **GET** `/users/{user_id}` - Obtener datos de usuario
- **PUT** `/users/{user_id}` - Actualizar usuario
- **DELETE** `/users/{user_id}` - Eliminar usuario (soft delete)

### 🏦 Cuentas (Requieren Autenticación) ✅ **¡NUEVO!**
- **POST** `/accounts` - Crear cuenta bancaria/financiera
- **GET** `/accounts` - Listar cuentas del usuario
- **GET** `/accounts/{account_id}` - Obtener cuenta específica
- **PUT** `/accounts/{account_id}` - Actualizar información de cuenta
- **PATCH** `/accounts/{account_id}/balance` - Actualizar saldo de cuenta
- **DELETE** `/accounts/{account_id}` - Eliminar cuenta (soft delete)

### 💚 Salud del Sistema
- **GET** `/health` - Estado de la API

**Total de endpoints**: 16 endpoints funcionales ✅

## 🔑 Autenticación JWT

### Variables de Entorno
```bash
JWT_SECRET_KEY=your-production-secret-key
```

### Headers Requeridos (Endpoints Privados)
```bash
Authorization: Bearer <access_token>
Content-Type: application/json
```

### Token Structure
```json
{
  "access_token": "eyJ...",    // Válido por 30 minutos
  "refresh_token": "eyJ...",   // Válido por 7 días  
  "token_type": "Bearer",
  "expires_in": 1800,
  "user_id": "usr_123",
  "email": "user@example.com"
}
```

## 📋 Ejemplos de Uso

### Registro y Login
```bash
# Registrar usuario
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","password":"TestPass123!"}'

# Iniciar sesión
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"TestPass123!"}'
```

### Usar Endpoints Autenticados
```bash  
# Obtener usuario (requiere token)
curl -X GET http://localhost:3000/users/usr_123 \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Health Check
- **Endpoint:** `GET /health`
- **Descripción:** Verificar estado de la API
- **Response:**
```json
{
  "status": "healthy",
  "message": "Finance Tracker API is running",
  "timestamp": "2025-01-16T10:30:00Z",
  "version": "1.0.0",
  "environment": "dev"
}
```

## 🛠️ Desarrollo

### Estructura de Handlers
- **`handlers/auth.py`**: Maneja registro, login y refresh de tokens
- **`handlers/users.py`**: Maneja operaciones CRUD de usuarios (requiere auth)
- **`handlers/accounts.py`**: Maneja operaciones CRUD de cuentas bancarias (requiere auth) ✅ **¡NUEVO!**
- **`handlers/health.py`**: Endpoint de salud del sistema

### Modelos de Datos
- **`models/user.py`**: Modelos Pydantic V2 para validación de datos de usuarios
  - `UserCreate`: Registro de usuario
  - `UserLogin`: Login de usuario  
  - `UserResponse`: Respuesta de usuario
  - `UserUpdate`: Actualización de usuario

- **`models/account.py`**: Modelos Pydantic V2 para validación de datos de cuentas ✅ **¡NUEVO!**
  - `AccountCreate`: Creación de cuenta bancaria
  - `AccountUpdate`: Actualización de cuenta
  - `AccountResponse`: Respuesta de cuenta
  - `AccountBalance`: Actualización de saldo
  - `AccountListResponse`: Lista de cuentas con totales

### Utilidades
- **`utils/jwt_auth.py`**: Manejo completo de JWT (crear, validar, refresh, decorators)
- **`utils/dynamodb_client.py`**: Cliente optimizado de DynamoDB con Single Table Design
- **`utils/dynamodb_patterns.py`**: Patrones Single Table Design para múltiples entidades
- **`utils/responses.py`**: Utilidades para respuestas HTTP estandarizadas

## 📚 Documentación Detallada

Para documentación específica de endpoints, consulta:
- **[Endpoints de Autenticación](docs/auth-api.md)** - `/auth/register`, `/auth/login`, `/auth/refresh`
- **[Endpoints de Usuarios](docs/users-api.md)** - `/users/{user_id}` operations
- **[Endpoints de Cuentas](docs/accounts-api.md)** - `/accounts` operations ✅ **¡NUEVO!**
- **[JWT Implementation](docs/jwt-authentication.md)** - Detalles técnicos de JWT

### Features Implementados por Documentación ✅
- ✅ **Auth API**: 3 endpoints completos con JWT
- ✅ **Users API**: 3 endpoints con autenticación 
- ✅ **Accounts API**: 6 endpoints con CRUD completo ✅ **¡NUEVO!**
- ✅ **Health Check**: 1 endpoint de monitoreo
- ✅ **JWT Auth**: Sistema completo de autenticación

## 🚀 Despliegue

El backend se despliega automáticamente usando Terraform. Ver `/terraform/` para configuración de infraestructura.

### Variables de Entorno Requeridas
```bash
# Producción
JWT_SECRET_KEY=your-super-secure-production-key
AWS_REGION=mx-central-1
DYNAMODB_TABLE_NAME=finance-tracker-table
```
}
```

## ⚙️ Configuración

Las variables de entorno se manejan en `src/utils/config.py`:

- `ENVIRONMENT` - Entorno (dev, staging, production)
- `DEBUG` - Modo debug
- `AWS_REGION` - Región de AWS
- `DYNAMODB_TABLE_PREFIX` - Prefijo para tablas DynamoDB

## 🔧 Desarrollo

### Agregar Nuevo Handler
1. Crear archivo en `src/handlers/`
2. Implementar función `lambda_handler`
3. Agregar tests correspondientes
4. Documentar endpoint en este README

### Estándares de Código
- **Formatting:** Black
- **Linting:** Flake8
- **Type Checking:** MyPy
- **Testing:** Pytest con >80% coverage

## 🚀 Despliegue

El despliegue se maneja con Terraform (próximamente).

```bash
# Deploy a desarrollo
terraform apply -var="environment=dev"

# Deploy a producción
terraform apply -var="environment=production"
```

## 📊 Próximos Endpoints a Implementar

- [ ] `POST /api/transactions` - Crear transacción entre cuentas
- [ ] `GET /api/transactions` - Listar transacciones del usuario  
- [ ] `GET /api/transactions/{transaction_id}` - Obtener transacción específica
- [ ] `POST /api/categories` - Crear categoría de gastos/ingresos
- [ ] `GET /api/categories` - Listar categorías del usuario
- [ ] `POST /api/budgets` - Crear presupuesto
- [ ] `GET /api/budgets` - Listar presupuestos
- [ ] `GET /api/reports/summary` - Reporte resumen financiero
- [ ] `GET /api/reports/monthly` - Reporte mensual

### ✅ Endpoints Completados
- [x] **Authentication** (3 endpoints) - `POST /auth/*`  
- [x] **Users** (3 endpoints) - `GET|PUT|DELETE /users/{user_id}`
- [x] **Accounts** (6 endpoints) - Full CRUD `/accounts/*` ✅ **¡NUEVO!**
- [x] **Health** (1 endpoint) - `GET /health`

**Total implementado**: 16/25 endpoints (64% completado) ✅

## 🤝 Contribución

1. Seguir las guidelines del `PROJECT_PLAN.md`
2. Escribir tests para nuevas funcionalidades
3. Mantener coverage >80%
4. Usar type hints en Python
5. Documentar APIs con OpenAPI (próximamente)

---

*Para más información, revisar `PROJECT_PLAN.md` en el directorio raíz.*
