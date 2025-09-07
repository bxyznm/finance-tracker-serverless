# API de Tarjetas - Finance Tracker

## Descripción
Endpoints para la gestión completa de tarjetas de crédito y débito en el sistema Finance Tracker. Incluye operaciones CRUD, transacciones, pagos y generación de estados de cuenta.

## 💳 Arquitectura de Tarjetas

### Tipos de Tarjetas Soportados
- **Crédito**: Tarjetas de crédito con límite y pagos mensuales
- **Débito**: Tarjetas de débito vinculadas a cuentas bancarias
- **Prepagada**: Tarjetas con saldo prepagado
- **Empresarial**: Tarjetas corporativas y de negocios
- **Recompensas**: Tarjetas con programas de puntos/cashback
- **Tienda**: Tarjetas de tiendas departamentales
- **Otra**: Otros tipos de tarjetas

### Redes de Tarjetas
- **Visa**, **Mastercard**, **American Express**
- **Discover**, **JCB**, **UnionPay**, **Diners Club**

### Estados de Tarjetas
- **Activa**: Tarjeta en uso normal
- **Bloqueada**: Temporalmente suspendida
- **Vencida**: Ha pasado su fecha de expiración
- **Cancelada**: Permanentemente cerrada
- **Pendiente**: En proceso de activación

## 📍 Endpoints de Tarjetas

### Base URL
```
https://sjlc3gosfe.execute-api.mx-central-1.amazonaws.com/dev/cards
```

---

## 1. Crear Tarjeta
**POST** `/cards`

Registrar una nueva tarjeta de crédito o débito en el sistema.

### Request Headers
```http
Authorization: Bearer <access_token>
Content-Type: application/json
```

### Request Body
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
  "description": "Mi tarjeta de crédito principal para compras grandes",
  "status": "active"
}
```

### Campos Obligatorios
- **name**: Nombre descriptivo de la tarjeta
- **card_type**: Tipo de tarjeta (credit, debit, prepaid, etc.)
- **card_network**: Red de la tarjeta (visa, mastercard, etc.)
- **bank_name**: Nombre del banco emisor

### Campos Opcionales para Tarjetas de Crédito
- **credit_limit**: Límite de crédito disponible
- **minimum_payment**: Pago mínimo mensual
- **payment_due_date**: Día del mes para fecha de pago (1-31)
- **cut_off_date**: Día del mes para fecha de corte (1-31)
- **apr**: Tasa de interés anual (APR)
- **annual_fee**: Cuota anual de la tarjeta

### Validaciones
- **name**: 1-100 caracteres, no puede estar vacío
- **bank_name**: 1-50 caracteres
- **credit_limit**: >= 0, máximo 999,999,999.99
- **current_balance**: -999,999,999.99 a 999,999,999.99
- **payment_due_date**: 1-31 (día válido del mes)
- **cut_off_date**: 1-31 (día válido del mes)
- **apr**: 0-100 (porcentaje anual)
- **currency**: MXN, USD, EUR, CAD, GBP, JPY
- **color**: Formato hexadecimal válido (#FF0000 o #F00)

### Response (201)
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
    "description": "Mi tarjeta de crédito principal para compras grandes",
    "status": "active",
    "days_until_due": 12,
    "created_at": "2024-12-07T10:30:00Z",
    "updated_at": "2024-12-07T10:30:00Z"
  }
}
```

### Errores Posibles
```json
// 400 - Datos inválidos
{
  "error": "Card name cannot be empty or only spaces"
}

// 400 - Validación fallida
{
  "error": "Credit limit must be between 0 and 999,999,999.99"
}

// 401 - No autenticado
{
  "error": "Authentication required"
}
```

---

## 2. Listar Tarjetas
**GET** `/cards`

Obtener todas las tarjetas del usuario autenticado con resumen financiero.

### Request Headers
```http
Authorization: Bearer <access_token>
```

### Query Parameters
```http
GET /cards?status=active&type=credit
```

- **status** (opcional): `active`, `blocked`, `expired`, `cancelled`, `pending`
- **type** (opcional): `credit`, `debit`, `prepaid`, `business`, `rewards`, `store`, `other`

### Response (200)
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

### Campos Calculados
- **available_credit**: credit_limit - current_balance
- **days_until_due**: Días hasta la próxima fecha de pago
- **total_debt_by_currency**: Deuda total agrupada por moneda
- **total_available_credit**: Crédito disponible total por moneda

