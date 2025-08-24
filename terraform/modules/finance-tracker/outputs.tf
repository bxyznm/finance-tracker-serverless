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
# DynamoDB Table Output (Single Table Design)
# -----------------------------------------------------------------------------

output "dynamodb_table" {
  description = "Información de la tabla principal DynamoDB (Single Table Design)"
  value = {
    main = {
      name = aws_dynamodb_table.main.name
      arn  = aws_dynamodb_table.main.arn
      hash_key = aws_dynamodb_table.main.hash_key
      range_key = aws_dynamodb_table.main.range_key
      billing_mode = aws_dynamodb_table.main.billing_mode
      gsi1_name = "GSI1"
      gsi2_name = "GSI2"
    }
  }
}

# -----------------------------------------------------------------------------
# DynamoDB Environment Variable
# -----------------------------------------------------------------------------

output "dynamodb_table_name" {
  description = "Nombre de la tabla DynamoDB para variables de entorno"
  value = aws_dynamodb_table.main.name
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
  value = length(data.github_release.finance_tracker) > 0 ? {
    tag_name     = data.github_release.finance_tracker[0].release_tag
    release_id   = data.github_release.finance_tracker[0].id
    created_at   = data.github_release.finance_tracker[0].created_at
    published_at = data.github_release.finance_tracker[0].published_at
    prerelease   = data.github_release.finance_tracker[0].prerelease
    assets_count = length(data.github_release.finance_tracker[0].assets)
  } : {
    tag_name     = "local-dev"
    release_id   = null
    created_at   = null
    published_at = null
    prerelease   = null
    assets_count = 0
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

# -----------------------------------------------------------------------------
# Detailed API Endpoints Table
# -----------------------------------------------------------------------------

output "api_endpoints_table" {
  description = "Tabla detallada de endpoints organizados por categoría"
  value = {
    base_url = "https://${aws_api_gateway_rest_api.finance_tracker_api.id}.execute-api.${var.aws_region}.amazonaws.com/${aws_api_gateway_stage.finance_tracker_stage.stage_name}"
    
    # Endpoints de Sistema
    system = {
      health_check = {
        method      = "GET"
        path        = "/health"
        url         = "https://${aws_api_gateway_rest_api.finance_tracker_api.id}.execute-api.${var.aws_region}.amazonaws.com/${aws_api_gateway_stage.finance_tracker_stage.stage_name}/health"
        description = "Verificar estado del sistema"
        auth_required = false
      }
    }
    
    # Endpoints de Autenticación y Gestión de Usuarios
    authentication = {
      register = {
        method      = "POST"
        path        = "/users"
        url         = "https://${aws_api_gateway_rest_api.finance_tracker_api.id}.execute-api.${var.aws_region}.amazonaws.com/${aws_api_gateway_stage.finance_tracker_stage.stage_name}/users"
        description = "Registrar nuevo usuario"
        auth_required = false
      }
      login = {
        method      = "POST"
        path        = "/users/login"
        url         = "https://${aws_api_gateway_rest_api.finance_tracker_api.id}.execute-api.${var.aws_region}.amazonaws.com/${aws_api_gateway_stage.finance_tracker_stage.stage_name}/users/login"
        description = "Iniciar sesión de usuario"
        auth_required = false
      }
      get_users = {
        method      = "GET"
        path        = "/users"
        url         = "https://${aws_api_gateway_rest_api.finance_tracker_api.id}.execute-api.${var.aws_region}.amazonaws.com/${aws_api_gateway_stage.finance_tracker_stage.stage_name}/users"
        description = "Obtener información de usuarios"
        auth_required = true
      }
    }
    
    # Endpoints de Gestión de Usuarios
    user_management = {
      register_user = {
        method      = "POST"
        path        = "/users"
        url         = "https://${aws_api_gateway_rest_api.finance_tracker_api.id}.execute-api.${var.aws_region}.amazonaws.com/${aws_api_gateway_stage.finance_tracker_stage.stage_name}/users"
        description = "Registrar nuevo usuario"
        auth_required = false
      }
      list_users = {
        method      = "GET"
        path        = "/users"
        url         = "https://${aws_api_gateway_rest_api.finance_tracker_api.id}.execute-api.${var.aws_region}.amazonaws.com/${aws_api_gateway_stage.finance_tracker_stage.stage_name}/users"
        description = "Listar usuarios"
        auth_required = true
      }
      login_user = {
        method      = "POST"
        path        = "/users/login"
        url         = "https://${aws_api_gateway_rest_api.finance_tracker_api.id}.execute-api.${var.aws_region}.amazonaws.com/${aws_api_gateway_stage.finance_tracker_stage.stage_name}/users/login"
        description = "Login de usuario"
        auth_required = false
      }
      refresh_token = {
        method      = "POST"
        path        = "/users/refresh-token"
        url         = "https://${aws_api_gateway_rest_api.finance_tracker_api.id}.execute-api.${var.aws_region}.amazonaws.com/${aws_api_gateway_stage.finance_tracker_stage.stage_name}/users/refresh-token"
        description = "Renovar access token con refresh token"
        auth_required = false
      }
      get_user_by_id = {
        method      = "GET"
        path        = "/users/{user_id}"
        url         = "https://${aws_api_gateway_rest_api.finance_tracker_api.id}.execute-api.${var.aws_region}.amazonaws.com/${aws_api_gateway_stage.finance_tracker_stage.stage_name}/users/{user_id}"
        description = "Obtener usuario por ID"
        auth_required = true
      }
      update_user = {
        method      = "PUT"
        path        = "/users/{user_id}"
        url         = "https://${aws_api_gateway_rest_api.finance_tracker_api.id}.execute-api.${var.aws_region}.amazonaws.com/${aws_api_gateway_stage.finance_tracker_stage.stage_name}/users/{user_id}"
        description = "Actualizar usuario existente"
        auth_required = true
      }
      delete_user = {
        method      = "DELETE"
        path        = "/users/{user_id}"
        url         = "https://${aws_api_gateway_rest_api.finance_tracker_api.id}.execute-api.${var.aws_region}.amazonaws.com/${aws_api_gateway_stage.finance_tracker_stage.stage_name}/users/{user_id}"
        description = "Eliminar usuario (soft delete)"
        auth_required = true
      }
    }
    
    # Endpoints de Gestión de Transacciones
    transactions = {
      list_transactions = {
        method      = "GET"
        path        = "/transactions"
        url         = "https://${aws_api_gateway_rest_api.finance_tracker_api.id}.execute-api.${var.aws_region}.amazonaws.com/${aws_api_gateway_stage.finance_tracker_stage.stage_name}/transactions"
        description = "Listar transacciones del usuario"
        auth_required = true
      }
      create_transaction = {
        method      = "POST"
        path        = "/transactions"
        url         = "https://${aws_api_gateway_rest_api.finance_tracker_api.id}.execute-api.${var.aws_region}.amazonaws.com/${aws_api_gateway_stage.finance_tracker_stage.stage_name}/transactions"
        description = "Crear nueva transacción"
        auth_required = true
      }
      get_transaction = {
        method      = "GET"
        path        = "/transactions/{id}"
        url         = "https://${aws_api_gateway_rest_api.finance_tracker_api.id}.execute-api.${var.aws_region}.amazonaws.com/${aws_api_gateway_stage.finance_tracker_stage.stage_name}/transactions/{id}"
        description = "Obtener transacción específica"
        auth_required = true
      }
      update_transaction = {
        method      = "PUT"
        path        = "/transactions/{id}"
        url         = "https://${aws_api_gateway_rest_api.finance_tracker_api.id}.execute-api.${var.aws_region}.amazonaws.com/${aws_api_gateway_stage.finance_tracker_stage.stage_name}/transactions/{id}"
        description = "Actualizar transacción existente"
        auth_required = true
      }
      delete_transaction = {
        method      = "DELETE"
        path        = "/transactions/{id}"
        url         = "https://${aws_api_gateway_rest_api.finance_tracker_api.id}.execute-api.${var.aws_region}.amazonaws.com/${aws_api_gateway_stage.finance_tracker_stage.stage_name}/transactions/{id}"
        description = "Eliminar transacción"
        auth_required = true
      }
    }
    
    # Endpoints de Gestión de Categorías
    categories = {
      list_categories = {
        method      = "GET"
        path        = "/categories"
        url         = "https://${aws_api_gateway_rest_api.finance_tracker_api.id}.execute-api.${var.aws_region}.amazonaws.com/${aws_api_gateway_stage.finance_tracker_stage.stage_name}/categories"
        description = "Listar categorías disponibles"
        auth_required = true
      }
      create_category = {
        method      = "POST"
        path        = "/categories"
        url         = "https://${aws_api_gateway_rest_api.finance_tracker_api.id}.execute-api.${var.aws_region}.amazonaws.com/${aws_api_gateway_stage.finance_tracker_stage.stage_name}/categories"
        description = "Crear nueva categoría"
        auth_required = true
      }
      get_category = {
        method      = "GET"
        path        = "/categories/{id}"
        url         = "https://${aws_api_gateway_rest_api.finance_tracker_api.id}.execute-api.${var.aws_region}.amazonaws.com/${aws_api_gateway_stage.finance_tracker_stage.stage_name}/categories/{id}"
        description = "Obtener categoría específica"
        auth_required = true
      }
      update_category = {
        method      = "PUT"
        path        = "/categories/{id}"
        url         = "https://${aws_api_gateway_rest_api.finance_tracker_api.id}.execute-api.${var.aws_region}.amazonaws.com/${aws_api_gateway_stage.finance_tracker_stage.stage_name}/categories/{id}"
        description = "Actualizar categoría existente"
        auth_required = true
      }
      delete_category = {
        method      = "DELETE"
        path        = "/categories/{id}"
        url         = "https://${aws_api_gateway_rest_api.finance_tracker_api.id}.execute-api.${var.aws_region}.amazonaws.com/${aws_api_gateway_stage.finance_tracker_stage.stage_name}/categories/{id}"
        description = "Eliminar categoría"
        auth_required = true
      }
    }
  }
}

# -----------------------------------------------------------------------------
# Frontend Outputs
# -----------------------------------------------------------------------------

output "frontend_bucket_name" {
  description = "Nombre del bucket S3 para el frontend"
  value       = aws_s3_bucket.frontend_bucket.id
}

output "frontend_bucket_arn" {
  description = "ARN del bucket S3 para el frontend"  
  value       = aws_s3_bucket.frontend_bucket.arn
}

output "frontend_cloudfront_distribution_id" {
  description = "ID de la distribución CloudFront"
  value       = aws_cloudfront_distribution.frontend_distribution.id
}

output "frontend_cloudfront_domain_name" {
  description = "Domain name de CloudFront para acceder al frontend"
  value       = aws_cloudfront_distribution.frontend_distribution.domain_name
}

output "frontend_url" {
  description = "URL completa del frontend"
  value       = var.use_custom_domain ? "https://${var.frontend_subdomain}.${var.domain_name}" : "https://${aws_cloudfront_distribution.frontend_distribution.domain_name}"
}

output "ssl_certificate_arn" {
  description = "ARN del certificado SSL (si se usa)"
  value       = var.use_custom_domain && !var.cloudflare_integration ? aws_acm_certificate.frontend_cert[0].arn : null
}

output "dns_validation_records" {
  description = "Records DNS necesarios para validar el certificado SSL"
  value = var.use_custom_domain && !var.cloudflare_integration ? {
    for dvo in aws_acm_certificate.frontend_cert[0].domain_validation_options : dvo.domain_name => {
      name   = dvo.resource_record_name
      record = dvo.resource_record_value
      type   = dvo.resource_record_type
    }
  } : {}
}

output "cloudflare_setup_instructions" {
  description = "Instrucciones para configurar Cloudflare"
  value = var.use_custom_domain && var.cloudflare_integration ? {
    domain = "${var.frontend_subdomain}.${var.domain_name}"
    cloudfront_domain = aws_cloudfront_distribution.frontend_distribution.domain_name
    instructions = [
      "1. En Cloudflare, ve a DNS para tu dominio ${var.domain_name}",
      "2. Agrega un registro CNAME:",
      "   - Nombre: ${var.frontend_subdomain}",
      "   - Contenido: ${aws_cloudfront_distribution.frontend_distribution.domain_name}",
      "   - TTL: Auto",
      "   - Proxy status: Proxied (nube naranja)",
      "3. Tu frontend estará disponible en: https://${var.frontend_subdomain}.${var.domain_name}"
    ]
  } : null
}
