# API Gateway
# Crea la API REST que expone nuestras funciones Lambda

# API Gateway REST API principal
resource "aws_api_gateway_rest_api" "main" {
  name        = "${local.project_name}-${var.environment}-api"
  description = "Finance Tracker REST API - ${var.environment}"

  # Configuración de CORS
  endpoint_configuration {
    types = ["REGIONAL"]
  }

  tags = merge(local.common_tags, {
    Name = "Finance Tracker API"
    Description = "API REST principal para la aplicación"
  })
}

# Recurso para /health
resource "aws_api_gateway_resource" "health" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  parent_id   = aws_api_gateway_rest_api.main.root_resource_id
  path_part   = "health"
}

# Método GET para /health
resource "aws_api_gateway_method" "health_get" {
  rest_api_id   = aws_api_gateway_rest_api.main.id
  resource_id   = aws_api_gateway_resource.health.id
  http_method   = "GET"
  authorization = "NONE"

  # Habilitar CORS
  request_parameters = {
    "method.request.header.Access-Control-Allow-Origin" = false
  }
}

# Integración Lambda para GET /health
resource "aws_api_gateway_integration" "health_get_integration" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  resource_id = aws_api_gateway_resource.health.id
  http_method = aws_api_gateway_method.health_get.http_method

  integration_http_method = "POST"  # Lambda siempre usa POST
  type                   = "AWS_PROXY"
  uri                    = aws_lambda_function.health_check.invoke_arn
}

# Método OPTIONS para CORS preflight
resource "aws_api_gateway_method" "health_options" {
  rest_api_id   = aws_api_gateway_rest_api.main.id
  resource_id   = aws_api_gateway_resource.health.id
  http_method   = "OPTIONS"
  authorization = "NONE"
}

# Integración MOCK para OPTIONS (CORS)
resource "aws_api_gateway_integration" "health_options_integration" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  resource_id = aws_api_gateway_resource.health.id
  http_method = aws_api_gateway_method.health_options.http_method

  type = "MOCK"
  request_templates = {
    "application/json" = "{\"statusCode\": 200}"
  }
}

# Response para OPTIONS
resource "aws_api_gateway_method_response" "health_options_response" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  resource_id = aws_api_gateway_resource.health.id
  http_method = aws_api_gateway_method.health_options.http_method
  status_code = "200"

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = true
    "method.response.header.Access-Control-Allow-Methods" = true
    "method.response.header.Access-Control-Allow-Origin"  = true
  }
}

# Integration response para OPTIONS
resource "aws_api_gateway_integration_response" "health_options_integration_response" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  resource_id = aws_api_gateway_resource.health.id
  http_method = aws_api_gateway_method.health_options.http_method
  status_code = aws_api_gateway_method_response.health_options_response.status_code

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'"
    "method.response.header.Access-Control-Allow-Methods" = "'GET,OPTIONS'"
    "method.response.header.Access-Control-Allow-Origin"  = "'*'"
  }

  depends_on = [aws_api_gateway_integration.health_options_integration]
}

# CloudWatch Log Group para API Gateway
resource "aws_cloudwatch_log_group" "api_gateway_logs" {
  count             = var.enable_api_gateway_logs ? 1 : 0
  name              = "API-Gateway-Execution-Logs_${aws_api_gateway_rest_api.main.id}/${var.api_gateway_stage_name}"
  retention_in_days = var.environment == "production" ? 30 : 7

  tags = merge(local.common_tags, {
    Name = "API Gateway Logs"
  })
}

# Configuración de logging para API Gateway
resource "aws_api_gateway_account" "main" {
  count               = var.enable_api_gateway_logs ? 1 : 0
  cloudwatch_role_arn = aws_iam_role.api_gateway_cloudwatch_role[0].arn
}

