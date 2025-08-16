# Outputs
# Valores importantes que se mostrarán después del deployment

# Información de la API
output "api_gateway_url" {
  description = "URL base del API Gateway"
  value       = "https://${aws_api_gateway_rest_api.main.id}.execute-api.${var.aws_region}.amazonaws.com/${var.api_gateway_stage_name}"
}

output "health_check_url" {
  description = "URL completa del endpoint de health check"
  value       = "https://${aws_api_gateway_rest_api.main.id}.execute-api.${var.aws_region}.amazonaws.com/${var.api_gateway_stage_name}/health"
}

output "api_gateway_id" {
  description = "ID del API Gateway"
  value       = aws_api_gateway_rest_api.main.id
}

# Información de DynamoDB
output "dynamodb_table_names" {
  description = "Nombres de las tablas de DynamoDB"
  value = {
    users        = aws_dynamodb_table.users.name
    accounts     = aws_dynamodb_table.accounts.name
    transactions = aws_dynamodb_table.transactions.name
    categories   = aws_dynamodb_table.categories.name
    budgets      = aws_dynamodb_table.budgets.name
  }
}

output "dynamodb_table_arns" {
  description = "ARNs de las tablas de DynamoDB"
  value = {
    users        = aws_dynamodb_table.users.arn
    accounts     = aws_dynamodb_table.accounts.arn
    transactions = aws_dynamodb_table.transactions.arn
    categories   = aws_dynamodb_table.categories.arn
    budgets      = aws_dynamodb_table.budgets.arn
  }
}

# Información de Lambda
output "lambda_function_names" {
  description = "Nombres de las funciones Lambda"
  value = {
    health_check = aws_lambda_function.health_check.function_name
  }
}

output "lambda_function_arns" {
  description = "ARNs de las funciones Lambda"
  value = {
    health_check = aws_lambda_function.health_check.arn
  }
}

# Información de IAM
output "lambda_execution_role_arn" {
  description = "ARN del rol de ejecución de Lambda"
  value       = aws_iam_role.lambda_execution_role.arn
}

# Información del entorno
output "environment" {
  description = "Entorno de deployment"
  value       = var.environment
}

output "aws_region" {
  description = "Región de AWS"
  value       = var.aws_region
}

output "project_name" {
  description = "Nombre del proyecto"
  value       = local.project_name
}

# Información de configuración
output "table_prefix" {
  description = "Prefijo usado para las tablas DynamoDB"
  value       = local.table_prefix
}

# URLs útiles para testing
output "curl_health_check" {
  description = "Comando curl para probar el health check"
  value       = "curl -X GET https://${aws_api_gateway_rest_api.main.id}.execute-api.${var.aws_region}.amazonaws.com/${var.api_gateway_stage_name}/health"
}
