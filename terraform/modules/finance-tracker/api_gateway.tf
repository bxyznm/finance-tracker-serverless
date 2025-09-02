# =============================================================================
# Finance Tracker Serverless - API Gateway Resources
# =============================================================================

# -----------------------------------------------------------------------------
# API Gateway REST API
# -----------------------------------------------------------------------------

resource "aws_api_gateway_rest_api" "finance_tracker_api" {
  name        = "${local.name_prefix}-api"
  description = "Finance Tracker API - ${var.environment} (${var.dev_release_tag != null ? var.dev_release_tag : (length(data.github_release.finance_tracker) > 0 ? data.github_release.finance_tracker[0].release_tag : "local-dev")})"

  endpoint_configuration {
    types = ["REGIONAL"]
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

# Recurso /users/{user_id} para operaciones CRUD por ID
resource "aws_api_gateway_resource" "users_user_id" {
  rest_api_id = aws_api_gateway_rest_api.finance_tracker_api.id
  parent_id   = aws_api_gateway_resource.users.id
  path_part   = "{user_id}"
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

# Auth login resource - /auth/login
resource "aws_api_gateway_resource" "auth_login" {
  rest_api_id = aws_api_gateway_rest_api.finance_tracker_api.id
  parent_id   = aws_api_gateway_resource.auth.id
  path_part   = "login"
}

# Auth register resource - /auth/register  
resource "aws_api_gateway_resource" "auth_register" {
  rest_api_id = aws_api_gateway_rest_api.finance_tracker_api.id
  parent_id   = aws_api_gateway_resource.auth.id
  path_part   = "register"
}

# Auth refresh resource - /auth/refresh
resource "aws_api_gateway_resource" "auth_refresh" {
  rest_api_id = aws_api_gateway_rest_api.finance_tracker_api.id
  parent_id   = aws_api_gateway_resource.auth.id
  path_part   = "refresh"
}

# Recurso /accounts
resource "aws_api_gateway_resource" "accounts" {
  rest_api_id = aws_api_gateway_rest_api.finance_tracker_api.id
  parent_id   = aws_api_gateway_rest_api.finance_tracker_api.root_resource_id
  path_part   = "accounts"
}

# Recurso /accounts/{account_id} para operaciones por ID específico
resource "aws_api_gateway_resource" "accounts_account_id" {
  rest_api_id = aws_api_gateway_rest_api.finance_tracker_api.id
  parent_id   = aws_api_gateway_resource.accounts.id
  path_part   = "{account_id}"
}

# Recurso /accounts/{account_id}/balance para actualizar balance
resource "aws_api_gateway_resource" "accounts_account_id_balance" {
  rest_api_id = aws_api_gateway_rest_api.finance_tracker_api.id
  parent_id   = aws_api_gateway_resource.accounts_account_id.id
  path_part   = "balance"
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

# Users - GET /users (solo GET, POST movido a auth)
resource "aws_api_gateway_method" "users_get" {
  rest_api_id   = aws_api_gateway_rest_api.finance_tracker_api.id
  resource_id   = aws_api_gateway_resource.users.id
  http_method   = "GET"
  authorization = "NONE" # TODO: Implementar autorización
}

resource "aws_api_gateway_integration" "users_get_integration" {
  rest_api_id = aws_api_gateway_rest_api.finance_tracker_api.id
  resource_id = aws_api_gateway_resource.users.id
  http_method = aws_api_gateway_method.users_get.http_method

  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.users.invoke_arn
}

# Users by ID - GET /users/{user_id}
resource "aws_api_gateway_method" "users_user_id_get" {
  rest_api_id   = aws_api_gateway_rest_api.finance_tracker_api.id
  resource_id   = aws_api_gateway_resource.users_user_id.id
  http_method   = "GET"
  authorization = "NONE" # TODO: Implementar autorización JWT
}

resource "aws_api_gateway_integration" "users_user_id_get_integration" {
  rest_api_id = aws_api_gateway_rest_api.finance_tracker_api.id
  resource_id = aws_api_gateway_resource.users_user_id.id
  http_method = aws_api_gateway_method.users_user_id_get.http_method

  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.users.invoke_arn
}

# Users by ID - PUT /users/{user_id}
resource "aws_api_gateway_method" "users_user_id_put" {
  rest_api_id   = aws_api_gateway_rest_api.finance_tracker_api.id
  resource_id   = aws_api_gateway_resource.users_user_id.id
  http_method   = "PUT"
  authorization = "NONE" # TODO: Implementar autorización JWT
}

resource "aws_api_gateway_integration" "users_user_id_put_integration" {
  rest_api_id = aws_api_gateway_rest_api.finance_tracker_api.id
  resource_id = aws_api_gateway_resource.users_user_id.id
  http_method = aws_api_gateway_method.users_user_id_put.http_method

  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.users.invoke_arn
}

# Users by ID - DELETE /users/{user_id}
resource "aws_api_gateway_method" "users_user_id_delete" {
  rest_api_id   = aws_api_gateway_rest_api.finance_tracker_api.id
  resource_id   = aws_api_gateway_resource.users_user_id.id
  http_method   = "DELETE"
  authorization = "NONE" # TODO: Implementar autorización JWT
}

resource "aws_api_gateway_integration" "users_user_id_delete_integration" {
  rest_api_id = aws_api_gateway_rest_api.finance_tracker_api.id
  resource_id = aws_api_gateway_resource.users_user_id.id
  http_method = aws_api_gateway_method.users_user_id_delete.http_method

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

# Auth Login - POST /auth/login
resource "aws_api_gateway_method" "auth_login_post" {
  rest_api_id   = aws_api_gateway_rest_api.finance_tracker_api.id
  resource_id   = aws_api_gateway_resource.auth_login.id
  http_method   = "POST"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "auth_login_integration" {
  rest_api_id = aws_api_gateway_rest_api.finance_tracker_api.id
  resource_id = aws_api_gateway_resource.auth_login.id
  http_method = aws_api_gateway_method.auth_login_post.http_method

  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.auth.invoke_arn
}

# Auth Register - POST /auth/register
resource "aws_api_gateway_method" "auth_register_post" {
  rest_api_id   = aws_api_gateway_rest_api.finance_tracker_api.id
  resource_id   = aws_api_gateway_resource.auth_register.id
  http_method   = "POST"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "auth_register_integration" {
  rest_api_id = aws_api_gateway_rest_api.finance_tracker_api.id
  resource_id = aws_api_gateway_resource.auth_register.id
  http_method = aws_api_gateway_method.auth_register_post.http_method

  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.auth.invoke_arn
}

# Auth Refresh - POST /auth/refresh
resource "aws_api_gateway_method" "auth_refresh_post" {
  rest_api_id   = aws_api_gateway_rest_api.finance_tracker_api.id
  resource_id   = aws_api_gateway_resource.auth_refresh.id
  http_method   = "POST"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "auth_refresh_integration" {
  rest_api_id = aws_api_gateway_rest_api.finance_tracker_api.id
  resource_id = aws_api_gateway_resource.auth_refresh.id
  http_method = aws_api_gateway_method.auth_refresh_post.http_method

  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.auth.invoke_arn
}

# -----------------------------------------------------------------------------
# CORS OPTIONS Methods for Auth Endpoints
# -----------------------------------------------------------------------------

# CORS Options for Auth Login
resource "aws_api_gateway_method" "auth_login_options" {
  rest_api_id   = aws_api_gateway_rest_api.finance_tracker_api.id
  resource_id   = aws_api_gateway_resource.auth_login.id
  http_method   = "OPTIONS"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "auth_login_options" {
  rest_api_id = aws_api_gateway_rest_api.finance_tracker_api.id
  resource_id = aws_api_gateway_resource.auth_login.id
  http_method = aws_api_gateway_method.auth_login_options.http_method
  type        = "MOCK"

  request_templates = {
    "application/json" = "{ \"statusCode\": 200 }"
  }
}

resource "aws_api_gateway_method_response" "auth_login_options" {
  rest_api_id = aws_api_gateway_rest_api.finance_tracker_api.id
  resource_id = aws_api_gateway_resource.auth_login.id
  http_method = aws_api_gateway_method.auth_login_options.http_method
  status_code = "200"

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = true
    "method.response.header.Access-Control-Allow-Methods" = true
    "method.response.header.Access-Control-Allow-Origin"  = true
  }
}

resource "aws_api_gateway_integration_response" "auth_login_options" {
  rest_api_id = aws_api_gateway_rest_api.finance_tracker_api.id
  resource_id = aws_api_gateway_resource.auth_login.id
  http_method = aws_api_gateway_method.auth_login_options.http_method
  status_code = aws_api_gateway_method_response.auth_login_options.status_code

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,X-Requested-With'"
    "method.response.header.Access-Control-Allow-Methods" = "'GET,POST,PUT,DELETE,OPTIONS'"
    "method.response.header.Access-Control-Allow-Origin"  = "'*'"
  }
}

# CORS Options for Auth Register
resource "aws_api_gateway_method" "auth_register_options" {
  rest_api_id   = aws_api_gateway_rest_api.finance_tracker_api.id
  resource_id   = aws_api_gateway_resource.auth_register.id
  http_method   = "OPTIONS"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "auth_register_options" {
  rest_api_id = aws_api_gateway_rest_api.finance_tracker_api.id
  resource_id = aws_api_gateway_resource.auth_register.id
  http_method = aws_api_gateway_method.auth_register_options.http_method
  type        = "MOCK"

  request_templates = {
    "application/json" = "{ \"statusCode\": 200 }"
  }
}

resource "aws_api_gateway_method_response" "auth_register_options" {
  rest_api_id = aws_api_gateway_rest_api.finance_tracker_api.id
  resource_id = aws_api_gateway_resource.auth_register.id
  http_method = aws_api_gateway_method.auth_register_options.http_method
  status_code = "200"

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = true
    "method.response.header.Access-Control-Allow-Methods" = true
    "method.response.header.Access-Control-Allow-Origin"  = true
  }
}

resource "aws_api_gateway_integration_response" "auth_register_options" {
  rest_api_id = aws_api_gateway_rest_api.finance_tracker_api.id
  resource_id = aws_api_gateway_resource.auth_register.id
  http_method = aws_api_gateway_method.auth_register_options.http_method
  status_code = aws_api_gateway_method_response.auth_register_options.status_code

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,X-Requested-With'"
    "method.response.header.Access-Control-Allow-Methods" = "'GET,POST,PUT,DELETE,OPTIONS'"
    "method.response.header.Access-Control-Allow-Origin"  = "'*'"
  }
}

# CORS Options for Auth Refresh
resource "aws_api_gateway_method" "auth_refresh_options" {
  rest_api_id   = aws_api_gateway_rest_api.finance_tracker_api.id
  resource_id   = aws_api_gateway_resource.auth_refresh.id
  http_method   = "OPTIONS"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "auth_refresh_options" {
  rest_api_id = aws_api_gateway_rest_api.finance_tracker_api.id
  resource_id = aws_api_gateway_resource.auth_refresh.id
  http_method = aws_api_gateway_method.auth_refresh_options.http_method
  type        = "MOCK"

  request_templates = {
    "application/json" = "{ \"statusCode\": 200 }"
  }
}

resource "aws_api_gateway_method_response" "auth_refresh_options" {
  rest_api_id = aws_api_gateway_rest_api.finance_tracker_api.id
  resource_id = aws_api_gateway_resource.auth_refresh.id
  http_method = aws_api_gateway_method.auth_refresh_options.http_method
  status_code = "200"

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = true
    "method.response.header.Access-Control-Allow-Methods" = true
    "method.response.header.Access-Control-Allow-Origin"  = true
  }
}

resource "aws_api_gateway_integration_response" "auth_refresh_options" {
  rest_api_id = aws_api_gateway_rest_api.finance_tracker_api.id
  resource_id = aws_api_gateway_resource.auth_refresh.id
  http_method = aws_api_gateway_method.auth_refresh_options.http_method
  status_code = aws_api_gateway_method_response.auth_refresh_options.status_code

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,X-Requested-With'"
    "method.response.header.Access-Control-Allow-Methods" = "'GET,POST,PUT,DELETE,OPTIONS'"
    "method.response.header.Access-Control-Allow-Origin"  = "'*'"
  }
}

# -----------------------------------------------------------------------------
# CORS OPTIONS Methods for Users Endpoints
# -----------------------------------------------------------------------------

# CORS Options for Users by ID - /users/{user_id}
resource "aws_api_gateway_method" "users_user_id_options" {
  rest_api_id   = aws_api_gateway_rest_api.finance_tracker_api.id
  resource_id   = aws_api_gateway_resource.users_user_id.id
  http_method   = "OPTIONS"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "users_user_id_options" {
  rest_api_id = aws_api_gateway_rest_api.finance_tracker_api.id
  resource_id = aws_api_gateway_resource.users_user_id.id
  http_method = aws_api_gateway_method.users_user_id_options.http_method
  type        = "MOCK"

  request_templates = {
    "application/json" = "{ \"statusCode\": 200 }"
  }
}

resource "aws_api_gateway_method_response" "users_user_id_options" {
  rest_api_id = aws_api_gateway_rest_api.finance_tracker_api.id
  resource_id = aws_api_gateway_resource.users_user_id.id
  http_method = aws_api_gateway_method.users_user_id_options.http_method
  status_code = "200"

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = true
    "method.response.header.Access-Control-Allow-Methods" = true
    "method.response.header.Access-Control-Allow-Origin"  = true
  }
}

resource "aws_api_gateway_integration_response" "users_user_id_options" {
  rest_api_id = aws_api_gateway_rest_api.finance_tracker_api.id
  resource_id = aws_api_gateway_resource.users_user_id.id
  http_method = aws_api_gateway_method.users_user_id_options.http_method
  status_code = aws_api_gateway_method_response.users_user_id_options.status_code

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,X-Requested-With'"
    "method.response.header.Access-Control-Allow-Methods" = "'GET,POST,PUT,DELETE,OPTIONS'"
    "method.response.header.Access-Control-Allow-Origin"  = "'*'"
  }
}

# -----------------------------------------------------------------------------
# Accounts API Methods and Integrations
# -----------------------------------------------------------------------------

# Accounts - POST /accounts (Create account)
resource "aws_api_gateway_method" "accounts_post" {
  rest_api_id   = aws_api_gateway_rest_api.finance_tracker_api.id
  resource_id   = aws_api_gateway_resource.accounts.id
  http_method   = "POST"
  authorization = "NONE" # JWT handled by Lambda function
}

resource "aws_api_gateway_integration" "accounts_post_integration" {
  rest_api_id = aws_api_gateway_rest_api.finance_tracker_api.id
  resource_id = aws_api_gateway_resource.accounts.id
  http_method = aws_api_gateway_method.accounts_post.http_method

  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.accounts.invoke_arn
}

# Accounts - GET /accounts (List accounts)
resource "aws_api_gateway_method" "accounts_get" {
  rest_api_id   = aws_api_gateway_rest_api.finance_tracker_api.id
  resource_id   = aws_api_gateway_resource.accounts.id
  http_method   = "GET"
  authorization = "NONE" # JWT handled by Lambda function
}

resource "aws_api_gateway_integration" "accounts_get_integration" {
  rest_api_id = aws_api_gateway_rest_api.finance_tracker_api.id
  resource_id = aws_api_gateway_resource.accounts.id
  http_method = aws_api_gateway_method.accounts_get.http_method

  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.accounts.invoke_arn
}

# Account by ID - GET /accounts/{account_id}
resource "aws_api_gateway_method" "accounts_account_id_get" {
  rest_api_id   = aws_api_gateway_rest_api.finance_tracker_api.id
  resource_id   = aws_api_gateway_resource.accounts_account_id.id
  http_method   = "GET"
  authorization = "NONE" # JWT handled by Lambda function
}

resource "aws_api_gateway_integration" "accounts_account_id_get_integration" {
  rest_api_id = aws_api_gateway_rest_api.finance_tracker_api.id
  resource_id = aws_api_gateway_resource.accounts_account_id.id
  http_method = aws_api_gateway_method.accounts_account_id_get.http_method

  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.accounts.invoke_arn
}

# Account by ID - PUT /accounts/{account_id} (Update account)
resource "aws_api_gateway_method" "accounts_account_id_put" {
  rest_api_id   = aws_api_gateway_rest_api.finance_tracker_api.id
  resource_id   = aws_api_gateway_resource.accounts_account_id.id
  http_method   = "PUT"
  authorization = "NONE" # JWT handled by Lambda function
}

resource "aws_api_gateway_integration" "accounts_account_id_put_integration" {
  rest_api_id = aws_api_gateway_rest_api.finance_tracker_api.id
  resource_id = aws_api_gateway_resource.accounts_account_id.id
  http_method = aws_api_gateway_method.accounts_account_id_put.http_method

  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.accounts.invoke_arn
}

# Account by ID - DELETE /accounts/{account_id} (Delete account)
resource "aws_api_gateway_method" "accounts_account_id_delete" {
  rest_api_id   = aws_api_gateway_rest_api.finance_tracker_api.id
  resource_id   = aws_api_gateway_resource.accounts_account_id.id
  http_method   = "DELETE"
  authorization = "NONE" # JWT handled by Lambda function
}

resource "aws_api_gateway_integration" "accounts_account_id_delete_integration" {
  rest_api_id = aws_api_gateway_rest_api.finance_tracker_api.id
  resource_id = aws_api_gateway_resource.accounts_account_id.id
  http_method = aws_api_gateway_method.accounts_account_id_delete.http_method

  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.accounts.invoke_arn
}

# Account Balance - PATCH /accounts/{account_id}/balance (Update balance)
resource "aws_api_gateway_method" "accounts_account_id_balance_patch" {
  rest_api_id   = aws_api_gateway_rest_api.finance_tracker_api.id
  resource_id   = aws_api_gateway_resource.accounts_account_id_balance.id
  http_method   = "PATCH"
  authorization = "NONE" # JWT handled by Lambda function
}

resource "aws_api_gateway_integration" "accounts_account_id_balance_patch_integration" {
  rest_api_id = aws_api_gateway_rest_api.finance_tracker_api.id
  resource_id = aws_api_gateway_resource.accounts_account_id_balance.id
  http_method = aws_api_gateway_method.accounts_account_id_balance_patch.http_method

  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.accounts.invoke_arn
}

# -----------------------------------------------------------------------------
# CORS OPTIONS Methods for Accounts Endpoints
# -----------------------------------------------------------------------------

# CORS Options for Accounts - /accounts
resource "aws_api_gateway_method" "accounts_options" {
  rest_api_id   = aws_api_gateway_rest_api.finance_tracker_api.id
  resource_id   = aws_api_gateway_resource.accounts.id
  http_method   = "OPTIONS"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "accounts_options" {
  rest_api_id = aws_api_gateway_rest_api.finance_tracker_api.id
  resource_id = aws_api_gateway_resource.accounts.id
  http_method = aws_api_gateway_method.accounts_options.http_method
  type        = "MOCK"

  request_templates = {
    "application/json" = "{ \"statusCode\": 200 }"
  }
}

resource "aws_api_gateway_method_response" "accounts_options" {
  rest_api_id = aws_api_gateway_rest_api.finance_tracker_api.id
  resource_id = aws_api_gateway_resource.accounts.id
  http_method = aws_api_gateway_method.accounts_options.http_method
  status_code = "200"

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = true
    "method.response.header.Access-Control-Allow-Methods" = true
    "method.response.header.Access-Control-Allow-Origin"  = true
  }
}

resource "aws_api_gateway_integration_response" "accounts_options" {
  rest_api_id = aws_api_gateway_rest_api.finance_tracker_api.id
  resource_id = aws_api_gateway_resource.accounts.id
  http_method = aws_api_gateway_method.accounts_options.http_method
  status_code = aws_api_gateway_method_response.accounts_options.status_code

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,X-Requested-With'"
    "method.response.header.Access-Control-Allow-Methods" = "'GET,POST,PUT,DELETE,OPTIONS'"
    "method.response.header.Access-Control-Allow-Origin"  = "'*'"
  }
}

# CORS Options for Accounts by ID - /accounts/{account_id}
resource "aws_api_gateway_method" "accounts_account_id_options" {
  rest_api_id   = aws_api_gateway_rest_api.finance_tracker_api.id
  resource_id   = aws_api_gateway_resource.accounts_account_id.id
  http_method   = "OPTIONS"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "accounts_account_id_options" {
  rest_api_id = aws_api_gateway_rest_api.finance_tracker_api.id
  resource_id = aws_api_gateway_resource.accounts_account_id.id
  http_method = aws_api_gateway_method.accounts_account_id_options.http_method
  type        = "MOCK"

  request_templates = {
    "application/json" = "{ \"statusCode\": 200 }"
  }
}

resource "aws_api_gateway_method_response" "accounts_account_id_options" {
  rest_api_id = aws_api_gateway_rest_api.finance_tracker_api.id
  resource_id = aws_api_gateway_resource.accounts_account_id.id
  http_method = aws_api_gateway_method.accounts_account_id_options.http_method
  status_code = "200"

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = true
    "method.response.header.Access-Control-Allow-Methods" = true
    "method.response.header.Access-Control-Allow-Origin"  = true
  }
}

resource "aws_api_gateway_integration_response" "accounts_account_id_options" {
  rest_api_id = aws_api_gateway_rest_api.finance_tracker_api.id
  resource_id = aws_api_gateway_resource.accounts_account_id.id
  http_method = aws_api_gateway_method.accounts_account_id_options.http_method
  status_code = aws_api_gateway_method_response.accounts_account_id_options.status_code

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,X-Requested-With'"
    "method.response.header.Access-Control-Allow-Methods" = "'GET,POST,PUT,DELETE,OPTIONS'"
    "method.response.header.Access-Control-Allow-Origin"  = "'*'"
  }
}

# CORS Options for Account Balance - /accounts/{account_id}/balance
resource "aws_api_gateway_method" "accounts_account_id_balance_options" {
  rest_api_id   = aws_api_gateway_rest_api.finance_tracker_api.id
  resource_id   = aws_api_gateway_resource.accounts_account_id_balance.id
  http_method   = "OPTIONS"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "accounts_account_id_balance_options" {
  rest_api_id = aws_api_gateway_rest_api.finance_tracker_api.id
  resource_id = aws_api_gateway_resource.accounts_account_id_balance.id
  http_method = aws_api_gateway_method.accounts_account_id_balance_options.http_method
  type        = "MOCK"

  request_templates = {
    "application/json" = "{ \"statusCode\": 200 }"
  }
}

resource "aws_api_gateway_method_response" "accounts_account_id_balance_options" {
  rest_api_id = aws_api_gateway_rest_api.finance_tracker_api.id
  resource_id = aws_api_gateway_resource.accounts_account_id_balance.id
  http_method = aws_api_gateway_method.accounts_account_id_balance_options.http_method
  status_code = "200"

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = true
    "method.response.header.Access-Control-Allow-Methods" = true
    "method.response.header.Access-Control-Allow-Origin"  = true
  }
}

resource "aws_api_gateway_integration_response" "accounts_account_id_balance_options" {
  rest_api_id = aws_api_gateway_rest_api.finance_tracker_api.id
  resource_id = aws_api_gateway_resource.accounts_account_id_balance.id
  http_method = aws_api_gateway_method.accounts_account_id_balance_options.http_method
  status_code = aws_api_gateway_method_response.accounts_account_id_balance_options.status_code

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,X-Requested-With'"
    "method.response.header.Access-Control-Allow-Methods" = "'GET,POST,PUT,DELETE,PATCH,OPTIONS'"
    "method.response.header.Access-Control-Allow-Origin"  = "'*'"
  }
}

# -----------------------------------------------------------------------------
# Lambda Permissions for API Gateway
# -----------------------------------------------------------------------------

resource "aws_lambda_permission" "api_gateway_health" {
  statement_id  = "AllowExecutionFromAPIGateway-Health"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.health.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.finance_tracker_api.execution_arn}/*/*"
}

resource "aws_lambda_permission" "api_gateway_users" {
  statement_id  = "AllowExecutionFromAPIGateway-Users"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.users.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.finance_tracker_api.execution_arn}/*/*"
}

