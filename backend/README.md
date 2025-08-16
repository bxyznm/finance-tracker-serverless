# Finance Tracker - Backend

API serverless para gestión de finanzas personales usando AWS Lambda y DynamoDB.

## 🏗️ Arquitectura

- **Runtime:** Python 3.11+
- **Serverless:** AWS Lambda
- **Database:** DynamoDB
- **API Gateway:** REST API
- **Authentication:** AWS Cognito (próximamente)

## 📁 Estructura del Proyecto

```
backend/
├── src/
│   ├── handlers/          # Lambda handlers para cada endpoint
│   │   ├── health.py      # Health check endpoint
│   │   └── __init__.py
│   ├── models/            # Modelos de datos con Pydantic
│   │   └── __init__.py
│   ├── utils/             # Utilidades compartidas
│   │   ├── config.py      # Configuración de la aplicación
│   │   ├── responses.py   # Utilidades de respuestas HTTP
│   │   └── __init__.py
│   └── __init__.py
├── tests/                 # Tests unitarios
│   └── test_health.py     # Tests del health check
├── requirements.txt       # Dependencias Python
└── README.md             # Este archivo
```

## 🚀 Instalación y Setup

### Prerequisitos
- Python 3.11+
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
```

## 🧪 Testing

```bash
# Ejecutar todos los tests
pytest

# Ejecutar tests con coverage
pytest --cov=src

# Ejecutar tests específicos
pytest tests/test_health.py
```

## 📝 Endpoints Disponibles

### Health Check
- **Endpoint:** `GET /health`
- **Descripción:** Verificar estado de la API
- **Response:**
```json
{
  "status": "healthy",
  "message": "Finance Tracker API is running",
  "timestamp": "2025-08-15T10:30:00Z",
  "version": "1.0.0",
  "environment": "dev"
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

- [ ] `POST /api/users` - Registro de usuario
- [ ] `GET /api/accounts` - Listar cuentas
- [ ] `POST /api/transactions` - Crear transacción
- [ ] `GET /api/categories` - Listar categorías
- [ ] `POST /api/budgets` - Crear presupuesto

## 🤝 Contribución

1. Seguir las guidelines del `PROJECT_PLAN.md`
2. Escribir tests para nuevas funcionalidades
3. Mantener coverage >80%
4. Usar type hints en Python
5. Documentar APIs con OpenAPI (próximamente)

---

*Para más información, revisar `PROJECT_PLAN.md` en el directorio raíz.*
