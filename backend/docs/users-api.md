# API de Usuarios - Finance Tracker

## Descripción
API serverless para gestión de usuarios del sistema Finance Tracker, implementada con AWS Lambda, DynamoDB y Python.

## Características de Seguridad

### ✅ Validación de Contraseñas
- Mínimo 8 caracteres
- Al menos una mayúscula
- Al menos una minúscula  
- Al menos un número
- Al menos un carácter especial (!@#$%^&*(),.?":{}|<>)

### ✅ Protección contra Ataques
- Máximo 5 intentos de login fallidos antes de bloqueo temporal (1 hora)
- Hash seguro de contraseñas con bcrypt
- Validación de duplicados de email
- Normalización de emails a minúsculas

### ✅ Validación de Datos
- Nombres solo con letras, espacios y acentos
- Emails válidos con formato correcto
- Monedas soportadas: MXN, USD, EUR, CAD

## Endpoints

### 1. Registro de Usuario
**POST** `/users`

Crear una nueva cuenta de usuario.

**Request Body:**
```json
{
  "name": "Bryan Torres",
  "email": "bryan@example.com",
  "currency": "MXN",
  "password": "MiContraseña123!",
  "confirm_password": "MiContraseña123!"
}
```

**Response Success (201):**
```json
{
  "message": "Usuario creado exitosamente",
  "user": {
    "user_id": "usr_123abc456def",
    "name": "Bryan Torres",
    "email": "bryan@example.com",
    "currency": "MXN",
    "created_at": "2025-08-22T12:00:00.000Z",
    "updated_at": "2025-08-22T12:00:00.000Z",
    "is_active": true,
    "email_verified": false,
    "last_login_at": null
  },
  "next_steps": [
    "Verifica tu email para activar completamente tu cuenta",
    "Inicia sesión con tus credenciales"
  ]
}
```

**Error Responses:**
- `400` - Datos inválidos (contraseña débil, email inválido, etc.)
- `409` - Email ya registrado

---

### 2. Login de Usuario
**POST** `/users/login`

Iniciar sesión con credenciales.

**Request Body:**
```json
{
  "email": "bryan@example.com",
  "password": "MiContraseña123!"
}
```

**Response Success (200):**
```json
{
  "message": "Login exitoso",
  "user": {
    "user_id": "usr_123abc456def",
    "name": "Bryan Torres",
    "email": "bryan@example.com",
    "currency": "MXN",
    "created_at": "2025-08-22T12:00:00.000Z",
    "updated_at": "2025-08-22T12:00:00.000Z",
    "is_active": true,
    "email_verified": false,
    "last_login_at": "2025-08-22T15:30:00.000Z"
  },
  "access_token": "TODO_JWT_TOKEN",
  "token_type": "bearer"
}
```

**Error Responses:**
- `400` - Datos de login inválidos
- `401` - Credenciales incorrectas
- `403` - Cuenta inactiva
- `423` - Cuenta bloqueada temporalmente

---

### 3. Obtener Usuario
**GET** `/users/{user_id}`

Obtener información de un usuario específico.

**Response Success (200):**
```json
{
  "user": {
    "user_id": "usr_123abc456def",
    "name": "Bryan Torres",
    "email": "bryan@example.com",
    "currency": "MXN",
    "created_at": "2025-08-22T12:00:00.000Z",
    "updated_at": "2025-08-22T12:00:00.000Z",
    "is_active": true,
    "email_verified": false,
    "last_login_at": "2025-08-22T15:30:00.000Z"
  }
}
```

**Error Responses:**
- `404` - Usuario no encontrado

---

### 4. Actualizar Usuario
**PUT** `/users/{user_id}`

Actualizar información del usuario. Para cambios sensibles (email o contraseña) se requiere la contraseña actual.

**Request Body (actualización básica):**
```json
{
  "name": "Bryan Torres Actualizado",
  "currency": "USD"
}
```

**Request Body (cambio de contraseña):**
```json
{
  "current_password": "MiContraseña123!",
  "new_password": "MiNuevaContraseña456!",
  "confirm_new_password": "MiNuevaContraseña456!"
}
```

**Request Body (cambio de email):**
```json
{
  "current_password": "MiContraseña123!",
  "email": "bryan.nuevo@example.com"
}
```

**Response Success (200):**
```json
{
  "message": "Usuario actualizado exitosamente",
  "user": {
    "user_id": "usr_123abc456def",
    "name": "Bryan Torres Actualizado",
    "email": "bryan.nuevo@example.com",
    "currency": "USD",
    "created_at": "2025-08-22T12:00:00.000Z",
    "updated_at": "2025-08-22T16:00:00.000Z",
    "is_active": true,
    "email_verified": false,
    "last_login_at": "2025-08-22T15:30:00.000Z"
  },
  "updated_fields": ["name", "email", "currency", "updated_at"]
}
```

**Error Responses:**
- `400` - Datos inválidos o contraseña actual requerida
- `401` - Contraseña actual incorrecta
- `404` - Usuario no encontrado
- `409` - Email ya en uso

---

### 5. Eliminar Usuario
**DELETE** `/users/{user_id}`

Eliminar usuario (soft delete - marca como inactivo).

**Response Success (200):**
```json
{
  "message": "Usuario eliminado exitosamente",
  "user_id": "usr_123abc456def"
}
```

**Error Responses:**
- `404` - Usuario no encontrado

---

### 6. Información de la API
**GET** `/users`

Obtener información sobre la API y endpoints disponibles.

**Response Success (200):**
```json
{
  "message": "API de usuarios de Finance Tracker",
  "version": "2.0.0",
  "timestamp": "2025-08-22T16:00:00.000Z",
  "features": [
    "Registro de usuarios con validación de contraseña",
    "Login con protección contra ataques de fuerza bruta",
    "Encriptación de contraseñas con bcrypt",
    "Validación de emails y datos",
    "Soft delete de usuarios",
    "Actualización segura de perfil"
  ],
  "available_operations": [
    "POST /users - Registrar nuevo usuario",
    "POST /users/login - Iniciar sesión",
    "GET /users/{user_id} - Obtener usuario por ID",
    "PUT /users/{user_id} - Actualizar usuario",
    "DELETE /users/{user_id} - Eliminar usuario (soft delete)"
  ],
  "supported_currencies": ["MXN", "USD", "EUR", "CAD"],
  "security_features": [
    "Contraseñas deben tener al menos 8 caracteres",
    "Incluir mayúsculas, minúsculas, números y símbolos",
    "Máximo 5 intentos de login antes de bloqueo temporal",
    "Hash seguro de contraseñas con bcrypt"
  ]
}
```

## Códigos de Estado HTTP

- **200** - OK: Operación exitosa
- **201** - Created: Usuario creado exitosamente
- **400** - Bad Request: Datos inválidos
- **401** - Unauthorized: Credenciales inválidas
- **403** - Forbidden: Cuenta inactiva
- **404** - Not Found: Usuario no encontrado
- **409** - Conflict: Email ya registrado
- **423** - Locked: Cuenta bloqueada temporalmente
- **500** - Internal Server Error: Error interno del servidor

## Modelos de Datos

### Usuario (Response)
```json
{
  "user_id": "string",           // ID único del usuario
  "name": "string",              // Nombre completo
  "email": "string",             // Email (normalizado a minúsculas)
  "currency": "string",          // Código de moneda (MXN, USD, EUR, CAD)
  "created_at": "datetime",      // Fecha de creación (ISO 8601)
  "updated_at": "datetime",      // Fecha de última actualización
  "is_active": "boolean",        // Si la cuenta está activa
  "email_verified": "boolean",   // Si el email está verificado
  "last_login_at": "datetime?"   // Fecha del último login (nullable)
}
```

## Arquitectura

### Single Table Design (DynamoDB)
- **PK**: `USER#{user_id}` - Partition Key
- **SK**: `METADATA` - Sort Key
- **GSI1_PK**: `EMAIL#{email}` - Para búsquedas por email
- **GSI1_SK**: `USER#{user_id}` - Sort key del índice

### Campos Internos (No expuestos en API)
- `password_hash`: Hash bcrypt de la contraseña
- `failed_login_attempts`: Contador de intentos fallidos
- `blocked_until`: Timestamp de bloqueo temporal

## Ejemplo de Uso con cURL

### Registrar usuario:
```bash
curl -X POST https://api.finance-tracker.com/users \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Bryan Torres",
    "email": "bryan@example.com",
    "currency": "MXN",
    "password": "MiContraseña123!",
    "confirm_password": "MiContraseña123!"
  }'
```

### Login:
```bash
curl -X POST https://api.finance-tracker.com/users/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "bryan@example.com",
    "password": "MiContraseña123!"
  }'
```

## Próximas Mejoras

- [ ] Implementación de JWT tokens para autenticación
- [ ] Verificación de email por correo electrónico
- [ ] Rate limiting por IP
- [ ] Recuperación de contraseña
- [ ] Autenticación de dos factores (2FA)
- [ ] Logs de auditoría detallados
- [ ] Integración con servicios de notificación
