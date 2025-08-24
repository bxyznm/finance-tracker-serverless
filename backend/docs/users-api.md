# API de Usuarios - Finance Tracker

## Descripción
API serverless para gestión de usuarios del sistema Finance Tracker, implementada con AWS Lambda, DynamoDB y Python. Incluye autenticación JWT para endpoints seguros.

**🔄 Cambio Importante**: Los endpoints de autenticación han sido reorganizados para mejor separación de responsabilidades:
- **Autenticación**: `/auth/register`, `/auth/login`, `/auth/refresh`  
- **Gestión de Usuarios**: `/users/{user_id}` (CRUD operations)

## 🔐 Autenticación JWT

### Sistema de Tokens
- **Access Token**: Válido por 30 minutos, usado para autenticar requests
- **Refresh Token**: Válido por 7 días, usado para renovar access tokens
- **Algoritmo**: HS256 (HMAC with SHA-256)
- **Header requerido**: `Authorization: Bearer <access_token>`

### Endpoints Públicos (sin autenticación)
- `POST /auth/register` - Registro de usuario
- `POST /auth/login` - Inicio de sesión
- `POST /auth/refresh` - Renovación de tokens
- `GET /health` - Estado del sistema

### Endpoints Privados (requieren autenticación)
- `GET /users/{user_id}` - Obtener datos de usuario
- `PUT /users/{user_id}` - Actualizar datos de usuario  
- `DELETE /users/{user_id}` - Eliminar cuenta de usuario

### Control de Acceso
- Los usuarios solo pueden acceder/modificar sus propios datos
- Intento de acceso a datos de otro usuario retorna `403 Forbidden`
- Tokens inválidos o expirados retornan `401 Unauthorized`

## Características de Seguridad

### ✅ Autenticación JWT
- Access tokens de corta duración (30 min)
- Refresh tokens de larga duración (7 días)
- Validación de expiración automática
- Extracción segura de tokens desde headers

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
**POST** `/auth/register`

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
  "tokens": {
    "access_token": "eyJ...",
    "refresh_token": "eyJ...",
    "token_type": "Bearer",
    "expires_in": 1800,
    "user_id": "usr_123abc456def",
    "email": "bryan@example.com"
  },
  "next_steps": [
    "Verifica tu email para activar completamente tu cuenta",
    "Guarda tus tokens de forma segura"
  ]
}
```

**Error Responses:**
- `400` - Datos inválidos (contraseña débil, email inválido, etc.)
- `409` - Email ya registrado

---

### 2. Inicio de Sesión
**POST** `/auth/login`

Autenticar un usuario existente y obtener tokens JWT.

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
  "message": "Login successful",
  "user": {
    "user_id": "usr_123abc456def",
    "name": "Bryan Torres",
    "email": "bryan@example.com",
    "currency": "MXN",
    "last_login_at": "2025-08-22T12:30:00.000Z"
  },
  "tokens": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "token_type": "Bearer",
    "expires_in": 1800,
    "user_id": "usr_123abc456def",
    "email": "bryan@example.com"
  }
}
```

**Error Responses:**
- `400` - Datos de login inválidos
- `401` - Credenciales incorrectas
- `403` - Cuenta inactiva
- `423` - Cuenta bloqueada temporalmente

---

### 3. Renovar Token de Acceso
**POST** `/auth/refresh`

Obtener un nuevo access token usando un refresh token válido.

