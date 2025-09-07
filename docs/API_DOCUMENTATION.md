# 📚 API Documentation - Finance Tracker

Documentación completa y actualizada de todos los endpoints disponibles en el Finance Tracker API.

## 🌐 **Base URL Actual**

### **Producción (Actual)**
```
Base URL: https://sjlc3gosfe.execute-api.mx-central-1.amazonaws.com/dev
Health Check: https://sjlc3gosfe.execute-api.mx-central-1.amazonaws.com/dev/health
Status: ✅ EN LÍNEA Y FUNCIONANDO
```

### **Información de la API**
- **Región**: Mexico Central (mx-central-1)  
- **Protocolo**: HTTPS (TLS 1.2+)
- **Formato**: JSON únicamente
- **Encoding**: UTF-8
- **Rate Limiting**: 1000 requests/minuto por IP
- **CORS**: Habilitado para https://finance-tracker.brxvn.xyz

## 🔑 **Sistema de Autenticación JWT**

La API utiliza **JWT (JSON Web Tokens)** con patrón access/refresh token.

### **Headers de Autenticación**
```http
Authorization: Bearer <access_token>
Content-Type: application/json
```

### **Token Lifecycle**
- **Access Token**: Válido por 1 hora, contiene permisos y user_id
- **Refresh Token**: Válido por 7 días, solo para renovar access_token
- **Renovación**: Automática via `/auth/refresh` endpoint

---

## 🚀 **Endpoints Disponibles**

### � **Health Check** (Público)

#### **GET** `/health`
Verificar estado de la API y conectividad.

**Request:**
```bash
curl https://sjlc3gosfe.execute-api.mx-central-1.amazonaws.com/dev/health
```

**Response Success (200):**
```json
{
  "status": "healthy",
  "message": "Finance Tracker API is running", 
  "timestamp": "2025-09-02T05:24:12.087300+00:00",
  "version": "1.0.0",
  "environment": "dev"
}
```

---

### �🔐 **Autenticación** (Público)

#### **POST** `/auth/register`
Registrar nuevo usuario en el sistema.

**Request Body:**
```json
{
  "name": "Juan Pérez",
  "email": "juan.perez@gmail.com",
  "password": "MiPassword123!",
  "currency": "MXN"
}
```

