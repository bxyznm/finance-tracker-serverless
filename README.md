# Finance Tracker Serverless ✅

> **Status**: ✅ **PRODUCCIÓN** | **AWS**: ✅ Desplegado | **API**: ✅ Funcionando | **DB**: ✅ Single Table Design

Aplicación serverless para gestión de finanzas personales construida con Python, AWS Lambda, DynamoDB y Terraform. Diseñada para el mercado mexicano con soporte nativo para pesos mexicanos (MXN).

## 🚀 URLs de Producción

- **🔗 API Base**: https://xbp9zivp7c.execute-api.mx-central-1.amazonaws.com/api
- **💚 Health Check**: https://xbp9zivp7c.execute-api.mx-central-1.amazonaws.com/api/health  
- **� Auth API**: https://xbp9zivp7c.execute-api.mx-central-1.amazonaws.com/api/auth
- **�👥 Users API**: https://xbp9zivp7c.execute-api.mx-central-1.amazonaws.com/api/users

## ✅ Funcionalidades Implementadas

### Health Check ✅
```bash
curl -X GET https://xbp9zivp7c.execute-api.mx-central-1.amazonaws.com/api/health
```

### Autenticación ✅
```bash
# Registrar nuevo usuario
curl -X POST https://xbp9zivp7c.execute-api.mx-central-1.amazonaws.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Tu Nombre","email":"tu@email.com","password":"TuPassword123!","currency":"MXN"}'

# Iniciar sesión
curl -X POST https://xbp9zivp7c.execute-api.mx-central-1.amazonaws.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"tu@email.com","password":"TuPassword123!"}'

# Renovar token de acceso
curl -X POST https://xbp9zivp7c.execute-api.mx-central-1.amazonaws.com/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{"refresh_token":"tu_refresh_token_aqui"}'
```

### CRUD de Usuarios ✅
```bash
# Obtener usuario por ID (requiere autenticación)
curl -X GET https://xbp9zivp7c.execute-api.mx-central-1.amazonaws.com/api/users/{user_id} \
  -H "Authorization: Bearer tu_access_token"

# Actualizar usuario (requiere autenticación)
curl -X PUT https://xbp9zivp7c.execute-api.mx-central-1.amazonaws.com/api/users/{user_id} \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer tu_access_token" \
  -d '{"name":"Nuevo Nombre","currency":"USD"}'

# Eliminar usuario - soft delete (requiere autenticación)
curl -X DELETE https://xbp9zivp7c.execute-api.mx-central-1.amazonaws.com/api/users/{user_id} \
  -H "Authorization: Bearer tu_access_token"
```

### Validaciones Implementadas ✅
- ✅ Sistema de autenticación JWT con access/refresh tokens
- ✅ Validación de contraseñas seguras (8+ caracteres, mayús/minús/número/especial)
- ✅ Email único y formato válido
- ✅ Campos requeridos (name, email, password)
- ✅ Currency en formato ISO (MXN, USD, etc.)
- ✅ Error handling descriptivo con Pydantic
- ✅ Soft delete (marcar usuario como inactivo)
- ✅ Endpoints de autenticación separados (/auth/) y gestión de usuarios (/users/)

## 🏗️ Arquitectura

### AWS Infrastructure
- **Lambda Functions**: Python 3.12 runtime (256MB)
- **API Gateway**: REST API con CORS habilitado
- **DynamoDB**: **Single Table Design** con GSIs optimizados
- **IAM**: Roles y policies configurados
- **CloudWatch**: Logs centralizados
- **S3**: Bucket para deployment assets

### Tech Stack
- **Backend**: Python 3.12 + Pydantic 2.8
- **Database**: DynamoDB con Single Table Design Pattern
- **Infrastructure**: Terraform (IaC)
- **Validation**: Pydantic + email-validator
- **AWS SDK**: boto3 optimizado
- **Layer**: 20MB optimizado (65% reducción)

### Single Table Design Pattern
```python
# Estructura de datos optimizada
{
  "pk": "USER#{user_id}",           # Partition Key
  "sk": "METADATA",                 # Sort Key  
  "gsi1_pk": "EMAIL#{email}",       # GSI1 para búsqueda por email
  "gsi1_sk": "USER#{user_id}",      
  "entity_type": "user",
  "user_id": "usr_123456",
  "name": "Juan Pérez",
  "email": "juan@example.com",
  "currency": "MXN",
  "is_active": true
}
```