**Request Body:**
```json
{
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response Success (200):**
```json
{
  "message": "Token refreshed successfully",
  "tokens": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "token_type": "Bearer",
    "expires_in": 1800,
    "user_id": "usr_123abc456def",
    "email": "bryan@example.com"
  }
}
```

---

### 2. Login de Usuario
**POST** `/users/login`

Iniciar sesión con credenciales y obtener tokens JWT.

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
  "message": "Login successful",
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
  "tokens": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "token_type": "Bearer",
    "expires_in": 1800,
    "user_id": "usr_123abc456def",
    "email": "bryan@example.com"
  }
**Error Responses:**
- `400` - Refresh token faltante
- `401` - Refresh token inválido o expirado

---

### 4. Obtener Usuario 🔐
**GET** `/users/{user_id}`

Obtener información de un usuario específico. **Requiere autenticación JWT.**

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```
```

**Restricciones:**
- Solo puedes acceder a tu propia información de usuario
- El `user_id` debe coincidir con el usuario del token JWT

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
- `401` - Token JWT faltante o inválido
- `403` - Acceso denegado (intentando acceder a datos de otro usuario)
- `404` - Usuario no encontrado

---

### 5. Actualizar Usuario 🔐
**PUT** `/users/{user_id}`

Actualizar información del usuario. **Requiere autenticación JWT.** Para cambios sensibles (email o contraseña) se requiere la contraseña actual.

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Restricciones:**
- Solo puedes actualizar tu propia información
- El `user_id` debe coincidir con el usuario del token JWT

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
- `401` - Token JWT faltante o inválido, o contraseña actual incorrecta
- `403` - Acceso denegado (intentando actualizar otro usuario)
- `404` - Usuario no encontrado
- `409` - Email ya en uso

---

### 6. Eliminar Usuario 🔐
**DELETE** `/users/{user_id}`

Eliminar usuario (soft delete - marca como inactivo). **Requiere autenticación JWT.**

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Restricciones:**
- Solo puedes eliminar tu propia cuenta
- El `user_id` debe coincidir con el usuario del token JWT

**Response Success (200):**
```json
{
  "message": "Usuario eliminado exitosamente",
  "user_id": "usr_123abc456def"
}
```

**Error Responses:**
- `401` - Token JWT faltante o inválido
- `403` - Acceso denegado (intentando eliminar otro usuario)
- `404` - Usuario no encontrado

---

### 7. Información de la API
**GET** `/users`

Obtener información sobre la API y endpoints disponibles. **Endpoint público.**

**Response Success (200):**
```json
{
  "message": "API de usuarios de Finance Tracker",
  "version": "3.0.0",
  "timestamp": "2025-08-22T16:00:00.000Z",
  "features": [
    "Registro de usuarios con validación de contraseña",
    "Autenticación JWT con tokens de acceso y refresh",
    "Login con protección contra ataques de fuerza bruta",
    "Control de acceso basado en usuarios",
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

### Login y obtener tokens JWT:
```bash
curl -X POST https://api.finance-tracker.com/users/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "bryan@example.com",
    "password": "MiContraseña123!"
  }'
```

### Acceder a endpoint protegido:
```bash
curl -X GET https://api.finance-tracker.com/users/usr_123abc456def \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### Refresh token:
```bash
curl -X POST https://api.finance-tracker.com/users/refresh-token \
  -H "Content-Type: application/json" \
  -d '{
    "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }'
```

## Manejo de Errores JWT

### Errores de Autenticación Comunes

**Token faltante (401):**
```json
{
  "error": "Unauthorized",
  "message": "Token de autorización requerido"
}
```

**Token inválido (401):**
```json
{
  "error": "Unauthorized", 
  "message": "Token inválido o expirado"
}
```

**Acceso denegado (403):**
```json
{
  "error": "Forbidden",
  "message": "No tienes permisos para acceder a este recurso"
}
```

### Flujo de Renovación de Token

1. El token de acceso expira después de 15 minutos
2. Usa el refresh token para obtener un nuevo token de acceso
3. El refresh token expira después de 7 días
4. Si el refresh token expira, el usuario debe hacer login nuevamente

### Seguridad y Mejores Prácticas

- **Tokens de acceso cortos**: 15 minutos para minimizar riesgo
- **Refresh tokens largos**: 7 días para mejor experiencia de usuario
- **Aislamiento de usuarios**: Cada usuario solo puede acceder a sus propios datos
- **Headers seguros**: Tokens enviados en headers Authorization
- **Validación estricta**: Verificación de firma y expiración en cada request
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
