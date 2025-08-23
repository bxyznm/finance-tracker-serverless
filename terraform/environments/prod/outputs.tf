# =============================================================================
# Finance Tracker Serverless - Outputs para Entorno Production
# =============================================================================

# -----------------------------------------------------------------------------
# Outputs del Módulo Principal
# -----------------------------------------------------------------------------

output "api_gateway_url" {
  description = "URL base de la API Gateway para producción"
  value       = module.finance_tracker.api_gateway_url
}

output "health_check_url" {
  description = "URL del endpoint de health check para producción"
  value       = module.finance_tracker.health_check_url
}

output "api_endpoints" {
  description = "URLs de todos los endpoints de la API para producción"
  value       = module.finance_tracker.api_endpoints
  sensitive   = false
}

output "api_endpoints_table" {
  description = "Tabla detallada de endpoints organizados por categoría para producción"
  value       = module.finance_tracker.api_endpoints_table
  sensitive   = false
}

# -----------------------------------------------------------------------------
# Información de Lambda Functions
# -----------------------------------------------------------------------------

output "lambda_functions" {
  description = "Información de las funciones Lambda en producción"
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
  description = "Información de la tabla DynamoDB en producción (Single Table Design)"
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
  description = "Información del release de GitHub utilizado en producción"
  value       = module.finance_tracker.github_release_info
}

# -----------------------------------------------------------------------------
# Información del Entorno
# -----------------------------------------------------------------------------

output "environment_info" {
  description = "Información general del entorno de producción"
  value = merge(module.finance_tracker.environment_info, {
    environment_type = "production"
    high_availability = true
    monitoring_enabled = true
    backup_enabled = true
    security_hardened = true
  })
}

# -----------------------------------------------------------------------------
# Información de Monitoring
# -----------------------------------------------------------------------------

output "cloudwatch_alarms" {
  description = "Información de las alarmas de CloudWatch configuradas"
  value = {
    lambda_errors_alarms = {
      for k, v in aws_cloudwatch_metric_alarm.lambda_errors : k => {
        name = v.alarm_name
        arn  = v.arn
      }
    }
    lambda_duration_alarms = {
      for k, v in aws_cloudwatch_metric_alarm.lambda_duration : k => {
        name = v.alarm_name
        arn  = v.arn
      }
    }
    api_gateway_5xx_alarm = {
      name = aws_cloudwatch_metric_alarm.api_gateway_5xx_errors.alarm_name
      arn  = aws_cloudwatch_metric_alarm.api_gateway_5xx_errors.arn
    }
  }
}