# Stage de deployment para API Gateway
resource "aws_api_gateway_deployment" "main" {
  rest_api_id = aws_api_gateway_rest_api.main.id

  # Forzar recreación cuando cambian los métodos
  triggers = {
    redeployment = sha1(jsonencode([
      aws_api_gateway_resource.health.id,
      aws_api_gateway_method.health_get.id,
      aws_api_gateway_integration.health_get_integration.id,
      aws_api_gateway_method.health_options.id,
      aws_api_gateway_integration.health_options_integration.id,
      # Usuarios endpoints
      aws_api_gateway_resource.users.id,
      aws_api_gateway_resource.users_user_id.id,
      aws_api_gateway_method.users_post.id,
      aws_api_gateway_method.users_get.id,
      aws_api_gateway_method.users_put.id,
      aws_api_gateway_method.users_delete.id,
      aws_api_gateway_integration.users_post_integration.id,
      aws_api_gateway_integration.users_get_integration.id,
      aws_api_gateway_integration.users_put_integration.id,
      aws_api_gateway_integration.users_delete_integration.id,
    ]))
  }

  lifecycle {
    create_before_destroy = true
  }

  depends_on = [
    # Health endpoints
    aws_api_gateway_method.health_get,
    aws_api_gateway_integration.health_get_integration,
    aws_api_gateway_method.health_options,
    aws_api_gateway_integration.health_options_integration,
    # Users endpoints
    aws_api_gateway_method.users_post,
    aws_api_gateway_method.users_get,
    aws_api_gateway_method.users_put,
    aws_api_gateway_method.users_delete,
    aws_api_gateway_integration.users_post_integration,
    aws_api_gateway_integration.users_get_integration,
    aws_api_gateway_integration.users_put_integration,
    aws_api_gateway_integration.users_delete_integration,
  ]
}

# Configuración de stage (para logging y métricas)
resource "aws_api_gateway_stage" "main" {
  deployment_id = aws_api_gateway_deployment.main.id
  rest_api_id   = aws_api_gateway_rest_api.main.id
  stage_name    = var.api_gateway_stage_name

  # Configuración de logging
  dynamic "access_log_settings" {
    for_each = var.enable_api_gateway_logs ? [1] : []
    content {
      destination_arn = aws_cloudwatch_log_group.api_gateway_logs[0].arn
      format = jsonencode({
        requestId      = "$context.requestId"
        ip            = "$context.identity.sourceIp"
        caller        = "$context.identity.caller"
        user          = "$context.identity.user"
        requestTime   = "$context.requestTime"
        httpMethod    = "$context.httpMethod"
        resourcePath  = "$context.resourcePath"
        status        = "$context.status"
        protocol      = "$context.protocol"
        responseLength = "$context.responseLength"
        error         = "$context.error.message"
        errorType     = "$context.error.messageString"
      })
    }
  }

  # Habilitar métricas detalladas
  xray_tracing_enabled = var.environment != "dev"

  tags = merge(local.common_tags, {
    Name = "API Gateway Stage"
  })
}

# ============================
# USUARIOS ENDPOINTS
# ============================

# Recurso /users
resource "aws_api_gateway_resource" "users" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  parent_id   = aws_api_gateway_rest_api.main.root_resource_id
  path_part   = "users"
}

# Recurso /users/{user_id}
resource "aws_api_gateway_resource" "users_user_id" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  parent_id   = aws_api_gateway_resource.users.id
  path_part   = "{user_id}"
}

# ============================
# MÉTODOS /users
# ============================

# POST /users (crear usuario)
resource "aws_api_gateway_method" "users_post" {
  rest_api_id   = aws_api_gateway_rest_api.main.id
  resource_id   = aws_api_gateway_resource.users.id
  http_method   = "POST"
  authorization = "NONE"
  
  request_parameters = {
    "method.request.header.Content-Type" = false
  }
}

# OPTIONS /users (CORS)
resource "aws_api_gateway_method" "users_options" {
  rest_api_id   = aws_api_gateway_rest_api.main.id
  resource_id   = aws_api_gateway_resource.users.id
  http_method   = "OPTIONS"
  authorization = "NONE"
}

# ============================
# MÉTODOS /users/{user_id}
# ============================

# GET /users/{user_id}
resource "aws_api_gateway_method" "users_get" {
  rest_api_id   = aws_api_gateway_rest_api.main.id
  resource_id   = aws_api_gateway_resource.users_user_id.id
  http_method   = "GET"
  authorization = "NONE"
  
  request_parameters = {
    "method.request.path.user_id" = true
  }
}

# PUT /users/{user_id}
resource "aws_api_gateway_method" "users_put" {
  rest_api_id   = aws_api_gateway_rest_api.main.id
  resource_id   = aws_api_gateway_resource.users_user_id.id
  http_method   = "PUT"
  authorization = "NONE"
  
  request_parameters = {
    "method.request.path.user_id" = true
    "method.request.header.Content-Type" = false
  }
}

# DELETE /users/{user_id}
resource "aws_api_gateway_method" "users_delete" {
  rest_api_id   = aws_api_gateway_rest_api.main.id
  resource_id   = aws_api_gateway_resource.users_user_id.id
  http_method   = "DELETE"
  authorization = "NONE"
  
  request_parameters = {
    "method.request.path.user_id" = true
  }
}