**Response Success (201):**
```json
{
  "message": "Usuario creado exitosamente",
  "user": {
    "user_id": "usr_abc123def456",
    "name": "Juan Pérez", 
    "email": "juan.perez@gmail.com",
    "currency": "MXN",
    "is_active": true,
    "created_at": "2025-09-02T10:30:00.000Z"
  },
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Validaciones:**
- Email debe ser válido y único
- Password mínimo 8 caracteres, al menos 1 mayúscula, 1 número
- Name máximo 100 caracteres
- Currency debe ser código ISO válido (MXN, USD, EUR, etc.)

#### **POST** `/auth/login`
Iniciar sesión de usuario existente.

**Request Body:**
```json
{
  "email": "juan.perez@gmail.com",
  "password": "MiPassword123!"
}
```

**Response Success (200):**
```json
{
  "message": "Login exitoso", 
  "user": {
    "user_id": "usr_abc123def456",
    "name": "Juan Pérez",
    "email": "juan.perez@gmail.com", 
    "currency": "MXN",
    "last_login": "2025-09-02T10:45:00.000Z"
  },
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```
}
```

**Response Error (401):**
```json
{
  "success": false,
  "error": "INVALID_CREDENTIALS",
  "message": "Email o contraseña incorrectos"
}
```

#### **POST** `/auth/register`
Registrar nuevo usuario.

**Request Body:**
```json
{
  "email": "nuevo@example.com",
  "password": "password_seguro_123",
  "name": "María González"
}
```

**Response Success (201):**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "user_id": "usr_987654321",
      "email": "nuevo@example.com",
      "name": "María González",
      "created_at": "2025-01-15T11:00:00Z"
    }
  },
  "message": "Usuario creado exitosamente"
}
```

#### **POST** `/auth/refresh`
Renovar token JWT.

**Headers:**
```
Authorization: Bearer <token_actual>
```

**Response Success (200):**
```json
{
  "success": true,
  "data": {
    "token": "nuevo_jwt_token_aqui...",
    "expires_in": 3600
  }
}
```

---

### 👤 **Usuarios**

#### **GET** `/users/profile`
Obtener perfil del usuario autenticado.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response Success (200):**
```json
{
  "success": true,
  "data": {
    "user_id": "usr_123456789",
    "email": "usuario@example.com",
    "name": "Juan Pérez",
    "created_at": "2025-01-15T10:30:00Z",
    "updated_at": "2025-01-20T14:15:00Z",
    "preferences": {
      "currency": "MXN",
      "language": "es",
      "timezone": "America/Mexico_City"
    }
  }
}
```

#### **PUT** `/users/profile`
Actualizar perfil del usuario.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Request Body:**
```json
{
  "name": "Juan Carlos Pérez",
  "preferences": {
    "currency": "USD",
    "language": "en"
  }
}
```

**Response Success (200):**
```json
{
  "success": true,
  "data": {
    "user_id": "usr_123456789",
    "name": "Juan Carlos Pérez",
    "preferences": {
      "currency": "USD",
      "language": "en",
      "timezone": "America/Mexico_City"
    }
  },
  "message": "Perfil actualizado exitosamente"
}
```

---

### 💰 **Cuentas Financieras**

#### **GET** `/accounts`
Obtener todas las cuentas del usuario.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Query Parameters:**
- `type` (opcional): Filtrar por tipo (`bank`, `credit_card`, `savings`, `investment`)
- `status` (opcional): Filtrar por estado (`active`, `inactive`)

**Response Success (200):**
```json
{
  "success": true,
  "data": [
    {
      "account_id": "acc_123456789",
      "name": "Cuenta Corriente BBVA",
      "type": "bank",
      "currency": "MXN",
      "balance": 15750.50,
      "status": "active",
      "created_at": "2025-01-10T09:00:00Z",
      "updated_at": "2025-01-20T16:30:00Z"
    },
    {
      "account_id": "acc_987654321",
      "name": "Tarjeta Crédito Banamex",
      "type": "credit_card",
      "currency": "MXN",
      "balance": -3250.75,
      "credit_limit": 50000.00,
      "status": "active",
      "created_at": "2025-01-12T14:20:00Z",
      "updated_at": "2025-01-19T11:45:00Z"
    }
  ],
  "pagination": {
    "total": 2,
    "page": 1,
    "per_page": 10
  }
}
```

#### **POST** `/accounts`
Crear nueva cuenta financiera.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Request Body:**
```json
{
  "name": "Cuenta de Ahorros Santander",
  "type": "savings",
  "currency": "MXN",
  "initial_balance": 5000.00,
  "description": "Cuenta para emergencias"
}
```

**Response Success (201):**
```json
{
  "success": true,
  "data": {
    "account_id": "acc_555666777",
    "name": "Cuenta de Ahorros Santander",
    "type": "savings",
    "currency": "MXN",
    "balance": 5000.00,
    "status": "active",
    "description": "Cuenta para emergencias",
    "created_at": "2025-01-21T10:00:00Z"
  },
  "message": "Cuenta creada exitosamente"
}
```

#### **GET** `/accounts/{account_id}`
Obtener detalles de una cuenta específica.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response Success (200):**
```json
{
  "success": true,
  "data": {
    "account_id": "acc_123456789",
    "name": "Cuenta Corriente BBVA",
    "type": "bank",
    "currency": "MXN",
    "balance": 15750.50,
    "status": "active",
    "description": "Cuenta principal para gastos",
    "created_at": "2025-01-10T09:00:00Z",
    "updated_at": "2025-01-20T16:30:00Z",
    "recent_transactions": [
      {
        "transaction_id": "txn_111222333",
        "amount": -350.00,
        "description": "Compra en Super",
        "date": "2025-01-20T14:30:00Z"
      }
    ]
  }
}
```

#### **PUT** `/accounts/{account_id}`
Actualizar información de una cuenta.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Request Body:**
```json
{
  "name": "Cuenta Corriente BBVA - Principal",
  "description": "Cuenta principal para gastos diarios",
  "status": "active"
}
```

**Response Success (200):**
```json
{
  "success": true,
  "data": {
    "account_id": "acc_123456789",
    "name": "Cuenta Corriente BBVA - Principal",
    "description": "Cuenta principal para gastos diarios",
    "status": "active",
    "updated_at": "2025-01-21T11:00:00Z"
  },
  "message": "Cuenta actualizada exitosamente"
}
```

#### **DELETE** `/accounts/{account_id}`
Eliminar una cuenta (soft delete).

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response Success (200):**
```json
{
  "success": true,
  "message": "Cuenta eliminada exitosamente"
}
```

---

### 💸 **Transacciones**

#### **GET** `/accounts/{account_id}/transactions`
Obtener transacciones de una cuenta.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Query Parameters:**
- `start_date` (opcional): Fecha inicio (YYYY-MM-DD)
- `end_date` (opcional): Fecha fin (YYYY-MM-DD)
- `type` (opcional): Tipo de transacción (`income`, `expense`, `transfer`)
- `category` (opcional): Categoría de la transacción
- `limit` (opcional): Número de resultados (default: 50, max: 100)
- `offset` (opcional): Para paginación

**Response Success (200):**
```json
{
  "success": true,
  "data": [
    {
      "transaction_id": "txn_111222333",
      "account_id": "acc_123456789",
      "amount": -350.00,
      "type": "expense",
      "category": "groceries",
      "description": "Compra en Walmart",
      "date": "2025-01-20T14:30:00Z",
      "location": "Walmart Polanco",
      "created_at": "2025-01-20T14:35:00Z"
    },
    {
      "transaction_id": "txn_444555666",
      "account_id": "acc_123456789",
      "amount": 2500.00,
      "type": "income",
      "category": "salary",
      "description": "Salario mensual",
      "date": "2025-01-15T09:00:00Z",
      "created_at": "2025-01-15T09:05:00Z"
    }
  ],
  "pagination": {
    "total": 45,
    "limit": 50,
    "offset": 0,
    "has_more": false
  }
}
```

#### **POST** `/accounts/{account_id}/transactions`
Crear nueva transacción.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Request Body:**
```json
{
  "amount": -150.75,
  "type": "expense",
  "category": "restaurant",
  "description": "Cena en La Casa de Toño",
  "date": "2025-01-21T20:30:00Z",
  "location": "Roma Norte"
}
```

**Response Success (201):**
```json
{
  "success": true,
  "data": {
    "transaction_id": "txn_777888999",
    "account_id": "acc_123456789",
    "amount": -150.75,
    "type": "expense",
    "category": "restaurant",
    "description": "Cena en La Casa de Toño",
    "date": "2025-01-21T20:30:00Z",
    "location": "Roma Norte",
    "created_at": "2025-01-21T20:35:00Z",
    "new_balance": 15599.75
  },
  "message": "Transacción creada exitosamente"
}
```

---

### � **Tarjetas de Crédito y Débito**

#### **GET** `/cards`
Obtener todas las tarjetas del usuario con resumen financiero.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Query Parameters:**
- `status` (opcional): Filtrar por estado (`active`, `blocked`, `expired`, `cancelled`, `pending`)
- `type` (opcional): Filtrar por tipo (`credit`, `debit`, `prepaid`, `business`, `rewards`, `store`, `other`)

**Response Success (200):**
```json
{
  "cards": [
    {
      "card_id": "card_a1b2c3d4e5f6",
      "user_id": "user_123456",
      "name": "Tarjeta Principal BBVA",
      "card_type": "credit",
      "card_network": "visa",
      "bank_name": "BBVA Bancomer",
      "credit_limit": 50000.00,
      "current_balance": 12500.50,
      "available_credit": 37499.50,
      "minimum_payment": 625.00,
      "payment_due_date": 15,
      "cut_off_date": 28,
      "apr": 24.99,
      "annual_fee": 550.00,
      "rewards_program": "Puntos BBVA",
      "currency": "MXN",
      "color": "#004481",
      "description": "Mi tarjeta de crédito principal",
      "status": "active",
      "days_until_due": 12,
      "created_at": "2024-12-07T10:30:00Z",
      "updated_at": "2024-12-07T10:30:00Z"
    }
  ],
  "total_count": 3,
  "active_count": 2,
  "total_debt_by_currency": {
    "MXN": 15750.25,
    "USD": 850.00
  },
  "total_available_credit": {
    "MXN": 84249.75,
    "USD": 4150.00
  }
}
```

#### **POST** `/cards`
Crear una nueva tarjeta de crédito o débito.

**Headers:**
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "Tarjeta Principal BBVA",
  "card_type": "credit",
  "card_network": "visa",
  "bank_name": "BBVA Bancomer",
  "credit_limit": 50000.00,
  "current_balance": 12500.50,
  "minimum_payment": 625.00,
  "payment_due_date": 15,
  "cut_off_date": 28,
  "apr": 24.99,
  "annual_fee": 550.00,
  "rewards_program": "Puntos BBVA",
  "currency": "MXN",
  "color": "#004481",
  "description": "Mi tarjeta de crédito principal",
  "status": "active"
}
```

