# Finance Tracker - Terraform Main Configuration
# Este archivo define toda la infraestructura de AWS necesaria

terraform {
  required_version = ">= 1.0"
  
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    archive = {
      source  = "hashicorp/archive"
      version = "~> 2.0"
    }
  }
}

# Configuración del provider AWS
provider "aws" {
  region = var.aws_region

  # Tags por defecto para todos los recursos
  default_tags {
    tags = {
      Project     = "finance-tracker"
      Environment = var.environment
      ManagedBy   = "terraform"
      Owner       = "bryan"
    }
  }
}

# Variables locales para reutilizar
locals {
  project_name = "finance-tracker"
  table_prefix = "${local.project_name}-${var.environment}"
  
  common_tags = {
    Project     = local.project_name
    Environment = var.environment
    ManagedBy   = "terraform"
  }
}

# Data sources para obtener información de AWS
data "aws_caller_identity" "current" {}
data "aws_region" "current" {}
