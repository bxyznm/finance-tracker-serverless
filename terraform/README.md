# Finance Tracker - Infraestructura Terraform

Este directorio contiene toda la infraestructura como código (IaC) usando Terraform para desplegar la aplicación Finance Tracker en AWS.

## 🏗️ ¿Qué se despliega?

### **DynamoDB Tables (Base de Datos NoSQL)**
- `users` - Información de usuarios
- `accounts` - Cuentas bancarias  
- `transactions` - Transacciones financieras
- `categories` - Categorías (sistema + personalizadas)
- `budgets` - Presupuestos de usuarios

### **Lambda Functions (Código Serverless)**
- `health-check` - Endpoint para verificar estado de la API

### **API Gateway (REST API)**
- API REST que expone las funciones Lambda
- CORS configurado para frontend
- Logging y monitoreo habilitado

### **IAM Roles (Seguridad)**
- Permisos mínimos necesarios para Lambda
- Acceso controlado a DynamoDB
- Logging a CloudWatch

### **CloudWatch (Monitoreo)**
- Logs de Lambda functions
- Logs de API Gateway  
- Métricas y alarmas

## 📋 Prerequisitos

### **1. AWS CLI**
```bash
# Instalar AWS CLI
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install

# Configurar credenciales
aws configure
```

### **2. Terraform**
```bash
# Instalar Terraform
wget https://releases.hashicorp.com/terraform/1.6.0/terraform_1.6.0_linux_amd64.zip
unzip terraform_1.6.0_linux_amd64.zip
sudo mv terraform /usr/local/bin/
```

### **3. Configurar región de México**
```bash
# Configurar AWS CLI para usar la región mx-central-1
aws configure set region mx-central-1
```

### **3. Permisos AWS necesarios**
Tu usuario AWS necesita permisos para:
- DynamoDB (crear/gestionar tablas)
- Lambda (crear/gestionar funciones)  
- API Gateway (crear/gestionar APIs)
- IAM (crear/gestionar roles)
- CloudWatch (crear/gestionar logs)

## 🚀 Comandos de Deployment

### **Inicializar Terraform**
```bash
cd terraform
terraform init
```

### **Planear el deployment**
```bash
# Ver qué recursos se crearán
terraform plan
```

### **Desplegar a DEV**
```bash
# Desplegar usando terraform.tfvars
terraform apply

# O especificar entorno manualmente
terraform apply -var="environment=dev"
```

### **Desplegar a STAGING**
```bash
terraform apply -var="environment=staging" -var="enable_point_in_time_recovery=true"
```

### **Desplegar a PRODUCTION**
```bash
terraform apply -var="environment=production" \
  -var="enable_point_in_time_recovery=true" \
  -var="lambda_memory_size=512" \
  -var="dynamodb_billing_mode=PROVISIONED"
```

## 📊 Outputs Importantes

Después del deployment, Terraform mostrará:

```bash
# URLs de la API
api_gateway_url = "https://abc123.execute-api.mx-central-1.amazonaws.com/api"
health_check_url = "https://abc123.execute-api.mx-central-1.amazonaws.com/api/health"

# Comando para probar
curl_health_check = "curl -X GET https://abc123.execute-api.mx-central-1.amazonaws.com/api/health"

# Nombres de tablas DynamoDB
dynamodb_table_names = {
  accounts = "finance-tracker-dev-accounts"
  budgets = "finance-tracker-dev-budgets" 
  categories = "finance-tracker-dev-categories"
  transactions = "finance-tracker-dev-transactions"
  users = "finance-tracker-dev-users"
}
```

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
