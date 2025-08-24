# API de Autenticación - Finance Tracker

## Descripción
Endpoints dedicados para la autenticación de usuarios en el sistema Finance Tracker. Separados de las operaciones CRUD de usuarios para mejor organización y responsabilidad.

## 🔐 Arquitectura de Autenticación

### Tokens JWT
- **Access Token**: Válido por 30 minutos, usado para autenticar requests
- **Refresh Token**: Válido por 7 días, usado para renovar access tokens
- **Algoritmo**: HS256 (HMAC with SHA-256)

### Variables de Entorno
```bash
JWT_SECRET_KEY=your-secret-key-change-in-production
```

## 📍 Endpoints de Autenticación

### Base URL
```
https://xbp9zivp7c.execute-api.mx-central-1.amazonaws.com/api/auth
```

---

## 1. Registro de Usuario
**POST** `/auth/register`

Crear una nueva cuenta de usuario en el sistema.

### Request
```json
{
  "name": "Bryan Torres",
  "email": "bryan@example.com",
  "password": "MiContraseña123!",
  "confirm_password": "MiContraseña123!",
  "currency": "MXN"
}
```

### Validaciones
- **Email**: Formato válido y único en el sistema
- **Contraseña**: Mínimo 8 caracteres, debe incluir:
  - Al menos una mayúscula
  - Al menos una minúscula
  - Al menos un número
  - Al menos un carácter especial (!@#$%^&*(),.?":{}|<>)
- **Nombre**: Solo letras, espacios y acentos
- **Currency**: Códigos ISO válidos (MXN, USD, EUR, CAD)

### Response Success (201)
```json
{
  "message": "Usuario creado exitosamente",
  "user": {
    "user_id": "usr_123abc456def",
    "name": "Bryan Torres",
    "email": "bryan@example.com",
    "currency": "MXN",
    "created_at": "2025-01-16T12:00:00.000Z",
    "updated_at": "2025-01-16T12:00:00.000Z",
    "is_active": true,
    "email_verified": false,
    "last_login_at": null
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

### Error Responses
- `400 Bad Request` - Datos inválidos (contraseña débil, email inválido)
- `409 Conflict` - Email ya registrado en el sistema
- `422 Unprocessable Entity` - Validación de contraseña fallida

---

## 2. Inicio de Sesión
**POST** `/auth/login`

Autenticar un usuario existente y obtener tokens de acceso.

### Request
```json
{
  "email": "bryan@example.com",
  "password": "MiContraseña123!"
}
```

### Response Success (200)
```json
{
  "message": "Login successful",
  "user": {
    "user_id": "usr_123abc456def",
    "name": "Bryan Torres",
    "email": "bryan@example.com",
    "currency": "MXN",
    "is_active": true,
    "last_login_at": "2025-01-16T12:30:00.000Z"
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

### Error Responses
- `400 Bad Request` - Datos de login inválidos o faltantes
- `401 Unauthorized` - Credenciales incorrectas
- `403 Forbidden` - Cuenta inactiva o suspendida
- `423 Locked` - Cuenta bloqueada temporalmente (demasiados intentos fallidos)

---

## 3. Renovar Token de Acceso
**POST** `/auth/refresh`

Obtener un nuevo access token usando un refresh token válido.

### Request
```json
{
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Response Success (200)
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

### Error Responses
- `400 Bad Request` - Refresh token faltante o formato inválido
- `401 Unauthorized` - Refresh token inválido, expirado o revocado

---

## 🔒 Seguridad

### Protección contra Ataques
- **Rate Limiting**: Máximo 5 intentos de login fallidos por IP/usuario
- **Account Lockout**: Bloqueo temporal de cuenta por 1 hora después de 5 intentos fallidos
- **Password Hashing**: bcrypt con salt para almacenamiento seguro
- **Token Security**: Tokens firmados con HS256 y clave secreta

### Headers de Seguridad
```bash
Content-Type: application/json
Accept: application/json
```

### Tokens en Respuesta
- **Access Token**: Usar en header `Authorization: Bearer <token>`
- **Refresh Token**: Almacenar de forma segura (HttpOnly cookies recomendado)
- **Expiración**: Access tokens expiran en 30 minutos

---

## 📝 Ejemplos de Uso

### Curl Examples

#### Registrar Usuario
```bash
curl -X POST https://xbp9zivp7c.execute-api.mx-central-1.amazonaws.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Bryan Torres",
    "email": "bryan@example.com",
    "password": "MiContraseña123!",
    "confirm_password": "MiContraseña123!",
    "currency": "MXN"
  }'
```

#### Iniciar Sesión
```bash
curl -X POST https://xbp9zivp7c.execute-api.mx-central-1.amazonaws.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "bryan@example.com",
    "password": "MiContraseña123!"
  }'
```

#### Renovar Token
```bash
curl -X POST https://xbp9zivp7c.execute-api.mx-central-1.amazonaws.com/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }'
```

---

## 🔄 Flujo de Autenticación Recomendado

1. **Registro/Login**: Obtener access_token y refresh_token
2. **Usar Access Token**: Incluir en Authorization header para requests autenticados
3. **Token Expira**: Cuando access_token expire, usar refresh_token para obtener nuevo
4. **Renovar Refresh Token**: Cada 7 días o cuando expire
5. **Logout**: Invalidar tokens en el cliente (no hay endpoint de logout por ser JWT stateless)

### Manejo de Errores
- **401 en request autenticado**: Access token expirado → usar refresh endpoint
- **401 en refresh**: Refresh token expirado → requiere login nuevo
- **403**: Cuenta inactiva → contactar soporte
- **423**: Cuenta bloqueada → esperar 1 hora o contactar soporte

---

## ⚡ Performance y Mejores Prácticas

### Token Storage (Frontend)
- **Access Token**: sessionStorage o memoria
- **Refresh Token**: httpOnly cookies (más seguro) o localStorage (menos seguro)

### Request Optimization
- Incluir access token en todos los requests a endpoints privados
- Implementar retry automático con refresh cuando access token expire
- Cache user data para reducir calls al API

### Security Best Practices
- Nunca enviar tokens en URLs o logs
- Implementar token rotation en refresh
- Usar HTTPS siempre en producción
- Validar tokens en cada request del servidor
