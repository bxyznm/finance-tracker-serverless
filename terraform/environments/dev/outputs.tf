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

output "dynamodb_tables" {
  description = "Información de las tablas DynamoDB en desarrollo"
  value       = module.finance_tracker.dynamodb_tables
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
  description = "Resumen del deployment de desarrollo"
  value = <<-EOT
    🚀 Finance Tracker - Entorno de Desarrollo Desplegado
    
    📋 Información General:
    • Proyecto: ${var.project_name}
    • Ambiente: development
    • Región: ${var.aws_region}
    • Release: ${module.finance_tracker.github_release_info.tag_name}
    
    🌐 API Endpoints:
    • Health Check: ${module.finance_tracker.health_check_url}
    • Users: ${module.finance_tracker.api_endpoints.users}
    • Transactions: ${module.finance_tracker.api_endpoints.transactions}
    • Categories: ${module.finance_tracker.api_endpoints.categories}
    • Auth: ${module.finance_tracker.api_endpoints.auth}
    
    📊 Recursos Creados:
    • API Gateway: ${module.finance_tracker.api_gateway_id}
    • Lambda Functions: 5 funciones
    • DynamoDB Tables: 3 tablas
    • CloudWatch Log Groups: configurados
    
    💡 Comandos de Prueba:
    • curl ${module.finance_tracker.health_check_url}
    • aws logs tail /aws/lambda/${var.project_name}-dev-health --follow
    
    ⚠️  Nota: Este es un entorno de desarrollo optimizado para costos.
  EOT
}