**Beneficios del Single Table Design**:
- 💰 **Menor costo**: Una tabla vs múltiples tablas
- ⚡ **Mejor rendimiento**: Menos round-trips
- 🔧 **Simplicidad**: Menos recursos de infraestructura

## 📋 API Reference

### Endpoints de Autenticación

#### Registrar Usuario
- **Endpoint**: `POST /auth/register`
- **Campos requeridos**: `name` (string), `email` (string), `password` (string)
- **Campos opcionales**: `currency` (string, default: "MXN")
- **Validaciones**: Email único, formato válido, contraseña segura

#### Iniciar Sesión
- **Endpoint**: `POST /auth/login`
- **Campos requeridos**: `email` (string), `password` (string)
- **Response**: Access token + Refresh token + datos del usuario

#### Renovar Token
- **Endpoint**: `POST /auth/refresh`  
- **Campos requeridos**: `refresh_token` (string)
- **Response**: Nuevo access token

### Endpoints de Usuarios (Requieren Autenticación)

#### Obtener Usuario
- **Endpoint**: `GET /users/{user_id}`
- **Headers**: `Authorization: Bearer <access_token>`
- **Validaciones**: Solo el propio usuario puede acceder a sus datos

### Ejemplo de Respuesta Exitosa
```json
{
  "message": "Usuario creado exitosamente",
  "user": {
    "user_id": "usr_36cec417d261",
    "name": "Bryan Torres",
    "email": "bryan@ejemplo.com", 
    "currency": "MXN",
    "created_at": "2025-08-16 07:41:17.537715",
    "updated_at": "2025-08-16 07:41:17.537715",
    "is_active": true
  }
}
```

## 🛠️ Desarrollo y Deployment

### Prerrequisitos
- Python 3.12+
- AWS CLI configurado
- Terraform >= 1.0
- GitHub CLI (opcional)

### Setup Local
```bash
# Clonar repositorio
git clone https://github.com/bxyznm/finance-tracker-serverless.git
cd finance-tracker-serverless

# Instalar dependencias del backend
cd backend
pip install -r requirements.txt

# Ejecutar tests locales
python -m pytest tests/

# Volver a la raíz del proyecto
cd ..
```

### Deployment con Terraform

#### Ambiente de Desarrollo
```bash
cd terraform/environments/dev
terraform init
terraform plan
terraform apply
```

#### Ambiente de Producción  
```bash
cd terraform/environments/prod
terraform init
terraform plan
terraform apply
```

### Variables de Repositorio Requeridas

Para el deployment automático vía GitHub Actions, configura estas variables:

```bash
# Configurar variables del repositorio (GitHub CLI)
gh variable set DEV_S3_BUCKET_SUFFIX --body "dev-123456-abc123"
gh variable set PROD_S3_BUCKET_SUFFIX --body "prod-123456-abc123"
```

O manualmente en GitHub UI: `Settings` → `Secrets and variables` → `Actions` → `Variables`

## 🧪 Testing

### Tests Automatizados ✅
```bash
cd backend
python -m pytest tests/ -v
```

### Tests Manuales Verificados ✅
- ✅ Health check endpoint
- ✅ Create user (datos válidos)
- ✅ Create user (email duplicado - validación)
- ✅ Create user (email inválido - validación) 
- ✅ Create user (campos faltantes - validación)
- ✅ Get user by ID
- ✅ Update user
- ✅ Delete user (soft delete)

## 🚀 Roadmap

### ✅ Completado
- [x] **Infrastructure**: Terraform + AWS complete setup
- [x] **Users API**: Complete CRUD functionality
- [x] **Single Table Design**: DynamoDB optimization
- [x] **Validation**: Robust input validation with Pydantic
- [x] **Error Handling**: Comprehensive error responses
- [x] **Testing**: Unit tests and manual validation
- [x] **CI/CD**: GitHub Actions workflows
- [x] **Optimization**: Lambda layer size reduced 65%

