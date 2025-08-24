# =============================================================================
# Finance Tracker Serverless - Outputs para Entorno Development
# =============================================================================

# -----------------------------------------------------------------------------
# Outputs del Módulo Principal
# -----------------------------------------------------------------------------

output "api_gateway_url" {
  description = "URL base de la API Gateway para desarrollo"
  value       = module.finance_tracker.api_gateway_url
}

output "health_check_url" {
  description = "URL del endpoint de health check para desarrollo"
  value       = module.finance_tracker.health_check_url
}

output "api_endpoints" {
  description = "URLs de todos los endpoints de la API para desarrollo"
  value       = module.finance_tracker.api_endpoints
}

output "api_endpoints_table" {
  description = "Tabla detallada de endpoints organizados por categoría para desarrollo"
  value       = module.finance_tracker.api_endpoints_table
}

# -----------------------------------------------------------------------------
# Información de Lambda Functions
# -----------------------------------------------------------------------------

output "lambda_functions" {
  description = "Información de las funciones Lambda en desarrollo"
  value       = module.finance_tracker.lambda_functions
}

output "lambda_layer_arn" {
  description = "ARN del Lambda Layer con las dependencias"
  value       = module.finance_tracker.lambda_layer_arn
}

# -----------------------------------------------------------------------------
# Información de DynamoDB
# -----------------------------------------------------------------------------

output "dynamodb_table" {
  description = "Información de la tabla DynamoDB en desarrollo (Single Table Design)"
  value       = module.finance_tracker.dynamodb_table
}

output "dynamodb_table_name" {
  description = "Nombre de la tabla DynamoDB para variables de entorno"
  value       = module.finance_tracker.dynamodb_table_name
}

# -----------------------------------------------------------------------------
# Información del Release
# -----------------------------------------------------------------------------

output "github_release_info" {
  description = "Información del prerelease de GitHub utilizado"
  value       = module.finance_tracker.github_release_info
}

# -----------------------------------------------------------------------------
# Información del Entorno
# -----------------------------------------------------------------------------

output "environment_info" {
  description = "Información general del entorno de desarrollo"
  value = merge(module.finance_tracker.environment_info, {
    environment_type = "development"
    prerelease_mode  = true
    auto_destroy     = true
    cost_optimized   = true
  })
}

# -----------------------------------------------------------------------------
# Información de CloudWatch
# -----------------------------------------------------------------------------

output "cloudwatch_log_groups" {
  description = "Grupos de logs de CloudWatch en desarrollo"
  value       = module.finance_tracker.cloudwatch_log_groups
}

# -----------------------------------------------------------------------------
# Información de S3
# -----------------------------------------------------------------------------

output "deployment_assets_bucket" {
  description = "Información del bucket S3 para assets de deployment"
  value       = module.finance_tracker.deployment_assets_bucket
}

# -----------------------------------------------------------------------------
# Comandos Útiles para Desarrollo
# -----------------------------------------------------------------------------

output "useful_commands" {
  description = "Comandos útiles para trabajar con el entorno de desarrollo"
  value = {
    test_health_endpoint = "curl ${module.finance_tracker.health_check_url}"
    view_lambda_logs = {
      health       = "aws logs tail /aws/lambda/${var.project_name}-dev-health --follow"
      users        = "aws logs tail /aws/lambda/${var.project_name}-dev-users --follow"
      transactions = "aws logs tail /aws/lambda/${var.project_name}-dev-transactions --follow"
      categories   = "aws logs tail /aws/lambda/${var.project_name}-dev-categories --follow"
      auth         = "aws logs tail /aws/lambda/${var.project_name}-dev-auth --follow"
    }
    view_api_logs = "aws logs tail /aws/apigateway/${var.project_name}-dev --follow"
  }
}

# -----------------------------------------------------------------------------
# Output de Desarrollo con Formato Bonito
# -----------------------------------------------------------------------------

