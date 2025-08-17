# Finance Tracker Serverless - Terraform Infrastructure

Esta carpeta contiene toda la infraestructura como código (IaC) para el proyecto Finance Tracker Serverless, implementada siguiendo las mejores prácticas de Terraform.

## 🏗️ Arquitectura

La infraestructura está diseñada con una arquitectura modular que soporta múltiples entornos:

```
terraform/
├── modules/
│   └── finance-tracker/          # Módulo reutilizable principal
│       ├── main.tf               # Configuración principal y GitHub releases
│       ├── variables.tf          # Variables del módulo
│       ├── outputs.tf            # Outputs del módulo
│       ├── dynamodb.tf           # Tablas DynamoDB
│       ├── lambda.tf             # Funciones Lambda y Layer
│       └── api_gateway.tf        # API Gateway y configuración
├── environments/
│   ├── dev/                      # Entorno de desarrollo
│   │   ├── main.tf               # Configuración para desarrollo
│   │   ├── variables.tf          # Variables específicas de dev
│   │   ├── outputs.tf            # Outputs de desarrollo
│   │   └── terraform.tfvars.example
│   └── prod/                     # Entorno de producción
│       ├── main.tf               # Configuración para producción
│       ├── variables.tf          # Variables específicas de prod
│       ├── outputs.tf            # Outputs de producción
│       └── terraform.tfvars.example
├── deploy-dev.sh                 # Script de deployment para desarrollo
├── deploy-prod.sh                # Script de deployment para producción
└── README.md                     # Este archivo
```

## � Recursos Creados

### AWS Lambda
- **5 Funciones Lambda**: health, users, transactions, categories, auth
- **1 Lambda Layer**: Dependencias de Python compartidas
- **IAM Role**: Con permisos específicos para DynamoDB
- **CloudWatch Log Groups**: Para logging de cada función

### Amazon DynamoDB
- **users**: Tabla principal de usuarios con GSI por email
- **transactions**: Transacciones con GSI por fecha y categoría
- **categories**: Categorías con GSI por tipo
- **Configuración**: Encriptación habilitada, Point-in-Time Recovery (prod)

### **3. Configurar región de México**
```bash
### API Gateway
- **REST API**: Con endpoints para todas las funciones
- **Stage**: Configurado por entorno (dev/prod)
- **CORS**: Configurado según el entorno
- **Throttling**: Límites configurables por entorno
- **Logging**: CloudWatch logs habilitados

### S3 & GitHub Integration
- **Bucket S3**: Para almacenar assets de deployment temporalmente
- **GitHub Release Integration**: Lee automáticamente releases/prereleases
- **Assets Download**: Descarga y despliega código automáticamente

### Monitoring (Solo Producción)
- **CloudWatch Alarms**: Para errores y duración de Lambda
- **API Gateway Monitoring**: Alarmas para errores 5xx
- **Log Retention**: Configurado según entorno

## � Flujo de Deployment Automatizado

### Entorno de Desarrollo (dev)
1. **Trigger**: Pull Request a `main`
2. **GitHub Actions**: Crea un **prerelease** con assets
3. **Terraform**: Lee el prerelease y despliega en `dev`
4. **Resultado**: Entorno de desarrollo actualizado automáticamente

### Entorno de Producción (prod)
1. **Trigger**: Push a `main` 
2. **GitHub Actions**: Crea un **release** estable con assets
3. **Terraform**: Lee el release y despliega en `prod`
4. **Resultado**: Entorno de producción actualizado automáticamente

## 📋 Prerrequisitos

### Herramientas Requeridas
- **Terraform** >= 1.5
- **AWS CLI** configurado
- **curl** para testing
- **jq** (opcional, para JSON formatting)

### Credenciales y Configuración
- **AWS Credentials**: Configuradas con permisos suficientes
- **GitHub Token**: Con permisos de lectura del repositorio
- **terraform.tfvars**: Archivo con variables específicas del entorno

## ⚙️ Configuración Inicial

### 1. Clonar y Navegar
```bash
cd terraform/
```

### 2. Configurar Entorno de Desarrollo
```bash
# Copiar archivo de ejemplo
cp environments/dev/terraform.tfvars.example environments/dev/terraform.tfvars

