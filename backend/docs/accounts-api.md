# 🏦 Accounts API Documentation

Esta API permite la gestión completa de cuentas bancarias y financieras para usuarios autenticados del sistema Finance Tracker.

## 🎯 Descripción General

La API de Cuentas permite a los usuarios:
- ✅ Crear cuentas bancarias de diferentes tipos
- ✅ Listar todas sus cuentas
- ✅ Ver detalles de cuentas específicas
- ✅ Actualizar información de cuentas
- ✅ Gestionar balances con auditoría
- ✅ Eliminar cuentas (soft delete)

## 🔐 Autenticación

Todos los endpoints requieren autenticación JWT:
```http
Authorization: Bearer <access_token>
```

## 📋 Endpoints Disponibles

### 1. Crear Cuenta
**POST** `/accounts`

Crea una nueva cuenta bancaria para el usuario autenticado.

#### Request Body
```json
{
  "name": "Cuenta de Ahorros Principal",
  "bank_code": "BBVA",
  "account_type": "savings",
  "currency": "MXN",
  "initial_balance": 15000.50,
  "color": "#007bff",
  "description": "Mi cuenta principal de ahorros"
}
```

#### Campos
- `name` (string, requerido): Nombre descriptivo de la cuenta
- `bank_code` (string, requerido): Código del banco (ver lista abajo)
- `account_type` (string, requerido): Tipo de cuenta (checking, savings, credit, investment)
- `currency` (string, requerido): Código de divisa ISO (MXN, USD, EUR)
- `initial_balance` (decimal, opcional): Balance inicial (default: 0.00)
- `color` (string, opcional): Color hexadecimal para UI (default: "#007bff")
- `description` (string, opcional): Descripción adicional

#### Response Success (201)
```json
{
  "message": "Cuenta creada exitosamente",
  "account": {
    "account_id": "acc_d4f2a8b1c3e7",
    "user_id": "usr_36cec417d261",
    "name": "Cuenta de Ahorros Principal",
    "bank_code": "BBVA",
    "account_type": "savings",
    "currency": "MXN",
    "balance": 15000.50,
    "color": "#007bff",
    "description": "Mi cuenta principal de ahorros",
    "is_active": true,
    "created_at": "2025-08-23T10:30:00.000Z",
    "updated_at": "2025-08-23T10:30:00.000Z"
  }
}
```

#### cURL Example
```bash
curl -X POST https://api.finance-tracker.com/accounts \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_access_token" \
  -d '{
    "name": "Cuenta de Ahorros Principal",
    "bank_code": "BBVA",
    "account_type": "savings",
    "currency": "MXN",
    "initial_balance": 15000.50,
    "color": "#007bff",
    "description": "Mi cuenta principal de ahorros"
  }'
```

---

### 2. Listar Cuentas del Usuario
**GET** `/accounts`

Obtiene todas las cuentas activas del usuario autenticado.

#### Response Success (200)
```json
{
  "message": "Cuentas obtenidas exitosamente",
  "accounts": [
    {
      "account_id": "acc_d4f2a8b1c3e7",
      "name": "Cuenta de Ahorros BBVA",
      "bank_code": "BBVA",
      "account_type": "savings",
      "currency": "MXN",
      "balance": 15000.50,
      "color": "#007bff"
    },
    {
      "account_id": "acc_a1b2c3d4e5f6",
      "name": "Tarjeta de Crédito Santander",
      "bank_code": "SANTANDER",
      "account_type": "credit",
      "currency": "MXN",
      "balance": -2500.00,
      "color": "#dc3545"
    }
  ],
  "total_balance": {
    "MXN": 12500.50
  },
  "total_accounts": 2
}
```

#### cURL Example
```bash
curl -X GET https://api.finance-tracker.com/accounts \
  -H "Authorization: Bearer your_access_token"
```

---

### 3. Obtener Cuenta Específica
**GET** `/accounts/{account_id}`

Obtiene los detalles completos de una cuenta específica.

#### Path Parameters
- `account_id` (string, requerido): ID de la cuenta

