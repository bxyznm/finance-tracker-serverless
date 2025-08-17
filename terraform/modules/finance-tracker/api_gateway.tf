# =============================================================================
# Finance Tracker Serverless - API Gateway Resources
# =============================================================================

# -----------------------------------------------------------------------------
# API Gateway REST API
# -----------------------------------------------------------------------------

resource "aws_api_gateway_rest_api" "finance_tracker_api" {
  name        = "${local.name_prefix}-api"
  description = "Finance Tracker API - ${var.environment} (${data.github_release.finance_tracker.release_tag})"

  endpoint_configuration {
    types = ["REGIONAL"]
  }

  # Configuración de CORS a nivel de API
  cors_configuration {
    allow_credentials = false
    allow_headers     = var.cors_allowed_headers
    allow_methods     = var.cors_allowed_methods
    allow_origins     = var.cors_allowed_origins
    max_age           = 600
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-api"
    Type = "api-gateway"
  })
}

# -----------------------------------------------------------------------------
# API Gateway Resources (Rutas)
# -----------------------------------------------------------------------------

# Recurso /health
resource "aws_api_gateway_resource" "health" {
  rest_api_id = aws_api_gateway_rest_api.finance_tracker_api.id
  parent_id   = aws_api_gateway_rest_api.finance_tracker_api.root_resource_id
  path_part   = "health"
}

# Recurso /users
resource "aws_api_gateway_resource" "users" {
  rest_api_id = aws_api_gateway_rest_api.finance_tracker_api.id
  parent_id   = aws_api_gateway_rest_api.finance_tracker_api.root_resource_id
  path_part   = "users"
}

# Recurso /transactions
resource "aws_api_gateway_resource" "transactions" {
  rest_api_id = aws_api_gateway_rest_api.finance_tracker_api.id
  parent_id   = aws_api_gateway_rest_api.finance_tracker_api.root_resource_id
  path_part   = "transactions"
}

# Recurso /categories
resource "aws_api_gateway_resource" "categories" {
  rest_api_id = aws_api_gateway_rest_api.finance_tracker_api.id
  parent_id   = aws_api_gateway_rest_api.finance_tracker_api.root_resource_id
  path_part   = "categories"
}

# Recurso /auth
resource "aws_api_gateway_resource" "auth" {
  rest_api_id = aws_api_gateway_rest_api.finance_tracker_api.id
  parent_id   = aws_api_gateway_rest_api.finance_tracker_api.root_resource_id
  path_part   = "auth"
}

# -----------------------------------------------------------------------------
# API Gateway Methods y Integraciones
# -----------------------------------------------------------------------------