**Campos Obligatorios:**
- `name`: Nombre descriptivo (1-100 caracteres)
- `card_type`: Tipo de tarjeta
- `card_network`: Red de pago (visa, mastercard, etc.)
- `bank_name`: Banco emisor (1-50 caracteres)

**Response Success (201):**
```json
{
  "card": {
    "card_id": "card_a1b2c3d4e5f6",
    "user_id": "user_123456",
    "name": "Tarjeta Principal BBVA",
    "card_type": "credit",
    "card_network": "visa",
    "bank_name": "BBVA Bancomer",
    "credit_limit": 50000.00,
    "current_balance": 12500.50,
    "available_credit": 37499.50,
    "minimum_payment": 625.00,
    "payment_due_date": 15,
    "cut_off_date": 28,
    "apr": 24.99,
    "annual_fee": 550.00,
    "rewards_program": "Puntos BBVA",
    "currency": "MXN",
    "color": "#004481",
    "description": "Mi tarjeta de crédito principal",
    "status": "active",
    "days_until_due": 12,
    "created_at": "2024-12-07T10:30:00Z",
    "updated_at": "2024-12-07T10:30:00Z"
  }
}
```

#### **GET** `/cards/{card_id}`
Obtener detalles de una tarjeta específica.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response Success (200):**
```json
{
  "card": {
    "card_id": "card_a1b2c3d4e5f6",
    "user_id": "user_123456",
    "name": "Tarjeta Principal BBVA",
    "card_type": "credit",
    "card_network": "visa",
    "bank_name": "BBVA Bancomer",
    "credit_limit": 50000.00,
    "current_balance": 12500.50,
    "available_credit": 37499.50,
    "minimum_payment": 625.00,
    "payment_due_date": 15,
    "cut_off_date": 28,
    "apr": 24.99,
    "annual_fee": 550.00,
    "rewards_program": "Puntos BBVA",
    "currency": "MXN",
    "color": "#004481",
    "description": "Mi tarjeta de crédito principal",
    "status": "active",
    "days_until_due": 12,
    "created_at": "2024-12-07T10:30:00Z",
    "updated_at": "2024-12-07T10:30:00Z"
  }
}
```