#### Response Success (200)
```json
{
  "message": "Cuenta obtenida exitosamente",
  "account": {
    "account_id": "acc_d4f2a8b1c3e7",
    "user_id": "usr_36cec417d261",
    "name": "Cuenta de Ahorros Principal",
    "bank_code": "BBVA",
    "account_type": "savings",
    "currency": "MXN",
    "balance": 15000.50,
    "color": "#007bff",
    "description": "Mi cuenta principal de ahorros",
    "is_active": true,
    "created_at": "2025-08-23T10:30:00.000Z",
    "updated_at": "2025-08-23T10:30:00.000Z"
  }
}
```

#### cURL Example
```bash
curl -X GET https://api.finance-tracker.com/accounts/acc_d4f2a8b1c3e7 \
  -H "Authorization: Bearer your_access_token"
```

---

### 4. Actualizar Cuenta
**PUT** `/accounts/{account_id}`

Actualiza la información de una cuenta existente.

#### Path Parameters
- `account_id` (string, requerido): ID de la cuenta

#### Request Body
```json
{
  "name": "Cuenta Corriente BBVA",
  "color": "#28a745",
  "description": "Cuenta para gastos diarios"
}
```

#### Campos Actualizables
- `name` (string, opcional): Nuevo nombre de la cuenta
- `color` (string, opcional): Nuevo color hexadecimal
- `description` (string, opcional): Nueva descripción

**Nota**: Los campos `bank_code`, `account_type` y `currency` no son modificables por razones de seguridad.

#### Response Success (200)
```json
{
  "message": "Cuenta actualizada exitosamente",
  "account": {
    "account_id": "acc_d4f2a8b1c3e7",
    "name": "Cuenta Corriente BBVA",
    "color": "#28a745",
    "description": "Cuenta para gastos diarios",
    "updated_at": "2025-08-23T11:45:00.000Z"
  }
}
```

#### cURL Example
```bash
curl -X PUT https://api.finance-tracker.com/accounts/acc_d4f2a8b1c3e7 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_access_token" \
  -d '{
    "name": "Cuenta Corriente BBVA",
    "color": "#28a745",
    "description": "Cuenta para gastos diarios"
  }'
```

---

### 5. Actualizar Saldo de Cuenta
**PATCH** `/accounts/{account_id}/balance`

Actualiza el balance de una cuenta específica.

#### Path Parameters
- `account_id` (string, requerido): ID de la cuenta

#### Request Body
```json
{
  "balance": 25000.75,
  "reason": "Depósito de nómina"
}
```

#### Campos
- `balance` (decimal, requerido): Nuevo balance de la cuenta
- `reason` (string, opcional): Razón del cambio de balance (para auditoría)

#### Response Success (200)
```json
{
  "message": "Balance actualizado exitosamente",
  "account": {
    "account_id": "acc_d4f2a8b1c3e7",
    "name": "Cuenta de Ahorros Principal",
    "balance": 25000.75,
    "previous_balance": 15000.50,
    "balance_change": 10000.25,
    "reason": "Depósito de nómina",
    "updated_at": "2025-08-23T12:00:00.000Z"
  }
}
```

#### cURL Example
```bash
curl -X PATCH https://api.finance-tracker.com/accounts/acc_d4f2a8b1c3e7/balance \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_access_token" \
  -d '{
    "balance": 25000.75,
    "reason": "Depósito de nómina"
  }'
```

---

### 6. Eliminar Cuenta
**DELETE** `/accounts/{account_id}`

Elimina una cuenta (soft delete - marca como inactiva).

#### Path Parameters
- `account_id` (string, requerido): ID de la cuenta

#### Response Success (200)
```json
{
  "message": "Cuenta eliminada exitosamente",
  "account_id": "acc_d4f2a8b1c3e7"
}
```

#### cURL Example
```bash
curl -X DELETE https://api.finance-tracker.com/accounts/acc_d4f2a8b1c3e7 \
  -H "Authorization: Bearer your_access_token"
```

---

## 🏦 Bancos Mexicanos Soportados