---

## 3. Obtener Tarjeta por ID
**GET** `/cards/{card_id}`

Obtener detalles específicos de una tarjeta por su ID.

### Request Headers
```http
Authorization: Bearer <access_token>
```

### Path Parameters
- **card_id**: ID único de la tarjeta

### Response (200)
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

### Errores Posibles
```json
// 404 - Tarjeta no encontrada
{
  "error": "Card not found"
}

// 403 - No es del usuario
{
  "error": "Access denied"
}
```

---

## 4. Actualizar Tarjeta
**PUT** `/cards/{card_id}`

Actualizar información de una tarjeta existente.

### Request Headers
```http
Authorization: Bearer <access_token>
Content-Type: application/json
```

### Path Parameters
- **card_id**: ID único de la tarjeta

### Request Body
```json
{
  "name": "Tarjeta BBVA Platinum",
  "bank_name": "BBVA México",
  "credit_limit": 75000.00,
  "minimum_payment": 750.00,
  "payment_due_date": 20,
  "apr": 22.50,
  "annual_fee": 0.00,
  "rewards_program": "Puntos Premier",
  "color": "#003366",
  "description": "Tarjeta actualizada con mejores beneficios",
  "status": "active"
}
```

### Campos Actualizables
- Todos los campos excepto: `card_type`, `card_network`, `current_balance`, `user_id`, `card_id`
- El `current_balance` se actualiza mediante transacciones y pagos

### Response (200)
```json
{
  "card": {
    "card_id": "card_a1b2c3d4e5f6",
    "user_id": "user_123456",
    "name": "Tarjeta BBVA Platinum",
    "card_type": "credit",
    "card_network": "visa",
    "bank_name": "BBVA México",
    "credit_limit": 75000.00,
    "current_balance": 12500.50,
    "available_credit": 62499.50,
    "minimum_payment": 750.00,
    "payment_due_date": 20,
    "cut_off_date": 28,
    "apr": 22.50,
    "annual_fee": 0.00,
    "rewards_program": "Puntos Premier",
    "currency": "MXN",
    "color": "#003366",
    "description": "Tarjeta actualizada con mejores beneficios",
    "status": "active",
    "days_until_due": 17,
    "created_at": "2024-12-07T10:30:00Z",
    "updated_at": "2024-12-07T16:45:00Z"
  }
}
```

---

## 5. Eliminar Tarjeta
**DELETE** `/cards/{card_id}`

Eliminar permanentemente una tarjeta del sistema.

### Request Headers
```http
Authorization: Bearer <access_token>
```

### Path Parameters
- **card_id**: ID único de la tarjeta

### Response (200)
```json
{
  "message": "Card deleted successfully",
  "card_id": "card_a1b2c3d4e5f6"
}
```

### Notas Importantes
⚠️ **Esta operación es irreversible**
- Se elimina la tarjeta y todos sus registros asociados
- Las transacciones históricas pueden mantenerse para reportes
- Se recomienda cambiar el status a "cancelled" en lugar de eliminar

---

## 6. Agregar Transacción
**POST** `/cards/{card_id}/transactions`

Registrar una nueva transacción en la tarjeta (compra, pago, comisión, etc.).

### Request Headers
```http
Authorization: Bearer <access_token>
Content-Type: application/json
```

### Path Parameters
- **card_id**: ID único de la tarjeta

### Request Body
```json
{
  "amount": 1250.75,
  "description": "Compra en Amazon - Productos de oficina",
  "transaction_type": "purchase",
  "transaction_date": "2024-12-07T14:30:00Z"
}
```

### Tipos de Transacciones
- **purchase**: Compras y gastos (+)
- **payment**: Pagos realizados (-)
- **fee**: Comisiones y cargos (+)
- **interest**: Intereses generados (+)
- **cashback**: Reembolsos y recompensas (-)
- **refund**: Devoluciones (-)

### Validaciones
- **amount**: No puede ser cero, -999,999,999.99 a 999,999,999.99
- **description**: 1-255 caracteres, obligatorio
- **transaction_date**: Fecha ISO válida (opcional, default: ahora)

### Response (201)
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