# Health Check - GET /health
resource "aws_api_gateway_method" "health_get" {
  rest_api_id   = aws_api_gateway_rest_api.finance_tracker_api.id
  resource_id   = aws_api_gateway_resource.health.id
  http_method   = "GET"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "health_integration" {
  rest_api_id = aws_api_gateway_rest_api.finance_tracker_api.id
  resource_id = aws_api_gateway_resource.health.id
  http_method = aws_api_gateway_method.health_get.http_method

  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.health.invoke_arn
}

# Users - GET/POST /users
resource "aws_api_gateway_method" "users_get" {
  rest_api_id   = aws_api_gateway_rest_api.finance_tracker_api.id
  resource_id   = aws_api_gateway_resource.users.id
  http_method   = "GET"
  authorization = "NONE" # TODO: Implementar autorización
}

resource "aws_api_gateway_method" "users_post" {
  rest_api_id   = aws_api_gateway_rest_api.finance_tracker_api.id
  resource_id   = aws_api_gateway_resource.users.id
  http_method   = "POST"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "users_get_integration" {
  rest_api_id = aws_api_gateway_rest_api.finance_tracker_api.id
  resource_id = aws_api_gateway_resource.users.id
  http_method = aws_api_gateway_method.users_get.http_method

  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.users.invoke_arn
}

resource "aws_api_gateway_integration" "users_post_integration" {
  rest_api_id = aws_api_gateway_rest_api.finance_tracker_api.id
  resource_id = aws_api_gateway_resource.users.id
  http_method = aws_api_gateway_method.users_post.http_method

  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.users.invoke_arn
}

# Transactions - GET/POST /transactions  
resource "aws_api_gateway_method" "transactions_get" {
  rest_api_id   = aws_api_gateway_rest_api.finance_tracker_api.id
  resource_id   = aws_api_gateway_resource.transactions.id
  http_method   = "GET"
  authorization = "NONE"
}

resource "aws_api_gateway_method" "transactions_post" {
  rest_api_id   = aws_api_gateway_rest_api.finance_tracker_api.id
  resource_id   = aws_api_gateway_resource.transactions.id
  http_method   = "POST"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "transactions_get_integration" {
  rest_api_id = aws_api_gateway_rest_api.finance_tracker_api.id
  resource_id = aws_api_gateway_resource.transactions.id
  http_method = aws_api_gateway_method.transactions_get.http_method

  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.transactions.invoke_arn
}

resource "aws_api_gateway_integration" "transactions_post_integration" {
  rest_api_id = aws_api_gateway_rest_api.finance_tracker_api.id
  resource_id = aws_api_gateway_resource.transactions.id
  http_method = aws_api_gateway_method.transactions_post.http_method

  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.transactions.invoke_arn
}

# Categories - GET/POST /categories
resource "aws_api_gateway_method" "categories_get" {
  rest_api_id   = aws_api_gateway_rest_api.finance_tracker_api.id
  resource_id   = aws_api_gateway_resource.categories.id
  http_method   = "GET"
  authorization = "NONE"
}

resource "aws_api_gateway_method" "categories_post" {
  rest_api_id   = aws_api_gateway_rest_api.finance_tracker_api.id
  resource_id   = aws_api_gateway_resource.categories.id
  http_method   = "POST"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "categories_get_integration" {
  rest_api_id = aws_api_gateway_rest_api.finance_tracker_api.id
  resource_id = aws_api_gateway_resource.categories.id
  http_method = aws_api_gateway_method.categories_get.http_method

  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.categories.invoke_arn
}

resource "aws_api_gateway_integration" "categories_post_integration" {
  rest_api_id = aws_api_gateway_rest_api.finance_tracker_api.id
  resource_id = aws_api_gateway_resource.categories.id
  http_method = aws_api_gateway_method.categories_post.http_method

  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.categories.invoke_arn
}

# Auth - POST /auth
resource "aws_api_gateway_method" "auth_post" {
  rest_api_id   = aws_api_gateway_rest_api.finance_tracker_api.id
  resource_id   = aws_api_gateway_resource.auth.id
  http_method   = "POST"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "auth_integration" {
  rest_api_id = aws_api_gateway_rest_api.finance_tracker_api.id
  resource_id = aws_api_gateway_resource.auth.id
  http_method = aws_api_gateway_method.auth_post.http_method

  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.auth.invoke_arn
}

# -----------------------------------------------------------------------------
# Lambda Permissions para API Gateway
# -----------------------------------------------------------------------------

resource "aws_lambda_permission" "allow_api_gateway_health" {
  statement_id  = "AllowExecutionFromAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.health.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.finance_tracker_api.execution_arn}/*/*"
}

resource "aws_lambda_permission" "allow_api_gateway_users" {
  statement_id  = "AllowExecutionFromAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.users.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.finance_tracker_api.execution_arn}/*/*"
}

resource "aws_lambda_permission" "allow_api_gateway_transactions" {
  statement_id  = "AllowExecutionFromAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.transactions.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.finance_tracker_api.execution_arn}/*/*"
}

resource "aws_lambda_permission" "allow_api_gateway_categories" {
  statement_id  = "AllowExecutionFromAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.categories.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.finance_tracker_api.execution_arn}/*/*"
}

resource "aws_lambda_permission" "allow_api_gateway_auth" {
  statement_id  = "AllowExecutionFromAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.auth.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.finance_tracker_api.execution_arn}/*/*"
}

# -----------------------------------------------------------------------------
# API Gateway Deployment
# -----------------------------------------------------------------------------

resource "aws_api_gateway_deployment" "finance_tracker_deployment" {
  depends_on = [
    aws_api_gateway_integration.health_integration,
    aws_api_gateway_integration.users_get_integration,
    aws_api_gateway_integration.users_post_integration,
    aws_api_gateway_integration.transactions_get_integration,
    aws_api_gateway_integration.transactions_post_integration,
    aws_api_gateway_integration.categories_get_integration,
    aws_api_gateway_integration.categories_post_integration,
    aws_api_gateway_integration.auth_integration,
  ]

  rest_api_id = aws_api_gateway_rest_api.finance_tracker_api.id

  triggers = {
    redeployment = sha1(jsonencode([
      aws_api_gateway_resource.health.id,
      aws_api_gateway_resource.users.id,
      aws_api_gateway_resource.transactions.id,
      aws_api_gateway_resource.categories.id,
      aws_api_gateway_resource.auth.id,
      aws_api_gateway_method.health_get.id,
      aws_api_gateway_method.users_get.id,
      aws_api_gateway_method.users_post.id,
      aws_api_gateway_method.transactions_get.id,
      aws_api_gateway_method.transactions_post.id,
      aws_api_gateway_method.categories_get.id,
      aws_api_gateway_method.categories_post.id,
      aws_api_gateway_method.auth_post.id,
      aws_api_gateway_integration.health_integration.id,
      aws_api_gateway_integration.users_get_integration.id,
      aws_api_gateway_integration.users_post_integration.id,
      aws_api_gateway_integration.transactions_get_integration.id,
      aws_api_gateway_integration.transactions_post_integration.id,
      aws_api_gateway_integration.categories_get_integration.id,
      aws_api_gateway_integration.categories_post_integration.id,
      aws_api_gateway_integration.auth_integration.id,
    ]))
  }

  lifecycle {
    create_before_destroy = true
  }
}

# -----------------------------------------------------------------------------
# API Gateway Stage
# -----------------------------------------------------------------------------

resource "aws_api_gateway_stage" "finance_tracker_stage" {
  deployment_id = aws_api_gateway_deployment.finance_tracker_deployment.id
  rest_api_id   = aws_api_gateway_rest_api.finance_tracker_api.id
  stage_name    = var.environment

  # Configuración de throttling
  throttle_settings {
    rate_limit  = var.api_gateway_throttling_rate_limit
    burst_limit = var.api_gateway_throttling_burst_limit
  }

  # Configuración de logging
  dynamic "access_log_settings" {
    for_each = var.enable_api_gateway_logging ? [1] : []
    content {
      destination_arn = aws_cloudwatch_log_group.api_gateway_logs[0].arn
      format = jsonencode({
        requestId      = "$context.requestId"
        ip             = "$context.identity.sourceIp"
        caller         = "$context.identity.caller"
        user           = "$context.identity.user"
        requestTime    = "$context.requestTime"
        httpMethod     = "$context.httpMethod"
        resourcePath   = "$context.resourcePath"
        status         = "$context.status"
        protocol       = "$context.protocol"
        responseLength = "$context.responseLength"
        responseTime   = "$context.responseTime"
        errorMessage   = "$context.error.message"
        errorType      = "$context.error.messageString"
      })
    }
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-stage"
    Type = "api-gateway-stage"
  })
}

# CloudWatch Log Group para API Gateway
resource "aws_cloudwatch_log_group" "api_gateway_logs" {
  count             = var.enable_api_gateway_logging ? 1 : 0
  name              = "/aws/apigateway/${local.name_prefix}"
  retention_in_days = var.environment == "prod" ? 30 : 7

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-api-logs"
    Type = "cloudwatch-log-group"
  })
}

# Configuración de método de logging
resource "aws_api_gateway_method_settings" "finance_tracker_settings" {
  rest_api_id = aws_api_gateway_rest_api.finance_tracker_api.id
  stage_name  = aws_api_gateway_stage.finance_tracker_stage.stage_name
  method_path = "*/*"

  settings {
    metrics_enabled        = true
    logging_level          = var.enable_api_gateway_logging ? var.api_gateway_log_level : "OFF"
    data_trace_enabled     = var.environment != "prod"
    throttling_rate_limit  = var.api_gateway_throttling_rate_limit
    throttling_burst_limit = var.api_gateway_throttling_burst_limit
  }
}