output "cloudwatch_log_groups" {
  description = "Grupos de logs de CloudWatch en producción"
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
# Comandos de Monitoreo para Producción
# -----------------------------------------------------------------------------

output "monitoring_commands" {
  description = "Comandos útiles para monitorear el entorno de producción"
  value = {
    view_lambda_logs = {
      health       = "aws logs tail /aws/lambda/${var.project_name}-prod-health --follow"
      users        = "aws logs tail /aws/lambda/${var.project_name}-prod-users --follow"
      transactions = "aws logs tail /aws/lambda/${var.project_name}-prod-transactions --follow"
      categories   = "aws logs tail /aws/lambda/${var.project_name}-prod-categories --follow"
      auth         = "aws logs tail /aws/lambda/${var.project_name}-prod-auth --follow"
    }
    view_api_logs = "aws logs tail /aws/apigateway/${var.project_name}-prod --follow"
    check_alarms = "aws cloudwatch describe-alarms --alarm-names ${join(" ", [for alarm in aws_cloudwatch_metric_alarm.lambda_errors : alarm.alarm_name])}"
    test_health = "curl -f ${module.finance_tracker.health_check_url} || echo 'Health check failed!'"
  }
}

# -----------------------------------------------------------------------------
# URLs para Documentación
# -----------------------------------------------------------------------------

output "documentation_urls" {
  description = "URLs útiles para documentación y monitoreo"
  value = {
    aws_console_lambda     = "https://${var.aws_region}.console.aws.amazon.com/lambda/home?region=${var.aws_region}#/functions"
    aws_console_apigateway = "https://${var.aws_region}.console.aws.amazon.com/apigateway/home?region=${var.aws_region}#/apis"
    aws_console_dynamodb   = "https://${var.aws_region}.console.aws.amazon.com/dynamodbv2/home?region=${var.aws_region}#tables"
    aws_console_cloudwatch = "https://${var.aws_region}.console.aws.amazon.com/cloudwatch/home?region=${var.aws_region}#alarmsV2:"
  }
}

# -----------------------------------------------------------------------------
# Output de Producción con Formato Bonito
# -----------------------------------------------------------------------------

output "prod_deployment_summary" {
  description = "Resumen del deployment de producción con tabla de endpoints"
  value = <<-EOT
    🚀 Finance Tracker - Entorno de Producción Desplegado
    
    📋 Información General:
    • Proyecto: ${var.project_name}
    • Ambiente: production
    • Región: ${var.aws_region}
    • Release: ${module.finance_tracker.github_release_info.tag_name}
    • Deployment: ${module.finance_tracker.environment_info.deployed_at}
    • Base URL: ${module.finance_tracker.api_gateway_url}
    
    📡 API Endpoints de Producción:
    
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
    
    📊 Recursos de Producción:
    • API Gateway: ${module.finance_tracker.api_gateway_id} con throttling configurado
    • Lambda Functions: 5 funciones con ${var.lambda_memory_size}MB RAM cada una
    • DynamoDB Table: ${module.finance_tracker.dynamodb_table_name} (Single Table Design)
    • Lambda Layer: Dependencies layer optimizado para producción
    • CloudWatch: ${length(aws_cloudwatch_metric_alarm.lambda_errors) + length(aws_cloudwatch_metric_alarm.lambda_duration) + 1} alarmas activas
    • S3 Bucket: para artefactos de deployment con versionado
    
    🔍 Comandos de Monitoreo:
    • Health Check: curl ${module.finance_tracker.health_check_url}
    • Ver Logs API: aws logs tail /aws/apigateway/${var.project_name}-prod --follow
    • Ver Logs Lambda: aws logs tail /aws/lambda/${var.project_name}-prod-{function} --follow
    • CloudWatch Console: https://${var.aws_region}.console.aws.amazon.com/cloudwatch/
    
    ✅ Características de Producción:
    • [AUTH REQ] = Requiere token de autenticación JWT
    • High Availability: Multi-AZ deployment habilitado
    • Point-in-Time Recovery: Habilitado para DynamoDB
    • Monitoring: ${length(aws_cloudwatch_metric_alarm.lambda_errors) + length(aws_cloudwatch_metric_alarm.lambda_duration) + 1} alarmas CloudWatch configuradas
    • Security: CORS configurado específicamente para dominios de producción
    • Backup: Automático para todas las tablas DynamoDB
    • Encryption: At-rest y in-transit habilitado
    • Throttling: Rate limiting configurado en API Gateway
    
    📝 Notas de Producción:
    • Todos los endpoints están bajo HTTPS
    • Logs con retención extendida configurada
    • Variables de entorno optimizadas para producción
    • Configuración de memoria y timeout optimizada
    
    🔗 URLs Completas Disponibles en: terraform output api_endpoints_table
    
    ⚠️  Importante: Este es un entorno de producción. Todos los cambios deben ser probados en desarrollo primero.
  EOT
}

# -----------------------------------------------------------------------------
# Output de Seguridad
# -----------------------------------------------------------------------------

output "security_info" {
  description = "Información de configuración de seguridad"
  value = {
    cors_origins_configured = length(var.cors_allowed_origins)
    point_in_time_recovery  = "enabled"
    encryption_at_rest     = "enabled"
    lambda_execution_role  = module.finance_tracker.lambda_execution_role_arn
    api_throttling_configured = true
    monitoring_alarms = length(aws_cloudwatch_metric_alarm.lambda_errors) + length(aws_cloudwatch_metric_alarm.lambda_duration) + 1
  }
}
