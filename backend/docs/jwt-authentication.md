# JWT Authentication Implementation

Este documento describe la implementación completa de autenticación JWT en el Finance Tracker API.

## 📋 Resumen

La implementación JWT proporciona autenticación segura y stateless para todos los endpoints que requieren autorización. Utiliza tokens de acceso de corta duración y tokens de refresco de larga duración para mantener la seguridad y usabilidad.

## 🔐 Arquitectura de Seguridad

### Token Types
- **Access Token**: Válido por 30 minutos, usado para autenticar requests
- **Refresh Token**: Válido por 7 días, usado para obtener nuevos access tokens
- **Algorithm**: HS256 (HMAC with SHA-256)

### Environment Variables
```bash
JWT_SECRET_KEY=your-secret-key-change-in-production  # Required in production
```

## 🛠️ Componentes Implementados

### 1. JWT Utilities (`src/utils/jwt_auth.py`)

#### Classes
- `TokenPayload`: Type-safe token payload structure
- `JWTError`: Custom exception for JWT-related errors

#### Core Functions
- `create_access_token(user_id, email)`: Generate access token
- `create_refresh_token(user_id, email)`: Generate refresh token
- `decode_token(token)`: Validate and decode token
- `create_token_response(user_id, email)`: Complete token response
- `refresh_access_token(refresh_token)`: Refresh access token

#### Middleware Functions
- `extract_token_from_event(event)`: Extract token from Lambda event
- `validate_token_from_event(event)`: Validate token from event
- `require_auth(handler_func)`: Decorator for protected endpoints

### 2. Updated User Handlers (`src/handlers/users.py`)

#### Authentication Flow
```python
# Login returns JWT tokens
POST /users/login
{
    "email": "user@example.com",
    "password": "password"
}

# Response
{
    "message": "Login successful",
    "user": {...},
    "tokens": {
        "access_token": "eyJ...",
        "refresh_token": "eyJ...",
        "token_type": "Bearer",
        "expires_in": 1800,
        "user_id": "user123",
        "email": "user@example.com"
    }
}
```

#### Protected Endpoints
All endpoints except registration, login, and refresh-token require authentication:

- `GET /users` - User summary (authenticated)
- `GET /users/{user_id}` - Get user by ID (own data only)
- `PUT /users/{user_id}` - Update user (own data only)
- `DELETE /users/{user_id}` - Delete user (own account only)

### 3. API Gateway Integration

#### New Endpoints
- `POST /users/refresh-token` - Token refresh endpoint

#### Authentication Headers
```bash
Authorization: Bearer <access_token>
```

## 🔄 Authentication Flow

### 1. User Registration
```bash
POST /users
{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "securepassword",
    "currency": "MXN"
}
```

### 2. User Login
```bash
POST /users/login
{
    "email": "john@example.com",
    "password": "securepassword"
}
```

### 3. Using Protected Endpoints
```bash
GET /users/user123
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 4. Token Refresh
```bash
POST /users/refresh-token
{
    "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

## 🛡️ Security Features

### User Isolation
- Users can only access their own data
- User ID validation from JWT payload
- 403 Forbidden when accessing other users' data

### Token Security
- Short-lived access tokens (30 minutes)
- Longer-lived refresh tokens (7 days)
- Secure token generation with timestamps
- Proper token expiration handling

### Brute Force Protection
- Failed login attempt tracking
- Account lockout after 5 failed attempts
- Password verification with bcrypt

### Input Validation
- Pydantic models for request validation
- Email normalization and validation
- Password strength requirements

## 📊 Error Handling

### Authentication Errors
```json
// No token provided
{
    "error": "Authentication required",
    "message": "Valid JWT token must be provided"
}

// Invalid or expired token  
{
    "error": "Authentication required",
    "message": "Valid JWT token must be provided"
}

// Accessing other user's data
{
    "error": "Access denied", 
    "message": "You can only access your own user data"
}
```

### Token Refresh Errors
```json
// Missing refresh token
{
    "error": "Missing refresh token",
    "message": "refresh_token is required"
}

// Invalid refresh token
{
    "error": "Invalid refresh token",
    "message": "The provided refresh token is invalid or expired"
}
```

## 🧪 Testing

### Test Coverage
- **JWT Utilities Tests** (`tests/test_jwt_auth.py`):
  - Token creation and validation
  - Token extraction from Lambda events
  - Error handling and edge cases
  - Token refresh functionality
  - Security validations

- **User Handler Tests** (`tests/test_users_jwt.py`):
  - Authentication flow testing
  - Protected endpoint access control
  - User isolation validation
  - Token refresh integration
  - Error scenarios

### Running Tests
```bash
cd backend
python -m pytest tests/test_jwt_auth.py -v
python -m pytest tests/test_users_jwt.py -v
```

## 🚀 Deployment

### Environment Variables
Set in AWS Lambda environment:
```bash
JWT_SECRET_KEY=your-production-secret-key-here
```

### Dependencies
Added to `requirements-prod.txt`:
```
PyJWT==2.8.0
cryptography==41.0.7
```

## 💡 Usage Examples

### Frontend Integration
```javascript
// Login
const loginResponse = await fetch('/users/login', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({email, password})
});

const {tokens} = await loginResponse.json();

// Store tokens
localStorage.setItem('access_token', tokens.access_token);
localStorage.setItem('refresh_token', tokens.refresh_token);

// Use authenticated endpoint
const userResponse = await fetch(`/users/${userId}`, {
    headers: {
        'Authorization': `Bearer ${localStorage.getItem('access_token')}`
    }
});

// Refresh token when access token expires
const refreshResponse = await fetch('/users/refresh-token', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({
        refresh_token: localStorage.getItem('refresh_token')
    })
});
```

### cURL Examples
```bash
# Login
curl -X POST https://api.example.com/users/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password"}'

# Get user data
curl -X GET https://api.example.com/users/user123 \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# Refresh token
curl -X POST https://api.example.com/users/refresh-token \
  -H "Content-Type: application/json" \
  -d '{"refresh_token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."}'
```

## 🎯 Next Steps

### Recommended Enhancements
1. **Token Blacklisting**: Implement token revocation for logout
2. **Role-Based Access**: Add user roles and permissions
3. **Rate Limiting**: Implement API rate limiting per user
4. **Audit Logging**: Log all authentication events
5. **Multi-Factor Auth**: Add 2FA support
6. **Session Management**: Track active user sessions

### Monitoring
- Monitor failed login attempts
- Track token refresh patterns
- Alert on suspicious authentication activity
- Monitor API endpoint usage patterns

## 📚 References

- [JWT.io](https://jwt.io/) - JWT token debugger and documentation
- [PyJWT Documentation](https://pyjwt.readthedocs.io/)
- [AWS Lambda Best Practices](https://docs.aws.amazon.com/lambda/latest/dg/best-practices.html)
- [OWASP JWT Security Best Practices](https://cheatsheetseries.owasp.org/cheatsheets/JSON_Web_Token_for_Java_Cheat_Sheet.html)
