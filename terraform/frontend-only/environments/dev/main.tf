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
    region = "mx-central-1"  # Región de México
    
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

# Provider principal - mx-central-1 es la región nativa de México
provider "aws" {
  region = var.aws_region  # mx-central-1
  
  default_tags {
    tags = {
      Project     = "finance-tracker"
      Environment = "dev"
      Component   = "frontend-s3-website"
      ManagedBy   = "terraform"
      SSLProvider = "cloudflare"
      Region      = "mexico-native"
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

output "website_endpoint" {
  description = "🌐 URL del website S3 - USAR ESTA PARA CLOUDFLARE DNS"
  value       = module.frontend.frontend_website_endpoint
}

output "website_url" {
  description = "URL completa del frontend S3"
  value       = module.frontend.frontend_url
}

output "bucket_name" {
  description = "Nombre del bucket S3"
  value       = module.frontend.frontend_bucket_name
}

output "cloudflare_configuration" {
  description = "📋 INSTRUCCIONES PARA CLOUDFLARE"
  value       = module.frontend.cloudflare_setup
}

output "deployment_summary" {
  description = "📊 RESUMEN DEL DESPLIEGUE"
  value = {
    status          = "✅ S3 Website Hosting creado"
    website_url     = module.frontend.frontend_url
    bucket_name     = module.frontend.frontend_bucket_name
    next_step       = "Configurar CNAME en Cloudflare"
    target_domain   = "finance-tracker.brxvn.xyz"
    ssl_provider    = "Cloudflare (gratis)"
  }
}
