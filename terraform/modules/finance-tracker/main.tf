# =============================================================================
# Finance Tracker Serverless - Módulo Principal
# =============================================================================

terraform {
  required_version = ">= 1.12.2"
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
# Data Sources - GitHub Release
# -----------------------------------------------------------------------------

# Obtener el release apropiado basado en el entorno (solo si hay release tag válido)
data "github_release" "finance_tracker" {
  count       = var.dev_release_tag != null && var.dev_release_tag != "" && var.dev_release_tag != "vdev" ? 1 : 0
  repository  = var.github_repository
  owner       = var.github_owner
  retrieve_by = "tag"
  release_tag = var.dev_release_tag
}

# -----------------------------------------------------------------------------
# Local Values
# -----------------------------------------------------------------------------

locals {
  # Tags comunes para todos los recursos
  common_tags = merge(var.common_tags, {
    Project     = var.project_name
    Environment = var.environment
    ManagedBy   = "terraform"
    Release     = var.dev_release_tag != null && var.dev_release_tag != "" && var.dev_release_tag != "vdev" ? var.dev_release_tag : "local-dev"
  })

  # Nombre base para recursos
  name_prefix = "${var.project_name}-${var.environment}"

  # URLs de los assets del release (opcional - solo si hay release)
  layer_asset_url = length(data.github_release.finance_tracker) > 0 ? [
    for asset in data.github_release.finance_tracker[0].assets :
    asset.browser_download_url if asset.name == "layer.zip"
  ][0] : null

  code_asset_url = length(data.github_release.finance_tracker) > 0 ? [
    for asset in data.github_release.finance_tracker[0].assets :
    asset.browser_download_url if asset.name == "code.zip"
  ][0] : null
}

# -----------------------------------------------------------------------------
# Random ID para nombres únicos (solo si no se provee sufijo personalizado)
# -----------------------------------------------------------------------------

resource "random_id" "bucket_suffix" {
  count       = var.s3_bucket_suffix == null ? 1 : 0
  byte_length = 4
}

# -----------------------------------------------------------------------------
# Locals para bucket name logic
# -----------------------------------------------------------------------------

locals {
  bucket_suffix = var.s3_bucket_suffix != null ? var.s3_bucket_suffix : random_id.bucket_suffix[0].hex
}

# -----------------------------------------------------------------------------
# S3 Bucket para almacenar assets temporalmente
# -----------------------------------------------------------------------------

resource "aws_s3_bucket" "deployment_assets" {
  bucket = "${local.name_prefix}-deployment-assets-${local.bucket_suffix}"
  tags   = local.common_tags
}

resource "aws_s3_bucket_versioning" "deployment_assets" {
  bucket = aws_s3_bucket.deployment_assets.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "deployment_assets" {
  bucket = aws_s3_bucket.deployment_assets.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "deployment_assets" {
  bucket = aws_s3_bucket.deployment_assets.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# -----------------------------------------------------------------------------
# Descargar y subir assets a S3
# -----------------------------------------------------------------------------

# Descargar layer.zip del release
resource "null_resource" "download_layer" {
  triggers = {
    release_tag = var.dev_release_tag
    asset_url   = local.layer_asset_url
  }

  provisioner "local-exec" {
    command = <<-EOT
      echo "📥 Downloading layer.zip from: ${local.layer_asset_url}"
      curl -L -H "Accept: application/octet-stream" \
           -o /tmp/layer.zip \
           "${local.layer_asset_url}"
      
      # Validate that the layer contains critical dependencies in correct AWS Lambda structure
      echo "🔍 Validating layer contents and AWS Lambda structure..."
      
      # Check if python/ directory exists (required for Python Lambda layers)
      if ! unzip -l /tmp/layer.zip | grep -q "python/"; then
        echo "❌ Error: Layer missing python/ directory (required for AWS Lambda Python layers)"
        echo "📋 Layer structure:"
        unzip -l /tmp/layer.zip | head -20
        exit 1
      fi
      
      # Check for critical Python packages in python/ directory
      if ! unzip -l /tmp/layer.zip | grep -E "python/(pydantic|boto3)"; then
        echo "❌ Error: Layer missing critical dependencies (pydantic, boto3) in python/ directory"
        echo "📋 Layer contents:"
        unzip -l /tmp/layer.zip | head -20
        exit 1
      fi
      
      echo "✅ Layer validation passed - correct AWS Lambda Python structure found"
      echo "📁 Layer structure preview:"
      unzip -l /tmp/layer.zip | grep "python/" | head -10
    EOT
  }
}

# Descargar code.zip del release
resource "null_resource" "download_code" {
  triggers = {
    release_tag = var.dev_release_tag
    asset_url   = local.code_asset_url
  }

  provisioner "local-exec" {
    command = <<-EOT
      curl -L -H "Accept: application/octet-stream" \
           -o /tmp/code.zip \
           "${local.code_asset_url}"
    EOT
  }
}

# Subir layer a S3
resource "aws_s3_object" "layer_zip" {
  depends_on = [null_resource.download_layer]

  bucket = aws_s3_bucket.deployment_assets.bucket
  key    = "releases/${var.dev_release_tag}/layer.zip"
  source = "/tmp/layer.zip"
  
  # Use release tag as a trigger for updates instead of file hash
  metadata = {
    release_tag = var.dev_release_tag
  }
  
  tags = local.common_tags
}

# Subir code a S3
resource "aws_s3_object" "code_zip" {
  depends_on = [null_resource.download_code]

  bucket = aws_s3_bucket.deployment_assets.bucket
  key    = "releases/${var.dev_release_tag}/code.zip"
  source = "/tmp/code.zip"
  
  # Use release tag as a trigger for updates instead of file hash
  metadata = {
    release_tag = var.dev_release_tag
  }
  
  tags = local.common_tags
}