| Código | Nombre Completo |
|--------|----------------|
| `BBVA` | Banco Bilbao Vizcaya Argentaria |
| `SANTANDER` | Banco Santander México |
| `BANORTE` | Banco Mercantil del Norte |
| `HSBC` | HSBC México |
| `CITIBANAMEX` | Citibanamex |
| `SCOTIABANK` | Scotiabank México |
| `INBURSA` | Banco Inbursa |
| `AZTECA` | Banco Azteca |
| `BAJIO` | Banco del Bajío |
| `BANREGIO` | Banregio |

## 💳 Tipos de Cuenta Soportados

| Código | Descripción |
|--------|-------------|
| `checking` | Cuenta Corriente |
| `savings` | Cuenta de Ahorros |
| `credit` | Tarjeta de Crédito |
| `investment` | Cuenta de Inversión |

## 💰 Divisas Soportadas

| Código | Descripción |
|--------|-------------|
| `MXN` | Peso Mexicano |
| `USD` | Dólar Estadounidense |
| `EUR` | Euro |
| `CAD` | Dólar Canadiense |
| `GBP` | Libra Esterlina |

## ❌ Códigos de Error

### 400 Bad Request
```json
{
  "error": "Validation error",
  "message": "Datos de entrada inválidos",
  "details": [
    {
      "field": "bank_code",
      "message": "Código de banco no válido"
    }
  ]
}
```

### 401 Unauthorized
```json
{
  "error": "Authentication required",
  "message": "Valid JWT token must be provided"
}
```

### 403 Forbidden
```json
{
  "error": "Forbidden",
  "message": "No tienes permisos para acceder a esta cuenta"
}
```

### 404 Not Found
```json
{
  "error": "Account not found",
  "message": "La cuenta solicitada no existe o no tienes permisos para acceder a ella"
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal server error",
  "message": "Error interno del servidor. Por favor, inténtalo de nuevo más tarde."
}
```

## 🔒 Seguridad y Consideraciones

### Autorización
- Los usuarios solo pueden acceder a sus propias cuentas
- El `user_id` se extrae automáticamente del JWT token
- No es posible acceder a cuentas de otros usuarios

### Validaciones
- Todos los campos son validados usando Pydantic V2
- Los códigos de banco son validados contra lista permitida
- Los tipos de cuenta son validados contra enum
- Los colores deben estar en formato hexadecimal válido
- Los balances deben ser números decimales válidos

### Auditoría
- Todos los cambios incluyen timestamps `created_at` y `updated_at`
- Los cambios de balance pueden incluir una razón para auditoría
- Soft delete preserva historial para propósitos regulatorios

### Rate Limiting
- Los endpoints están protegidos por API Gateway throttling
- Límites configurables por ambiente (dev/prod)

## 🧪 Testing

Para ejecutar los tests de la API de cuentas:

```bash
cd backend

# Tests de handlers
python -m pytest tests/test_accounts.py -v

# Tests de modelos
python -m pytest tests/test_account_models.py -v

# Tests con cobertura
python -m pytest tests/test_accounts.py tests/test_account_models.py --cov=src/handlers/accounts --cov=src/models/account --cov-report=html
```

## 📝 Changelog

### v2.0.0 (2025-08-23) - ✅ NUEVO
- ✅ Implementación completa de CRUD de cuentas
- ✅ Soporte para 10+ bancos mexicanos  
- ✅ Multi-currency support (MXN, USD, EUR)
- ✅ Gestión de balances con auditoría
- ✅ 44 tests automatizados (100% pass rate)
- ✅ JWT authentication en todos los endpoints
- ✅ Validaciones robustas con Pydantic V2
- ✅ Soft delete implementation
- ✅ Single Table Design integration

---

## 📞 Soporte

Para reportar issues o sugerir mejoras:
- **GitHub Issues**: https://github.com/bxyznm/finance-tracker-serverless/issues
- **Documentation**: https://github.com/bxyznm/finance-tracker-serverless/tree/main/backend/docs

---

**🏦 Finance Tracker - Accounts API v2.0.0**  
**Ready for Production** ✅