# Editar configuración
vim environments/dev/terraform.tfvars
```

**Variables mínimas requeridas:**
```hcl
github_owner = "tu-usuario-github"
github_token = "ghp_tu_token_de_github"
```

### 3. Configurar Entorno de Producción
```bash
# Copiar archivo de ejemplo
cp environments/prod/terraform.tfvars.example environments/prod/terraform.tfvars

# Editar configuración (IMPORTANTE: configurar CORS correctamente)
vim environments/prod/terraform.tfvars
```

**Configuración crítica para producción:**
```hcl
github_owner = "tu-usuario-github"
github_token = "ghp_tu_token_de_github"
cors_allowed_origins = [
  "https://tu-dominio-real.com",
  "https://app.tu-dominio.com"
]
```

## � Comandos de Deployment

### Desarrollo (dev)
```bash
# Deployment completo
./deploy-dev.sh

# Solo ver el plan
./deploy-dev.sh plan

# Ver outputs
./deploy-dev.sh outputs

# Probar deployment
./deploy-dev.sh test

# Destruir recursos
./deploy-dev.sh destroy
```

### Producción (prod)
```bash
# Deployment completo (con confirmaciones de seguridad)
./deploy-prod.sh

# Solo ver el plan
./deploy-prod.sh plan

# Ver outputs y estado
./deploy-prod.sh status

# Probar deployment
./deploy-prod.sh test

# Destruir recursos (CON MÚLTIPLES CONFIRMACIONES)
./deploy-prod.sh destroy
```

## 🔍 Monitoring y Troubleshooting

### Logs de Lambda
```bash
# Ver logs en tiempo real
aws logs tail /aws/lambda/finance-tracker-dev-health --follow
aws logs tail /aws/lambda/finance-tracker-prod-users --follow
```

### API Gateway Logs
```bash
# Ver logs de API Gateway
aws logs tail /aws/apigateway/finance-tracker-dev --follow
aws logs tail /aws/apigateway/finance-tracker-prod --follow
```

### Health Check
```bash
# Probar endpoint de salud
curl https://[api-id].execute-api.us-east-1.amazonaws.com/dev/health
curl https://[api-id].execute-api.us-east-1.amazonaws.com/prod/health
```

### CloudWatch Alarms (Producción)
```bash
# Ver estado de alarmas
aws cloudwatch describe-alarms --region us-east-1
```

## 🏷️ Gestión de Tags y Costos

### Tags Automáticos
Todos los recursos incluyen tags automáticos:
- `Environment`: dev/prod
- `Project`: finance-tracker
- `ManagedBy`: terraform
- `Release`: tag del GitHub release utilizado

### Optimización de Costos
- **Development**: 
  - DynamoDB: PAY_PER_REQUEST
  - Lambda: 256MB RAM
  - Logs: 7 días retención
  - Point-in-Time Recovery: Deshabilitado
  
- **Production**:
  - DynamoDB: PAY_PER_REQUEST (configurable a PROVISIONED)
  - Lambda: 512MB RAM
  - Logs: 30 días retención
  - Point-in-Time Recovery: Habilitado

## 🔐 Seguridad y Mejores Prácticas

### Seguridad Implementada
- ✅ IAM Roles con principio de menor privilegio
- ✅ Encriptación en reposo para DynamoDB
- ✅ VPC endpoints (si se configura)
- ✅ CORS configurado específicamente
- ✅ API throttling configurado
- ✅ Logs de acceso habilitados

### Estado Remoto (Recomendado para Producción)
```hcl
terraform {
  backend "s3" {
    bucket = "finance-tracker-terraform-state-prod"
    key    = "environments/prod/terraform.tfstate"
    region = "us-east-1"
    encrypt = true
    dynamodb_table = "finance-tracker-terraform-locks"
  }
}
```

## 🚨 Troubleshooting Común

### Error: GitHub Token
```
Error: GET https://api.github.com/repos/owner/repo/releases/latest: 401
```
**Solución**: Verificar que el `github_token` sea válido y tenga permisos de lectura.

### Error: AWS Credentials
```
Error: error configuring Terraform AWS Provider: no valid credential sources found
```
**Solución**: Ejecutar `aws configure` o verificar variables de entorno AWS.

### Error: Release Not Found
```
Error: could not find release
```
**Solución**: Asegurar que exista al menos un release/prerelease en GitHub.

### Lambda Function Code Changes Not Applied
**Causa**: El código no se actualiza automáticamente si no hay cambios en el hash.
**Solución**: El sistema está diseñado para leer automáticamente nuevos releases de GitHub.

## 📚 Recursos Adicionales

### Documentación Oficial
- [Terraform AWS Provider](https://registry.terraform.io/providers/hashicorp/aws/latest/docs)
- [AWS Lambda Documentation](https://docs.aws.amazon.com/lambda/)
- [API Gateway Documentation](https://docs.aws.amazon.com/apigateway/)
- [DynamoDB Documentation](https://docs.aws.amazon.com/dynamodb/)

### Comandos Útiles
```bash
# Ver estado completo de Terraform
terraform show