### Lógica de Balance
- **Compras/Gastos** (`purchase`, `fee`, `interest`): Incrementan el balance
- **Pagos/Reembolsos** (`payment`, `cashback`, `refund`): Disminuyen el balance

---

## 7. Realizar Pago
**POST** `/cards/{card_id}/payment`

Registrar un pago hacia la tarjeta de crédito.

### Request Headers
```http
Authorization: Bearer <access_token>
Content-Type: application/json
```

### Path Parameters
- **card_id**: ID único de la tarjeta

### Request Body
```json
{
  "amount": 2500.00,
  "payment_date": "2024-12-07T16:00:00Z",
  "description": "Pago mensual diciembre 2024"
}
```

### Validaciones
- **amount**: Debe ser mayor a cero, máximo 999,999,999.99
- **payment_date**: Fecha ISO válida (opcional, default: ahora)
- **description**: Hasta 255 caracteres (opcional)

### Response (200)
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

## 🚨 Códigos de Error

### 400 - Bad Request
```json
{
  "error": "Transaction amount cannot be zero"
}
```

### 401 - Unauthorized
```json
{
  "error": "Authentication required"
}
```

### 403 - Forbidden
```json
{
  "error": "Access denied"
}
```

### 404 - Not Found
```json
{
  "error": "Card not found"
}
```

### 500 - Internal Server Error
```json
{
  "error": "Internal server error"
}
```

---

## 🎯 Casos de Uso Comunes

### 1. Configuración Inicial de Tarjeta de Crédito
```bash
# Crear tarjeta principal
curl -X POST https://sjlc3gosfe.execute-api.mx-central-1.amazonaws.com/dev/cards \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Tarjeta Principal",
    "card_type": "credit",
    "card_network": "visa",
    "bank_name": "BBVA",
    "credit_limit": 50000,
    "payment_due_date": 15,
    "cut_off_date": 28
  }'
```

### 2. Registro de Compra
```bash
# Agregar transacción de compra
curl -X POST https://sjlc3gosfe.execute-api.mx-central-1.amazonaws.com/dev/cards/card_123/transactions \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 2500.50,
    "description": "Supermercado Soriana",
    "transaction_type": "purchase"
  }'
```

### 3. Pago Mensual
```bash
# Realizar pago a la tarjeta
curl -X POST https://sjlc3gosfe.execute-api.mx-central-1.amazonaws.com/dev/cards/card_123/payment \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 5000.00,
    "description": "Pago mensual"
  }'
```

### 4. Monitoreo de Deudas
```bash
# Obtener resumen de todas las tarjetas
curl -X GET https://sjlc3gosfe.execute-api.mx-central-1.amazonaws.com/dev/cards \
  -H "Authorization: Bearer <token>"
```

---

## 📊 Métricas y Monitoreo

### Campos Calculados Automáticamente
- **available_credit**: Crédito disponible actual
- **days_until_due**: Días hasta vencimiento del pago
- **total_debt_by_currency**: Deuda total por moneda
- **utilization_rate**: Porcentaje de utilización del crédito

### Alertas Recomendadas
- 🔴 **Alto riesgo**: Utilización > 90%
- 🟡 **Precaución**: Utilización > 70%
- 🔵 **Pago próximo**: < 7 días hasta fecha de pago
- ⚪ **Pago vencido**: Días pasada la fecha de pago

---

## 🔒 Consideraciones de Seguridad

### Autenticación JWT Requerida
- Todos los endpoints requieren token de acceso válido
- Los usuarios solo pueden acceder a sus propias tarjetas

### Validaciones Financieras
- Montos validados con precisión decimal (2 decimales)
- Límites máximos para prevenir errores de entrada
- Validación de fechas para prevenir datos inconsistentes

### Registro de Auditoría
- Todas las transacciones se registran con timestamps
- Cambios en tarjetas mantienen historial de modificaciones
- IDs únicos generados de forma segura

---

## 📝 Notas Técnicas

### Precisión Monetaria
- Todos los montos se manejan con precisión decimal
- Redondeo a 2 decimales para consistencia
- Soporte para múltiples monedas

### Fechas y Horarios
- Formato ISO 8601 (UTC) para todas las fechas
- Cálculos de fechas de pago consideran diferentes meses
- Soporte para fechas de corte personalizables

### Generación de IDs
- IDs únicos generados con prefijo `card_` + 16 caracteres hex
- Garantiza unicidad y facilita identificación en logs