#### **PUT** `/cards/{card_id}`
Actualizar información de una tarjeta existente.

**Headers:**
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Request Body (campos opcionales):**
```json
{
  "name": "Tarjeta BBVA Platinum",
  "credit_limit": 75000.00,
  "minimum_payment": 750.00,
  "payment_due_date": 20,
  "apr": 22.50,
  "annual_fee": 0.00,
  "color": "#003366",
  "description": "Tarjeta actualizada",
  "status": "active"
}
```

**Response Success (200):**
```json
{
  "card": {
    "card_id": "card_a1b2c3d4e5f6",
    "name": "Tarjeta BBVA Platinum",
    "credit_limit": 75000.00,
    "current_balance": 12500.50,
    "available_credit": 62499.50,
    "updated_at": "2024-12-07T16:45:00Z"
  }
}
```

#### **DELETE** `/cards/{card_id}`
Eliminar permanentemente una tarjeta.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response Success (200):**
```json
{
  "message": "Card deleted successfully",
  "card_id": "card_a1b2c3d4e5f6"
}
```

#### **POST** `/cards/{card_id}/transactions`
Agregar una transacción a la tarjeta.

**Headers:**
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "amount": 1250.75,
  "description": "Compra en Amazon - Productos de oficina",
  "transaction_type": "purchase",
  "transaction_date": "2024-12-07T14:30:00Z"
}
```

**Tipos de Transacciones:**
- `purchase`: Compras y gastos (+)
- `payment`: Pagos realizados (-)
- `fee`: Comisiones y cargos (+)
- `interest`: Intereses generados (+)
- `cashback`: Reembolsos y recompensas (-)
- `refund`: Devoluciones (-)

**Response Success (201):**
```json
{
  "message": "Transaction added successfully",
  "transaction": {
    "amount": 1250.75,
    "description": "Compra en Amazon - Productos de oficina",
    "transaction_type": "purchase",
    "transaction_date": "2024-12-07T14:30:00Z"
  },
  "card": {
    "card_id": "card_a1b2c3d4e5f6",
    "current_balance": 13751.25,
    "available_credit": 36248.75,
    "updated_at": "2024-12-07T14:30:00Z"
  }
}
```

#### **POST** `/cards/{card_id}/payment`
Realizar un pago hacia la tarjeta de crédito.

**Headers:**
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "amount": 2500.00,
  "payment_date": "2024-12-07T16:00:00Z",
  "description": "Pago mensual diciembre 2024"
}
```