# Formatear archivos Terraform
terraform fmt -recursive

# Validar configuración
terraform validate

# Ver dependencias
terraform graph | dot -Tsvg > graph.svg
```

## 🤝 Contribución

1. Todos los cambios deben probarse primero en `dev`
2. Los cambios de infraestructura requieren revisión
3. Seguir las convenciones de nombres establecidas
4. Documentar cualquier variable nueva

## 📞 Soporte

Para problemas relacionados con la infraestructura:
1. Revisar los logs de CloudWatch
2. Verificar el estado de Terraform: `terraform show`
3. Consultar este README
4. Crear un issue en el repositorio

## 🧪 Probar el Deployment

### **1. Health Check**
```bash
# Usar el comando que aparece en los outputs
curl -X GET https://TU_API_ID.execute-api.mx-central-1.amazonaws.com/api/health

# Respuesta esperada:
{
  "status": "healthy",
  "message": "Finance Tracker API is running",
  "timestamp": "2025-08-15T10:30:00Z",
  "version": "1.0.0",
  "environment": "dev"
}
```

### **2. Verificar en AWS Console**
- **Lambda**: https://console.aws.amazon.com/lambda
- **DynamoDB**: https://console.aws.amazon.com/dynamodbv2
- **API Gateway**: https://console.aws.amazon.com/apigateway
- **CloudWatch**: https://console.aws.amazon.com/cloudwatch

## 💰 Costos Estimados (USD/mes)

### **Desarrollo (PAY_PER_REQUEST)**
- DynamoDB: ~$1-5 (dependiendo del uso)
- Lambda: ~$0-2 (free tier generalmente cubre)
- API Gateway: ~$0-3 (free tier para primeras 1M requests)
- CloudWatch: ~$0-1
- **Total: ~$1-10/mes**

### **Producción (PROVISIONED + más memoria)**
- DynamoDB: ~$10-50 (dependiendo del throughput)
- Lambda: ~$5-20 (dependiendo de ejecuciones)
- API Gateway: ~$3-15 (dependiendo de requests)
- CloudWatch: ~$2-5
- **Total: ~$20-90/mes**

## 🔧 Configuración por Entorno

### **variables.tf**
Contiene todas las variables disponibles con valores por defecto.

### **terraform.tfvars**  
Configuración específica para DEV (ya configurado).

### **Para otros entornos, crear:**
```bash
# terraform-staging.tfvars
environment = "staging"
enable_point_in_time_recovery = true
lambda_memory_size = 512

