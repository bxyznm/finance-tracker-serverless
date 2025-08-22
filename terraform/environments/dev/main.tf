# =============================================================================
# Finance Tracker Serverless - Entorno Development
# =============================================================================

terraform {
  required_version = ">= 1.12.2"

  # Backend S3 para state remoto usando el mismo bucket de deployment assets
  backend "s3" {
    # El bucket se configurará dinámicamente via -backend-config
    # La región se configurará via -backend-config o AWS_DEFAULT_REGION/AWS_REGION env vars
    bucket = "finance-tracker-serverless-tfstates"
    key    = "terraform-state/dev/terraform.tfstate"
    
    # Configuración de seguridad
    encrypt = true
  }

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.80"  # Versión actualizada con soporte completo para mx-central-1
    }
    github = {
      source  = "integrations/github"
      version = "~> 6.4"   # Versión más reciente y estable
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.6"   # Versión más reciente
    }
    null = {
      source  = "hashicorp/null"
      version = "~> 3.2"   # Versión más reciente
    }
  }
}

# -----------------------------------------------------------------------------
# Providers Configuration
# -----------------------------------------------------------------------------

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Environment = "dev"
      Project     = "finance-tracker-serverless"
      ManagedBy   = "terraform"
      CreatedBy   = "dev-environment"
    }
  }
}

provider "github" {
  owner = var.github_owner
  token = var.github_token != "" ? var.github_token : null
  # Si github_token está vacío, el provider intentará usar la variable de entorno GITHUB_TOKEN
}

# -----------------------------------------------------------------------------
# Data Sources
# -----------------------------------------------------------------------------

# Obtener el último prerelease para desarrollo
data "github_release" "latest_prerelease" {
  repository  = var.github_repository
  owner       = var.github_owner
  retrieve_by = "tag"
  release_tag = var.dev_release_tag
}

# Obtener información del caller actual
data "aws_caller_identity" "current" {}
data "aws_region" "current" {}

# -----------------------------------------------------------------------------
# Local Values
# -----------------------------------------------------------------------------

locals {
  environment = "dev"
  
  # Tags específicos para desarrollo
  dev_tags = {
    Environment  = local.environment
    Purpose      = "development"
    AutoDestroy  = "true" # Para identificar recursos que se pueden eliminar automáticamente
    CostCenter   = "development"
  }
  
  # Configuración específica para desarrollo
  dev_config = {
    # DynamoDB en modo PAY_PER_REQUEST para desarrollo (más económico)
    dynamodb_billing_mode = "PAY_PER_REQUEST"
    
    # Lambda con menos memoria para desarrollo
    lambda_memory_size = 256
    lambda_timeout     = 30
    
    # API Gateway con límites más bajos para desarrollo
    api_throttling_rate_limit  = 100
    api_throttling_burst_limit = 200
    
    # Logs con retención más corta
    enable_api_gateway_logging = true
    api_gateway_log_level      = "INFO"
    
    # CORS más permisivo para desarrollo
    cors_allowed_origins = ["*"] # En producción debería ser más restrictivo
  }
}

# -----------------------------------------------------------------------------
# Finance Tracker Module
# -----------------------------------------------------------------------------

module "finance_tracker" {
  source = "../../modules/finance-tracker"

  # Configuración básica
  project_name = var.project_name
  environment  = local.environment
  aws_region   = var.aws_region

  # Configuración de GitHub
  github_owner      = var.github_owner
  github_repository = var.github_repository
  dev_release_tag   = var.dev_release_tag

  # Configuración de DynamoDB
  dynamodb_billing_mode         = local.dev_config.dynamodb_billing_mode
  enable_point_in_time_recovery = false # Deshabilitado en dev para ahorrar costos

  # Configuración de Lambda
  lambda_runtime           = var.lambda_runtime
  lambda_timeout           = local.dev_config.lambda_timeout
  lambda_memory_size       = local.dev_config.lambda_memory_size
  lambda_environment_variables = merge(var.lambda_environment_variables, {
    # Variables específicas para desarrollo
    DEBUG_MODE = "true"
    LOG_LEVEL  = "DEBUG"
  })

  # Configuración de API Gateway
  api_gateway_throttling_rate_limit  = local.dev_config.api_throttling_rate_limit
  api_gateway_throttling_burst_limit = local.dev_config.api_throttling_burst_limit
  enable_api_gateway_logging         = local.dev_config.enable_api_gateway_logging
  api_gateway_log_level              = local.dev_config.api_gateway_log_level

  # Configuración de CORS
  cors_allowed_origins = local.dev_config.cors_allowed_origins
  cors_allowed_methods = var.cors_allowed_methods
  cors_allowed_headers = var.cors_allowed_headers

  # Tags
  common_tags = merge(var.common_tags, local.dev_tags)
}

# -----------------------------------------------------------------------------
# Outputs específicos para desarrollo
# -----------------------------------------------------------------------------

# Output adicional para información de desarrollo
output "dev_info" {
  description = "Información específica del entorno de desarrollo"
  value = {
    message           = "🚀 Entorno de desarrollo desplegado exitosamente"
    prerelease_used   = var.dev_release_tag
    auto_destroy      = true
    cost_optimization = "Configurado para costos mínimos en desarrollo"
    debug_mode        = true
  }
}