**Response Success (200):**
```json
{
  "message": "Payment processed successfully",
  "payment": {
    "amount": 2500.00,
    "payment_date": "2024-12-07T16:00:00Z",
    "description": "Pago mensual diciembre 2024"
  },
  "card": {
    "card_id": "card_a1b2c3d4e5f6",
    "current_balance": 11251.25,
    "available_credit": 38748.75,
    "updated_at": "2024-12-07T16:00:00Z"
  }
}
```

---

### �📊 **Reportes y Analytics**

#### **GET** `/reports/summary`
Obtener resumen financiero del usuario.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Query Parameters:**
- `period` (opcional): Período de análisis (`week`, `month`, `quarter`, `year`)
- `start_date` (opcional): Fecha inicio personalizada
- `end_date` (opcional): Fecha fin personalizada

**Response Success (200):**
```json
{
  "success": true,
  "data": {
    "period": {
      "start_date": "2025-01-01",
      "end_date": "2025-01-31",
      "type": "month"
    },
    "summary": {
      "total_balance": 12499.75,
      "total_income": 8500.00,
      "total_expenses": -6250.25,
      "net_flow": 2249.75,
      "accounts_count": 3,
      "transactions_count": 47
    },
    "by_category": [
      {
        "category": "salary",
        "amount": 7500.00,
        "type": "income",
        "percentage": 88.24
      },
      {
        "category": "groceries", 
        "amount": -2100.50,
        "type": "expense",
        "percentage": 33.61
      }
    ],
    "by_account": [
      {
        "account_id": "acc_123456789",
        "name": "Cuenta Corriente BBVA",
        "balance": 15750.50,
        "change": +1200.30
      }
    ]
  }
}
```

---

### ⚡ **Health Check**

#### **GET** `/health`
Verificar estado de la API.

**Response Success (200):**
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "timestamp": "2025-01-21T12:00:00Z",
    "version": "1.0.0",
    "environment": "production",
    "database": "connected",
    "uptime": "72h 15m 30s"
  }
}
```

---

## 📋 **Códigos de Error Comunes**

| Código | Descripción |
|--------|-------------|
| `INVALID_CREDENTIALS` | Email o contraseña incorrectos |
| `TOKEN_EXPIRED` | Token JWT expirado |
| `INVALID_TOKEN` | Token JWT inválido |
| `USER_NOT_FOUND` | Usuario no encontrado |
| `ACCOUNT_NOT_FOUND` | Cuenta no encontrada |
| `INSUFFICIENT_PERMISSIONS` | Sin permisos para realizar la acción |
| `VALIDATION_ERROR` | Error en validación de datos |
| `RATE_LIMIT_EXCEEDED` | Límite de requests excedido |
| `INTERNAL_ERROR` | Error interno del servidor |

## 🔧 **Configuración del Cliente**

### Variables de Entorno para Frontend

```bash
REACT_APP_API_URL=https://api.finance-tracker.tu-dominio.com
REACT_APP_ENVIRONMENT=production
REACT_APP_FRONTEND_URL=https://finance-tracker.tu-dominio.com
```

### Headers Requeridos

```javascript
const headers = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${jwt_token}`,
  'X-Client-Version': '1.0.0'
}
```

### Manejo de Errores

```javascript
// Ejemplo de manejo de errores en JavaScript
try {
  const response = await fetch('/api/accounts', {
    headers: headers
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message);
  }
  
  const data = await response.json();
  return data;
} catch (error) {
  console.error('API Error:', error.message);
  // Manejar error apropiadamente
}
```

---

## 🚀 **Ejemplos de Uso**

### Login y obtener cuentas

```javascript
// 1. Login
const loginResponse = await fetch('/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'usuario@example.com',
    password: 'mi_password'
  })
});

const { data: { token } } = await loginResponse.json();

// 2. Obtener cuentas
const accountsResponse = await fetch('/accounts', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});

const accounts = await accountsResponse.json();
```

---

📝 **Nota**: Esta documentación está en constante actualización. Para la versión más reciente, consulta el repositorio del proyecto.