resource "aws_lambda_permission" "api_gateway_auth" {
  statement_id  = "AllowExecutionFromAPIGateway-Auth"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.auth.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.finance_tracker_api.execution_arn}/*/*"
}

resource "aws_lambda_permission" "api_gateway_accounts" {
  statement_id  = "AllowExecutionFromAPIGateway-Accounts"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.accounts.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.finance_tracker_api.execution_arn}/*/*"
}

resource "aws_lambda_permission" "api_gateway_transactions" {
  statement_id  = "AllowExecutionFromAPIGateway-Transactions"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.transactions.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.finance_tracker_api.execution_arn}/*/*"
}

resource "aws_lambda_permission" "api_gateway_categories" {
  statement_id  = "AllowExecutionFromAPIGateway-Categories"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.categories.function_name
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
    aws_api_gateway_integration.users_user_id_get_integration,
    aws_api_gateway_integration.users_user_id_put_integration,
    aws_api_gateway_integration.users_user_id_delete_integration,
    aws_api_gateway_integration.auth_login_integration,
    aws_api_gateway_integration.auth_register_integration,
    aws_api_gateway_integration.auth_refresh_integration,
    aws_api_gateway_integration.accounts_post_integration,
    aws_api_gateway_integration.accounts_get_integration,
    aws_api_gateway_integration.accounts_account_id_get_integration,
    aws_api_gateway_integration.accounts_account_id_put_integration,
    aws_api_gateway_integration.accounts_account_id_delete_integration,
    aws_api_gateway_integration.accounts_account_id_balance_patch_integration,
    aws_api_gateway_integration.transactions_get_integration,
    aws_api_gateway_integration.transactions_post_integration,
    aws_api_gateway_integration.categories_get_integration,
    aws_api_gateway_integration.categories_post_integration,
    # CORS OPTIONS integrations
    aws_api_gateway_integration.users_user_id_options,
    aws_api_gateway_integration.accounts_options,
    aws_api_gateway_integration.accounts_account_id_options,
    aws_api_gateway_integration.accounts_account_id_balance_options,
  ]

  rest_api_id = aws_api_gateway_rest_api.finance_tracker_api.id

  triggers = {
    redeployment = sha1(jsonencode([
      aws_api_gateway_resource.health.id,
      aws_api_gateway_resource.users.id,
      aws_api_gateway_resource.users_user_id.id,
      aws_api_gateway_resource.auth.id,
      aws_api_gateway_resource.auth_login.id,
      aws_api_gateway_resource.auth_register.id,
      aws_api_gateway_resource.auth_refresh.id,
      aws_api_gateway_resource.accounts.id,
      aws_api_gateway_resource.accounts_account_id.id,
      aws_api_gateway_resource.accounts_account_id_balance.id,
      aws_api_gateway_resource.transactions.id,
      aws_api_gateway_resource.categories.id,
      aws_api_gateway_method.health_get.id,
      aws_api_gateway_method.users_get.id,
      aws_api_gateway_method.users_user_id_get.id,
      aws_api_gateway_method.users_user_id_put.id,
      aws_api_gateway_method.users_user_id_delete.id,
      aws_api_gateway_method.auth_login_post.id,
      aws_api_gateway_method.auth_register_post.id,
      aws_api_gateway_method.auth_refresh_post.id,
      aws_api_gateway_method.auth_login_options.id,
      aws_api_gateway_method.auth_register_options.id,
      aws_api_gateway_method.auth_refresh_options.id,
      aws_api_gateway_method.users_user_id_options.id,
      aws_api_gateway_method.accounts_post.id,
      aws_api_gateway_method.accounts_get.id,
      aws_api_gateway_method.accounts_account_id_get.id,
      aws_api_gateway_method.accounts_account_id_put.id,
      aws_api_gateway_method.accounts_account_id_delete.id,
      aws_api_gateway_method.accounts_account_id_balance_patch.id,
      aws_api_gateway_method.transactions_get.id,
      aws_api_gateway_method.transactions_post.id,
      aws_api_gateway_method.categories_get.id,
      aws_api_gateway_method.categories_post.id,
      aws_api_gateway_integration.health_integration.id,
      aws_api_gateway_integration.users_get_integration.id,
      aws_api_gateway_integration.users_user_id_get_integration.id,
      aws_api_gateway_integration.users_user_id_put_integration.id,
      aws_api_gateway_integration.users_user_id_delete_integration.id,
      aws_api_gateway_integration.auth_login_integration.id,
      aws_api_gateway_integration.auth_register_integration.id,
      aws_api_gateway_integration.auth_refresh_integration.id,
      aws_api_gateway_integration.auth_login_options.id,
      aws_api_gateway_integration.auth_register_options.id,
      aws_api_gateway_integration.auth_refresh_options.id,
      aws_api_gateway_integration.users_user_id_options.id,
      aws_api_gateway_integration.accounts_post_integration.id,
      aws_api_gateway_integration.accounts_get_integration.id,
      aws_api_gateway_integration.accounts_account_id_get_integration.id,
      aws_api_gateway_integration.accounts_account_id_put_integration.id,
      aws_api_gateway_integration.accounts_account_id_delete_integration.id,
      aws_api_gateway_integration.accounts_account_id_balance_patch_integration.id,
      aws_api_gateway_integration.accounts_options.id,
      aws_api_gateway_integration.accounts_account_id_options.id,
      aws_api_gateway_integration.accounts_account_id_balance_options.id,
      aws_api_gateway_integration.transactions_get_integration.id,
      aws_api_gateway_integration.transactions_post_integration.id,
      aws_api_gateway_integration.categories_get_integration.id,
      aws_api_gateway_integration.categories_post_integration.id,
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
