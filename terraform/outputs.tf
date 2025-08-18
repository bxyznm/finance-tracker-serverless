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
output "dynamodb_table_name" {
  description = "Nombre de la tabla principal de DynamoDB (Single Table Design)"
  value       = aws_dynamodb_table.main.name
}

output "dynamodb_table_arn" {
  description = "ARN de la tabla principal de DynamoDB"
  value       = aws_dynamodb_table.main.arn
}

output "dynamodb_gsi_names" {
  description = "Nombres de los Global Secondary Indexes"
  value = {
    gsi1 = "GSI1"
  }
}

output "table_design_info" {
  description = "Información del diseño de tabla utilizado"
  value = {
    design_pattern = "Single Table Design"
    entities = [
      "users",
      "accounts",
      "transactions",
      "categories",
      "budgets"
    ]
    key_attributes = {
      partition_key = "pk"
      sort_key      = "sk"
      gsi1_pk       = "gsi1_pk"
      gsi1_sk       = "gsi1_sk"
    }
  }
}

# Información de Lambda
output "lambda_function_names" {
  description = "Nombres de las funciones Lambda"
  value = {
    health_check = aws_lambda_function.health_check.function_name
    users        = aws_lambda_function.users.function_name
  }
}

output "lambda_function_arns" {
  description = "ARNs de las funciones Lambda"
  value = {
    health_check = aws_lambda_function.health_check.arn
    users        = aws_lambda_function.users.arn
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

# Users API endpoints
output "users_api_endpoints" {
  description = "Endpoints de la API de usuarios"
  value = {
    base_url    = "https://${aws_api_gateway_rest_api.main.id}.execute-api.${var.aws_region}.amazonaws.com/${var.api_gateway_stage_name}/users"
    create_user = "curl -X POST https://${aws_api_gateway_rest_api.main.id}.execute-api.${var.aws_region}.amazonaws.com/${var.api_gateway_stage_name}/users"
    get_user    = "curl -X GET https://${aws_api_gateway_rest_api.main.id}.execute-api.${var.aws_region}.amazonaws.com/${var.api_gateway_stage_name}/users/{user_id}"
    update_user = "curl -X PUT https://${aws_api_gateway_rest_api.main.id}.execute-api.${var.aws_region}.amazonaws.com/${var.api_gateway_stage_name}/users/{user_id}"
    delete_user = "curl -X DELETE https://${aws_api_gateway_rest_api.main.id}.execute-api.${var.aws_region}.amazonaws.com/${var.api_gateway_stage_name}/users/{user_id}"
  }
}
