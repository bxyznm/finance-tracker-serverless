# =============================================================================
# Frontend DEV Environment
# =============================================================================
# Configuración específica para desplegar SOLO el frontend en desarrollo

terraform {
  required_version = ">= 1.12.2"

  # Estado separado para frontend
  backend "s3" {
    # El bucket se configurará dinámicamente via -backend-config
    bucket = "finance-tracker-serverless-tfstates"
    key    = "frontend-only/dev/terraform.tfstate"  # ← SEPARADO del backend
    
    # Configuración de seguridad
    encrypt = true
  }

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.80"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.6"
    }
  }
}

# -----------------------------------------------------------------------------
# Provider Configuration
# -----------------------------------------------------------------------------

provider "aws" {
  region = var.aws_region
  
  default_tags {
    tags = {
      Project     = "finance-tracker"
      Environment = "dev"
      Component   = "frontend-only"
      ManagedBy   = "terraform"
      CreatedBy   = "frontend-dev-environment"
    }
  }
}

# -----------------------------------------------------------------------------
# Data Sources (para obtener info del backend existente)
# -----------------------------------------------------------------------------

# Data source para obtener el backend state y extraer API Gateway URL
data "terraform_remote_state" "backend" {
  backend = "s3"
  
  config = {
    bucket = var.backend_state_bucket
    key    = "terraform-state/dev/terraform.tfstate"  # Estado del backend
    region = var.aws_region
  }
}

# -----------------------------------------------------------------------------
# Local Values
# -----------------------------------------------------------------------------

locals {
  environment = "dev"
  
  # Obtener API Gateway URL del backend existente
  api_gateway_url = try(data.terraform_remote_state.backend.outputs.api_gateway_url, "")
  
  common_tags = {
    Project     = "finance-tracker"
    Environment = "dev"
    Component   = "frontend-only"
  }
}

# -----------------------------------------------------------------------------
# Frontend Module
# -----------------------------------------------------------------------------

module "frontend" {
  source = "../../modules/frontend"
  
  # Configuración básica
  project_name = "finance-tracker"
  environment  = local.environment
  aws_region   = var.aws_region
  
  # URL del backend para configurar React
  api_gateway_url = local.api_gateway_url
  
  # Tags
  common_tags = local.common_tags
}

# -----------------------------------------------------------------------------
# Outputs
# -----------------------------------------------------------------------------

output "frontend_bucket_name" {
  description = "Nombre del bucket S3 del frontend"
  value       = module.frontend.frontend_bucket_name
}

output "frontend_cloudfront_distribution_id" {
  description = "ID de la distribución CloudFront"
  value       = module.frontend.frontend_cloudfront_distribution_id
}

output "frontend_url" {
  description = "URL del frontend desplegado"
  value       = module.frontend.frontend_url
}

output "api_gateway_url" {
  description = "URL del API Gateway (del backend)"
  value       = local.api_gateway_url
}

output "deployment_info" {
  description = "Información de despliegue"
  value = {
    message        = "🚀 Frontend desplegado independientemente"
    environment    = "dev"
    frontend_url   = module.frontend.frontend_url
    api_url        = local.api_gateway_url
    bucket_name    = module.frontend.frontend_bucket_name
    cloudfront_id  = module.frontend.frontend_cloudfront_distribution_id
  }
}
