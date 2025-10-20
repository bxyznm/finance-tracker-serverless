# API de Tarjetas - Finance Tracker

**Última actualización**: 19 de Octubre, 2025  
**Estado**: ✅ Completamente funcional con 32 tests pasando (incluye test de items malformados)

## Descripción
Endpoints para la gestión completa de tarjetas de crédito y débito en el sistema Finance Tracker. Incluye operaciones CRUD completas con soporte para fechas de pago y corte, validación defensiva de datos y soft-delete para preservar historial.

## 💳 Arquitectura de Tarjetas

### Tipos de Tarjetas Soportados
- **credit**: Tarjetas de crédito con límite y pagos mensuales
- **debit**: Tarjetas de débito vinculadas a cuentas bancarias
- **prepaid**: Tarjetas con saldo prepagado

### Redes de Tarjetas
- **visa**, **mastercard**, **amex** (American Express)

### Estados de Tarjetas
- **active**: Tarjeta en uso normal
- **inactive**: Tarjeta desactivada (soft delete) - no aparece en listados por defecto
- **blocked**: Tarjeta bloqueada temporalmente
- **expired**: Tarjeta vencida
- **cancelled**: Tarjeta cancelada permanentemente
- **pending**: Pendiente de activación

### Campos Importantes de Fechas
- **payment_due_date**: Día del mes para pago (1-31)
- **cut_off_date**: Día de corte del estado de cuenta (1-31)

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
  "bank_name": "BBVA",
  "credit_limit": 50000.00,
  "current_balance": 12500.50,
  "payment_due_date": 15,
  "cut_off_date": 1,
  "currency": "MXN",
  "notes": "Mi tarjeta principal para compras"
}
```

### Campos Obligatorios
- **name**: Nombre descriptivo de la tarjeta (string, 1-100 caracteres)
- **card_type**: Tipo de tarjeta: `credit`, `debit`, `prepaid`
- **card_network**: Red de la tarjeta: `visa`, `mastercard`, `amex`
- **bank_name**: Nombre del banco emisor (string, 1-50 caracteres)

### Campos Opcionales
- **credit_limit**: Límite de crédito (float, >= 0, default: 0.0)
- **current_balance**: Saldo actual (float, default: 0.0)
- **payment_due_date**: Día de pago mensual (int, 1-31)
- **cut_off_date**: Día de corte de estado de cuenta (int, 1-31)
- **currency**: Moneda (string, default: "MXN")
- **notes**: Notas adicionales (string opcional)

### Validaciones Importantes
- **name**: No puede estar vacío ni solo espacios
- **credit_limit**: Debe ser >= 0
- **payment_due_date**: Debe estar entre 1 y 31
- **cut_off_date**: Debe estar entre 1 y 31
- **currency**: Valores soportados: MXN, USD, EUR
- **status**: Siempre se crea como "active" (no se puede especificar en creación)

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

Obtener todas las tarjetas del usuario autenticado.

### Request Headers
```http
Authorization: Bearer <access_token>
```

### Query Parameters
```http
GET /cards?status=active&type=credit
```

- **status** (opcional): Filtrar por estado específico
  - `active` (default cuando no se especifica): Solo tarjetas activas
  - `inactive`: Solo tarjetas desactivadas/eliminadas
  - Si no se especifica el parámetro, **solo muestra activas** (comportamiento por defecto)
- **type** (opcional): `credit`, `debit`, `prepaid`

### Comportamiento de Filtrado por Status
```http
GET /cards              # Solo tarjetas activas (default)
GET /cards?status=active    # Explícitamente solo activas
GET /cards?status=inactive  # Solo tarjetas eliminadas/inactivas
```

**Importante**: Por defecto, las tarjetas con `status=inactive` NO se muestran. Esto previene que tarjetas eliminadas aparezcan en la UI principal.

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
  ]
}
```

### Nota Importante
- La respuesta es una **lista simple de tarjetas**
- Items malformados se filtran automáticamente (ver sección de Seguridad)
- No incluye campos calculados de agregación globales
- Cada tarjeta incluye `available_credit` y `days_until_due` calculados

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

### Request Body (Todos los campos son opcionales)
```json
{
  "name": "Tarjeta BBVA Oro",
  "bank_name": "BBVA",
  "credit_limit": 60000.00,
  "payment_due_date": 20,
  "cut_off_date": 5,
  "status": "active",
  "notes": "Tarjeta actualizada"
}
```

### Campos Actualizables
- **name**: Nombre de la tarjeta
- **bank_name**: Banco emisor
- **credit_limit**: Límite de crédito
- **payment_due_date**: Día de pago (1-31)
- **cut_off_date**: Día de corte (1-31)
- **status**: Estado (active/inactive)
- **notes**: Notas adicionales

