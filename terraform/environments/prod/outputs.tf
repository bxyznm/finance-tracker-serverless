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

output "dynamodb_tables" {
  description = "Información de las tablas DynamoDB en producción"
  value       = module.finance_tracker.dynamodb_tables
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
  description = "Resumen del deployment de producción"
  value = <<-EOT
    🚀 Finance Tracker - Entorno de Producción Desplegado
    
    📋 Información General:
    • Proyecto: ${var.project_name}
    • Ambiente: production
    • Región: ${var.aws_region}
    • Release: ${module.finance_tracker.github_release_info.tag_name}
    • Deployment: ${module.finance_tracker.environment_info.deployed_at}
    
    🌐 API Endpoints de Producción:
    • Health Check: ${module.finance_tracker.health_check_url}
    • API Base URL: ${module.finance_tracker.api_gateway_url}
    • Users: ${module.finance_tracker.api_endpoints.users}
    • Transactions: ${module.finance_tracker.api_endpoints.transactions}
    • Categories: ${module.finance_tracker.api_endpoints.categories}
    • Auth: ${module.finance_tracker.api_endpoints.auth}
    
    📊 Recursos de Producción:
    • API Gateway: ${module.finance_tracker.api_gateway_id}
    • Lambda Functions: 5 funciones con ${var.lambda_memory_size}MB RAM
    • DynamoDB Tables: 3 tablas con Point-in-Time Recovery
    • CloudWatch Alarms: ${length(aws_cloudwatch_metric_alarm.lambda_errors) + length(aws_cloudwatch_metric_alarm.lambda_duration) + 1} alarmas activas
    
    🔍 Monitoreo:
    • Lambda Logs: aws logs tail /aws/lambda/${var.project_name}-prod-{function} --follow
    • API Logs: aws logs tail /aws/apigateway/${var.project_name}-prod --follow
    • CloudWatch Console: https://${var.aws_region}.console.aws.amazon.com/cloudwatch/
    
    ✅ Características de Producción:
    • High Availability: Habilitada
    • Point-in-Time Recovery: Habilitado para DynamoDB
    • Monitoring: ${length(aws_cloudwatch_metric_alarm.lambda_errors) + length(aws_cloudwatch_metric_alarm.lambda_duration) + 1} alarmas configuradas
    • Security: CORS configurado específicamente
    • Backup: Automático para todas las tablas
    
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