# terraform-production.tfvars  
environment = "production"
enable_point_in_time_recovery = true
lambda_memory_size = 1024
dynamodb_billing_mode = "PROVISIONED"
```

## 🗑️ Destruir Recursos

### **🤖 Modo Automático (Recomendado)**

**Script completo con destrucción y verificación:**
```bash
# Destruir y verificar entorno de desarrollo
./destroy_and_verify.sh

# Destruir y verificar entorno específico
./destroy_and_verify.sh staging
./destroy_and_verify.sh production
```

**Solo verificar recursos existentes (sin destruir):**
```bash
# Verificar qué recursos existen actualmente
./quick_verify.sh

# Verificar entorno específico
./quick_verify.sh staging
```

### **🔧 Modo Manual**

**⚠️ CUIDADO: Esto eliminará TODOS los recursos**

```bash
# Destruir entorno de desarrollo
terraform destroy

# Destruir entorno específico
terraform destroy -var="environment=staging"
```

### **🤖 Características de los Scripts Automatizados**

**`destroy_and_verify.sh` - Script Completo:**
- ✅ Verificación de prerequisitos (AWS CLI, Terraform, credenciales)
- ⚠️ Confirmación de seguridad (requiere escribir 'DESTROY')
- 🗑️ Ejecución automática de `terraform destroy`
- 🔍 Verificación completa de todos los recursos
- 🧹 Opción de limpieza manual para recursos remanentes
- 📊 Reporte final detallado
- 💰 Confirmación de que no se generan más costos

**`quick_verify.sh` - Verificación Rápida:**
- 🔍 Solo verifica qué recursos existen
- ⚡ Ejecución rápida sin cambios
- 📋 Lista detallada de recursos encontrados
- 💡 Comandos útiles adicionales

### **⚠️ Recursos que pueden requerir limpieza manual:**

Algunos recursos de AWS pueden mostrar warnings al destruir y requerir verificación manual:

```bash
# Verificar que no queden recursos remanentes
aws dynamodb list-tables --region mx-central-1 | grep finance-tracker
aws lambda list-functions --region mx-central-1 | grep finance-tracker
aws logs describe-log-groups --region mx-central-1 | grep finance-tracker
aws apigateway get-rest-apis --region mx-central-1 | grep finance-tracker
```

### **🧹 Limpieza Manual (si es necesaria):**

Si algunos recursos no se eliminaron completamente:

```bash
# Eliminar tablas DynamoDB manualmente
aws dynamodb delete-table --table-name finance-tracker-dev-users --region mx-central-1

# Eliminar funciones Lambda manualmente  
aws lambda delete-function --function-name finance-tracker-dev-health-check --region mx-central-1

# Eliminar log groups manualmente
aws logs delete-log-group --log-group-name /aws/lambda/finance-tracker-dev-health-check --region mx-central-1
```

**Nota:** Los warnings sobre "Resource Destruction" son normales para recursos como API Gateway Account Settings que son compartidos a nivel de cuenta AWS.

## 🐛 Troubleshooting

### **Error: "AccessDenied"**
- Verificar que tu usuario AWS tiene los permisos necesarios
- Revisar que `aws configure` esté correctamente configurado

### **Error: "ResourceAlreadyExists"**
- Recursos ya existen con el mismo nombre
- Cambiar el `environment` o `project_name` en variables

### **Lambda package muy grande**
- El zip se genera automáticamente desde `../backend/src`
- Si excede 50MB, necesitaremos usar S3

### **API Gateway 502 Error**
- Verificar que Lambda tiene permisos correctos
- Revisar CloudWatch logs de Lambda

## 📝 Próximos Pasos

1. ✅ Health check funcionando
2. ⏳ Agregar más endpoints (users, accounts, etc.)
3. ⏳ Configurar autenticación (Cognito)
4. ⏳ Agregar monitoreo avanzado
5. ⏳ CI/CD pipeline

---

*Para más información, revisar los archivos individuales .tf*