output "dev_deployment_summary" {
  description = "Resumen del deployment de desarrollo con tabla de endpoints"
  value = <<-EOT
    🚀 Finance Tracker - Entorno de Desarrollo Desplegado
    
    📋 Información General:
    • Proyecto: ${var.project_name}
    • Ambiente: development
    • Región: ${var.aws_region}
    • Release: ${module.finance_tracker.github_release_info.tag_name}
    • Base URL: ${module.finance_tracker.api_gateway_url}
    
    📡 API Endpoints Disponibles:
    
    ┌─────────────────────────────────────────────────────────────────────────────────────────┐
    │                                SISTEMA                                                  │
    ├─────────────────────┬──────────┬─────────────────────────────────────────────────────────┤
    │ Endpoint            │ Método   │ Descripción                                             │
    ├─────────────────────┼──────────┼─────────────────────────────────────────────────────────┤
    │ /health             │ GET      │ Verificar estado del sistema                            │
    └─────────────────────┴──────────┴─────────────────────────────────────────────────────────┘
    
    ┌─────────────────────────────────────────────────────────────────────────────────────────┐
    │                       AUTENTICACIÓN Y USUARIOS                                         │
    ├─────────────────────┬──────────┬─────────────────────────────────────────────────────────┤
    │ Endpoint            │ Método   │ Descripción                                             │
    ├─────────────────────┼──────────┼─────────────────────────────────────────────────────────┤
    │ /users              │ POST     │ Registrar nuevo usuario                                │
    │ /users/login        │ POST     │ Iniciar sesión y obtener JWT tokens                   │
    │ /users/refresh-token│ POST     │ Renovar access token con refresh token                │
    │ /users              │ GET      │ Obtener resumen del API (requiere auth)    [AUTH REQ] │
    │ /users/{user_id}    │ GET      │ Obtener usuario por ID                     [AUTH REQ]  │
    │ /users/{user_id}    │ PUT      │ Actualizar datos de usuario                [AUTH REQ]  │
    │ /users/{user_id}    │ DELETE   │ Eliminar usuario                           [AUTH REQ]  │
    └─────────────────────┴──────────┴─────────────────────────────────────────────────────────┘
    
    ┌─────────────────────────────────────────────────────────────────────────────────────────┐
    │                            TRANSACCIONES                                                │
    ├─────────────────────┬──────────┬─────────────────────────────────────────────────────────┤
    │ Endpoint            │ Método   │ Descripción                                             │
    ├─────────────────────┼──────────┼─────────────────────────────────────────────────────────┤
    │ /transactions       │ GET      │ Listar transacciones del usuario          [AUTH REQ]   │
    │ /transactions       │ POST     │ Crear nueva transacción                    [AUTH REQ]   │
    └─────────────────────┴──────────┴─────────────────────────────────────────────────────────┘
    
    ┌─────────────────────────────────────────────────────────────────────────────────────────┐
    │                             CATEGORÍAS                                                  │
    ├─────────────────────┬──────────┬─────────────────────────────────────────────────────────┤
    │ Endpoint            │ Método   │ Descripción                                             │
    ├─────────────────────┼──────────┼─────────────────────────────────────────────────────────┤
    │ /categories         │ GET      │ Listar categorías del usuario             [AUTH REQ]   │
    │ /categories         │ POST     │ Crear nueva categoría                      [AUTH REQ]   │
    └─────────────────────┴──────────┴─────────────────────────────────────────────────────────┘
    
    ┌─────────────────────────────────────────────────────────────────────────────────────────┐
    │                         GESTIÓN DE CATEGORÍAS                                           │
    ├─────────────────────┬──────────┬─────────────────────────────────────────────────────────┤
    │ Endpoint            │ Método   │ Descripción                                             │
    ├─────────────────────┼──────────┼─────────────────────────────────────────────────────────┤
    │ /categories         │ GET      │ Listar categorías disponibles              [AUTH REQ]  │
    │ /categories         │ POST     │ Crear nueva categoría                       [AUTH REQ]  │
    │ /categories/{id}    │ GET      │ Obtener categoría específica               [AUTH REQ]  │
    │ /categories/{id}    │ PUT      │ Actualizar categoría existente             [AUTH REQ]  │
    │ /categories/{id}    │ DELETE   │ Eliminar categoría                         [AUTH REQ]  │
    └─────────────────────┴──────────┴─────────────────────────────────────────────────────────┘
    
    📊 Recursos Creados:
    • API Gateway: ${module.finance_tracker.api_gateway_id}
    • Lambda Functions: 5 funciones (health, auth, users, transactions, categories)
    • DynamoDB Table: ${module.finance_tracker.dynamodb_table_name} (Single Table Design)
    • Lambda Layer: Dependencies layer con Python 3.12
    • CloudWatch Log Groups: configurados para todas las funciones
    • S3 Bucket: para artefactos de deployment
    
    💡 Comandos de Prueba Rápida:
    • Health Check: curl ${module.finance_tracker.health_check_url}
    • Registrar Usuario: curl -X POST ${module.finance_tracker.api_gateway_url}/users -H "Content-Type: application/json" -d '{"email":"test@example.com","password":"Test123!","first_name":"Test","last_name":"User"}'
    • Login: curl -X POST ${module.finance_tracker.api_gateway_url}/users/login -H "Content-Type: application/json" -d '{"email":"test@example.com","password":"Test123!"}'
    • Ver Logs API: aws logs tail /aws/apigateway/${var.project_name}-dev --follow
    • Ver Logs Lambda: aws logs tail /aws/lambda/${var.project_name}-dev-health --follow
    
    📝 Notas Importantes:
    • [AUTH REQ] = Requiere token de autenticación
    • Registro de usuarios: POST /users (no /auth/register)
    • Login de usuarios: POST /users/login (no /auth/login)
    • Los endpoints mostrados reflejan la implementación actual
    • Todas las URLs incluyen CORS habilitado para desarrollo
    • Ambiente optimizado para costos mínimos
    • DynamoDB en modo PAY_PER_REQUEST
    • Logs con retención de 7 días
    
    🔗 URLs Completas Disponibles en: terraform output api_endpoints_table
  EOT
}

# -----------------------------------------------------------------------------
# Frontend Outputs
# -----------------------------------------------------------------------------

output "frontend_bucket_name" {
  description = "Nombre del bucket S3 para el frontend en desarrollo"
  value       = module.finance_tracker.frontend_bucket_name
}

output "frontend_website_endpoint" {
  description = "S3 static website endpoint for the frontend"
  value       = module.finance_tracker.frontend_website_endpoint
}