# OPTIONS /users/{user_id} (CORS)
resource "aws_api_gateway_method" "users_user_id_options" {
  rest_api_id   = aws_api_gateway_rest_api.main.id
  resource_id   = aws_api_gateway_resource.users_user_id.id
  http_method   = "OPTIONS"
  authorization = "NONE"
}

# ============================
# INTEGRACIONES USUARIOS
# ============================

# Integración POST /users -> Lambda
resource "aws_api_gateway_integration" "users_post_integration" {
  rest_api_id             = aws_api_gateway_rest_api.main.id
  resource_id             = aws_api_gateway_resource.users.id
  http_method             = aws_api_gateway_method.users_post.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.users.invoke_arn
  timeout_milliseconds    = 29000
}

# Integración GET /users/{user_id} -> Lambda
resource "aws_api_gateway_integration" "users_get_integration" {
  rest_api_id             = aws_api_gateway_rest_api.main.id
  resource_id             = aws_api_gateway_resource.users_user_id.id
  http_method             = aws_api_gateway_method.users_get.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.users.invoke_arn
  timeout_milliseconds    = 29000
}

# Integración PUT /users/{user_id} -> Lambda
resource "aws_api_gateway_integration" "users_put_integration" {
  rest_api_id             = aws_api_gateway_rest_api.main.id
  resource_id             = aws_api_gateway_resource.users_user_id.id
  http_method             = aws_api_gateway_method.users_put.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.users.invoke_arn
  timeout_milliseconds    = 29000
}

# Integración DELETE /users/{user_id} -> Lambda
resource "aws_api_gateway_integration" "users_delete_integration" {
  rest_api_id             = aws_api_gateway_rest_api.main.id
  resource_id             = aws_api_gateway_resource.users_user_id.id
  http_method             = aws_api_gateway_method.users_delete.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.users.invoke_arn
  timeout_milliseconds    = 29000
}

# ============================
# OPCIONES CORS USUARIOS
# ============================

# OPTIONS /users (CORS)
resource "aws_api_gateway_integration" "users_options_integration" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  resource_id = aws_api_gateway_resource.users.id
  http_method = aws_api_gateway_method.users_options.http_method
  type        = "MOCK"
  
  request_templates = {
    "application/json" = jsonencode({
      statusCode = 200
    })
  }
}

# OPTIONS /users/{user_id} (CORS)
resource "aws_api_gateway_integration" "users_user_id_options_integration" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  resource_id = aws_api_gateway_resource.users_user_id.id
  http_method = aws_api_gateway_method.users_user_id_options.http_method
  type        = "MOCK"
  
  request_templates = {
    "application/json" = jsonencode({
      statusCode = 200
    })
  }
}

# ============================
# RESPUESTAS CORS
# ============================

# Response para OPTIONS /users
resource "aws_api_gateway_method_response" "users_options_response" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  resource_id = aws_api_gateway_resource.users.id
  http_method = aws_api_gateway_method.users_options.http_method
  status_code = "200"
  
  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = true
    "method.response.header.Access-Control-Allow-Methods" = true
    "method.response.header.Access-Control-Allow-Origin"  = true
  }
}

# Integration Response para OPTIONS /users
resource "aws_api_gateway_integration_response" "users_options_integration_response" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  resource_id = aws_api_gateway_resource.users.id
  http_method = aws_api_gateway_method.users_options.http_method
  status_code = aws_api_gateway_method_response.users_options_response.status_code
  
  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'"
    "method.response.header.Access-Control-Allow-Methods" = "'GET,POST,OPTIONS'"
    "method.response.header.Access-Control-Allow-Origin"  = "'*'"
  }
}

# Response para OPTIONS /users/{user_id}
resource "aws_api_gateway_method_response" "users_user_id_options_response" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  resource_id = aws_api_gateway_resource.users_user_id.id
  http_method = aws_api_gateway_method.users_user_id_options.http_method
  status_code = "200"
  
  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = true
    "method.response.header.Access-Control-Allow-Methods" = true
    "method.response.header.Access-Control-Allow-Origin"  = true
  }
}

# Integration Response para OPTIONS /users/{user_id}
resource "aws_api_gateway_integration_response" "users_user_id_options_integration_response" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  resource_id = aws_api_gateway_resource.users_user_id.id
  http_method = aws_api_gateway_method.users_user_id_options.http_method
  status_code = aws_api_gateway_method_response.users_user_id_options_response.status_code
  
  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'"
    "method.response.header.Access-Control-Allow-Methods" = "'GET,PUT,DELETE,OPTIONS'"
    "method.response.header.Access-Control-Allow-Origin"  = "'*'"
  }
}
