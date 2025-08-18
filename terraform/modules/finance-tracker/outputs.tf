# =============================================================================
# Finance Tracker Serverless - Module Outputs
# =============================================================================

# -----------------------------------------------------------------------------
# API Gateway Outputs
# -----------------------------------------------------------------------------

output "api_gateway_url" {
  description = "URL base de la API Gateway"
  value       = "https://${aws_api_gateway_rest_api.finance_tracker_api.id}.execute-api.${var.aws_region}.amazonaws.com/${aws_api_gateway_stage.finance_tracker_stage.stage_name}"
}

output "api_gateway_id" {
  description = "ID de la API Gateway"
  value       = aws_api_gateway_rest_api.finance_tracker_api.id
}

output "api_gateway_stage" {
  description = "Stage de la API Gateway"
  value       = aws_api_gateway_stage.finance_tracker_stage.stage_name
}

output "api_gateway_execution_arn" {
  description = "ARN de ejecución de la API Gateway"
  value       = aws_api_gateway_rest_api.finance_tracker_api.execution_arn
}

# -----------------------------------------------------------------------------
# Lambda Functions Outputs
# -----------------------------------------------------------------------------

output "lambda_functions" {
  description = "Información de las funciones Lambda creadas"
  value = {
    health = {
      function_name = aws_lambda_function.health.function_name
      arn           = aws_lambda_function.health.arn
      invoke_arn    = aws_lambda_function.health.invoke_arn
    }
    users = {
      function_name = aws_lambda_function.users.function_name
      arn           = aws_lambda_function.users.arn
      invoke_arn    = aws_lambda_function.users.invoke_arn
    }
    transactions = {
      function_name = aws_lambda_function.transactions.function_name
      arn           = aws_lambda_function.transactions.arn
      invoke_arn    = aws_lambda_function.transactions.invoke_arn
    }
    categories = {
      function_name = aws_lambda_function.categories.function_name
      arn           = aws_lambda_function.categories.arn
      invoke_arn    = aws_lambda_function.categories.invoke_arn
    }
    auth = {
      function_name = aws_lambda_function.auth.function_name
      arn           = aws_lambda_function.auth.arn
      invoke_arn    = aws_lambda_function.auth.invoke_arn
    }
  }
}

output "lambda_layer_arn" {
  description = "ARN del Lambda Layer con las dependencias"
  value       = aws_lambda_layer_version.dependencies.arn
}

output "lambda_execution_role_arn" {
  description = "ARN del rol de ejecución de Lambda"
  value       = aws_iam_role.lambda_execution_role.arn
}

# -----------------------------------------------------------------------------
# DynamoDB Tables Outputs
# -----------------------------------------------------------------------------

output "dynamodb_tables" {
  description = "Información de las tablas DynamoDB creadas"
  value = {
    users = {
      name = aws_dynamodb_table.users.name
      arn  = aws_dynamodb_table.users.arn
    }
    transactions = {
      name = aws_dynamodb_table.transactions.name
      arn  = aws_dynamodb_table.transactions.arn
    }
    categories = {
      name = aws_dynamodb_table.categories.name
      arn  = aws_dynamodb_table.categories.arn
    }
    terraform_state_lock = {
      name = aws_dynamodb_table.terraform_state_lock.name
      arn  = aws_dynamodb_table.terraform_state_lock.arn
    }
  }
}

# -----------------------------------------------------------------------------
# S3 Bucket Outputs
# -----------------------------------------------------------------------------

output "s3_deployment_bucket" {
  description = "Información del bucket S3 para despliegues"
  value = {
    name   = aws_s3_bucket.deployment_assets.bucket
    arn    = aws_s3_bucket.deployment_assets.arn
    suffix = local.bucket_suffix
  }
}

# -----------------------------------------------------------------------------
# GitHub Release Outputs
# -----------------------------------------------------------------------------

output "github_release_info" {
  description = "Información del release de GitHub utilizado"
  value = {
    tag_name     = data.github_release.finance_tracker.release_tag
    release_id   = data.github_release.finance_tracker.id
    created_at   = data.github_release.finance_tracker.created_at
    published_at = data.github_release.finance_tracker.published_at
    prerelease   = data.github_release.finance_tracker.prerelease
    assets_count = length(data.github_release.finance_tracker.assets)
  }
}

# -----------------------------------------------------------------------------
# S3 Bucket Outputs
# -----------------------------------------------------------------------------

output "deployment_assets_bucket" {
  description = "Información del bucket S3 para assets de deployment"
  value = {
    name   = aws_s3_bucket.deployment_assets.bucket
    arn    = aws_s3_bucket.deployment_assets.arn
    region = aws_s3_bucket.deployment_assets.region
  }
}

# -----------------------------------------------------------------------------
# CloudWatch Log Groups
# -----------------------------------------------------------------------------

output "cloudwatch_log_groups" {
  description = "Grupos de logs de CloudWatch creados"
  value = {
    lambda_logs = {
      for k, v in aws_cloudwatch_log_group.lambda_logs : k => {
        name = v.name
        arn  = v.arn
      }
    }
    api_gateway_logs = var.enable_api_gateway_logging ? {
      name = aws_cloudwatch_log_group.api_gateway_logs[0].name
      arn  = aws_cloudwatch_log_group.api_gateway_logs[0].arn
    } : null
  }
}

# -----------------------------------------------------------------------------
# Environment Information
# -----------------------------------------------------------------------------

output "environment_info" {
  description = "Información general del entorno desplegado"
  value = {
    project_name = var.project_name
    environment  = var.environment
    aws_region   = var.aws_region
    name_prefix  = local.name_prefix
    deployed_at  = timestamp()
  }
}

# -----------------------------------------------------------------------------
# Health Check Endpoint
# -----------------------------------------------------------------------------

output "health_check_url" {
  description = "URL del endpoint de health check"
  value       = "https://${aws_api_gateway_rest_api.finance_tracker_api.id}.execute-api.${var.aws_region}.amazonaws.com/${aws_api_gateway_stage.finance_tracker_stage.stage_name}/health"
}

# -----------------------------------------------------------------------------
# API Endpoints
# -----------------------------------------------------------------------------

output "api_endpoints" {
  description = "URLs de los endpoints de la API"
  value = {
    base_url     = "https://${aws_api_gateway_rest_api.finance_tracker_api.id}.execute-api.${var.aws_region}.amazonaws.com/${aws_api_gateway_stage.finance_tracker_stage.stage_name}"
    health       = "https://${aws_api_gateway_rest_api.finance_tracker_api.id}.execute-api.${var.aws_region}.amazonaws.com/${aws_api_gateway_stage.finance_tracker_stage.stage_name}/health"
    users        = "https://${aws_api_gateway_rest_api.finance_tracker_api.id}.execute-api.${var.aws_region}.amazonaws.com/${aws_api_gateway_stage.finance_tracker_stage.stage_name}/users"
    transactions = "https://${aws_api_gateway_rest_api.finance_tracker_api.id}.execute-api.${var.aws_region}.amazonaws.com/${aws_api_gateway_stage.finance_tracker_stage.stage_name}/transactions"
    categories   = "https://${aws_api_gateway_rest_api.finance_tracker_api.id}.execute-api.${var.aws_region}.amazonaws.com/${aws_api_gateway_stage.finance_tracker_stage.stage_name}/categories"
    auth         = "https://${aws_api_gateway_rest_api.finance_tracker_api.id}.execute-api.${var.aws_region}.amazonaws.com/${aws_api_gateway_stage.finance_tracker_stage.stage_name}/auth"
  }
}