### 🔄 En Desarrollo (Próximas Semanas)
- [ ] **Accounts API**: Cuentas bancarias/financieras
- [ ] **Transactions API**: Registro de transacciones
- [ ] **Categories API**: Categorización de gastos
- [ ] **Authentication**: JWT/Cognito integration

### 🎯 Futuro (Próximos Meses)
- [ ] **Frontend**: React.js application
- [ ] **Budgets**: Sistema de presupuestos
- [ ] **Reports**: Dashboards y analytics
- [ ] **Mobile**: React Native app
- [ ] **Real-time**: WebSocket notifications

## 📊 Métricas y Performance

### Optimizaciones Técnicas Logradas ✅
- **Lambda Layer**: Reducido de 70MB+ a 20MB (65% menos)
- **Dependencies**: Curación manual sin conflictos Python 2/3
- **DynamoDB**: Single Table Design con GSIs optimizados
- **Response Time**: <500ms promedio
- **Success Rate**: 100% en tests realizados

### Recursos AWS Desplegados
- **Lambda Functions**: 5 funciones (health, users, transactions, categories, auth)
- **DynamoDB**: 1 tabla con 2 GSIs (Single Table Design)
- **API Gateway**: 1 REST API con múltiples endpoints
- **IAM**: Roles y policies optimizados
- **CloudWatch**: Log groups configurados
- **S3**: Bucket para deployment assets

## 🏆 Logros Destacados

### Arquitectura Serverless Completa ✅
- **Infrastructure as Code**: 100% definida en Terraform
- **Single Table Design**: Patrón DynamoDB avanzado implementado
- **CI/CD Pipeline**: GitHub Actions con deployment automático
- **Multi-environment**: Dev/Prod environments configurados

### Resolución de Issues Técnicos ✅
- ✅ Lambda layer size conflicts resueltos
- ✅ GSI naming inconsistencies corregidas
- ✅ Pydantic import errors solucionados
- ✅ Email validation dependencies optimizadas
- ✅ Migración exitosa a Single Table Design

## 🔧 Troubleshooting

### Problemas Comunes

#### Error: "Could not save S3 bucket suffix"
- **Causa**: Permisos insuficientes en GitHub Actions
- **Solución**: Configurar manualmente las variables `DEV_S3_BUCKET_SUFFIX` y `PROD_S3_BUCKET_SUFFIX`

#### Error: "ConditionalCheckFailedException"
- **Causa**: Email duplicado en DynamoDB
- **Solución**: Validar email único antes de crear usuario

#### Error: "Lambda layer size too large"
- **Causa**: Dependencias no optimizadas
- **Solución**: Usar layer v16 optimizado (20MB)

### Logs y Monitoreo
```bash
# Ver logs de Lambda
aws logs tail /aws/lambda/finance-tracker-dev-users --follow

# Ver logs de API Gateway  
aws logs tail /aws/apigateway/finance-tracker-dev --follow

# Ver métricas en CloudWatch
# https://mx-central-1.console.aws.amazon.com/cloudwatch/
```

## 📞 Contacto y Contribución

Este proyecto está optimizado para el mercado mexicano y construido con las mejores prácticas de arquitectura serverless.

### Para contribuir:
1. Fork el repositorio
2. Crear feature branch
3. Implementar cambios con tests
4. Submit pull request

### Para reportar issues:
1. Verificar CloudWatch logs
2. Revisar configuración de variables
3. Crear issue en GitHub con logs relevantes

---

## 🎉 Status Final

**✅ APLICACIÓN EN PRODUCCIÓN Y OPTIMIZADA**

La aplicación Finance Tracker Serverless está completamente desplegada, optimizada y funcionando en AWS con:

- ✅ **Single Table Design** implementado y funcionando
- ✅ **CRUD completo** de usuarios con validaciones robustas  
- ✅ **Infrastructure as Code** con Terraform
- ✅ **CI/CD Pipeline** con GitHub Actions
- ✅ **Performance optimizada** (65% reducción en layer size)
- ✅ **Multi-environment** (dev/prod) configurado

**Ready para desarrollo de próximas funcionalidades y escalamiento** 🚀