### Campos NO Actualizables
- `card_type`, `card_network`: Definidos en creación
- `current_balance`: Se actualiza mediante transacciones (próxima feature)
- `user_id`, `card_id`: Inmutables

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

## 5. Eliminar Tarjeta (Soft Delete)
**DELETE** `/cards/{card_id}`

Desactivar una tarjeta del sistema (soft delete). La tarjeta no se elimina permanentemente, solo cambia su status a "inactive".

### Request Headers
```http
Authorization: Bearer <access_token>
```

### Path Parameters
- **card_id**: ID único de la tarjeta

### Response (200)
```json
{
  "message": "Card deleted successfully"
}
```

### Notas Importantes
✅ **Soft Delete**: La tarjeta se marca como `inactive` en lugar de eliminarse
- Los datos permanecen en la base de datos
- La tarjeta **NO aparecerá en listados por defecto** (solo si `?status=inactive`)
- Se puede reactivar cambiando el status a "active" mediante el endpoint PUT
- Las transacciones asociadas se mantienen intactas
- El historial de la tarjeta se preserva para auditoría

### Comportamiento del Listado POST-Delete
Después de eliminar una tarjeta:
- `GET /cards` → No incluye tarjetas inactivas (por defecto)
- `GET /cards?status=inactive` → Incluye tarjetas eliminadas
- `GET /cards/{card_id}` → Retorna 404 si la tarjeta está inactiva

---

## 🛡️ Seguridad y Validación de Datos

### Manejo de Items Malformados
El sistema implementa **validación defensiva** al listar tarjetas:

#### Filtrado Automático
Cuando se lista tarjetas, el sistema valida que cada item tenga los siguientes campos obligatorios:
- `card_id`, `user_id`, `name`, `card_type`, `card_network`
- `bank_name`, `currency`, `status`, `created_at`, `updated_at`

#### Comportamiento ante Items Incompletos
Si un item en la base de datos está malformado o le faltan campos:
- ✅ El sistema **continúa procesando** otros items válidos
- ✅ El item malformado se **registra en logs** para investigación
- ✅ La API responde **200 OK** con los items válidos disponibles
- ✅ **No se genera error 500** que afecte la experiencia del usuario

#### Ejemplo de Log
```
WARNING: Skipping malformed card for user user_123: 
         card_id=card_abc123, missing fields: ['currency', 'status']
```

Este enfoque asegura que:
1. Un item corrupto no afecta el acceso a tarjetas válidas
2. Los administradores pueden detectar y corregir datos inconsistentes
3. La experiencia del usuario permanece fluida incluso con datos parcialmente dañados

---

## 🎯 Características Principales

### ✅ Funcionalidades Implementadas
1. **CRUD Completo de Tarjetas**
   - Crear tarjetas con validación completa
   - Listar tarjetas activas/inactivas
   - Obtener detalles de tarjeta específica
   - Actualizar información de tarjetas
   - Soft delete (desactivación)

2. **Gestión de Fechas**
   - Día de pago mensual (`payment_due_date`)
   - Día de corte de estado de cuenta (`cut_off_date`)

3. **Soporte Multi-banco**
   - Bancos mexicanos principales
   - Múltiples tipos de tarjetas
   - Diferentes redes (Visa, Mastercard, Amex)

### 🔜 Próximas Funcionalidades
- Transacciones de tarjetas
- Pagos a tarjetas
- Estados de cuenta
- Análisis de uso
- Alertas de pagos

---

## 🚨 Códigos de Error

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

### 1. Crear Tarjeta de Crédito
```bash
curl -X POST https://sjlc3gosfe.execute-api.mx-central-1.amazonaws.com/dev/cards \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Tarjeta BBVA Azul",
    "card_type": "credit",
    "card_network": "visa",
    "bank_name": "BBVA",
    "credit_limit": 50000,
    "payment_due_date": 15,
    "cut_off_date": 1,
    "currency": "MXN"
  }'
```

### 2. Listar Todas las Tarjetas Activas
```bash
curl -X GET "https://sjlc3gosfe.execute-api.mx-central-1.amazonaws.com/dev/cards?include_inactive=false" \
  -H "Authorization: Bearer <token>"
```

### 3. Actualizar Límite de Crédito y Día de Pago
```bash
curl -X PUT https://sjlc3gosfe.execute-api.mx-central-1.amazonaws.com/dev/cards/card_123 \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "credit_limit": 60000,
    "payment_due_date": 20
  }'
```

### 4. Desactivar Tarjeta (Soft Delete)
```bash
curl -X DELETE https://sjlc3gosfe.execute-api.mx-central-1.amazonaws.com/dev/cards/card_123 \
  -H "Authorization: Bearer <token>"
```

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
